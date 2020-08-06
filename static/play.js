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
  console.log(params);
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

function drawBoard(board, x, y, w, h) {
  render.fillStyle = "white";
  render.fillRect(x, y, w, h);

  let [xOff, yOff, size] = boardBounds(x, y, w, h);

  drawBoardSquare(board, xOff, yOff, size);
}

function drawBoardSquare(board, xOff, yOff, size) {
  render.fillStyle = "#819b7d";
  render.fillRect(xOff, yOff, size, size);
  for(let x = 0; x < 8; x++) {
    for(let y = 0; y < 8; y++) {
      render.strokeRect(xOff + x*(size/8), yOff + y*(size/8), size/8, size/8);

      if(board[x][y] == 0) continue;
      let color;
      if(reverse_colors) {
        color = board[x][y] == 1 ? 'black' : 'white';
      } else {
        color = board[x][y] == 1 ? 'white' : 'black';
      }
      render.fillStyle = color;

      render.beginPath();
      render.arc(xOff + (x + 0.5)*(size/8), yOff + (y + 0.5)*(size/8), (size/8) * 0.4, 0, 2.0 * Math.PI);
      render.fill();
    }
  }
}

async function clickHandle(event) {
  let x = event.pageX;
  let y = event.pageY;

  let [xOff, yOff, size] = boardBounds(5, 105, width - 10, height - 115);

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

  render.fillText(`You are playing ${reverse_colors ? 'black' : 'white'}.`, x + w/2, y + 25, w - 10);
  render.fillText("When a move is required, click where you would like to place a disk.", x + w/2, y + 50, w - 10);
  render.fillText("Move required: " + needed.needed, x + w/2, y + 75, w - 10);
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

  const board = await JSON.parse(await (await fetch(`/boards/${apiKey}`)).text());
  if(board != null) drawBoard(board.boards[0], 5, 105, width - 10, height - 115);
  const moveNeeded = await JSON.parse(await (await fetch(`/move_needed/${apiKey}`)).text());
  if(moveNeeded != null) drawMoveNeeded(moveNeeded, 5, 5, width - 10, 95);

  window.setTimeout(main, 500);
}
