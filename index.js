// ------------------------------- DESCRIPTION -------------------------------
// This file is a linker script that providse information about your application
// to an graphscript.App() instance AND exports an api

// ------------------------------- HISTORY -------------------------------
// July 12th, 2022 - Garrett Flynn - Created file
// July 13th, 2022 - Garrett Flynn - Updated for API export

import * as circlesPlugin from './plugins/circles/index.js';
import * as filterPlugin from './plugins/filter/index.js';
import * as focusPlugin from './plugins/focus/index.js';
import * as logPlugin from './plugins/log/index.js';
import * as secondsPlugin from './plugins/seconds/index.js';
import * as sinePlugin from './plugins/sine/index.js';
import * as timeseriesPlugin from './plugins/timeseries/index.js';
import * as webrtcPlugin from './plugins/webrtc/index.js';

// Step 1: Import JSON Files Directly
import pkg from './package.json' assert {type: 'json'};
import graph from './index.wasl' assert {type: 'json'};

// Step 2: Export Application API + Info
export const circles = circlesPlugin
export const filter = filterPlugin
export const focus = focusPlugin
export const log = logPlugin
export const seconds = secondsPlugin
export const sine = sinePlugin
export const timeseries = timeseriesPlugin
export const webrtc = webrtcPlugin

export default {
    package: pkg,
    graph
}