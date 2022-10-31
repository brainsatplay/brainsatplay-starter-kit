
// Internal Variables
export const __useclick = true

// Notification Variables
export const pressed = false;
export let cache = null // Store the last value passed to the Component

export const esElement = 'button'  // default element

// Element Attributes Specification
export const esAttributes = {
    innerHTML: 'Click Me',  // Set default text

    // Mimics the main onmousedown callback
    onclick: function () {
        if (this.__useclick) {
            this.default({value: true, __internal: true})
            this.default({value: false, __internal: true}) 
        }
    },

    onmousedown: function () {
        this.__useclick = false
        this.default({value: true, __internal: true}) // Run the default function of the ES Component
        const onMouseUp = () => {
            this.default({value: false, __internal: true}) // Notify when the mouse has been released
            globalThis.removeEventListener('mouseup', onMouseUp) // Stop monitoring for the mouseup event
            setTimeout(() => this.__useclick = true, 10)
        }
        globalThis.addEventListener('mouseup', onMouseUp) // Monitor when the user releases the mouse
    }
}

export default function (input){
    
    let res;
    const value = input?.value ?? input // Grab the passed value
    const isInternal = input?.__internal // Check if the input was internal or external

    // Pass the cached value for the Component when it is pressed
    if (isInternal) {

        this.pressed = value // Trigger setter

        if (this.cache) {
            if (value) res = this.cache // Establish a new behavior where the cahched value is returned when the button is pressed
        } else res = value // Maintain previous behavior by notifying when the button is (un)pressed.
    }
    
    // Set the cache with external values
    else if (value !== undefined) this.cache = value

    return res
}