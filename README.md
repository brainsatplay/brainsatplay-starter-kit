# The Brains@Play Starter Kit
 This template repository will **get you started working with [Brains@Play](https://github.com/brainsatplay) and engaging with our mission to support Universal Web Development**.

 > Accompanying tutorial content with source code and video links can be found in the `content` directory.

 ESCode is a framework for rapid application development.

 This framework has been designed from the bottom-up to support **visual reactive programming**. In addition to an advanced CLI, we have on-browser visualization and editing tools to support the authoring and remixing of ES Components by anyone with a browser.

## Installation
To take advantage of ESCode in your project, all you'll need to do is import the core [ESCompose](https://github.com/brainsatplay/escode/blob/main/libraries/escompose) library, which instantiates applications from **.esc.js** files.

```js
import * as escompose from './libraries/escompose/index.esm.js'
```

## Getting Started
To create a functional ESCode application, you'll need to understand a few fundamental concepts:

### ES Components (.esc)
This is covered in [hello world](./content/0-hello-world/index.esc.js) demo.

### Reactive Objects
This is covered in [composition](./content/1-composition/index.esc.js) demo, which introduces **listeners**.

These can be triggered **inline** in your own code files—or configured **in .esc** format to produce shareable ES Components.

### Web Components
This is covered in [web components](./content/2-web-components/index.esc.js) demo.

### Wrapping Existing APIs
This is covered in [game development](./content/3-game-development/index.esc.js) demo, which usesthe Phaser (v3) API to create a game.

### Multimodal Control
This is covered in [physiological signals](./content/4-physiological-signals/index.esc.js) file.

### Packaging for Educational Use
This is covered in [education](./content/5-education/index.esc.js) file, which demonstrates how to use Brains@Play applications for educational purposes.
- Nested ESC oriented around a shared UI.
- Native visual programming support. Just add text!
