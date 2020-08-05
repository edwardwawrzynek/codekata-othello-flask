var canvas
var ctx

// size configurations
const cell_size = 32
const info_box_width = 230
const info_box_height = 85
const info_box_radius = 20
const info_box_dim_ratio = info_box_height / info_box_width
const info_box_rad_ratio = info_box_radius / info_box_width

const colors = ["#FFFFFF", "#FF2400", "#87CEEB", "#008000", "#ffbf00"]

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, r);
    this.arcTo(x+w, y+h, x,   y+h, r);
    this.arcTo(x,   y+h, x,   y,   r);
    this.arcTo(x,   y,   x+w, y,   r);
    this.closePath()
    return this
  }

function drawBoard(centerx, centery, board, ctx) {
    const radius = cell_size * 4
    const left = centerx - radius
    const top = centery - radius
    
    // draw axes
    for (let x = 0; x <= cell_size * 8; x += cell_size) {
        ctx.beginPath()
        ctx.moveTo(left + x, top)
        ctx.lineTo(left + x, cell_size * 8 + top)
        ctx.stroke()
    }
    for (let y = 0; y <= cell_size * 8; y += cell_size) {
        ctx.beginPath()
        ctx.moveTo(left, top + y)
        ctx.lineTo(cell_size * 8 + left, top + y)
        ctx.stroke()
    }

    board.forEach((col, x) => {
        col.forEach((tile, y) => {
            ctx.fillStyle = colors[tile]
            ctx.beginPath()
            ctx.arc(left + x * cell_size + cell_size * 0.5, top + y * cell_size + cell_size * 0.5, cell_size * 0.3, 0, 2 * Math.PI)
            ctx.fill()
        })
    })
}

function drawInfoBox(centerx, centery, fill, name, wlt_record) {
    // draw rect
    const left = centerx - info_box_width / 2
    const top = centery - info_box_height / 2

    ctx.fillStyle = fill
    ctx.roundRect(left, top, info_box_width, info_box_height, info_box_radius).fill()

    // write name
    ctx.font = "22px monospace"
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    let texty = top + 11 + 15
    ctx.fillText(name, centerx, texty)

    // write WLT record
    let num_games = (wlt_record[0] + wlt_record[1] + wlt_record[2])
    let percent = ((wlt_record[0] / num_games) + (0.5 * wlt_record[2] / num_games))* 100
    let record_text = `${wlt_record[0]} - ${wlt_record[1]} - ${wlt_record[2]} (${Math.round(percent)}%)`
    ctx.font = "16px monospace"
    texty = top + info_box_height - 8 - 15
    ctx.fillText(record_text, centerx, texty)
}

async function main() {
    // fetch game results
    const game_results_response = await JSON.parse(await (await fetch(`/game_results`)).text())
    const results = game_results_response.results
    const order = game_results_response.order

    // fetch winner
    const winner_response = await JSON.parse(await (await fetch(`/winner`)).text())
    const winner = winner_response.winner

    // fetch boards
    const boards_response = await JSON.parse(await (await fetch(`/boards/observe0`)).text())
    const boards = boards_response.boards

    // fetch WLT records
    const records_response = await JSON.parse(await (await fetch(`/records`)).text())
    const records = records_response.records

    // fetch names
    const names_response = await JSON.parse(await (await fetch(`/player_names`)).text())
    const names = names_response.names

    // clear canvas for redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // draw info boxes
    for (let i = 0; i < records.length; ++i) {
        let x = (canvas.width / 5) * (i + 1)
        let y = 60
        drawInfoBox(x, y, colors[i + 1], names[i], records[i])
    }

    // draw boards
    for (let i = 0; i < boards.length; ++i) {
        let x = (canvas.width / 4) * (i + 1)
        let y = cell_size * 4 + info_box_height + 50
        drawBoard(x, y, boards[i], ctx)
    }

    // draw schedule
    let x = (canvas.width / 4) * 3
    let y = info_box_height + 50
    let w = 30
    let h = info_box_dim_ratio * w
    let r = info_box_rad_ratio * w
    ctx.font = `${h}px monospace`
    for (let i = 0; i < order.length; ++i) {
        let game = order[i]

        ctx.fillStyle = colors[game[0]]
        ctx.roundRect(x - w * 2 - 5, y, w, h, r).fill()

        ctx.fillStyle = colors[game[1]]
        ctx.roundRect(x - w, y, w, h, r).fill()

        if (results[i] != -1) {
            ctx.fillStyle = colors[results[i]]
            ctx.roundRect(x + w * 2 + 5, y, w, h, r).fill()
        } else {
            ctx.fillStyle = "black"
            ctx.textAlign = "center"
            ctx.fillText("TIE", x + w * 2 + 5, y + h / 2 + 1)
        }
        y += h + 10
    }

    // draw winner
    if (winner != null) {
        ctx.font = "48px monospace"
        ctx.fillStyle = colors[winner + 1]
        name = names[winner]
        let x = canvas.width / 2
        let y = canvas.height - 50
        ctx.fillText(`${name} Wins!`, x, y)
    }
    
}

window.onload = () => {
    canvas = document.getElementById("canvas")
    canvas.width = 1300
    canvas.height = 500
    ctx = canvas.getContext("2d")
    window.setInterval(main, 500)
}