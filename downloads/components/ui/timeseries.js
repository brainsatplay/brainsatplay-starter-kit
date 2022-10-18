import 'https://cdn.jsdelivr.net/npm/visualscript@0.0.7/dist/index.esm.js'

export const esElement = {
    element: 'div',
    style: {
        height: '100%',
        width: '100%'
    }
}

export let stream;

export function onrender(){
    if (this.stream) this.stream.remove()
    this.stream = document.createElement('visualscript-timeseries-stream')
    this.esElement.appendChild(this.stream)
}

export let nChannels = 0
export let channels = {}

const arrayFactory = (data, length=1, position=0) => Array.from({length}, (_,i) => (position === i) ? data : [])
export default function (data, time, tag) {
    if (this.stream){
        let transformed = arrayFactory(data, this.nChannels, this.channels[tag])
        this.stream.data = transformed
        if (this.channels[tag] === undefined) {
           this.channels[tag] = this.nChannels // index
           this.nChannels++ // increment
           this.onrender() 
        }
        this.stream.draw()
    }
}