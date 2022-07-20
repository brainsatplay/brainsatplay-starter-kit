import 'https://cdn.jsdelivr.net/npm/visualscript@0.0.7/dist/index.esm.js'

let timeseries;

export default {
    tag: 'timeseries',
    operator: (data) => {
        if (timeseries){
            timeseries.data = [data]
            timeseries.draw()
        }
        return data
    },

    tagName: 'div',
    style: {
        height: '100%',
        width: '100%'
    },

    // Add TimeSeries instance to the main UI
    oncreate: (self) => {
        timeseries = document.createElement('visualscript-timeseries-stream') // don't use class declarations directly to avoid version overlap
        self.appendChild(timeseries)
    }
}