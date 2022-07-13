export default {
    tag: 'log',
    operator: (...inputs) => console.log('[log]:', ...inputs),
}