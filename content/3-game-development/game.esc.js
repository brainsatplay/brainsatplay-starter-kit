import * as player from  "./external/components/player.esc.js"
import * as game from  "./external/components/game.esc.js"

export const __compose = game

export const __children = {
    player,
    companion: {
        __compose: player,
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