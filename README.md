# Codekata-Othello-Flask

## Game 
Othello is played by 2 players on an 8x8 board. Players take turns placing oppositely colored stones on the board.

A move consists of "outflanking" your opponent's disks, then flipping them to your color.

### The 8 Rules of Othello
1. If a player cannot outflank at least one of their opponent's disks, they must forfeit their turn. Player's may not forfeit their turn under any other circumstances.
2. A disk may outflank any number of disks in any number of rows or directions at the same time. Rows are defined as continuous straight lines.
3. Player's may not skip over their own color when outflanking. Rows must be continuous lines of the opponent's disks.
4. Disks may only be outflanked as a direct result of a move. A disk flipped because it was just outflanked cannot outflank more disks.
5. All outflanked disks must be flipped.
6. Once a disk is placed, it can never be moved to another square.
7. Players have an unlimited supply of disks.
8. The game ends when neither player may make a legal move. The player with the majority of the disks wins.

### Starting Positions

Player 1 starts with disks on (4, 3) and (3, 4). Player 2 starts with disks on (3, 3) and (4, 4).
These are the 4 centermost squares on the board.

## Game API

Each player is given a unique key to make api requests with. For the default server configuration, the keys are: `key0`, `key1`, `key2`, `key3`

For a real competition, tokens will be distributed beforehand.

### Routes

All responses returned by the api are valid JSON. The routes described below are not the only existing routes. However, they are the only routes relevant to the AIs.

`GET /boards/<key>`

Returns the state of the board as a 2D Array.
The opponent's disks appear as -1 and your disks appear as 1. Empty squares appear as 0.

`GET /move_needed/<key>`

Returns a boolean representing whether the server is waiting for the player with api key `key` to make a move.

`POST /set_name/<key>/<newName>`

Sets a player's name as it appears on the front end. `key` is the player and `newName` is the new name.

`POST /move/<key>/<x>/<y>`

Puts a move at `(x, y)` by the player with api key `key`. Returns errors if they occurred.

## Running the Server

The server is written with Flask. It serves by default on `http://localhost:5000`. It can be run with `flask run`.