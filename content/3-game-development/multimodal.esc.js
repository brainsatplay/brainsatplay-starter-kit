import * as controlled from  "./controlled.esc.js"
import * as button from  "./core/components/button.esc.js"
import * as speak from "./core/components/voice/speak.esc.js"

export const esAttributes = { style: { position: 'relative' } }

export const esCompose = controlled

export const esDOM = {

    buttons: {
        esAttributes: {
            style: {
                position: 'absolute',
                top: '0px',
                left: '0px',
            },
        },
        esDOM: {
            enableVoice: {
                esElement: 'button',
                esAttributes: {
                    innerText: 'Enable Voice Commands',
                },
                esCompose: button
            },
        }
    },

    speak: {
        // grammar,
        esCompose: speak,
    },
}

export const esListeners = {

     'speak.start': {
        'buttons.enableVoice': {
            esBranch: [
                {equals: true, value: true}
            ]
        }
    },

    'companion.jump': {
        speak: {
            esBranch: [
                {equals: 'jump small alien', value: true},
            ]
        },
    },

    'player.jump': {
        speak: {
            esBranch: [
                {equals: 'jump big alien', value: true},
                {equals: 'jump', value: true},
            ]
        },
    }

}