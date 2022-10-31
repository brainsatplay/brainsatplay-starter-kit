import * as main from '../0-hello-world/index.esc.js'
import * as input from './components/input.esc.js'

export const esCompose = main


export const esDOM = {
    input
}

export const esListeners = {
    h1: {
        input: true
    }
}