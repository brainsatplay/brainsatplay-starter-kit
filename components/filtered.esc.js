import * as signal from "./noisy.esc.js";
import * as filter from "https://cdn.jsdelivr.net/npm/escode-device-filter@0.0.2";

const filterOverride = {
    __children: {
        devices: filter, // Overwrite devices with filter properties
    },
}

export const __compose = [filterOverride, signal]

export const __children = {
    devices: {
        __children: {
            filter: {
                settings: {
                    useLowpass: true,
                    lowpassHz: 40,
                    useDCBlock: true,
                    useNotch50: true,
                    useNotch60: true,
                },
            }
        }
    },
}