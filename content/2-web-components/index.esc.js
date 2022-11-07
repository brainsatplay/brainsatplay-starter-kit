
import * as main from '../1-composition/index.esc.js'

export const __attributes = {
    style: {
        display: 'flex'
    }
}

export const __define = {
    randomNumberDisplay: {
        __element: {
            name: 'header-input',
            extends: 'div',
        },
        __compose: main
    }
}
export let __children = {}

const nDisplays = 3
for (let i = 0; i < nDisplays; i++) {
    __children[`input${i}`] = { __element: 'header-input' }
}