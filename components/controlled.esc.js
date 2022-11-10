import * as phaser from  "./game.esc.js"
import * as keys from  "./external/components/keyboard.esc.js"

export const __compose = phaser

export const __children = {
    keys
}

export const __listeners = {

    ['player.jump']: {
        ['keys.ArrowUp']: true
    },

    ['companion.jump']: {
        ['keys.w']: true
    },
    
    ['player.velocity']: {
        ['keys.ArrowLeft']: {
            __branch: [
                {equals: true, value: -150},
                {equals: false, value: 0},
            ]
        },

        ['keys.ArrowRight']: {
            __branch: [
                {equals: true, value: 150},
                {equals: false, value: 0},
            ]
        }
    },
        
    ['companion.velocity']: {
        ['keys.a']: {
            __branch: [
                {equals: true, value: -150},
                {equals: false, value: 0},
            ]
        },

        ['keys.d']: {
            __branch: [
                {equals: true, value: 150},
                {equals: false, value: 0},
            ]
        }
    }
}