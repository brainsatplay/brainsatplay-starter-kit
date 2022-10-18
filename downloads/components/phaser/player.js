// NOTE: Player is designed to sit inside the Game node
export let bounce = 0.0;
export let collideWorldBounds;
export let size = {}
export let position = {}
export let jumpRefractoryPeriod = 2000 // wait until next jump

export let create; // externally-specified create function
export let update; // externally-specified update function

export let ref; // reference to the player sprite

export let jumped = false
export function jump (height) {
    if (
        height 
        && this.jumped === false 
    ) {
        this.jumped = true
        this.ref.body.setVelocityY(-500*height);
        setTimeout(() => this.jumped = false, this.jumpRefractoryPeriod) // minimum 1.5 seconds
    }
}

export function move (x=0) {
    this.ref.body.setVelocityX(x);
}

// Custom Callback for Phaser Game
export function ongame(game){

    if (game){

        // create the player sprite
        this.ref = game.physics.add.sprite(this.position.x, this.position.y, "player");

        this.ref.setBounce(this.bounce); // our player will bounce from items
        this.ref.setCollideWorldBounds(this.collideWorldBounds); // don't go out of the map

        // small fix to our player images, we resize the physics body object slightly
        this.ref.body.setSize((this.size.width ?? this.ref.width) + this.size.offset?.width ?? 0, (this.size.height ?? this.ref.height) + this.size.offset?.height ?? 0); // adjustment

        if (typeof this.create === "function") this.create.call(game, this.ref)
    }

}

export default function() { return this.ref }