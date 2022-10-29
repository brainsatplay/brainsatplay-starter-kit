
export let mode = 'key'

export let shiftKey;
export let metaKey;
export let altKey;

const defaults = ['shiftKey', 'metaKey', 'altKey', 'ctrlKey']

export const heldSet = new Set()
export const held = []
export const holdTime = 300 // State must be held for 300ms

export function updateHeld (val, command = 'add') {
    if (command === 'add') this.heldSet.add(val)
    else this.heldSet.delete(val)

    if (this.heldId) clearTimeout(this.heldId)
    this.heldId = setTimeout(() => this.held = [...this.heldSet], this.holdTime) // State must be held for 300ms
}

export function esConnected() {

    // Toggle On
    window.addEventListener('keydown', (ev) => {

        const val = ev[this.mode]

        if (!this[val]) {

            defaults.forEach(key => {
                if (ev[key]) this[key] = ev[key]
            })

            this.updateHeld(val)

            this.default(val)
        }
    })

    // Toggle Off
    window.addEventListener('keyup', (ev) => {

        const val = ev[this.mode]
        defaults.forEach(key => {
            if (ev[key] != this[key]) this[key] = ev[key]
        })

        this.updateHeld(val, 'delete')

        this[val] = false
    })

}

export default function (key) {
    this[key] = true
    return key // Return held keys
}