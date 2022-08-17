import 'https://cdn.jsdelivr.net/npm/visualscript@0.0.7/dist/index.esm.js'

export let visualization;
export const tagName= 'div'

export const style= {
    height: '100%',
    width: '100%'
}

export function onrender(self) {
    visualization = document.createElement('visualscript-timeseries-stream') // don't use class declarations directly to avoid version overlap
    self.appendChild(visualization)
}



export default function (data) {
    if (visualization){
        visualization.data = [data]
        visualization.draw()
    }
    return data
}