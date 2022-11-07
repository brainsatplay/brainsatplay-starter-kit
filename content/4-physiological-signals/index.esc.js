// Previous Demo Components
import * as game from  "../3-game-development/controlled.esc.js"

// New Demo Components
import * as average from  "./components/average.esc.js"
import * as threshold from  "./components/threshold.esc.js"

// External Components
import * as devices from 'https://cdn.jsdelivr.net/npm/escode-device@0.0.3'
import * as timeseries from 'https://cdn.jsdelivr.net/npm/escode-plot-timeseries@0.0.4'

console.log('devices', devices)
export const __compose = game

export const __attributes = { style: { position: 'relative' } }

export const __listeners = {
    'player.jump': {
        threshold: true
    },
    threshold: 'average',
    average: {
        'devices.output': {
            __format: (o) => { 
                const res = o[0]
                if (!res) return
                else return [res] // First channel only
            }
        }
    },
    ['timeseries.plot']: 'devices.output',
}

export const __children = {

    // ---------- Blink Detector ----------
    average: {
        maxBufferSize: 20,
        buffer: [],
        __compose: average,
    },
    threshold: {
        value: 100,
        __compose: threshold,
    },

    // ---------- Device Connection ----------
    devices,

    timeseries: {
        __compose: timeseries,
        __attributes: {
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
        __children: {
            signalCanvas: {
                __attributes: {
                    style: {
                        width: '100%',
                        height: '150px'
                    }
                },
            },
            overlayCanvas: {
                __attributes: {
                    style: {
                        width: '100%',
                        height: '150px'
                    }
                },
            },
        },
    },
}