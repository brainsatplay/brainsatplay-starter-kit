// -------------------------- Custom Scripts + Components --------------------------
import * as custom from "./scripts/index.js"
import * as log from "./components/log.js"

console.log('log', log)
console.log('custom', custom)

// -------------------------- Downloads --------------------------
// Components
import * as keys from "./downloads/components/basic/keyboard.js"
import * as game from  "./downloads/components/phaser/game.js"
import * as player from  "./downloads/components/phaser/player.js"

import * as average from  "./downloads/components/basic/average.js"
import * as threshold from  "./downloads/components/basic/threshold.js"
import * as muse from  "./downloads/components/devices/muse.js"
import * as button from  "./downloads/components/ui/button.js"
import * as timeseries from  "./downloads/components/ui/timeseries.js"
import * as start from  "./downloads/components/devices/start.js"

// Scripts
import createMain from  "./downloads/scripts/player/create/main.js"
import createCompanion from  "./downloads/scripts/player/create/companion.js"
import update from "./downloads/scripts/player/update.js"
import create from "./downloads/scripts/player/create.js"

// Customize Button Element
const buttonElementConfig = Object.assign({}, button.esElement)
buttonElementConfig.attributes = Object.assign({}, buttonElementConfig.attributes)
buttonElementConfig.attributes.innerText = 'Connect Muse'
buttonElementConfig.style = {
    'z-index': 100,
    position: 'absolute',
    top: '0',
    left: '0',
}

// Customize Timeseries Element
const timeseriesElementConfig = Object.assign({}, timeseries.esElement)
timeseriesElementConfig.style = {
    position: "absolute",
    bottom: "15px",
    right: "15px",
    width: "250px",
    height: "150px",
    "z-index": 100,
}


// Specify Application Logic
export const esComponents = {

    // Main Phaser Game
    keys: {
        esCompose: keys,
    },
    game: {
        esCompose: game,
        preload: {
            setBaseURL: "https://raw.githubusercontent.com/brainsatplay/escode/main/drafts/demos/phaser/assets",
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
            }
        },
        esComponents: {
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
                update: update 
            }
        }
    },
}
// Adding Companion
esComponents.game.esComponents.companion = {
    esCompose: player,
    position: {
        x: 100,
        y: 200
    },
    size: {
        offset: {
            height: -8
        }
    },
    bounce: 0.2,
    collideWorldBounds: false,
    create: createCompanion,
    update
}

// Adding Device Controls
esComponents.average = {
    maxBufferSize: 100,
    buffer: [],
    esCompose: average,
},

esComponents.threshold = {
    threshold: 300,
    esCompose: threshold,
},
    
// model.esComponents.synthetic = average
// model.esComponents.ganglion = average
esComponents.muse = {
    esCompose: muse,
}

esComponents.button = {
    esElement: buttonElementConfig,
    esCompose: button,
}

    
esComponents.timeseries = {
    esElement: timeseriesElementConfig,
    esCompose: timeseries
}
    
esComponents.datastreams = {
    esCompose: start
}


export const esListeners = {

        // Main Player Controls
        ['keys.ArrowUp']: {
            ['game.player.jump']: true,
        },

        ['keys.ArrowLeft']: {
            ['game.player.velocity']: {
                esBranch: [
                    {equals: true, value: -150},
                    {equals: false, value: 0},
                ]
            }
        },
        ['keys.ArrowRight']: {
            ['game.player.velocity']: {
                esBranch: [
                    {equals: true, value: 150},
                    {equals: false, value: 0},
                ]
            }
        },

        // Companion Controls
        ['keys.w']: {
            ['game.companion.jump']: true,
        },
        ['keys.a']: {
            ['game.companion.velocity']: {
                esBranch: [
                    {equals: true, value: -200},
                    {equals: false, value: 0},
                ]
            }
        },
        ['keys.d']: {
            ['game.companion.velocity']: {
                esBranch: [
                    {equals: true, value: 200},
                    {equals: false, value: 0},
                ]
            }
        },

        // Threshold Control
        average: 'threshold',
        threshold: "game.player.jump",
        datastreams: {
            timeseries: true,
            average: true
        },

        muse: "datastreams",
        button: "muse"
}