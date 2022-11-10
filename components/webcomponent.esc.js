import * as composition from './composition.esc.js'


export const __define = {
    myWebComponent: {
        __element: {
            name: 'header-input',
            extends: 'div',
        },
        __compose: composition
    }
}

export let __children = {
    input1: { __element: 'header-input' },
    input2: { __element: 'header-input' },
    input3: { __element: 'header-input' }
}