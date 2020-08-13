let canvas, render, width, height;

let apiKey="";
let name="";

// configuration params
let do_set_name = true;
let reverse_colors = false;

function getHashParams() {

  var hashParams = {};
  var e,
      a = /\+/g,  // Regex for replacing addition symbol with a space
      r = /([^&;=]+)=?([^&;]*)/g,
      d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
      q = window.location.hash.substring(1);

  while (e = r.exec(q))
     hashParams[d(e[1])] = d(e[2]);

  return hashParams;
}

/* setup a full page canvas */
window.onload = () => {
  canvas = document.getElementById("canvas");
  render = canvas.getContext("2d");

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    render.fillStyle = "white";
    render.fillRect(0, 0, width, height);
  };

  resize();
  window.onresize = resize;

  const params = getHashParams();
  if('no_set_name' in params) {
    do_set_name = false;
  }
  if('api_key' in params) {
    apiKey = params['api_key'];
  }
  if('reverse_colors' in params) {
    reverse_colors = true;
  }

  canvas.addEventListener('click', clickHandle, false);

  window.setTimeout(main, 500);
}

function boardBounds(x, y, w, h) {
  if(w > h) {
    return [x + (w - h)/2, y, h];
  } else {
    return [x, y + (h - w)/2, w];
  }
}

function applyDir(pos, dir) {
  const [x, y] = pos;
  const [dx, dy] = dir;

  return [x + dx, y + dy];
}

function validPos(pos) {
  return pos[0] >= 0 && pos[0] < 8 && pos[1] >= 0 && pos[1] < 8;
}

function countDisks(board, player) {
  let res = 0;
  for(let x = 0; x < 8; x++) {
    for(let y = 0; y < 8; y++) {
      if(board[x][y] == player) res++;
    }
  }

  return res;
}

// get the legal moves that us can make on the board
// return an array of legal moves [[x, y], [x, y], ...]
function getLegalMoves(board, us) {
  let moves = [];

  const them = us == 1 ? -1 : 1;
  // all possible directions
  const directions = [
    [1, 0],
    [1, 1],
    [1, -1],
    [-1, 0],
    [-1, 1],
    [-1, -1],
    [0, 1],
    [0, -1],
  ]

  for(let x = 0; x < 8; x++) {
    for(let y = 0; y < 8; y++) {
      if(board[x][y] != 0) continue;

      for(let d = 0; d < 8; d++) {
        const startPos = [x, y];
        const dir = directions[d];

        // a legal move is one that forms a chain of any number of them, than us
        let pos = applyDir(startPos, dir);
        let hitThem = false;
        while(validPos(pos) && board[pos[0]][pos[1]] == them) {
          pos = applyDir(pos, dir);
          hitThem = true;
        }
        if(hitThem && validPos(pos) && board[pos[0]][pos[1]] == us) {
          moves.push([x, y]);
        }
      }
    }
  }

  return moves;
}

function drawBoard(board, drawMoves, x, y, w, h) {
  render.fillStyle = "white";
  render.fillRect(x, y, w, h);

  let [xOff, yOff, size] = boardBounds(x, y, w, h);

  drawBoardSquare(board, drawMoves, xOff, yOff, size);
}

function drawBoardSquare(board, drawMoves, xOff, yOff, size) {
  const moves = getLegalMoves(board, 1);

  render.fillStyle = "white";
  render.fillRect(xOff, yOff, size, size);
  for(let x = 0; x < 8; x++) {
    for(let y = 0; y < 8; y++) {
      if(drawMoves && moves.some((pos) => pos[0] == x && pos[1] == y)) {
        render.beginPath();
        render.arc(xOff + (x + 0.5)*(size/8), yOff + (y + 0.5)*(size/8), (size/8) * 0.3, 0, 2.0 * Math.PI);
        render.stroke();
      }

      render.strokeRect(xOff + x*(size/8), yOff + y*(size/8), size/8, size/8);

      if(board[x][y] == 0) continue;

      let color;
      if(reverse_colors) {
        color = board[x][y] == 1 ? '#FF2400' : '#87CEEB';
      } else {
        color = board[x][y] == 1 ? '#87CEEB' : '#FF2400';
      }
      render.fillStyle = color;

      render.beginPath();
      render.arc(xOff + (x + 0.5)*(size/8), yOff + (y + 0.5)*(size/8), (size/8) * 0.3, 0, 2.0 * Math.PI);
      render.fill();
    }
  }
}

