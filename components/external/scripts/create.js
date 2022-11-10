let score = 0;

function create() {

    // load the map
    const map = this.make.tilemap({ key: "map" });

    // ------------------------- Create Ground -------------------------
    // tiles for the ground layer
    const groundTiles = map.addTilesetImage("tiles");
    // create the ground layer
    const groundLayer = map.createLayer("World", groundTiles, 0, 0);
    // the player will collide with this layer
    groundLayer.setCollisionByExclusion([-1]);

    // ------------------------- Create Coins -------------------------
    // coin image used as tileset
    const coinTiles = map.addTilesetImage("coin");
    
    // add coins as tiles
    const coinLayer = map.createLayer("Coins", coinTiles, 0, 0);

    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;

    coinLayer.setTileIndexCallback(17, (sprite, tile) => {
      removeTile(coinLayer, tile)
      score = incrementScore(score, text)
    }, this);

    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // set background color, so the sky is not black
    this.cameras.main.setBackgroundColor("#ccccff");

    // ------------------------- Create Score -------------------------
    const text = this.add.text(20, 570, "0", {
      fontSize: "20px",
      fill: "#ffffff",
    });

    // fix the text to the camera
    text.setScrollFactor(0);
  }

   // this function will be called when the player touches a coin
   function incrementScore(score, text) {
    score++; // add 10 points to the score
    if (text) text.setText(score); // set the text to show the current score
    return score;
  }

  // this function will be called when the player touches a coin
  function removeTile(layer, tile) {
    layer.removeTileAt(tile.x, tile.y); // remove the tile/coin
    return false;
  }

  export default create