// Element Specification
export const esElement = {
    element: 'button',
    attributes: {
        innerHTML: 'Click Me',  // Set default text
        onmousedown: function () {
            this.default({value: true, __internal: true}) // Run the default function of the ES Component
            const onMouseUp = () => {
                this.default({value: false, __internal: true}) // Notify when the mouse has been released
                globalThis.removeEventListener('mouseup', onMouseUp) // Stop monitoring for the mouseup event
            }
            globalThis.addEventListener('mouseup', onMouseUp) // Monitor when the user releases the mouse
        }
    }
}

export let cache = null // Store the last value passed to the Component

export default function (input){

    let res;
    const value = input?.value ?? input // Grab the passed value
    const isInternal = input?.__internal // Check if the input was internal or external

    // Pass the cached value for the Component when it is pressed
    if (isInternal) {
        if (this.cache) {
            if (value !== undefined) res = this.cache // Establish a new behavior where the cahched value is returned when the button is pressed
        } else res = value // Maintain previous behavior by notifying when the button is (un)pressed.
    }
    
    // Set the cache with external values
    else if (value !== undefined) this.cache = value

    return res
}