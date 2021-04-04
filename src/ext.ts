import * as flashpoint from 'flashpoint-launcher';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path = require('path');

class GameLaunch {
    creaDate: Date;
    gameName: string;

    constructor(gameName: string) {
        this.creaDate = new Date();
        this.gameName = gameName;
    }
}

class GameInfo {
    totalTime: number;
    gameName: string;

    constructor(gameName: string, currentTime: number) {
        this.totalTime = currentTime;
        this.gameName = gameName;
    }
}

let timers: { [id: string] : GameLaunch; } = {};
let times: { [id: string] : GameInfo; } = {};

function submitActivity(id: string) {
    let timer = timers[id];
    let diff = new Date().getTime() - timer.creaDate.getTime();

    if (times[id] !== undefined) {
        times[id].totalTime += diff / 1000;
    } else {
        times[id] = new GameInfo(timer.gameName, diff / 1000);
    }

    writeFileSync(path.join(__dirname, "../data/times.json"), JSON.stringify(times), "utf8");

    updateTime(id);

    delete timers[id];
    flashpoint.log.info('Session of ' + timer.gameName + ' lasted ' + ((diff / 1000) / 60).toFixed(2) + ' minutes for a total of ' + (times[id].totalTime / 60).toFixed(2) + ' minutes');
}

function updateTime(id: string) {
    flashpoint.games.findGame(id).then((x: flashpoint.Game) => {
        let notes = x.notes;
        if (notes.includes("Time played:")) {
            notes = notes.replace(/Time played:.*/, "Time played: " + (times[id].totalTime / 60).toFixed(1) + " minutes");
        } else {
            notes = "Time played: " + (times[id].totalTime / 60).toFixed(1) + " minutes\n\n" + notes;
        }
        x.notes = notes;
        flashpoint.games.updateGame(x);
    });
}

export function activate(context: flashpoint.ExtensionContext) {

    if (existsSync(path.join(__dirname, "../data/times.json"))) {
        times = JSON.parse(readFileSync(path.join(__dirname, "../data/times.json"), "utf8"));
        Object.keys(times).forEach(function(key) {
            updateTime(key);
        });
    }

    flashpoint.games.onDidLaunchGame((game) => {
        if (!flashpoint.getExtConfigValue('com.time-played.allow-multiple-game-instance') && Object.keys(timers).length > 0) {
            submitActivity(Object.keys(timers)[0]);
            timers = {};
        }
        timers[game.id] = new GameLaunch(game.title);
    });
    flashpoint.services.onServiceRemove((process) => {
        if (process.id.startsWith('game.') && process.id.length > 5 && timers[process.id.substr(5)] !== undefined) {
            submitActivity(process.id.substr(5));
        }
    });
}