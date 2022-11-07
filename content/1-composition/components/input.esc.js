export const __element = 'input'

export const __attributes = {
    oninput: function () { this.default() }
}

export default function(input) {
    if (input !== undefined) this.esElement.value = input
    return this.esElement.value
}