import 'https://cdn.jsdelivr.net/npm/visualscript@0.0.7/dist/index.esm.js'

const timeseries = {
    tag: 'timeseries',
    operator: (data) => {
        if (timeseries.visualization){
            timeseries.visualization.data = [data]
            timeseries.visualization.draw()
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
        timeseries.visualization = document.createElement('visualscript-timeseries-stream') // don't use class declarations directly to avoid version overlap
        self.appendChild(timeseries.visualization)
    }
}

export default timeseries