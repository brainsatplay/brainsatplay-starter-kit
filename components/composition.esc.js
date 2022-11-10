import * as main from './hello.esc.js'
import * as input from './input.esc.js'

export const __compose = main

export const __children = {
    input
}

export const __listeners = {
    header: {
        input: true
    }
}
