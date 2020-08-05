from enum import Enum
import itertools
import copy

from flask import json

EMPTY = 0
PLAYER1 = 1
PLAYER2 = -1

class Direction:
    def __init__(self, dx, dy):
        self.dx = dx
        self.dy = dy

    def __repr__(self):
        return f"({self.dx}, {self.dy})"

    def from_focus(self, focus):
        return (focus[0] + self.dx, focus[1] + self.dy)

directions = tuple([Direction(*p) for p in itertools.product([-1, 0, 1], [-1, 0, 1])])

class Board:
    center_squares = ((3, 3), (4, 3), (4, 4), (3, 4))
    def __init__(self, board=None):
        if board == None:
            self.contents = [[EMPTY for y in range(8)] for x in range(8)]
        else:
            self.contents = copy.deepcopy(board.contents)
        self.all_tiles = tuple(itertools.product(range(8), range(8)))
        self.player1_key = None
        self.player2_key = None

        self.active_turn = PLAYER1

        self.winner = None
        self.loser = None
        self.tied = False

        self.is_open = True
    
    def __str__(self):
        string = ""
        for col in self.contents:
            for cell in col:
                string += cell
            string += "\n"
        return string

    @property
    def game(self):
        return (self.player1_key, self.player2_key)

    def ready(self):
        self.is_open = True
        self.winner = None
        self.loser = None
        self.tied = False
        self.active_turn = PLAYER1

    def load_game(self, game):
        self.contents = [[EMPTY for y in range(8)] for x in range(8)]
        for index, tile in enumerate(self.center_squares):
            if index % 2 == 0:
                self.set_at(*tile, PLAYER1)
            else:
                self.set_at(*tile, PLAYER2)

        self.player1_key = game[0]
        self.player2_key = game[1]

        self.is_open = False

    def is_occupied(self, x, y):
        return self.get_at(x, y) != EMPTY

    def get_opponent(self, player):
        return {PLAYER1: PLAYER2, PLAYER2: PLAYER1}[player]

    def get_at(self, x, y):
        return self.contents[x][y]

    def set_at(self, x, y, val):
        self.contents[x][y] = val

    def flip(self, x, y):
        self.set_at(x, y, -self.get_at(x, y))

    def flip_all(self, tiles):
        for tile in tiles:
            self.flip(*tile)

    def point_in_bounds(self, x, y):
        return (x in range(8)) and (y in range(8))

    def get_flipped_tiles(self, player, x, y):
        opponent = self.get_opponent(player)

        flipped_tiles = []

        for direction in directions:
            path = []

            focus = (x, y)
            first = True
            found_end = False

            while first or self.get_at(*focus) == opponent:
                first = False

                focus = direction.from_focus(focus)

                if not self.point_in_bounds(*focus): break

                if self.get_at(*focus) == player:
                    found_end = True
                    break
                elif self.get_at(*focus) == opponent:
                    path.append(focus)
            if found_end: flipped_tiles += path

        return flipped_tiles
    
    def check_legal(self, player, x, y):
        if self.is_occupied(x, y):
            return "space is occupied"
        elif len(self.get_flipped_tiles(player, x, y)) == 0:
            return "move must capture pieces"
        else:
            return None

    def must_forfeit(self, player):
        forfeit = True
        for tile in self.all_tiles:
            err = self.check_legal(player, *tile)
            if err == None:
                forfeit = False
                break
        return forfeit
        

    def put_move(self, player, x, y):
        if self.active_turn != player:
            return "played out of turn"

        err = self.check_legal(player, x, y)
        if err == None:
            self.flip_all(self.get_flipped_tiles(player, x, y))
            self.set_at(x, y, player)
            if not self.must_forfeit(-self.active_turn):
                self.active_turn *= -1
            
        else:
            return err

    def check_game_end(self):
        if self.must_forfeit(PLAYER1) and self.must_forfeit(PLAYER2):
            self.end_game()

    def end_game(self):
        self.active_turn = None

        # score result
        if self.winner == None:
            p1_score = 0
            p2_score = 0
            for tile in self.all_tiles:
                if self.get_at(*tile) == PLAYER1:
                    p1_score += 1
                elif self.get_at(*tile) == PLAYER2:
                    p2_score += 1

            if p1_score > p2_score:
                self.winner = self.player1_key
                self.loser = self.player2_key
            elif p2_score > p1_score:
                self.winner = self.player2_key
                self.loser = self.player1_key
            else:
                self.tied = True
        

    def prepared_for(self, player_key):
        new_board = Board(self)
        if player_key == self.player1_key:
            return new_board
        else:
            new_board.flip_all(self.all_tiles)
            return new_board

    def prepared_for_observer(self, player_keys_guide):
        new_board = Board(self)
        for tile in new_board.all_tiles:
            current = self.get_at(*tile)
            if current != 0:
                if current == PLAYER1:
                    key = self.player1_key
                elif current == PLAYER2:
                    key = self.player2_key
                else:
                    print(current) # this shouldn't happen
                new = player_keys_guide.index(key) + 1
            else:
                new = 0
            new_board.set_at(*tile, new)
        return new_board

    def move_needed(self, player):
        self.check_game_end()
        return player == self.active_turn
