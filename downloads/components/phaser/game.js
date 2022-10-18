import merge from './config/merge.js';
import defaultConfig from './config/phaser.config.js'

// ----------------------- Phaser Mashup Plugin -----------------------
// An integrated plugin for initializing a Phaser game

// Load Phaser
const script = document.createElement('script')
script.src = 'https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser-arcade-physics.min.js'
document.head.appendChild(script)

// Handle async loading
let nodes = {}
let onResolve = null

if (!('Phaser' in window)) script.onload = () => {
    if (onResolve instanceof Function) onResolve(window.Phaser) // resolve previous promise
    for (let tag in nodes)  nodes[tag].default() // run created nodes when initialized // TODO: Is broken...
    // for (let tag in nodes) nodes[tag].default() 
}

const call = (func, ctx, ...args) => {
    if (typeof func === 'function') func.call(ctx, args)
}

export const preload = []
export const config = defaultConfig

export let game;

export const esElement = 'div'

export function esInit() {
    if (window.Phaser) this.default() // run node if phaser exists
     else nodes[this._unique] = this // set link to node
}

export function esDelete() {
    if (this.game) this.game.destroy(true, false)
}

export default async function(){


    const instance = this

    // Get Phaser
    const Phaser = window.Phaser ?? await new Promise(resolve => onResolve = resolve)

    // Get Config
    let cfg = (typeof this.config === 'function') ? this.config(window.Phaser) : this.config;
    let defaultCfg = (typeof config === 'function') ? config(window.Phaser) : config;
    let mergedConfig = merge(defaultCfg, cfg) // merge config with default config
    mergedConfig.parent =  this.esElement // set parent node

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

            if (instance.esComponents) {
                for (let key in instance.esComponents) {
                    const component = instance.esComponents[key]
                    if (typeof component.ongame === 'function') component.ongame(this.context)
                }
            }

            resolve(this.context)
        }


        // ----------------------- Update Callback -----------------------
        mergedConfig.scene.update = function(){
            call(originalUpdate, this) // TODO: Call all dependent objects...

            // run children with update functions
            if (instance.esComponents) {
                for (let key in instance.esComponents) {
                    const component = instance.esComponents[key]
                    if (typeof component.update === 'function') component.update(this, instance.esComponents) // can be internal or connected
                }
            }
        }


        this.game = new Phaser.Game(mergedConfig);

    })

}