// ------------ Load and Connect an EEG Device ------------
import ganglion from "https://cdn.jsdelivr.net/npm/@brainsatplay/ganglion@0.0.2/dist/index.esm.js"

export default (trigger) => (trigger) ? ganglion : undefined