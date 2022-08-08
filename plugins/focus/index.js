

import * as bandpowerPlugin from './bandpower/index.js';
import * as fftPlugin from './fft/index.js';
import * as ratioPlugin from './ratio/index.js';

import pkg from './package.json' assert {type: 'json'};
import graph from './index.wasl' assert {type: 'json'};

export const bandpower = bandpowerPlugin
export const fft = fftPlugin
export const ratio = ratioPlugin

export default {
    package: pkg,
    graph
}