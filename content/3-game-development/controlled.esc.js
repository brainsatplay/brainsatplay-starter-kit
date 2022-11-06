import * as phaser from  "./index.esc.js"
import * as keys from  "./external/components/keyboard.esc.js"

export const esCompose = phaser

export const esDOM = {
    keys: {
        esCompose: keys,
    },
}


const leftRight = (left, right) => {
    return {
        [`keys.${left}`]: {
            esBranch: [
                {equals: true, value: -150},
                {equals: false, value: 0},
            ]
        },

        [`keys.${right}`]: {
            esBranch: [
                {equals: true, value: 150},
                {equals: false, value: 0},
            ]
        }
    }
}

export const esListeners = {

    ['player.jump']: {
        ['keys.ArrowUp']: true
    },
    
    ['player.velocity']: leftRight('ArrowLeft', 'ArrowRight'),


        ['companion.jump']: {
            ['keys.w']: true
        },
        
        ['companion.velocity']: leftRight('a', 'd'),

}