const getLayer = (name, context) => {
    return context.children.list.find(o => o.type === "TilemapLayer" && o.layer.name === name)
}

function createPlayer(player) {

        const context = this.ref?.scene ?? this

        // player will collide with the level tiles
        const groundLayer = getLayer('World', context) 
        context.physics.add.collider(groundLayer, player);
    
        const coinLayer = getLayer('Coins', context) 
        context.physics.add.overlap(player, coinLayer);
          
}

export default createPlayer