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

export function activate(context: flashpoint.ExtensionContext) {

    if (existsSync(path.join(__dirname, "../data/times.json"))) {
        times = JSON.parse(readFileSync(path.join(__dirname, "../data/times.json"), "utf8"));
    }

    flashpoint.games.onDidLaunchGame((game) => {
        timers[game.id] = new GameLaunch(game.title);
    });
    flashpoint.services.onServiceRemove((process) => {
        if (process.id.startsWith('game.') && process.id.length > 5) {
            let closedId = process.id.substr(5);
            let timer = timers[closedId];
            let diff = new Date().getTime() - timer.creaDate.getTime();

            if (times[closedId] !== undefined) {
                times[closedId].totalTime += diff / 1000;
            } else {
                times[closedId] = new GameInfo(timer.gameName, diff / 1000);
            }

            writeFileSync(path.join(__dirname, "../data/times.json"), JSON.stringify(times), "utf8");

            delete timers[closedId];
            flashpoint.log.info('Session of ' + timer.gameName + ' lasted ' + ((diff / 1000) / 60).toFixed(2) + ' minutes for a total of ' + (times[closedId].totalTime / 60).toFixed(2) + ' minutes');
        }
    });
}