// Previous Demo Components
import * as helloWorldDemo from  "../0-hello-world/index.esc.js"
import * as compositionDemo from  "../1-composition/index.esc.js"
import * as webComponentsDemo from  "../2-web-components/index.esc.js"
import * as gameDemo from  "../3-game-development/multimodal.esc.js"
import * as physiologicalSignalsDemo from  "../4-physiological-signals/index.esc.js"


export const esAttributes = {
    style: {
        overflow: 'scroll',
        height: '100%',
        width: '100%',
        padding: '50px',
        fontFamily: 'sans-serif',
        boxSizing: 'border-box'
    }
}


const maxHeight = '400px'
gameDemo.esAttributes.style.height = maxHeight

// const esCode = undefined

const esCode = {
    style: {
        height: maxHeight,
        border: '2px solid'
    }
}


export const esDOM = {

    header: {
        esElement: 'h1',
        esAttributes: {
            innerText: 'Brains@Play Starter Kit'
        }
    },

    paragraph1: {
        esElement: 'p',
        esAttributes: {
            innerText: 'Congratulations on starting your journey with Brains@Play. We are exited to see what you develop with us.'
        }
    },

    hr1: {
        esElement: 'hr',
    },


    paragraph2: {
        esElement: 'p',
        esAttributes: {
            innerHTML: 'In this tutorial, we first introduced the concept of an <b>ES Component</b> by creating a basic Hello World project with a single header tag.'
        }
    },

    helloworld: {
        esCode,
        esCompose: helloWorldDemo,
    },

    paragraph3: {
        esElement: 'p',
        esAttributes: {
            innerHTML: 'Then, we used the principle of <b>composition</b> to extend this by listening to the value of an input tag with the innerText of our header.'
        }
    },

    composition: {
        esCode,
        esCompose: compositionDemo,
    },

    paragraph4: {
        esElement: 'p',
        esAttributes: {
            innerHTML: 'Next, we registered this ES Component as a <b>Web Component</b> that can be included anywhere in an existing project. How cool!'
        }
    },

    webcomponents: {
        esCode,
        esCompose: webComponentsDemo,
    },

    hr2: {
        esElement: 'hr',
    },

    paragraph5: {
        esElement: 'p',
        esAttributes: {
            innerHTML: 'Switching to a more complicated example, we used an existing ES Component to <b>create a simple game</b> using <a href="https://phaser.io/phaser3">Phaser 3</a>, while also introducing the concept of <b>multimodal control</b>.'
        }
    },

    game: {
        esCode,
        esCompose: gameDemo,
    },

    paragraph6: {
        esElement: 'p',
        esAttributes: {
            innerHTML: 'Finally, we extended this game to be controlled by <b>physiological data</b> from the Muse 2 headband.'
        }
    },

    physiologicalsignals: {
        esCode,
        esCompose: physiologicalSignalsDemo,
        // esChildPosition: 0
    },

    hr2: {
        esElement: 'hr',
    },

    paragraph7: {
        esElement: 'p',
        esAttributes: {
            innerHTML: 'We hope you enjoyed this tutorial. And we hope to see you again soon!'
        }
    },
}