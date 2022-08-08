export const tag = "ratio"

export const operator = (a,b) => {
    if (b) return a/b
    else return a
}

export default operator