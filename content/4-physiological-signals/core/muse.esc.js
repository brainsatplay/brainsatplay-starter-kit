// ------------ Load and Connect an EEG Device ------------
import muse from "https://cdn.jsdelivr.net/npm/@brainsatplay/muse@0.0.1/dist/index.esm.js"

export default (trigger) => (trigger) ? muse : undefined