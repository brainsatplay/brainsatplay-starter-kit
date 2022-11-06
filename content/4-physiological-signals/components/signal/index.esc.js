
import * as timeseries from 'https://cdn.jsdelivr.net/npm/escode-plot-timeseries@0.0.1'
import * as devices from 'https://cdn.jsdelivr.net/npm/escode-device@0.0.1'

export const esCompose = timeseries

export const esDOM = {
    devices,
}

export const esListeners = {
    'plot': 'devices.output'
}