async function clickHandle(event) {
  let x = event.pageX;
  let y = event.pageY;

  let [xOff, yOff, size] = boardBounds(5, 105, width - 10, height - 185);

  x -= xOff;
  y -= yOff;

  x /= size/8;
  y /= size/8;

  x = Math.floor(x);
  y = Math.floor(y);

  if(x < 0 || y < 0 || x > 8 || y > 8) return;

  const response = JSON.parse(await (await fetch(`/move/${apiKey}/${y}/${x}`, {method: 'POST'})).text());
  if(response.error != null) {
    alert(`Error making move: ${response.error}`);
  }
}

function drawMoveNeeded(needed, x, y, w, h) {
  render.fillStyle = "white";
  render.fillRect(x, y, w, h);

  render.font = "15px monospace";
  render.textAlign = "center";
  render.fillStyle = "black";

  render.fillText(`You are playing ${reverse_colors ? 'red' : 'blue'}. When it is your turn, click to place a disk.`, x + w/2, y + 25, w - 10);
  render.fillText("Empty squares with the outline of a disk are your legal moves.", x + w/2, y + 50, w - 10);
  render.fillText(needed.needed ? "Your Turn" : "Not Your Turn", x + w/2, y + 75, w - 10);
}

function drawNoActiveMatch(x, y, w, h) {
  render.fillStyle = "white";
  render.fillRect(x, y, w, h);

  render.font = "15px monospace";
  render.textAlign = "center";
  render.fillStyle = "black";

  render.fillText("No Active Match", x + w/2, y + h/2, w - 10);
}

function drawBottomStats(board, x, y, w, h) {
  render.fillStyle = "white";
  render.fillRect(x, y, w, h);

  render.font = "15px monospace";
  render.textAlign = "left";
  render.fillStyle = "black";

  const us = countDisks(board, 1);
  const them = countDisks(board, -1);

  const usM = getLegalMoves(board, 1);
  const themM = getLegalMoves(board, -1);
  let winnerText = "";

  if(usM == 0 && themM == 0) {
    if(us - them == 0) winnerText = "Tie!";
    if(us - them > 0) winnerText = "You Win!";
    if(us - them < 0) winnerText = "You Lose!";
  }

  render.fillText(`${us.toString().padStart(2, ' ')} - ${them.toString().padStart(2, ' ')} (You - Them)  ${winnerText}`, x + 5, y + 20, w - 10);

  if(winnerText != "") {
    render.font = "50px monospace";
    render.textAlign = "center";
    render.fillStyle = "black";

    render.fillText(winnerText, width/2, height/2, width - 10);
  }
}

function drawBottomStatsSquare(board, x, y, w, h) {
  let [xOff, yOff, size] = boardBounds(5, 105, width - 10, height - 185);
  drawBottomStats(board, x + xOff, y, size, h);

}

async function main() {
  if(apiKey == "") {
    apiKey = window.prompt("API key to play with", "");
    if(apiKey == "") return;
  }
  if(name == "" && do_set_name) {
    name = window.prompt("Name", "");
    if(name == "") return;

    await fetch(`/set_name/${apiKey}/${name}`, {method: 'POST'});
  }

  const moveNeededText = await (await fetch(`/move_needed/${apiKey}`)).text();
  const boardText = await (await fetch(`/boards/${apiKey}`)).text();

  const moveNeeded = JSON.parse(moveNeededText);
  if(moveNeeded != null) drawMoveNeeded(moveNeeded, 5, 5, width - 10, 95);
  const board = JSON.parse(boardText);
  if(board != null) {
    if(board.boards.length > 0) {
      drawBoard(board.boards[0], moveNeeded.needed, 5, 105, width - 10, height - 185);
      drawBottomStatsSquare(board.boards[0], 5, height - 75, width - 10, 70);
    } else {
      drawNoActiveMatch(5, 105, width - 10, height - 115);
    }
  }

  window.setTimeout(main, 500);
}
