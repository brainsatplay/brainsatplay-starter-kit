import dataDevices from "./index.js"


const operator = async function (input, ...recursiveData) {

    if (input === 'data') return recursiveData
    else {
        // Activate the Specified Device
        return await dataDevices.getUserDevice(input).then(device => {

            // Begin Tracking the Device Data
            const ontrack = (track) => track.subscribe((data, timestamp) => this.default('data', data, timestamp, track.contentHint))
            device.stream.getTracks().forEach(ontrack)
            device.stream.onaddtrack = (ev) => ontrack(ev.track)
            // return device
        })
    }
}

export default operator