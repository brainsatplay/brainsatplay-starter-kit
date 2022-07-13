// ------------------------------- DESCRIPTION -------------------------------
// This file is a linker script that providse information about your application
// to an graphscript.App() instance.

// ------------------------------- HISTORY -------------------------------
// July 12th, 2022 - Garrett Flynn - Created file

// Step 1: Import JSON Files Directly
import graph from './.brainsatplay/index.graph.json' assert {type: 'json'};
import plugins from './.brainsatplay/index.plugins.json' assert {type: 'json'};

// Step 2: Export Application Information
export default {
    plugins,
    graph
}