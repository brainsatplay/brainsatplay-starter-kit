// Previous Demo Components
import * as game from  "../3-game-development/multimodal.esc.js"
import * as button from  "../3-game-development/core/components/button.esc.js"

// New Demo Components
import * as average from  "./components/average.esc.js"
import * as threshold from  "./components/threshold.esc.js"
import * as muse from  "./core/muse.esc.js"
import * as start from  "./core/start.esc.js"

export const esCompose = game

export const esListeners = {
    'player.jump': {
        threshold: true
    },
    threshold: 'average',
    average: {
        start: true
    },
    start: 'muse',
    muse: 'buttons.connectMuse'
}

export const esDOM = {

    // ---------- Blink Detector ----------
    average: {
        maxBufferSize: 100,
        buffer: [],
        esCompose: average,
    },
    threshold: {
        value: 300,
        esCompose: threshold,
    },

    // ---------- Device Connection ----------
    muse,

    buttons: {
        esDOM: {
            connectMuse: {
                esAttributes: {
                    innerText: 'Connect Muse'
                },
                esCompose: button,
            },
        }
    },

    start,
}