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

// timers track information of a game currently launch
// times keep all timer info inside a file for persistency
let timers: { [id: string] : GameLaunch; } = {};
let times: { [id: string] : GameInfo; } = {};

// Get a time and display it in a better readable format
function getDisplaytime(time: number) {
    let curr = time / 60;
    if (curr > 90) {
        return (curr / 60).toFixed(1) + " hours";
    }
    return curr.toFixed(1) + " minutes";
}

// When the player is done playing a game
function submitActivity(id: string) {
    let timer = timers[id];
    let diff = new Date().getTime() - timer.creaDate.getTime(); // Time played

    // Update previous time if exist
    if (times[id] !== undefined) {
        times[id].totalTime += diff / 1000;
    } else {
        times[id] = new GameInfo(timer.gameName, diff / 1000);
    }

    // Save info in file
    writeFileSync(path.join(__dirname, "../data/times.json"), JSON.stringify(times), "utf8");

    updateTime(id);

    delete timers[id];
    flashpoint.log.info('Session of ' + timer.gameName + ' lasted ' + ((diff / 1000) / 60).toFixed(2) + ' minutes for a total of ' + getDisplaytime(times[id].totalTime));
}

// Update time played in the "note" section of the game
function updateTime(id: string) {
    flashpoint.games.findGame(id).then((x: flashpoint.Game) => {
        let outputHtml = "Time played: " + getDisplaytime(times[id].totalTime);
        let notes = x.notes;

        // If the note section already exist, we update it, else we create a new one
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
    });
}

let playlistGameIds : string[];
let playlistGames : flashpoint.Game[];

let playlist: flashpoint.Playlist;

// Update playlist containing game played the most
function updatePlaylist() {
    // Delete old playlist if exists
    flashpoint.games.findPlaylist("time-played").then((x: flashpoint.Playlist) => {
        if (x !== undefined) {
            flashpoint.games.removePlaylist(x.id);
        }
    });

    // Get all games
    let games = [];
    for (const [key, value] of Object.entries(times)) {
        games.push({ id: key, time: value.totalTime });
    }

    // Sort them by play time
    games.sort(function(a, b) {
        return a.time > b.time ? -1 : 1;
    });

    playlistGameIds = [];
    playlistGames = [];
    for (let i = 0; i < games.length; i++) {
        playlistGameIds.push(games[i].id);
    }

    loadNextGame(0);
}

// Recursive function that get a game, add it in the list of game and go to the next one
function loadNextGame(index: number) {
    flashpoint.games.findGame(playlistGameIds[index]).then((x: flashpoint.Game) => {
        if (!x.extreme || flashpoint.getExtConfigValue('com.time-played.show-extreme-in-playlist')) { // Is game not extreme or we allow extreme games
            playlistGames.push(x);
        }
        if (playlistGames.length < 10 && index == playlistGames.length - 1) { // Take 10 first games or max amount if less than 10
            loadNextGame(index + 1);
        } else {
            createPlaylist();
        }
    });
}

function createPlaylist() {
    let pGames : flashpoint.PlaylistGame[] = [];
    for (let i = 0; i < playlistGames.length; i++) {
        let game : flashpoint.PlaylistGame = {
            playlistId: "time-played",
            game: playlistGames[i],
            order: i,
            notes: ""
        };
        pGames.push(game);
    }

    playlist = {
        id: "time-played",
        author: "Xwilarg",
        description: "Your 10 most played games and animations",
        extreme: false,
        title: "*Most Played*",
        icon: null,
        library: "arcade",
        games: pGames,
    };
    flashpoint.games.updatePlaylist(playlist);;
}

export function activate(context: flashpoint.ExtensionContext) {

    // Load data saved
    if (existsSync(path.join(__dirname, "../data/times.json"))) {
        times = JSON.parse(readFileSync(path.join(__dirname, "../data/times.json"), "utf8"));
        Object.keys(times).forEach(function(key) {
            updateTime(key);
        });
    }

    flashpoint.games.onDidLaunchGame((game) => {
        // If we don't allow multiple game instances, starting a new one "close" the previous one
        if (!flashpoint.getExtConfigValue('com.time-played.allow-multiple-game-instance') && Object.keys(timers).length > 0) {
            submitActivity(Object.keys(timers)[0]);
            timers = {};
        }
        timers[game.id] = new GameLaunch(game.title);
    });
    flashpoint.services.onServiceRemove((process) => {
        if (process.id.startsWith('game.') && process.id.length > 5 && timers[process.id.substr(5)] !== undefined) {
            submitActivity(process.id.substr(5));
            if (flashpoint.getExtConfigValue('com.time-played.create-playlist')) {
                updatePlaylist();
            }
        }
    });
}