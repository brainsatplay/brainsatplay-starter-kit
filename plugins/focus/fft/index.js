export default (input) => {
    const output = Array.from({length: 10}, (e,i) => (i+1)*input)
    return [output]
}