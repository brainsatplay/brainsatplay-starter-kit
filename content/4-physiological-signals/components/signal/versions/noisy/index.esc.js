import * as signal from '../../index.esc.js'
import * as noise from 'https://cdn.jsdelivr.net/npm/escode-device-noise@0.0.1'

const power = [50, 60]
const movement = [1]

const noiseOverride =  {
    esDOM: {
        devices: noise
    }
}

export const esDOM =  {
    devices:{
        esDOM: {
            noise: {
                frequencies: [[...movement, ...power]] // custom frequencies
            }
        }
    }
}

export const esCompose = [noiseOverride, signal]