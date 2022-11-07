
import * as timeseries from 'https://cdn.jsdelivr.net/npm/escode-plot-timeseries@0.0.4'
import * as devices from 'https://cdn.jsdelivr.net/npm/escode-device@0.0.3'

export const __compose = timeseries

export const __children = {
    devices,
}

export const __listeners = {
    'plot': 'devices.output'
}
