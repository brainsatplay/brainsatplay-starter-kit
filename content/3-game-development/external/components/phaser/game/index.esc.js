import merge from './config/merge.js';
import defaultConfig from './config/phaser.config.js'

// ----------------------- Phaser Mashup Plugin -----------------------
// An integrated plugin for initializing a Phaser game

// Load Phaser
const script = document.createElement('script')
script.src = 'https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser-arcade-physics.min.js'
document.head.appendChild(script)

// Handle async loading
let nodes = []

if (!('Phaser' in window)) script.onload = () => {
    nodes.forEach(n => n.default()) // run created nodes when initialized
}

const call = (func, ctx, ...args) => {
    if (typeof func === 'function') func.call(ctx, args)
}

export const preload = []
export const config = defaultConfig

export let game;

export const container = null // Always create a container with its own scope

export const pointerEvents = false

export function esConnected() {

    // Allow scrolling on phaser games
    this.container = document.createElement('div')
    if (!this.pointerEvents) this.container.style.pointerEvents = 'none'
    this.container.style.width = '100%'
    this.container.style.height = '100%'
    this.esElement.appendChild(this.container)

    if (window.Phaser) this.default() // run node if phaser exists
    else nodes.push(this)
}

export function esDisconnected() {
    if (this.game) this.game.destroy(true, false)
}

export default async function(){

    const instance = this

    // Get Phaser
    const Phaser =  window.Phaser

    // Get Config
    let cfg = (typeof this.config === 'function') ? this.config(window.Phaser) : this.config;
    let defaultCfg = (typeof config === 'function') ? config(window.Phaser) : config;
    let mergedConfig = merge(defaultCfg, cfg) // merge config with default config
    mergedConfig.parent =  this.container // set parent node

    // Handle Game Initialization
    return new Promise((resolve) => {
        const originalUpdate = mergedConfig.scene.update
        const originalCreate = mergedConfig.scene.create
        const originalPreload = mergedConfig.scene.preload

        // ----------------------- Preload Callback -----------------------
        mergedConfig.scene.preload = function(){

            // Preload all specified assets
            for (let fName in instance.preload){
                const o = instance.preload[fName]
                if (typeof o === 'object') for (let key in o) this.load[fName](...Object.values(o[key]));
                else this.load[fName](o);
            }
            // instance.preload.forEach(o => this[o.function](...o.args)) // Preload all assets
            call(originalPreload, this)
        }

        // ----------------------- Create Callback -----------------------
        mergedConfig.scene.create = function(){
            call(originalCreate, this)
            this.context = this

            if (instance.esDOM) {
                for (let key in instance.esDOM) {
                    const component = instance.esDOM[key]
                    if (typeof component.ongame === 'function') component.ongame(this.context)
                }
            }

            resolve(this.context)
        }


        // ----------------------- Update Callback -----------------------
        mergedConfig.scene.update = function(){
            call(originalUpdate, this) // TODO: Call all dependent objects...

            // run children with update functions
            if (instance.esDOM) {
                for (let key in instance.esDOM) {
                    const component = instance.esDOM[key]
                    if (typeof component.update === 'function') component.update(this, instance.esDOM) // can be internal or connected
                }
            }
        }


        this.game = new Phaser.Game(mergedConfig);

    })

}