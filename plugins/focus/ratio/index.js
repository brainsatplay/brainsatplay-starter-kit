export default {
    tag: 'ratio',
    operator: (a,b) => {
        console.log('[ratio]', a, b)
        if (b) return a/b
        else return a
    },
}