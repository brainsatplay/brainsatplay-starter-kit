
// Buffer Mode
export let maxBufferSize = 100
export let buffer;

export default function (input) {
    const max = this.maxBufferSize
    const isBuffer = Array.isArray(this.buffer)
    let buffer = isBuffer ? this.buffer : []
    if (input !== undefined) {
        if (Array.isArray(input[0])) input = input[0] // No nested arrays...
        if (!Array.isArray(input)) input = [input]
        buffer.push(...input)
    }

    if (isBuffer && buffer.length > max) buffer = buffer.splice(-max)
    return buffer.reduce((a,b) => a + b, 0) / buffer.length
}