import * as flashpoint from 'flashpoint-launcher';

var timers: { [id: string] : GameInfo; } = {};

class GameInfo {
    creaDate: Date;
    gameName: string;

    constructor(gameName: string) {
        this.creaDate = new Date();
        this.gameName = gameName;
    }
}

export function activate(context: flashpoint.ExtensionContext) {
    flashpoint.games.onDidLaunchGame((game) => {
        timers[game.id] = new GameInfo(game.title);
    });
    flashpoint.services.onServiceRemove((process) => {
        if (process.id.startsWith('game.') && process.id.length > 5) {
            let closedId = process.id.substr(5);
            let timer = timers[closedId];
            let diff = new Date().getTime() - timer.creaDate.getTime();
            delete timers[closedId];
            flashpoint.log.info('Played at ' + timer.gameName + ' for ' + ((diff / 1000) / 60).toFixed(2) + ' minutes.');
        }
    });
}