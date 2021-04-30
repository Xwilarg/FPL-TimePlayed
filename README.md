# FPL-TimePlayed
Flashpoint extension to display how much time you spent on a game


## How to download it
 - Go in [Releases](https://github.com/Xwilarg/FPL-TimePlayed/releases) and get the latest version of TimePlayed.zip
 - Open your Flashpoint folder and go in Data/Extensions, unzip the file there
 - Your extension will now be installed the next time you restart Flashpoint!

## About
### What does it do?
TimePlayed get the time between when you start and stop a game and write it in the game notes\
If you start a game A then a game B, the time count of game A will stop when game B is launched (configurable in the extension settings)

### Features
 - Track your playtime and display it in the game notes section of the game
 - Create a playlist containing your 10 most play games (sorted by playtime)

## Issues and others informations

### My playtime isn't displayed/updating
To see your playtime, you must refresh the current game display, for that just select another game and go back to the one you were\
You playtime is also logged in the History tab

### I don't see my playlist containing most played games
You might have to restart Flashpoint Launcher for this to take effect

### Notice when updating Flashpoint or this extension
Your times are saved in \[your flashpoint directory\]/Data/Extensions/TimePlayed/data/times.json\
If you do something that might delete this file (updating this extension of replacing your Flashpoint Infinity version with another one) make sure to copy this file and paste it there again afterward

### Note about how your playtime is displayed
For now your playtime is displayed on a game under the "Notes" section, this section, usually left empty, may contains various information about the game.\
TimePlayed doesn't remove the information written here, but add your playtime on top of it.\
However everything written here is persistent, the only way to modify it is by going in Configuration, enabling the edition mode and pressing the small pencil on the top-left corner of the game.
