
// // // Remote CDN (stable)
// import * as remoteESCompose from 'https://cdn.jsdelivr.net/npm/escompose@0.1.5/dist/index.esm.js'
// import * as remoteESCode from 'https://cdn.jsdelivr.net/npm/escode@0.1.0/dist/index.esm.js'
// import * as remoteESMpile from 'https://cdn.jsdelivr.net/npm/esmpile@0.1.3/dist/index.esm.js'
// export const escompose = remoteESCompose
// export const escode = remoteESCode
// export const esm = remoteESMpile

// Local Filesystem (latest)
import * as localESCompose from './escompose/index.esm.js'
import * as localEScode from './escode/index.esm.js'
import * as localESMpile from './esmpile/index.esm.js'
export const escompose = localESCompose
export const escode = localEScode
export const esm = localESMpile
