import base from './base.js'
import { main } from './main.js'

function createCompanion(player) {

    base.call(this, player) // call base create function
    main.call(this, player) // call main create function (no follow)

    const size =  4/6
    // Half Size
    player.setDisplaySize(size*player.width , size*player.height); 

}

export default createCompanion