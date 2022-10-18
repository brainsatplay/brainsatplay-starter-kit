
// ------------ Create a Device ------------
let looping = false
let freqs = [1,4,8]
const customDevice = {
    label: 'mydevice',
    onconnect: (device) => {
        looping = true
        const animate = (callback) => {
            if (looping){
                const t = Date.now() / 1000 
                let channels = []
                freqs.forEach(f => {
                    const y = Math.sin((2 * f * Math.PI) * t)
                    channels.push(y)
                })
                callback(channels)
                setTimeout(() => animate(callback), 1000/60)
            }
        }

        animate(device.ondata)
        
    },
    ondisconnect: async (device) => looping = false,
    ondata: (channels) => {
        
        // This would usually have to be organized.
        // But we already have what we need!
        return channels

    },
    protocols: []
}

export default (trigger) => (trigger) ? customDevice : undefined