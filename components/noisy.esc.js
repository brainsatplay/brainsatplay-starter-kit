import * as signal from './signal.esc.js'
import * as noise from 'https://cdn.jsdelivr.net/npm/escode-device-noise@0.0.2'

const noiseOverride =  {
    __children: {
        devices: noise
    }
}

export const __compose = [noiseOverride, signal]

const power = [50, 60]
const movement = [1]

export const __children =  {
    devices:{
        __children: {
            noise: {
                frequencies: [[...movement, ...power]] // custom frequencies
            }
        }
    }
}