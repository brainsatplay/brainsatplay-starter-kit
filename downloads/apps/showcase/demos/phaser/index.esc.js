import * as game from  "../../../../components/phaser/game/index.js"
import * as player from  "../../../../components/phaser/player.js"
import createMain from  "./scripts/player/create/main.js"
import update from "./scripts/player/update.js"
import create from "./scripts/create.js"
import * as keys from "../../../../components/basic/keyboard.js"

export const esAttributes = {
    style: {
        width: '100%',
        height: '100%',
    }
}

export const esDOM = {
    keys: {
        esCompose: keys,
    },
    game: {
        
        esAttributes: {
            style: {
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
            }
        },

        esCompose: game,
        preload: {
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
        },
        config: {
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
                // {
                //     esCompose: create
                // }
            }
        },
        esDOM: {
            player: {
                esCompose: player,
                position: {
                    x: 200,
                    y: 200
                },
                size: {
                    offset: {
                        height: -8
                    }
                },
                bounce: 0.2,
                collideWorldBounds: false,
                create: createMain,
                // {
                //     esCompose: createMain
                // },
                update: update 
                // {
                //     esCompose: update
                // }
            }
        }
    }
}


export const esListeners = {

        // Main Player Controls
        ['game.player.jump']: {
            ['keys.ArrowUp']: true
        },
        
        ['game.player.velocity']: {

            ['keys.ArrowLeft']: {
                esBranch: [
                    {equals: true, value: -150},
                    {equals: false, value: 0},
                ]
            },

            ['keys.ArrowRight']: {
                esBranch: [
                    {equals: true, value: 150},
                    {equals: false, value: 0},
                ]
            }
        }
}