import time
import random
import itertools
import copy
from threading import Thread

from flask import json

from game.othello import Board, PLAYER1, PLAYER2

class WLTRecord:
    def __init__(self):
        self.wins = 0
        self.losses = 0
        self.ties = 0

    @property
    def win_rate(self):
        num_games = self.wins + self.losses + self.ties
        return (self.wins / num_games) + (0.5 * self.ties / num_games)
    
    def to_tuple(self):
        return (self.wins, self.losses, self.ties)


class Tournament:
    def __init__(self, rounds=1, observe_key="observe0", admin_key="admin0", player_keys=("key0", "key1", "key2", "key3")):
        self.rounds = rounds
        self.observe_key = observe_key
        self.admin_key = admin_key
        self.player_keys = player_keys

        self.player_names = [f"Unknown {i}" for i, player in enumerate(player_keys)]

        self.boards = [Board() for i in range(2)]

        self.games = [game for game in itertools.product(self.player_keys, self.player_keys) if game[0] != game[1]] * self.rounds
        random.shuffle(self.games)
        self.active_games = []
        self.game_results = [0 for game in self.games]

        self.player_games = {key: None for key in self.player_keys}
        self.player_records = {key: WLTRecord() for key in self.player_keys}
    
        self.update_interval = 0.5 # seconds

        self.thread = None
        self.running = False
        self.stopped = False

    def start(self):
        self.thread = Thread(target=self.update_players)
        self.thread.daemon = True
        self.thread.start()

    def restart(self):
        self.running = False
        print("Stopping tournament...")
        while not self.stopped:
            pass
        print("Tournament stopped.")
        print("Restarting tournament...")
        self.__init__(self.rounds, self.observe_key, self.admin_key, self.player_keys)
        self.start()

    def get_winner(self):
        # check if the game is over
        if len([r for r in self.game_results if r == 0]) > 0:
            return json.dumps({"error": None, "winner": None})

        apikey = max(self.player_keys, key=lambda apikey: self.player_records[apikey].win_rate)
        winner = self.player_keys.index(apikey)
        return json.dumps({"error": None, "winner": winner})

    def is_idle(self, player_key):
        return self.player_games[player_key] == None

    def update_players(self):
        start = time.time()
        last_update = start
        self.running = True
        print(f"Tournament started, updating every {self.update_interval} seconds")
        while self.running:
            time.sleep(self.update_interval)

            # handle finished boards
            for b in self.boards:
                b.ready_run_countdown()

                if b.tied:
                    self.player_records[b.player1_key].ties += 1
                    self.player_records[b.player2_key].ties += 1
                    self.game_results[self.games.index(b.game)] = -1 # -1 means TIE
                elif b.winner != None:
                    self.player_records[b.winner].wins += 1
                    self.player_records[b.loser].losses += 1
                    self.game_results[self.games.index(b.game)] = self.player_keys.index(b.winner) + 1
                else: # game has not finished
                    continue
                self.player_games[b.player1_key] = None
                self.player_games[b.player2_key] = None
                print("Readying board")
                b.ready_start_countdown()

            # handle available boards
            available_boards = [b for b in self.boards if b.is_open]
            for board in available_boards:
                for game in self.games:
                    if (not self.is_idle(game[0])) or (not self.is_idle(game[1])) or game in self.active_games:
                        continue
                    board.load_game(game)
                    self.active_games.append(game)
                    self.player_games[game[0]] = board
                    self.player_games[game[1]] = board
                    print(f"Starting game {game}")
                    break
        self.stopped = True

    def set_name(self, player_key, new_name):
        err = "player does not exist"
        if player_key in self.player_keys:
            index = self.player_keys.index(player_key)
            self.player_names[index] = new_name
            err = None
        return err

    def put_move(self, player_key, x, y):
        err = "player is not in an active game"
        board = self.player_games.get(player_key, None)
        if board != None:
            if player_key == board.player1_key:
                player = PLAYER1
            else:
                player = PLAYER2
            err = board.put_move(player, x, y)
        return err
        
    def get_boards(self, key):
        err = None
        boards = []
        if key in self.player_keys:
            if self.player_games[key] != None:
                boards.append(self.player_games[key].prepared_for(key).contents)
        elif key == self.observe_key:
            board_objs = self.boards.copy()
            for obj in board_objs:
                board = obj.prepared_for_observer(self.player_keys).contents
                boards.append(board)
        else:
            err = "key not found"
        return json.dumps({"error": err, "boards": boards})

    def key_to_index(self, key):
        return self.player_keys.index(key)

    def get_game_results(self):
        games = [(self.key_to_index(g[0]) + 1, self.key_to_index(g[1]) + 1) for g in self.games]
        return json.dumps({"error": None, "results": self.game_results, "order": games})

    def get_wlt_records(self):
        records = [self.player_records[key].to_tuple() for key in self.player_keys]
        data = {"error": None, "records": records}
        return json.dumps(data)

    def get_names(self):
        data = {"error": None, "names": self.player_names}
        return json.dumps(data)

    def get_move_needed(self, key):
        if key != None:
            board = self.player_games[key]
            if board != None:
                if board.player1_key == key:
                    player = PLAYER1
                else:
                    player = PLAYER2
                needed = board.move_needed(player)
                return json.dumps({"error": None, "needed": needed})
            else:
                return json.dumps({"error": None, "needed": False})
        else:
            return json.dumps({"error": "key not found", "needed": False})
        
        
    