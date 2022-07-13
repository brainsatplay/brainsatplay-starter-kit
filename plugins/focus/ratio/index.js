export default {
    tag: 'ratio',
    operator: (a,b) => {
        if (b) return a/b
        else return a
    },
}