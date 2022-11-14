import * as hello from "./hello.esc.js";
import * as composition from "./composition.esc.js";
import * as webcomponent from "./webcomponent.esc.js";
import * as game from "./multimodal.esc.js";
import * as physiologyGame from "./physiology.esc.js";
import * as signal from  "./signal.esc.js"
import * as noisy from  "./noisy.esc.js"
import * as filtered from  "./filtered.esc.js"

const __editor = {
  style: {
      height: '400px',
      border: '2px solid'
  }
}

export const __attributes = {
  style: {
      overflow: 'scroll',
      height: '100%',
      width: '100%',
      padding: '50px',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box'
  }
}

export const __children = {
  header: {
    __element: "h1",
    __attributes: {
      innerText: "ESCode: A First Look",
    },
  },

  paragraph1: {
    __element: "p",
    __attributes: {
      innerText:
        "Congratulations on starting your journey with Brains@Play and ESCode. We are excited to see what you develop with us.",
    },
  },

  hr1: {
    __element: "hr",
  },

  h2: {
    __element: "h2",
    __attributes: {
      innerHTML: "Part I: Getting Started",
    },
  },

  paragraph2: {
    __element: "p",
    __attributes: {
      innerHTML:
        "In this tutorial, we first introduced the concept of an <b>ES Component</b> by creating a basic Hello World project with a single header tag.",
    },
  },

  hello: {
    __editor,
    __attributes: { style: { position: "relative" } },
    __compose: hello,
  },

  paragraph3: {
    __element: "p",
    __attributes: {
      innerHTML:
        "Then, we used the principle of <b>composition</b> to extend this by listening to the value of an input tag with the innerText of our header.",
    },
  },

  paragraph3_1: {
    __element: "p",
    __children: {
      span1: {
        __element: "span",
        __attributes: {
          innerHTML: "This allowed you to update the header with ",
        },
      },
      em1: {
        __element: "em",
        __attributes: {
          innerHTML: "whatever you wanted",
        },
      },
      span2: {
        __element: "span",
        __attributes: {
          innerHTML: " when writing in the input.",
        },
      },
    },
  },

  composition: {
    __editor,
    __attributes: { style: { position: "relative" } },
    __compose: composition,
  },

  paragraph4: {
    __element: "p",
    __attributes: {
      innerHTML:
        "Next, we registered this ES Component as a <b>Web Component</b> that can be included anywhere in an existing project. How cool!",
    },
  },

  webcomponent: {
    __editor,
    __attributes: { style: { position: "relative" } },
    __compose: webcomponent,
  },

  hr2: {
    __element: "hr",
  },

  paragraph5: {
    __element: "p",
    __attributes: {
      innerHTML:
        'Switching to a more complicated example, we used an existing ES Component to <b>create a simple game</b> using <a href="https://phaser.io/phaser3">Phaser 3</a>, while also introducing the concept of <b>multimodal control</b>.',
    },
  },

  game: {
    __editor,
    __attributes: { style: { position: "relative" } },
    __compose: game,
  },

  hr3: {
    __element: "hr",
  },

  secondsection: {
      __children: {
        h2: {
            __element: 'h2',
            __attributes: {
                innerHTML: "Part II: Using Physiological Signals as Game Controls"
            }
        },

            block1: {
                __children: {
                    p1: {
                        __element: 'p',
                        __attributes: {
                            innerHTML: "Signals are information being carried in a medium like electricity or light that we can use to understand or communicate with each other."
                        }
                    },
                    demo1: {
                      __editor,
                      __attributes: { style: { position: "relative" } },
                      __compose: signal,
                    },
                }
            },


            block2: {
                __children: {
                    p2: {
                        __element: 'p',
                        __attributes: {
                            innerHTML: "However, signals usually have to compete with nonsensical noise due to imperfect device measurements and environmental interference."
                        }
                    },
                    demo2:{
                      __editor,
                      __attributes: { style: { position: "relative" } },
                      __compose: noisy,
                    },
                }
            },


            block3: {
                __children: {
                    p3: {
                        __element: 'p',
                        __attributes: {
                            innerHTML: "This makes it hard to use these signals to do things like control a game!"
                        }
                    },
                    demo3: {
                      __editor,
                      __attributes: { style: { position: "relative" } },
                      __compose: physiologyGame,
                      __children: {
                          devices: {
                              __attributes: {
                                  style: {
                                      display:'none'
                                  }
                              }
                          }
                      }
                    },
                }
            },


            block4: {
                __children: {
                    p4: {
                        __element: 'p',
                        __attributes: {
                            innerHTML: "We can filter some noise, but sometimes there are multiple sources of noise, in this case <b>we still see signals from our power outlet</b>, which oscillates as a 60Hz alternating current that isn't completely converted to DC current."
                        }
                    },
                    demo4: {
                      __editor,
                      __attributes: { style: { position: "relative" } },
                      __compose: filtered,

                      __children: {
                          devices: {
                              __children: {
                                  filter: {
                                      settings: {
                                          useNotch50: false,
                                          useNotch60: false,
                                      },
                                  }
                              }
                          },
                      }
                    },
                }
            },


            block5: {
                __children: {
                    p5: {
                        __element: 'p',
                        __attributes: {
                            innerHTML: "To solve this we can <b>apply multiple filters</b> to block different ranges (i.e. lowpass, highpass, and bandpass filters) or specific frequencies (e.g. notch filters). "
                        }
                    },
                    demo5: {
                      __editor,
                      __attributes: { style: { position: "relative" } },
                      __compose: filtered,
                    },
                }
            },


            block6: {
                __children: {
                    p6: {
                        __element: 'p',
                        __attributes: {
                            innerHTML: "We can now control the game with our eyes! Try it!"
                        }
                    },
                    demo6: {
                      __editor,
                      __attributes: { style: { position: "relative" } },
                      __compose: physiologyGame,
                      __children: {
                          devices: {
                              __attributes: {
                                  style: {
                                      display:'none'
                                  }
                              }
                          }
                      }
                    },
                }
            }
      }

  },

  hr4: {
    __element: "hr",
  },

  paragraph7: {
    __element: "p",
    __attributes: {
      innerHTML:
        "We hope you enjoyed this tutorial. And we hope to see you again soon!",
    },
  },
}

export const __listeners = {
  "paragraph3_1.em1": {
    "composition.input": true,
  },
};


const phaser = [3,6]
const filterDemos = [4,5]

// Wire together all the data demos
const start = 1
const n = 6
for (let i = start; i < n + 1; i++) {
    const list = {}
    const spsUpdates = {}
    for (let j = start; j < n + 1; j++) {
        if (i !== j) {
            list[`secondsection.block${j}.demo${j}.devices.connect`] = true
            spsUpdates[`secondsection.block${j}.demo${j}.devices.connect.sps`] = true
        }
    }

    if (filterDemos.includes(i)) __listeners[`secondsection.block${i}.demo${i}.devices.filter.settings.sps`] = spsUpdates
    if (!phaser.includes(i)) __listeners[`secondsection.block${i}.demo${i}.devices.ondata`] = list
}

// Mirror the data above
phaser.forEach(i => {
    if (i > start){
      __listeners[`secondsection.block${i}.demo${i}.devices.output`] = {
            [`secondsection.block${i-1}.demo${i-1}.devices.output`]: true
        }
    }
})