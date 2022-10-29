// -------------------------- Custom Scripts + Components --------------------------
import custom from "./scripts/index.js"
// import * as log from "./components/log.js"

// -------------------------- Downloads --------------------------
import * as average from  "./downloads/components/basic/average.js"
import * as threshold from  "./downloads/components/basic/threshold.js"
import * as muse from  "./downloads/components/devices/muse.js"
import * as button from  "./downloads/components/ui/button.js"
import * as start from  "./downloads/components/devices/start.js"

// ----------------------------- Base Component -----------------------------
import * as phaser from "./downloads/apps/showcase/demos/phaser/index.esc.js"
export const esCompose = phaser

// ----------------------------- Will Merge In -----------------------------
export const esAttributes = { style: { position: 'relative' } }

export const esListeners = {
    ['game.player.jump']: {
        threshold: true
    },
    threshold: 'average',
    average: {
        datastreams: true
    },
    datastreams: 'muse',
    muse: 'button'
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

    // ---------- Devices ----------
    // synthetic: {
    //     esCompose: synthetic,
    // },
    // ganglion: {
    //     esCompose: ganglion,
    // },
    muse: {
        esCompose: muse,
    },

    button: {
        esElement: 'button',
        esAttributes: {
            innerText: 'Connect Muse',
            onclick: custom,
            style: {
                zIndex: 100,
                position: 'absolute',
                top: '0',
                left: '0',
            }
        },
        esCompose: button,
    },

    datastreams: {
        esCompose: start,
    },
}