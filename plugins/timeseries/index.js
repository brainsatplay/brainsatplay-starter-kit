import 'https://cdn.jsdelivr.net/npm/visualscript@0.0.7/dist/index.esm.js'

export let visualization;
export const tagName= 'visualscript-timeseries-stream'

export const style= {
    height: '100%',
    width: '100%'
}


export default function (data) {
    if (this.element){
        this.element.data = [data]
        this.element.draw()
    }
    return data
}