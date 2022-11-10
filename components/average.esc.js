export default function (array) {
    return array.reduce((a,b) => a + b, 0) / array.length
}