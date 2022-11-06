import * as game from  "../external/components/phaser/game/index.esc.js"
import create from "../external/scripts/create.js"

export const esAttributes = {
    style: {
        width: '100%',
        height: '100%',
    }
}

export const esCompose = game

export const preload = {
    setBaseURL: "https://raw.githubusercontent.com/brainsatplay/escode/main/apps/showcase/demos/phaser/assets",
    tilemapTiledJSON: [
        [
            "map",
            "map.json"
        ]
    ],
    spritesheet: [
        [
            "tiles",
            "tiles.png",
            {
                frameWidth: 70,
                frameHeight: 70
            }
        ]
    ],
    image: [
        [
            "coin",
            "coinGold.png"
        ]
    ],
    atlas: [
        [
            "player",
            "player.png",
            "player.json"
        ]
    ]
}

export const config = {
    physics: {
        default: "arcade",
        arcade: {
            gravity: {
                y: 500
            }
        }
    },
    scene: {
        key: "main",
        create: create
    }
}