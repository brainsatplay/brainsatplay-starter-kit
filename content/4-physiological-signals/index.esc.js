// Previous Demo Components
import * as game from  "../3-game-development/controlled.esc.js"

// New Demo Components
import * as average from  "./components/average.esc.js"
import * as threshold from  "./components/threshold.esc.js"

// External Components
import * as devices from 'https://cdn.jsdelivr.net/npm/escode-device@0.0.0'
import * as timeseries from 'https://cdn.jsdelivr.net/npm/escode-plot-timeseries@0.0.1'

export const esCompose = game

export const esListeners = {
    'player.jump': {
        threshold: true
    },
    threshold: 'average',
    average: {
        'devices.output': {
            esFormat: (o) => { 
                const res = o[0]
                if (!res) return
                else return [res] // First channel only
            }
        }
    },
    ['timeseries.plot']: 'devices.output',
}

export const esDOM = {

    // ---------- Blink Detector ----------
    average: {
        maxBufferSize: 20,
        buffer: [],
        esCompose: average,
    },
    threshold: {
        value: 100,
        esCompose: threshold,
    },

    // ---------- Device Connection ----------
    devices,

    timeseries: {
        esCompose: timeseries,
        esAttributes: {
            style: {
                position: "absolute",
                bottom: "15px",
                right: "15px",
                width: "250px",
                height: "150px",
                zIndex: 1,
            }
        },

        // Style the Internal Canvases
        esDOM: {
            signalCanvas: {
                esAttributes: {
                    style: {
                        width: '100%',
                        height: '150px'
                    }
                },
            },
            overlayCanvas: {
                esAttributes: {
                    style: {
                        width: '100%',
                        height: '150px'
                    }
                },
            },
        },
    },
}