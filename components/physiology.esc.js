import * as game from  "./controlled.esc.js"
import * as devices from 'https://cdn.jsdelivr.net/npm/escode-device@0.0.3'
import * as timeseries from 'https://cdn.jsdelivr.net/npm/escode-plot-timeseries@0.0.4'
import * as average from  "./average.esc.js"
import * as threshold from  "./threshold.esc.js"

export const __compose = game

export const __children = {
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
    average,
    threshold
}

export const __listeners = {
    'player.jump': 'threshold',
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
    ['timeseries.plot']: 'devices.output'
}