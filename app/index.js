import sinePlugin from './nodes/sine/index.js'
import secondsPlugin from './nodes/time/index.js'
import logPlugin from './nodes/log/index.js'

const seconds = Object.assign({children: []}, secondsPlugin)
const sine = Object.assign({children: []}, sinePlugin)
seconds.children.push(sine)
sine.children.push(logPlugin)

export default {
    seconds
}