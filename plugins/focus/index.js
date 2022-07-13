

import bandpower from './bandpower/index.js';
import fft from './fft/index.js';
import ratio from './ratio/index.js';

import pkg from './package.json' assert {type: 'json'};
import graph from './.brainsatplay/index.graph.json' assert {type: 'json'};
import plugins from './.brainsatplay/index.plugins.json' assert {type: 'json'};

export default {
    bandpower,
    fft, 
    ratio,
    ['.brainsatplay']: {
        package: pkg,
        plugins,
        graph
    }
}