import * as player from  "./components/player.esc.js"
import * as game from  "./components/game.esc.js"

export const esCompose = game

export const esDOM = {
    player,
    companion: {
        esCompose: player,
        position: {
            x: 100,
            y: 200
        },
        size: {
            height: 4/6,
            width: 4/6
        }
    }
}