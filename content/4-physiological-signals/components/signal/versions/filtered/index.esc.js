import * as signal from "../noisy/index.esc.js";
import * as filter from "https://cdn.jsdelivr.net/npm/escode-device-filter@0.0.1";

const filterOverride = {
    esDOM: {
        devices: filter, // Overwrite devices with filter properties
    },
}

export const esCompose = [filterOverride, signal]


export const esDOM = {
    devices: {
        esDOM: {
            filter: {
                settings: {
                    useBandpass: true,
                    useDCBlock: true,
                    useNotch50: true,
                    useNotch60: true,
                },
            }
        }
    },
}