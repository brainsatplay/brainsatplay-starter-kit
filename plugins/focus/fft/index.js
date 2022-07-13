export default {
    tag: 'fft',
    operator: (input) => {
        const output = [input]
        console.log('[fft]:', output)
        return [output]
    },
}