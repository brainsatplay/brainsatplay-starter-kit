export let callback;

export default function (...args) {
    console.log('[log]:', ...args);

    if(typeof this.callback === 'function') this.callback(...args);
}