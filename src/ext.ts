import * as flashpoint from 'flashpoint-launcher';
import 'reflect-metadata';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { jsonObject, jsonMember, TypedJSON } from 'typedjson';
import path = require('path');

class GameLaunch {
    creaDate: Date;
    gameName: string;

    constructor(gameName: string) {
        this.creaDate = new Date();
        this.gameName = gameName;
    }
}

@jsonObject
class GameInfo {
    @jsonMember
    totalTime: number;
    @jsonMember
    gameName: string;

    constructor(gameName: string, currentTime: number) {
        this.totalTime = currentTime;
        this.gameName = gameName;
    }
}

let timers: Map<string, GameLaunch> = new Map();
let times: Map<string, GameInfo> = new Map()
const serializer = new TypedJSON(GameInfo);

export function activate(context: flashpoint.ExtensionContext) {

    if (existsSync("data/times.json")) {
        times = JSON.parse(readFileSync(path.join(__dirname, "../data/times.json"), "utf8")).map((x: any) => {
            return TypedJSON.parse(JSON.stringify(x), GameInfo);
        });
    }

    flashpoint.games.onDidLaunchGame((game) => {
        timers.set(game.id, new GameLaunch(game.title));
    });
    flashpoint.services.onServiceRemove((process) => {
        if (process.id.startsWith('game.') && process.id.length > 5) {
            let closedId = process.id.substr(5);
            let timer = timers.get(closedId);
            let diff = new Date().getTime() - timer.creaDate.getTime();

            if (times.has(closedId)) {
                times.get(closedId).totalTime += diff / 1000;
            } else {
                times.set(closedId, new GameInfo(timer.gameName, diff / 1000));
            }

            writeFileSync(path.join(__dirname, "../data/times.json"), serializer.stringify(times), "utf8");

            delete timers[closedId];
            flashpoint.log.info('Session of ' + timer.gameName + ' lasted ' + ((diff / 1000) / 60).toFixed(2) + ' minutes for a total of ' + (times.get(closedId).totalTime / 60).toFixed(2) + ' minutes');
        }
    });
}