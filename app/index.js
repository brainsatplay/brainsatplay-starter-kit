import sinePlugin from './nodes/sine/index.js'
import secondsPlugin from './nodes/time/index.js'
import logPlugin from './nodes/log/index.js'
import filterPlugin from './nodes/filter/index.js'
import fftPlugin from './nodes/fft/index.js'
import ratioPlugin from './nodes/ratio/index.js'
import webrtcPlugin from './nodes/webrtc/index.js'
import circlePlugin from './nodes/circle/index.js'

// Order the Graph
const plugins = [secondsPlugin, sinePlugin, filterPlugin, fftPlugin, ratioPlugin, webrtcPlugin, circlePlugin, logPlugin]
const pluginsWithChildren = plugins.map(plugin => Object.assign({children: []}, plugin))
const seconds = pluginsWithChildren[0]

// Link Children Sequentially
for (let i = 0; i < pluginsWithChildren.length - 1; i++){
    const child = pluginsWithChildren[i+1]
    if (child) pluginsWithChildren[i].children.push(child)
}

// Export the Application
export default {
    seconds
}