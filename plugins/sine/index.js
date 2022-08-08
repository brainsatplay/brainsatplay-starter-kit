export const tag = "sine"

export const operator = (time, frequency=1, amplitude=1, phase=0, center=0) => {
    return amplitude * Math.sin((2 * frequency * Math.PI) * (time + phase)) + center
}

export default operator