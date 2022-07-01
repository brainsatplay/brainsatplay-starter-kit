import sinePlugin from './nodes/sine/index.js'
import secondsPlugin from './nodes/time/index.js'
import logPlugin from './nodes/log/index.js'
import filterPlugin from './nodes/filter/index.js'
import fftPlugin from './nodes/fft/index.js'
import ratioPlugin from './nodes/ratio/index.js'
import webrtcPlugin from './nodes/webrtc/index.js'
import circlePlugin from './nodes/circle/index.js'

const plugins = [secondsPlugin, sinePlugin, filterPlugin, fftPlugin, ratioPlugin, webrtcPlugin, circlePlugin, logPlugin]

const seconds = plugins[0]
const pluginsWithChildren = plugins.map(plugin => Object.assign({children: []}, plugin))
for (let i = 0; i < pluginsWithChildren.length; i++){
    pluginsWithChildren[i].children.push(pluginsWithChildren[i+1])
}

export default {
    seconds
}