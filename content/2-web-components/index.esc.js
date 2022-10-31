
import * as main from '../1-composition/index.esc.js'

export const esAttributes = {
    style: {
        display: 'flex'
    }
}

export const esComponents = {
    randomNumberDisplay: {
        esElement: {
            name: 'header-input',
            extends: 'div',
        },
        esCompose: main
    }
}
export let esDOM = {}

const nDisplays = 3
for (let i = 0; i < nDisplays; i++) {
    esDOM[`input${i}`] = { esElement: 'header-input' }
}