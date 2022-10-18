
export let mode = 'key'

export let shiftKey;
export let metaKey;
export let altKey;

const defaults = ['shiftKey', 'metaKey', 'altKey']

export function esInit() {

    // Toggle On
    window.addEventListener('keydown', (ev) => {

        const val = ev[this.mode]

        const defaults = ['shiftKey', 'metaKey', 'altKey']
        defaults.forEach(key => {
            if (ev[key]) this[key] = ev[key]
        })

        this.default(val)
    })

    // Toggle Off
    window.addEventListener('keyup', (ev) => {
        defaults.forEach(key => {
            if (ev[key] != this[key]) this[key] = ev[key]
        })

        this[ev[this.mode]] = false
    })

}

export default function (key) {
    this[key] = true
    return key // Return last key
}