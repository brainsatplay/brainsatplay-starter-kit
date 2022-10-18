import fs from 'fs'
import path from 'path'
import https from 'https'

import config from './brainsatplay.config.js'


for (let destination in config.external) {
    let url = config.external[destination]
    const dirname = path.dirname(destination)
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true })
    }
    let file = fs.createWriteStream(destination)
    https.get(url, function(res) {
        if (res.statusCode === 200) {
            res.pipe(file)
        } else {
            console.error(`Response failed for `, url, res.ok)
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
        }
    }).on('error', (e) => {
        console.error(e);
      });
}


