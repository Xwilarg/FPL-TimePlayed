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

function getDisplaytime(time: number) {
    let curr = time / 60;
    if (curr > 90) {
        return (curr / 60).toFixed(1) + " hours";
    }
    return curr.toFixed(1) + " minutes";
}

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
    flashpoint.log.info('Session of ' + timer.gameName + ' lasted ' + ((diff / 1000) / 60).toFixed(2) + ' minutes for a total of ' + getDisplaytime(times[id].totalTime));
}

function updateTime(id: string) {
    flashpoint.games.findGame(id).then((x: flashpoint.Game) => {
        let outputHtml = "Time played: " + getDisplaytime(times[id].totalTime);
        let notes = x.notes;
        if (notes.includes("Time played:")) {
            notes = notes.replace(/.*Time played:.*/, outputHtml);
        } else {
            if (notes === "") {
                notes = outputHtml;
            } else {
                notes = outputHtml + "\n\n" + notes;
            }
        }
        x.notes = notes;
        flashpoint.games.updateGame(x);

        if (!flashpoint.getExtConfigValue('com.time-played.create-playlist')) {
            return;
        }

        flashpoint.games.findPlaylist("time-played").then((x: flashpoint.Playlist) => {
            if (x !== undefined) {
                flashpoint.games.removePlaylist(x.id);
            }
        });
        let games = [];
        for (const [key, value] of Object.entries(times)) {
            games.push({ id: key, time: value.totalTime });
        }

        games.sort(function(a, b) {
            return a.time > b.time ? -1 : 1;
        });

        let max = games.length > 10 ? 10 : games.length;

        let whitelist : flashpoint.FieldFilter[] = [];
        for (let i = 0; i < max; i++) {
            let filter: flashpoint.FieldFilter = {
                field: "id",
                value: games[i].id
            };
            whitelist.push(filter);
        }
        let search : flashpoint.FindGamesOpts = {
            filter: {
                searchQuery: {
                    whitelist: whitelist,
                    blacklist: [],
                    genericBlacklist: [],
                    genericWhitelist: []
                }
            }
        };
        flashpoint.games.findGames(search, false).then((x: flashpoint.ResponseGameRange<false>[]) => {
            for (const elem in x[0].games) {
                flashpoint.log.info("Elem: " + elem);
            }
        });


       /* let playlist: flashpoint.Playlist = {
            id: "time-played",
            author: "Xwilarg",
            description: "Your 10 most played games and animations",
            extreme: false,
            title: "*Most Played*",
            icon: null,
            library: "arcade"
        }*/
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