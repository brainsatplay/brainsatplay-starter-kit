export const esElement = 'input'

export const esAttributes = {
    oninput: function () { this.default() }
}

export default function(input) {
    if (input !== undefined) this.esElement.value = input
    return this.esElement.value
}