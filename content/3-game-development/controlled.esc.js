import * as phaser from  "./game.esc.js"
import * as keys from  "./external/components/keyboard.esc.js"

export const __compose = phaser

export const __children = {
    keys: {
        __compose: keys,
    },
}


const leftRight = (left, right) => {
    return {
        [`keys.${left}`]: {
            __branch: [
                {equals: true, value: -150},
                {equals: false, value: 0},
            ]
        },

        [`keys.${right}`]: {
            __branch: [
                {equals: true, value: 150},
                {equals: false, value: 0},
            ]
        }
    }
}

export const __listeners = {

    ['player.jump']: {
        ['keys.ArrowUp']: true
    },
    
    ['player.velocity']: leftRight('ArrowLeft', 'ArrowRight'),


        ['companion.jump']: {
            ['keys.w']: true
        },
        
        ['companion.velocity']: leftRight('a', 'd'),

}