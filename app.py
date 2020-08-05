from threading import Thread

from flask import Flask, render_template, json, request

from game.tournament import Tournament
from game.othello import Board

app = Flask(__name__)

# begin tournament
tournament = Tournament()
tournament.start()

# pages
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/admin/")
def admin(key=None):
    return render_template("admin.html")

# GET routes
@app.route("/boards/<key>", methods=["GET"])
def get_boards(key=None):
    return tournament.get_boards(key)

@app.route("/game_results", methods=["GET"])
def get_schedule():
    return tournament.get_game_results()

@app.route("/move_needed/<key>", methods=["GET"])
def get_move_needed(key=None):
    return tournament.get_move_needed(key)

@app.route("/records", methods=["GET"])
def get_wlt_records():
    return tournament.get_wlt_records()

@app.route("/player_names", methods=["GET"])
def get_player_names():
    return tournament.get_names()

@app.route("/winner", methods=["GET"])
def get_winner():
    return tournament.get_winner()

# POST routes
@app.route("/set_name/<key>/<newName>", methods=["POST"])
def set_name(key=None, newName=None):
    err = tournament.set_name(key, newName)
    return json.dumps({"error": err})

@app.route("/move/<key>/<x>/<y>", methods=["POST"])
def move(key=None, x=None, y=None):
    err = tournament.put_move(key, int(y), int(x))
    return json.dumps({"error": err})

@app.route("/restart/<key>", methods=["POST"])
def restart(key=None):
    if key == tournament.admin_key:
        tournament.restart()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)