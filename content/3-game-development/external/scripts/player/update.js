export default function update(context, peers){

      // Check if the this.ref got to the end of the scene, take it back to the origin.
      if (this.ref.x >= 2060 || this.ref.x <= 0)  this.ref.x = 0.5;

    if (this.velocity !== 0) this.ref.flipX = Math.sign(this.velocity) === -1
    this.move(this.velocity);


    // Allow Movement
    if (this.velocity === 0) this.ref.anims.play("idle", true);


    // Toggle Walk Animation
    if (this.ref.body.velocity.x === 0) {
        this.ref.anims.play("walk", false);
        this.ref.anims.play("idle", true);
    } else this.ref.anims.play("walk", true)
    
}