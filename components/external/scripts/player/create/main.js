import base from './base.js'

export function main() {

    const context = this.ref?.scene ?? this

    // player walk animation
    context.anims.create({
        key: "walk",
        frames: context.anims.generateFrameNames("player", {
            prefix: "p1_walk",
            start: 1,
            end: 11,
            zeroPad: 2,
        }),
        frameRate: 10,
        repeat: -1,
        });
        // idle with only one frame, so repeat is not neaded
        context.anims.create({
        key: "idle",
        frames: [{ key: "player", frame: "p1_stand" }],
        frameRate: 10,
    });
}

function createMain(player) {

    const context = this.ref?.scene ?? this


    base.call(context, player) // call base create function
    main.call(context, player) // call base create function


    // make the camera follow the player
    context.cameras.main.startFollow(player); // TODO: Move out

}


export default createMain