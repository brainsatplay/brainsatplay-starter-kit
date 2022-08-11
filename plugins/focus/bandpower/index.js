export default (input, band='alpha') => {

    if (!Array.isArray(input)) input = []

    const output = {
        alpha: input[0]*100,
        delta: input[1]*100,
        beta: input[2]*100,
        theta: input[3]*100,
        gamma: input[4]*100,
    }

    return output[band] // TODO: Allow returning multiple outputs
}