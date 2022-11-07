import * as controlled from  "./controlled.esc.js"
import * as button from  "./external/components/button.esc.js"
import * as speak from "./external/components/voice/speak.esc.js"

export const __attributes = { style: { position: 'relative' } }

export const __compose = controlled

export const __children = {

    buttons: {
        __attributes: {
            style: {
                position: 'absolute',
                top: '0px',
                left: '0px',
            },
        },
        __children: {
            enableVoice: {
                __element: 'button',
                __attributes: {
                    innerText: 'Enable Voice Commands',
                },
                __compose: button
            },
        }
    },

    speak: {
        // grammar,
        __compose: speak,
    },
}

export const __listeners = {

     'speak.start': {
        'buttons.enableVoice': {
            __branch: [
                {equals: true, value: true}
            ]
        }
    },

    'player.jump': {
        speak: {
            __branch: [
                {equals: 'jump', value: true},
            ]
        },
    }

}