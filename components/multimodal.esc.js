import * as controlled from  "./controlled.esc.js"
import * as button from  "./external/components/button.esc.js"
import * as speak from "./external/components/voice/speak.esc.js"

export const __compose = controlled

export const __children = {

    button: {
        __attributes: {
            innerText: 'Enable Voice Commands',
            style: {
                position: 'absolute',
                top: '0px',
                left: '0px',
            },
        },
        __compose: button
    },

    speak,
}


export const __listeners = {

    'speak.start': {
       'button': {
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