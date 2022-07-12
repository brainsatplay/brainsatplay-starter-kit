export default {
    tag: 'filter',
    operator: (input) => {
        console.log('[filter]:', input)
        return input
    },

    // Logic
    edges: ['fft']
}