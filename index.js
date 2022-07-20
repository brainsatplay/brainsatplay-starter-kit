// ------------------------------- DESCRIPTION -------------------------------
// This file is a linker script that providse information about your application
// to an graphscript.App() instance AND exports an api

// ------------------------------- HISTORY -------------------------------
// July 12th, 2022 - Garrett Flynn - Created file
// July 13th, 2022 - Garrett Flynn - Updated for API export

import circles from './plugins/circles/index.js';
import filter from './plugins/filter/index.js';
import focus from './plugins/focus/index.js';
import log from './plugins/log/index.js';
import seconds from './plugins/seconds/index.js';
import sine from './plugins/sine/index.js';
import timeseries from './plugins/timeseries/index.js';
import webrtc from './plugins/webrtc/index.js';

// Step 1: Import JSON Files Directly
import pkg from './package.json' assert {type: 'json'};
import graph from './.brainsatplay/index.graph.json' assert {type: 'json'};
import plugins from './.brainsatplay/index.plugins.json' assert {type: 'json'};

// Step 2: Export Application API + Info
export default {
    circles,
    filter, 
    focus,
    log,
    seconds,
    sine, 
    timeseries,
    webrtc,
    ['.brainsatplay']: {
        package: pkg,
        plugins,
        graph
    }
}