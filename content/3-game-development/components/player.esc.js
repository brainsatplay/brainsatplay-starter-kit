import * as player from  "../core/components/phaser/player.esc.js"
import create from  "../core/scripts/player/create/main.js"
import update from "../core/scripts/player/update.js"


export const esCompose = player

export const position = {
    x: 200,
    y: 200
}

export const size = {
    offset: {
        height: -8
    }
}

export const bounce = 0.2
export const collideWorldBounds = false

export {
    create,
    update
}