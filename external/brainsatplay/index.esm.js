var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// ../../external/graphscript/Graph.ts
var ARGUMENT_NAMES = /([^,]*)/g;
function getFnParamInfo(fn) {
  var fstr = fn.toString();
  const openPar = fstr.indexOf("(");
  const closePar = fstr.indexOf(")");
  const getFirstBracket = (str, offset = 0) => {
    const fb = offset + str.indexOf("{");
    if (fb < closePar && fb > openPar) {
      return getFirstBracket(str.slice(fb), offset + fb);
    } else
      return fb;
  };
  const firstBracket = getFirstBracket(fstr);
  let innerMatch;
  if (firstBracket === -1 || closePar < firstBracket)
    innerMatch = fstr.slice(fstr.indexOf("(") + 1, fstr.indexOf(")"));
  else
    innerMatch = fstr.match(/([a-zA-Z]\w*|\([a-zA-Z]\w*(,\s*[a-zA-Z]\w*)*\)) =>/)?.[1];
  const matches = innerMatch.match(ARGUMENT_NAMES).filter((e) => !!e);
  const info = /* @__PURE__ */ new Map();
  matches.forEach((v) => {
    let [name2, value] = v.split("=");
    name2 = name2.trim();
    name2 = name2.replace(/\d+$/, "");
    try {
      if (name2)
        info.set(name2, (0, eval)(`(${value})`));
    } catch (e) {
      info.set(name2, void 0);
      console.warn(`Argument ${name2} could be parsed for`, fn.toString());
    }
  });
  return info;
}
function parseFunctionFromText(method = "") {
  let getFunctionBody = (methodString) => {
    return methodString.replace(/^\W*(function[^{]+\{([\s\S]*)\}|[^=]+=>[^{]*\{([\s\S]*)\}|[^=]+=>(.+))/i, "$2$3$4");
  };
  let getFunctionHead = (methodString) => {
    let startindex = methodString.indexOf(")");
    return methodString.slice(0, methodString.indexOf("{", startindex) + 1);
  };
  let newFuncHead = getFunctionHead(method);
  let newFuncBody = getFunctionBody(method);
  let newFunc;
  if (newFuncHead.includes("function ")) {
    let varName = newFuncHead.split("(")[1].split(")")[0];
    newFunc = new Function(varName, newFuncBody);
  } else {
    if (newFuncHead.substring(0, 6) === newFuncBody.substring(0, 6)) {
      let varName = newFuncHead.split("(")[1].split(")")[0];
      newFunc = new Function(varName, newFuncBody.substring(newFuncBody.indexOf("{") + 1, newFuncBody.length - 1));
    } else {
      try {
        newFunc = (0, eval)(newFuncHead + newFuncBody + "}");
      } catch {
      }
    }
  }
  return newFunc;
}
var state = {
  pushToState: {},
  data: {},
  triggers: {},
  setState(updateObj) {
    Object.assign(state.data, updateObj);
    for (const prop of Object.getOwnPropertyNames(updateObj)) {
      if (state.triggers[prop])
        state.triggers[prop].forEach((obj) => obj.onchange(state.data[prop]));
    }
    return state.data;
  },
  subscribeTrigger(key, onchange) {
    if (key) {
      if (!state.triggers[key]) {
        state.triggers[key] = [];
      }
      let l = state.triggers[key].length;
      state.triggers[key].push({ idx: l, onchange });
      return state.triggers[key].length - 1;
    } else
      return void 0;
  },
  unsubscribeTrigger(key, sub) {
    let idx = void 0;
    let triggers = state.triggers[key];
    if (triggers) {
      if (!sub)
        delete state.triggers[key];
      else {
        let obj = triggers.find((o) => {
          if (o.idx === sub) {
            return true;
          }
        });
        if (obj)
          triggers.splice(idx, 1);
        return true;
      }
    }
  },
  subscribeTriggerOnce(key, onchange) {
    let sub;
    let changed = (value) => {
      onchange(value);
      state.unsubscribeTrigger(key, sub);
    };
    sub = state.subscribeTrigger(key, changed);
  }
};
var GraphNode = class {
  constructor(properties = {}, parentNode, graph) {
    this.nodes = /* @__PURE__ */ new Map();
    this.arguments = /* @__PURE__ */ new Map();
    this.initial = {};
    this.state = state;
    this.isLooping = false;
    this.isAnimating = false;
    this.looper = void 0;
    this.animation = void 0;
    this.forward = true;
    this.backward = false;
    this.runSync = false;
    this.firstRun = true;
    this.DEBUGNODE = false;
    this.operator = (self = this, origin, ...args) => {
      return args;
    };
    this.runOp = (node = this, origin = this, ...args) => {
      if (node.DEBUGNODE)
        console.time(node.tag);
      let result = node.operator(node, origin, ...args);
      if (result instanceof Promise) {
        result.then((res) => {
          if (res !== void 0)
            this.setState({ [node.tag]: res });
          if (node.DEBUGNODE) {
            console.timeEnd(node.tag);
            if (result !== void 0)
              console.log(`${node.tag} result:`, result);
          }
          ;
          return res;
        });
      } else {
        if (result !== void 0)
          this.setState({ [node.tag]: result });
        if (node.DEBUGNODE) {
          console.timeEnd(node.tag);
          if (result !== void 0)
            console.log(`${node.tag} result:`, result);
        }
        ;
      }
      return result;
    };
    this.setOperator = (operator) => {
      if (typeof operator !== "function")
        return operator;
      let params = getFnParamInfo(operator);
      const keys = params.keys();
      const paramOne = keys.next().value;
      const paramTwo = keys.next().value;
      const restrictedOne = ["self", "node"];
      const restrictedTwo = ["origin", "parent", "graph", "router"];
      if (!restrictedOne.includes(paramOne) && !restrictedTwo.includes(paramTwo)) {
        let fn = operator;
        operator = (self, origin, ...args) => {
          return fn(...args);
        };
        if (this.arguments) {
          params.forEach((v, k) => {
            if (!this.arguments.has(k))
              this.arguments.set(k, v);
          });
        }
      }
      this.operator = operator;
      return operator;
    };
    this.run = (...args) => {
      return this._run(this, void 0, ...args);
    };
    this.runAsync = (...args) => {
      return new Promise((res, rej) => {
        res(this._run(this, void 0, ...args));
      });
    };
    this.transformArgs = (args = []) => args;
    this._run = (node = this, origin, ...args) => {
      if (typeof this.transformArgs === "function")
        args = this.transformArgs(args, node);
      if (!(typeof node === "object")) {
        if (typeof node === "string") {
          let fnd = void 0;
          if (this.graph)
            fnd = this.graph.nodes.get(node);
          if (!fnd)
            fnd = this.nodes.get(node);
          node = fnd;
        }
        if (!node)
          return void 0;
      }
      if (node.firstRun) {
        node.firstRun = false;
        if (!(node.children && node.forward || node.parent && node.backward || node.repeat || node.delay || node.frame || node.recursive || node.branch))
          node.runSync = true;
        if (node.animate && !node.isAnimating) {
          node.runAnimation(node.animation, args, node, origin);
        }
        if (node.loop && typeof node.loop === "number" && !node.isLooping) {
          node.runLoop(node.looper, args, node, origin);
        }
        if (node.loop || node.animate)
          return;
      }
      if (node.runSync) {
        let res = node.runOp(node, origin, ...args);
        return res;
      }
      return new Promise(async (resolve) => {
        if (node) {
          let run = (node2, tick = 0, ...input) => {
            return new Promise(async (r) => {
              tick++;
              let res = await node2.runOp(node2, origin, ...input);
              if (node2.repeat) {
                while (tick < node2.repeat) {
                  if (node2.delay) {
                    setTimeout(async () => {
                      r(await run(node2, tick, ...input));
                    }, node2.delay);
                    break;
                  } else if (node2.frame && window?.requestAnimationFrame) {
                    requestAnimationFrame(async () => {
                      r(await run(node2, tick, ...input));
                    });
                    break;
                  } else
                    res = await node2.runOp(node2, origin, ...input);
                  tick++;
                }
                if (tick === node2.repeat) {
                  r(res);
                  return;
                }
              } else if (node2.recursive) {
                while (tick < node2.recursive) {
                  if (node2.delay) {
                    setTimeout(async () => {
                      r(await run(node2, tick, ...res));
                    }, node2.delay);
                    break;
                  } else if (node2.frame && window?.requestAnimationFrame) {
                    requestAnimationFrame(async () => {
                      r(await run(node2, tick, ...res));
                    });
                    break;
                  } else
                    res = await node2.runOp(node2, origin, ...res);
                  tick++;
                }
                if (tick === node2.recursive) {
                  r(res);
                  return;
                }
              } else {
                r(res);
                return;
              }
            });
          };
          let runnode = async () => {
            let res = await run(node, void 0, ...args);
            if (res !== void 0) {
              if (node.backward && node.parent instanceof GraphNode) {
                if (Array.isArray(res))
                  await this.runParent(node, ...res);
                else
                  await this.runParent(node, res);
              }
              if (node.children && node.forward) {
                if (Array.isArray(res))
                  await this.runChildren(node, ...res);
                else
                  await this.runChildren(node, res);
              }
              if (node.branch) {
                this.runBranch(node, res);
              }
            }
            return res;
          };
          if (node.delay) {
            setTimeout(async () => {
              resolve(await runnode());
            }, node.delay);
          } else if (node.frame && window?.requestAnimationFrame) {
            requestAnimationFrame(async () => {
              resolve(await runnode());
            });
          } else {
            resolve(await runnode());
          }
        } else
          resolve(void 0);
      });
    };
    this.runParent = async (node, ...args) => {
      if (node.backward && node.parent) {
        if (typeof node.parent === "string") {
          if (node.graph && node.graph?.get(node.parent)) {
            node.parent = node.graph;
            if (node.parent)
              this.nodes.set(node.parent.tag, node.parent);
          } else
            node.parent = this.nodes.get(node.parent);
        }
        if (node.parent instanceof GraphNode)
          await node.parent._run(node.parent, this, ...args);
      }
    };
    this.runChildren = async (node, ...args) => {
      if (typeof node.children === "object") {
        for (const key in node.children) {
          if (typeof node.children[key] === "string") {
            if (node.graph && node.graph?.get(node.children[key])) {
              node.children[key] = node.graph.get(node.children[key]);
              if (!node.nodes.get(node.children[key].tag))
                node.nodes.set(node.children[key].tag, node.children[key]);
            }
            if (!node.children[key] && node.nodes.get(node.children[key]))
              node.children[key] = node.nodes.get(node.children[key]);
          } else if (typeof node.children[key] === "undefined" || node.children[key] === true) {
            if (node.graph && node.graph?.get(key)) {
              node.children[key] = node.graph.get(key);
              if (!node.nodes.get(node.children[key].tag))
                node.nodes.set(node.children[key].tag, node.children[key]);
            }
            if (!node.children[key] && node.nodes.get(key))
              node.children[key] = node.nodes.get(key);
          }
          if (node.children[key]?.runOp)
            await node.children[key]._run(node.children[key], node, ...args);
        }
      }
    };
    this.runBranch = async (node, output) => {
      if (node.branch) {
        let keys = Object.keys(node.branch);
        await Promise.all(keys.map(async (k) => {
          if (typeof node.branch[k].if === "object")
            node.branch[k].if = stringifyFast(node.branch[k].if);
          let pass = false;
          if (typeof output === "object")
            if (stringifyFast(output) === node.branch[k].if)
              pass = true;
            else if (output === node.branch[k].if)
              pass = true;
            else
              pass = true;
          if (pass) {
            if (node.branch[k].then instanceof GraphNode) {
              if (Array.isArray(output))
                await node.branch[k].then._run(node.branch[k].then, node, ...output);
              else
                await node.branch[k].then._run(node.branch[k].then, node, ...output);
            } else if (typeof node.branch[k].then === "function") {
              if (Array.isArray(output))
                await node.branch[k].then(...output);
              else
                await node.branch[k].then(output);
            } else if (typeof node.branch[k].then === "string") {
              if (node.graph)
                node.branch[k].then = node.graph.nodes.get(node.branch[k].then);
              else
                node.branch[k].then = node.nodes.get(node.branch[k].then);
              if (node.branch[k].then instanceof GraphNode) {
                if (Array.isArray(output))
                  await node.branch[k].then._run(node.branch[k].then, node, ...output);
                else
                  await node.branch[k].then._run(node.branch[k].then, node, ...output);
              }
            }
          }
          return pass;
        }));
      }
    };
    this.runAnimation = (animation = this.animation, args = [], node = this, origin) => {
      this.animation = animation;
      if (!animation)
        this.animation = this.operator;
      if (node.animate && !node.isAnimating) {
        node.isAnimating = true;
        let anim = async () => {
          if (node.isAnimating) {
            if (node.DEBUGNODE)
              console.time(node.tag);
            let result = this.animation(node, origin, ...args);
            if (result instanceof Promise) {
              result = await result;
            }
            if (node.DEBUGNODE) {
              console.timeEnd(node.tag);
              if (result !== void 0)
                console.log(`${node.tag} result:`, result);
            }
            ;
            if (result !== void 0) {
              if (this.tag)
                this.setState({ [this.tag]: result });
              if (node.backward && node.parent?._run) {
                if (Array.isArray(result))
                  await this.runParent(node, ...result);
                else
                  await this.runParent(node, result);
              }
              if (node.children && node.forward) {
                if (Array.isArray(result))
                  await this.runChildren(node, ...result);
                else
                  await this.runChildren(node, result);
              }
              if (node.branch) {
                this.runBranch(node, result);
              }
              this.setState({ [node.tag]: result });
            }
            requestAnimationFrame(anim);
          }
        };
        requestAnimationFrame(anim);
      }
    };
    this.runLoop = (loop = this.looper, args = [], node = this, origin, timeout = node.loop) => {
      node.looper = loop;
      if (!loop)
        node.looper = node.operator;
      if (typeof timeout === "number" && !node.isLooping) {
        node.isLooping = true;
        let looping = async () => {
          if (node.isLooping) {
            if (node.DEBUGNODE)
              console.time(node.tag);
            let result = node.looper(node, origin, ...args);
            if (result instanceof Promise) {
              result = await result;
            }
            if (node.DEBUGNODE) {
              console.timeEnd(node.tag);
              if (result !== void 0)
                console.log(`${node.tag} result:`, result);
            }
            ;
            if (result !== void 0) {
              if (node.tag)
                node.setState({ [node.tag]: result });
              if (node.backward && node.parent?._run) {
                if (Array.isArray(result))
                  await this.runParent(node, ...result);
                else
                  await this.runParent(node, result);
              }
              if (node.children && node.forward) {
                if (Array.isArray(result))
                  await this.runChildren(node, ...result);
                else
                  await this.runChildren(node, result);
              }
              if (node.branch) {
                this.runBranch(node, result);
              }
              node.setState({ [node.tag]: result });
            }
            setTimeout(async () => {
              await looping();
            }, timeout);
          }
        };
        looping();
      }
    };
    this.setParent = (parent) => {
      this.parent = parent;
      if (this.backward)
        this.runSync = false;
    };
    this.setChildren = (children) => {
      this.children = children;
      if (this.forward)
        this.runSync = false;
    };
    this.add = (node = {}) => {
      if (typeof node === "function")
        node = { operator: node };
      if (!(node instanceof GraphNode))
        node = new GraphNode(node, this, this.graph);
      this.nodes.set(node.tag, node);
      if (this.graph) {
        this.graph.nodes.set(node.tag, node);
        this.graph.nNodes++;
      }
      return node;
    };
    this.remove = (node) => {
      if (typeof node === "string")
        node = this.nodes.get(node);
      if (node instanceof GraphNode) {
        this.nodes.delete(node.tag);
        if (this.graph) {
          this.graph.nodes.delete(node.tag);
          this.graph.nNodes--;
        }
        this.nodes.forEach((n) => {
          if (n.nodes.get(node.tag))
            n.nodes.delete(node.tag);
        });
      }
    };
    this.append = (node, parentNode = this) => {
      if (typeof node === "string")
        node = this.nodes.get(node);
      if (node instanceof GraphNode) {
        parentNode.addChildren(node);
        if (node.forward)
          node.runSync = false;
      }
    };
    this.subscribe = (callback, tag = this.tag) => {
      if (callback instanceof GraphNode) {
        return this.subscribeNode(callback);
      } else
        return this.state.subscribeTrigger(tag, callback);
    };
    this.unsubscribe = (sub, tag = this.tag) => {
      this.state.unsubscribeTrigger(tag, sub);
    };
    this.addChildren = (children) => {
      if (!this.children)
        this.children = {};
      if (typeof children === "object")
        Object.assign(this.children, children);
      this.convertChildrenToNodes();
      if (this.forward)
        this.runSync = false;
    };
    this.callParent = (...args) => {
      const origin = this;
      if (typeof this.parent === "string") {
        if (this.graph && this.graph?.get(this.parent)) {
          this.parent = this.graph;
          if (this.parent)
            this.nodes.set(this.parent.tag, this.parent);
        } else
          this.parent = this.nodes.get(this.parent);
      }
      if (typeof this.parent?.operator === "function")
        return this.parent.runOp(this.parent, origin, ...args);
    };
    this.callChildren = (idx, ...args) => {
      const origin = this;
      let result;
      if (typeof this.children === "object") {
        for (const key in this.children) {
          if (this.children[key]?.runOp)
            this.children[key].runOp(this.children[key], origin, ...args);
        }
      }
      return result;
    };
    this.getProps = (node = this) => {
      return {
        tag: node.tag,
        operator: node.operator,
        graph: node.graph,
        children: node.children,
        parent: node.parent,
        forward: node.forward,
        backward: node.bacward,
        loop: node.loop,
        animate: node.animate,
        frame: node.frame,
        delay: node.delay,
        recursive: node.recursive,
        repeat: node.repeat,
        branch: node.branch,
        oncreate: node.oncreate,
        DEBUGNODE: node.DEBUGNODE,
        ...this.initial
      };
    };
    this.setProps = (props = {}) => {
      let tmp = Object.assign({}, props);
      if (tmp.children) {
        this.addChildren(props.children);
        delete tmp.children;
      }
      if (tmp.operator) {
        this.setOperator(props.operator);
        delete tmp.operator;
      }
      Object.assign(tmp, props);
      if (!(this.children && this.forward || this.parent && this.backward || this.repeat || this.delay || this.frame || this.recursive))
        this.runSync = true;
    };
    this.removeTree = (node) => {
      if (node) {
        if (typeof node === "string")
          node = this.nodes.get(node);
      }
      if (node instanceof GraphNode) {
        const recursivelyRemove = (node2) => {
          if (typeof node2.children === "object") {
            for (const key in node2.children) {
              if (node2.children[key].stopNode)
                node2.children[key].stopNode();
              if (node2.children[key].tag) {
                if (this.nodes.get(node2.children[key].tag))
                  this.nodes.delete(node2.children[key].tag);
                if (this[node2.children[key].tag] instanceof GraphNode)
                  delete this[node2.children[key].tag];
              }
              this.nodes.forEach((n) => {
                if (n.nodes.get(node2.children[key].tag))
                  n.nodes.delete(node2.children[key].tag);
                if (n[node2.children[key].tag] instanceof GraphNode)
                  delete n[node2.children[key].tag];
              });
              recursivelyRemove(node2.children[key]);
            }
          }
        };
        if (node.stopNode)
          node.stopNode();
        if (node.tag) {
          this.nodes.delete(node.tag);
          if (this[node.tag] instanceof GraphNode)
            delete this[node.tag];
          this.nodes.forEach((n) => {
            if (node?.tag) {
              if (n.nodes.get(node.tag))
                n.nodes.delete(node.tag);
              if (n[node.tag] instanceof GraphNode)
                delete n[node.tag];
            }
          });
          recursivelyRemove(node);
          if (this.graph)
            this.graph.removeTree(node);
        }
      }
    };
    this.checkNodesHaveChildMapped = (node, child, checked = {}) => {
      let tag = node.tag;
      if (!tag)
        tag = node.name;
      if (!checked[tag]) {
        checked[tag] = true;
        if (node.children) {
          if (child.tag in node.children) {
            if (!(node.children[child.tag] instanceof GraphNode))
              node.children[child.tag] = child;
            if (!node.firstRun)
              node.firstRun = true;
          }
        }
        if (node.parent) {
          if (node.parent.children) {
            this.checkNodesHaveChildMapped(node.parent, child, checked);
          } else if (node.nodes) {
            node.nodes.forEach((n) => {
              if (!checked[n.tag]) {
                this.checkNodesHaveChildMapped(n, child, checked);
              }
            });
          }
        }
        if (node.graph) {
          if (node.parent && node.parent.name !== node.graph.name) {
            node.graph.nodes.forEach((n) => {
              if (!checked[n.tag]) {
                this.checkNodesHaveChildMapped(n, child, checked);
              }
            });
          }
        }
      }
    };
    this.convertChildrenToNodes = (n = this) => {
      if (n?.children) {
        for (const key in n.children) {
          if (!(n.children[key] instanceof GraphNode)) {
            if (typeof n.children[key] === "undefined" || n.children[key] === true) {
              n.children[key] = n.graph.get(key);
              if (!n.children[key])
                n.children[key] = n.nodes.get(key);
              if (n.children[key] instanceof GraphNode) {
                if (n.graph) {
                  let props = n.children[key].getProps();
                  delete props.parent;
                  delete props.graph;
                  if (n.source)
                    n.children[key] = new GraphNode(props, n, n.source);
                  else {
                    if (props.tag)
                      props.tag = `${props.tag}${n.graph.nNodes + 1}`;
                    n.children[key] = new GraphNode(props, n, n.graph);
                  }
                }
                n.nodes.set(n.children[key].tag, n.children[key]);
                if (!(n.children[key].tag in n))
                  n[n.children[key].tag] = n.children[key].tag;
                this.checkNodesHaveChildMapped(n, n.children[key]);
              }
            } else if (typeof n.children[key] === "string") {
              let child = n.graph.get(n.children[key]);
              n.children[key] = child;
              if (!child)
                child = n.nodes.get(key);
              if (child instanceof GraphNode) {
                n.nodes.set(n.children[key].tag, n.children[key]);
                if (!(n.children[key].tag in n))
                  n[n.children[key].tag] = n.children[key].tag;
                this.checkNodesHaveChildMapped(n, child);
              }
            } else if (typeof n.children[key] === "object") {
              if (!n.children[key].tag)
                n.children[key].tag = key;
              n.children[key] = new GraphNode(n.children[key], n, n.graph);
              this.checkNodesHaveChildMapped(n, n.children[key]);
            }
          }
        }
      }
      return n.children;
    };
    this.stopLooping = (node = this) => {
      node.isLooping = false;
    };
    this.stopAnimating = (node = this) => {
      node.isAnimating = false;
    };
    this.stopNode = (node = this) => {
      node.stopAnimating(node);
      node.stopLooping(node);
    };
    this.subscribeNode = (node) => {
      if (node.tag)
        this.nodes.set(node.tag, node);
      return this.state.subscribeTrigger(this.tag, (res) => {
        node._run(node, this, res);
      });
    };
    this.print = (node = this, printChildren = true, nodesPrinted = []) => {
      let dummyNode = new GraphNode();
      if (typeof node === "string")
        node = this.nodes.get(node);
      if (node instanceof GraphNode) {
        nodesPrinted.push(node.tag);
        let jsonToPrint = {
          tag: node.tag,
          operator: node.operator.toString()
        };
        if (node.parent)
          jsonToPrint.parent = node.parent.tag;
        if (typeof node.children === "object") {
          for (const key in node.children) {
            if (typeof node.children[key] === "string")
              return node.children[key];
            if (nodesPrinted.includes(node.children[key].tag))
              return node.children[key].tag;
            else if (!printChildren) {
              return node.children[key].tag;
            } else
              return node.children[key].print(node.children[key], printChildren, nodesPrinted);
          }
        }
        for (const prop in node) {
          if (prop === "parent" || prop === "children")
            continue;
          if (typeof dummyNode[prop] === "undefined") {
            if (typeof node[prop] === "function") {
              jsonToPrint[prop] = node[prop].toString();
            } else if (typeof node[prop] === "object") {
              jsonToPrint[prop] = JSON.stringifyWithCircularRefs(node[prop]);
            } else {
              jsonToPrint[prop] = node[prop];
            }
          }
        }
        return JSON.stringify(jsonToPrint);
      }
    };
    this.reconstruct = (json) => {
      let parsed = reconstructObject(json);
      if (parsed)
        return this.add(parsed);
    };
    this.setState = this.state.setState;
    this.DEBUGNODES = (debugging = true) => {
      this.DEBUGNODE = debugging;
      this.nodes.forEach((n) => {
        if (debugging)
          n.DEBUGNODE = true;
        else
          n.DEBUGNODE = false;
      });
    };
    if (typeof properties === "function") {
      properties = { operator: properties };
    }
    if (typeof properties === "object") {
      if (properties instanceof Graph) {
        let source = properties;
        properties = {
          source,
          operator: (input) => {
            if (typeof input === "object") {
              let result = {};
              for (const key in input) {
                if (typeof source[key] === "function") {
                  if (Array.isArray(input[key]))
                    result[key] = source[key](...input[key]);
                  else
                    result[key] = source[key](input[key]);
                } else {
                  source[key] = input[key];
                  result[key] = source[key];
                }
              }
              return result;
            }
            return source;
          }
        };
        if (source.operator)
          properties.operator = source.operator;
        if (source.children)
          properties.children = source.children;
        if (source.forward)
          properties.forward = source.forward;
        if (source.backward)
          properties.backward = source.backward;
        if (source.repeat)
          properties.repeat = source.repeat;
        if (source.recursive)
          properties.recursive = source.recursive;
        if (source.loop)
          properties.loop = source.loop;
        if (source.animate)
          properties.animate = source.animate;
        if (source.looper)
          properties.looper = source.looper;
        if (source.animation)
          properties.animation = source.animation;
        if (source.delay)
          properties.delay = source.delay;
        if (source.tag)
          properties.tag = source.tag;
        if (source.oncreate)
          properties.oncreate = source.oncreate;
        this.nodes = source.nodes;
        if (graph) {
          source.nodes.forEach((n) => {
            if (!graph.nodes.get(n.tag)) {
              graph.nodes.set(n.tag, n);
              graph.nNodes++;
            }
          });
        }
      }
      if (properties.tag && (graph || parentNode)) {
        if (graph?.nodes) {
          let hasnode = graph.nodes.get(properties.tag);
          if (hasnode) {
            Object.assign(this, hasnode);
            if (!this.source)
              this.source = hasnode;
          }
        } else if (parentNode?.nodes) {
          let hasnode = parentNode.nodes.get(properties.tag);
          if (hasnode) {
            Object.assign(this, hasnode);
            if (!this.source)
              this.source = hasnode;
          }
        }
      }
      if (properties?.operator) {
        properties.operator = this.setOperator(properties.operator);
      }
      if (!properties.tag && graph) {
        properties.tag = `node${graph.nNodes}`;
      } else if (!properties.tag) {
        properties.tag = `node${Math.floor(Math.random() * 1e10)}`;
      }
      if ("arguments" in properties) {
        if (properties.arguments) {
          for (let key in properties.arguments) {
            this.arguments.set(key, properties.arguments[key]);
          }
        }
        properties.arguments = this.arguments;
      }
      let keys = Object.getOwnPropertyNames(this);
      for (const key in properties) {
        if (!keys.includes(key))
          this.initial[key] = properties[key];
      }
      Object.assign(this, properties);
      if (!this.tag) {
        if (graph) {
          this.tag = `node${graph.nNodes}`;
        } else {
          this.tag = `node${Math.floor(Math.random() * 1e10)}`;
        }
      }
      if (parentNode)
        this.parent = parentNode;
      if (graph)
        this.graph = graph;
      if (graph) {
        if (!graph.nodes.get(this.tag)) {
          graph.nNodes++;
        }
        graph.nodes.set(this.tag, this);
      }
      if (typeof properties.tree === "object") {
        for (const key in properties.tree) {
          if (typeof properties.tree[key] === "object") {
            if ((!properties.tree[key]).tag) {
              properties.tree[key].tag = key;
            }
          }
          let node = new GraphNode(properties.tree[key], this, graph);
          this.nodes.set(node.tag, node);
        }
      }
      if (this.children)
        this.convertChildrenToNodes(this);
      if (this.parent instanceof GraphNode || this.parent instanceof Graph)
        this.checkNodesHaveChildMapped(this.parent, this);
      if (typeof this.oncreate === "function")
        this.oncreate(this);
      if (!this.firstRun)
        this.firstRun = true;
    } else
      return properties;
  }
};
var Graph = class {
  constructor(tree, tag, props) {
    this.nNodes = 0;
    this.nodes = /* @__PURE__ */ new Map();
    this.state = state;
    this.tree = {};
    this.add = (node = {}) => {
      let props = node;
      if (!(node instanceof GraphNode))
        node = new GraphNode(props, this, this);
      else
        this.nNodes++;
      if (node.tag)
        this.tree[node.tag] = props;
      this.nodes.set(node.tag, node);
      return node;
    };
    this.setTree = (tree = this.tree) => {
      if (!tree)
        return;
      for (const node in tree) {
        if (!this.nodes.get(node)) {
          if (typeof tree[node] === "function") {
            this.add({ tag: node, operator: tree[node] });
          } else if (typeof tree[node] === "object" && !Array.isArray(tree[node])) {
            if (!tree[node].tag)
              tree[node].tag = node;
            let newNode = this.add(tree[node]);
            if (tree[node].aliases) {
              tree[node].aliases.forEach((a) => {
                this.nodes.set(a, newNode);
              });
            }
          } else {
            this.add({ tag: node, operator: (self, origin, ...args) => {
              return tree[node];
            } });
          }
        } else {
          let n = this.nodes.get(node);
          if (typeof tree[node] === "function") {
            n.setOperator(tree[node]);
          } else if (typeof tree[node] === "object") {
            if (tree[node] instanceof GraphNode) {
              if (n.tag !== tree[node].tag)
                this.add(tree[node]);
            } else if (tree[node] instanceof Graph) {
              let source = tree[node];
              let properties = {};
              if (source.operator)
                properties.operator = source.operator;
              if (source.children)
                properties.children = source.children;
              if (source.forward)
                properties.forward = source.forward;
              if (source.backward)
                properties.backward = source.backward;
              if (source.repeat)
                properties.repeat = source.repeat;
              if (source.recursive)
                properties.recursive = source.recursive;
              if (source.loop)
                properties.loop = source.loop;
              if (source.animate)
                properties.animate = source.animate;
              if (source.looper)
                properties.looper = source.looper;
              if (source.animation)
                properties.animation = source.animation;
              if (source.delay)
                properties.delay = source.delay;
              if (source.tag)
                properties.tag = source.tag;
              if (source.oncreate)
                properties.oncreate = source.oncreate;
              properties.nodes = source.nodes;
              properties.source = source;
              n.setProps(properties);
            } else {
              n.setProps(tree[node]);
            }
          }
        }
      }
      this.nodes.forEach((node) => {
        if (typeof node.children === "object") {
          for (const key in node.children) {
            if (typeof node.children[key] === "string") {
              if (this.nodes.get(node.children[key])) {
                node.children[key] = this.nodes.get(node.children[key]);
              }
            } else if (node.children[key] === true || typeof node.children[key] === "undefined") {
              if (this.nodes.get(key)) {
                node.children[key] = this.nodes.get(key);
              }
            }
            if (node.children[key] instanceof GraphNode) {
              node.checkNodesHaveChildMapped(node, node.children[key]);
            }
          }
        }
        if (typeof node.parent === "string") {
          if (this.nodes.get(node.parent)) {
            node.parent = this.nodes.get(node.parent);
            node.nodes.set(node.parent.tag, node.parent);
          }
        }
      });
    };
    this.get = (tag) => {
      return this.nodes.get(tag);
    };
    this.set = (node) => {
      return this.nodes.set(node.tag, node);
    };
    this.run = (node, ...args) => {
      if (typeof node === "string")
        node = this.nodes.get(node);
      if (node instanceof GraphNode)
        return node._run(node, this, ...args);
      else
        return void 0;
    };
    this.runAsync = (node, ...args) => {
      if (typeof node === "string")
        node = this.nodes.get(node);
      if (node instanceof GraphNode)
        return new Promise((res, rej) => {
          res(node._run(node, this, ...args));
        });
      else
        return new Promise((res, rej) => {
          res(void 0);
        });
    };
    this._run = (node, origin = this, ...args) => {
      if (typeof node === "string")
        node = this.nodes.get(node);
      if (node instanceof GraphNode)
        return node._run(node, origin, ...args);
      else
        return void 0;
    };
    this.removeTree = (node) => {
      if (typeof node === "string")
        node = this.nodes.get(node);
      if (node instanceof GraphNode) {
        const recursivelyRemove = (node2) => {
          if (node2.children) {
            if (Array.isArray(node2.children)) {
              node2.children.forEach((c) => {
                if (c.stopNode)
                  c.stopNode();
                if (c.tag) {
                  if (this.nodes.get(c.tag))
                    this.nodes.delete(c.tag);
                }
                this.nodes.forEach((n) => {
                  if (n.nodes.get(c.tag))
                    n.nodes.delete(c.tag);
                });
                recursivelyRemove(c);
              });
            } else if (typeof node2.children === "object") {
              if (node2.stopNode)
                node2.stopNode();
              if (node2.tag) {
                if (this.nodes.get(node2.tag))
                  this.nodes.delete(node2.tag);
              }
              this.nodes.forEach((n) => {
                if (n.nodes.get(node2.tag))
                  n.nodes.delete(node2.tag);
              });
              recursivelyRemove(node2);
            }
          }
        };
        if (node.stopNode)
          node.stopNode();
        if (node.tag) {
          this.nodes.delete(node.tag);
          this.nodes.forEach((n) => {
            if (n.nodes.get(node.tag))
              n.nodes.delete(node.tag);
          });
          this.nNodes--;
          recursivelyRemove(node);
        }
      }
      return node;
    };
    this.remove = (node) => {
      if (typeof node === "string")
        node = this.nodes.get(node);
      if (node?.tag) {
        node.stopNode();
        if (node?.tag) {
          if (this.nodes.get(node.tag)) {
            this.nodes.delete(node.tag);
            this.nodes.forEach((n) => {
              if (n.nodes.get(node.tag))
                n.nodes.delete(node.tag);
            });
          }
        }
      }
      return node;
    };
    this.append = (node, parentNode) => {
      parentNode.addChildren(node);
    };
    this.callParent = async (node, origin = node, ...args) => {
      if (node?.parent) {
        return await node.callParent(node, origin, ...args);
      }
    };
    this.callChildren = async (node, idx, ...args) => {
      if (node?.children) {
        return await node.callChildren(idx, ...args);
      }
    };
    this.subscribe = (node, callback) => {
      if (!callback)
        return;
      if (node instanceof GraphNode) {
        return node.subscribe(callback);
      } else if (typeof node == "string")
        return this.state.subscribeTrigger(node, callback);
    };
    this.unsubscribe = (tag, sub) => {
      this.state.unsubscribeTrigger(tag, sub);
    };
    this.subscribeNode = (inputNode, outputNode) => {
      let tag;
      if (inputNode?.tag)
        tag = inputNode.tag;
      else if (typeof inputNode === "string")
        tag = inputNode;
      return this.state.subscribeTrigger(tag, (res) => {
        this.run(outputNode, inputNode, ...res);
      });
    };
    this.stopNode = (node) => {
      if (typeof node === "string") {
        node = this.nodes.get(node);
      }
      if (node instanceof GraphNode) {
        node.stopNode();
      }
    };
    this.print = (node = void 0, printChildren = true) => {
      if (node instanceof GraphNode)
        return node.print(node, printChildren);
      else {
        let printed = `{`;
        this.nodes.forEach((n) => {
          printed += `
"${n.tag}:${n.print(n, printChildren)}"`;
        });
        return printed;
      }
    };
    this.reconstruct = (json) => {
      let parsed = reconstructObject(json);
      if (parsed)
        return this.add(parsed);
    };
    this.create = (operator, parentNode, props) => {
      return createNode(operator, parentNode, props, this);
    };
    this.setState = this.state.setState;
    this.DEBUGNODES = (debugging = true) => {
      this.nodes.forEach((n) => {
        if (debugging)
          n.DEBUGNODE = true;
        else
          n.DEBUGNODE = false;
      });
    };
    this.tag = tag ? tag : `graph${Math.floor(Math.random() * 1e11)}`;
    if (props)
      Object.assign(this, props);
    if (tree || Object.keys(this.tree).length > 0)
      this.setTree(tree);
  }
};
function reconstructObject(json = "{}") {
  try {
    let parsed = typeof json === "string" ? JSON.parse(json) : json;
    const parseObj = (obj) => {
      for (const prop in obj) {
        if (typeof obj[prop] === "string") {
          let funcParsed = parseFunctionFromText(obj[prop]);
          if (typeof funcParsed === "function") {
            obj[prop] = funcParsed;
          }
        } else if (typeof obj[prop] === "object") {
          parseObj(obj[prop]);
        }
      }
      return obj;
    };
    return parseObj(parsed);
  } catch (err2) {
    console.error(err2);
    return void 0;
  }
}
var stringifyWithCircularRefs = function() {
  const refs = /* @__PURE__ */ new Map();
  const parents = [];
  const path = ["this"];
  function clear() {
    refs.clear();
    parents.length = 0;
    path.length = 1;
  }
  function updateParents(key, value) {
    var idx = parents.length - 1;
    var prev = parents[idx];
    if (typeof prev === "object") {
      if (prev[key] === value || idx === 0) {
        path.push(key);
        parents.push(value.pushed);
      } else {
        while (idx-- >= 0) {
          prev = parents[idx];
          if (typeof prev === "object") {
            if (prev[key] === value) {
              idx += 2;
              parents.length = idx;
              path.length = idx;
              --idx;
              parents[idx] = value;
              path[idx] = key;
              break;
            }
          }
          idx--;
        }
      }
    }
  }
  function checkCircular(key, value) {
    if (value != null) {
      if (typeof value === "object") {
        if (key) {
          updateParents(key, value);
        }
        let other = refs.get(value);
        if (other) {
          return "[Circular Reference]" + other;
        } else {
          refs.set(value, path.join("."));
        }
      }
    }
    return value;
  }
  return function stringifyWithCircularRefs2(obj, space) {
    try {
      parents.push(obj);
      return JSON.stringify(obj, checkCircular, space);
    } finally {
      clear();
    }
  };
}();
if (JSON.stringifyWithCircularRefs === void 0) {
  JSON.stringifyWithCircularRefs = stringifyWithCircularRefs;
}
var stringifyFast = function() {
  const refs = /* @__PURE__ */ new Map();
  const parents = [];
  const path = ["this"];
  function clear() {
    refs.clear();
    parents.length = 0;
    path.length = 1;
  }
  function updateParents(key, value) {
    var idx = parents.length - 1;
    if (parents[idx]) {
      var prev = parents[idx];
      if (typeof prev === "object") {
        if (prev[key] === value || idx === 0) {
          path.push(key);
          parents.push(value.pushed);
        } else {
          while (idx-- >= 0) {
            prev = parents[idx];
            if (typeof prev === "object") {
              if (prev[key] === value) {
                idx += 2;
                parents.length = idx;
                path.length = idx;
                --idx;
                parents[idx] = value;
                path[idx] = key;
                break;
              }
            }
            idx++;
          }
        }
      }
    }
  }
  function checkValues(key, value) {
    let val;
    if (value != null) {
      if (typeof value === "object") {
        let c = value.constructor.name;
        if (key && c === "Object") {
          updateParents(key, value);
        }
        let other = refs.get(value);
        if (other) {
          return "[Circular Reference]" + other;
        } else {
          refs.set(value, path.join("."));
        }
        if (c === "Array") {
          if (value.length > 20) {
            val = value.slice(value.length - 20);
          } else
            val = value;
        } else if (c.includes("Set")) {
          val = Array.from(value);
        } else if (c !== "Object" && c !== "Number" && c !== "String" && c !== "Boolean") {
          val = "instanceof_" + c;
        } else if (c === "Object") {
          let obj = {};
          for (const prop in value) {
            if (value[prop] == null) {
              obj[prop] = value[prop];
            } else if (Array.isArray(value[prop])) {
              if (value[prop].length > 20)
                obj[prop] = value[prop].slice(value[prop].length - 20);
              else
                obj[prop] = value[prop];
            } else if (value[prop].constructor.name === "Object") {
              obj[prop] = {};
              for (const p in value[prop]) {
                if (Array.isArray(value[prop][p])) {
                  if (value[prop][p].length > 20)
                    obj[prop][p] = value[prop][p].slice(value[prop][p].length - 20);
                  else
                    obj[prop][p] = value[prop][p];
                } else {
                  if (value[prop][p] != null) {
                    let con = value[prop][p].constructor.name;
                    if (con.includes("Set")) {
                      obj[prop][p] = Array.from(value[prop][p]);
                    } else if (con !== "Number" && con !== "String" && con !== "Boolean") {
                      obj[prop][p] = "instanceof_" + con;
                    } else {
                      obj[prop][p] = value[prop][p];
                    }
                  } else {
                    obj[prop][p] = value[prop][p];
                  }
                }
              }
            } else {
              let con = value[prop].constructor.name;
              if (con.includes("Set")) {
                obj[prop] = Array.from(value[prop]);
              } else if (con !== "Number" && con !== "String" && con !== "Boolean") {
                obj[prop] = "instanceof_" + con;
              } else {
                obj[prop] = value[prop];
              }
            }
          }
          val = obj;
        } else {
          val = value;
        }
      } else {
        val = value;
      }
    }
    return val;
  }
  return function stringifyFast2(obj, space) {
    parents.push(obj);
    let res = JSON.stringify(obj, checkValues, space);
    clear();
    return res;
  };
}();
if (JSON.stringifyFast === void 0) {
  JSON.stringifyFast = stringifyFast;
}
function createNode(operator, parentNode, props, graph) {
  if (typeof props === "object") {
    props.operator = operator;
    return new GraphNode(props, parentNode, graph);
  }
  return new GraphNode({ operator }, parentNode, graph);
}

// ../../external/graphscript/services/dom/DOMElement.js
var DOMElement = class extends HTMLElement {
  constructor() {
    super();
    __publicField(this, "template", (props, self = this) => {
      return `<div> Custom Fragment Props: ${JSON.stringify(props)} </div>`;
    });
    __publicField(this, "props", {});
    __publicField(this, "useShadow", false);
    __publicField(this, "styles");
    __publicField(this, "oncreate");
    __publicField(this, "onresize");
    __publicField(this, "ondelete");
    __publicField(this, "onchanged");
    __publicField(this, "renderonchanged", false);
    __publicField(this, "FRAGMENT");
    __publicField(this, "attachedShadow", false);
    __publicField(this, "obsAttributes", ["props", "options", "onchanged", "onresize", "ondelete", "oncreate", "template"]);
    __publicField(this, "delete", () => {
      this.remove();
      if (typeof this.ondelete === "function")
        this.ondelete(this.props);
    });
    __publicField(this, "render", (props = this.props) => {
      if (typeof this.template === "function")
        this.templateResult = this.template(props, this);
      else
        this.templateResult = this.template;
      const t = document.createElement("template");
      if (typeof this.templateResult === "string")
        t.innerHTML = this.templateResult;
      else if (this.templateResult instanceof HTMLElement) {
        if (this.templateResult.parentNode) {
          this.templateResult.parentNode.removeChild(this.templateResult);
        }
        t.appendChild(this.templateResult);
      }
      const fragment = t.content;
      if (this.FRAGMENT) {
        if (this.useShadow) {
          this.shadowRoot.removeChild(this.FRAGMENT);
        } else
          this.removeChild(this.FRAGMENT);
      }
      if (this.useShadow) {
        if (!this.attachedShadow)
          this.attachShadow({ mode: "open" });
        this.shadowRoot.prepend(fragment);
        this.FRAGMENT = this.shadowRoot.childNodes[0];
      } else
        this.prepend(fragment);
      this.FRAGMENT = this.childNodes[0];
      let rendered = new CustomEvent("rendered", { detail: { props: this.props, self: this } });
      this.dispatchEvent("rendered");
      if (this.oncreate)
        this.oncreate(this, props);
    });
    __publicField(this, "state", {
      pushToState: {},
      data: {},
      triggers: {},
      setState(updateObj) {
        Object.assign(this.pushToState, updateObj);
        if (Object.keys(this.triggers).length > 0) {
          for (const prop of Object.getOwnPropertyNames(this.triggers)) {
            if (this.pushToState[prop]) {
              this.data[prop] = this.pushToState[prop];
              delete this.pushToState[prop];
              this.triggers[prop].forEach((obj) => {
                obj.onchanged(this.data[prop]);
              });
            }
          }
        }
        return this.pushToState;
      },
      subscribeTrigger(key, onchanged = (res) => {
      }) {
        if (key) {
          if (!this.triggers[key]) {
            this.triggers[key] = [];
          }
          let l = this.triggers[key].length;
          this.triggers[key].push({ idx: l, onchanged });
          return this.triggers[key].length - 1;
        } else
          return void 0;
      },
      unsubscribeTrigger(key, sub) {
        let idx = void 0;
        let triggers = this.triggers[key];
        if (triggers) {
          if (!sub)
            delete this.triggers[key];
          else {
            let obj = triggers.find((o) => {
              if (o.idx === sub) {
                return true;
              }
            });
            if (obj)
              triggers.splice(idx, 1);
            return true;
          }
        }
      },
      subscribeTriggerOnce(key = void 0, onchanged = (value) => {
      }) {
        let sub;
        let changed = (value) => {
          onchanged(value);
          this.unsubscribeTrigger(key, sub);
        };
        sub = this.subscribeTrigger(key, changed);
      }
    });
  }
  get observedAttributes() {
    return this.obsAttributes;
  }
  get obsAttributes() {
    return this.obsAttributes;
  }
  set obsAttributes(att) {
    if (typeof att === "string") {
      this.obsAttributes.push(att);
    } else if (Array.isArray(att))
      this.obsAttributes = att;
  }
  static get tag() {
    return this.name.toLowerCase() + "-";
  }
  static addElement(tag = this.tag, cls = this, extend = void 0) {
    addCustomElement(cls, tag, extend);
  }
  attributeChangedCallback(name2, old, val) {
    if (name2 === "onchanged") {
      let onchanged = val;
      if (typeof onchanged === "string")
        onchanged = parseFunctionFromText2(onchanged);
      if (typeof onchanged === "function") {
        this.onchanged = onchanged;
        this.state.data.props = this.props;
        this.state.unsubscribeTrigger("props");
        this.state.subscribeTrigger("props", this.onchanged);
        let changed = new CustomEvent("changed", { detail: { props: this.props, self: this } });
        this.state.subscribeTrigger("props", () => {
          this.dispatchEvent(changed);
        });
      }
    } else if (name2 === "onresize") {
      let onresize = val;
      if (typeof onresize === "string")
        onresize = parseFunctionFromText2(onresize);
      if (typeof onresize === "function") {
        if (this.ONRESIZE) {
          try {
            window.removeEventListener("resize", this.ONRESIZE);
          } catch (err2) {
          }
        }
        this.ONRESIZE = (ev) => {
          this.onresize(this.props, this);
        };
        this.onresize = onresize;
        window.addEventListener("resize", this.ONRESIZE);
      }
    } else if (name2 === "ondelete") {
      let ondelete = val;
      if (typeof ondelete === "string")
        ondelete = parseFunctionFromText2(ondelete);
      if (typeof ondelete === "function") {
        this.ondelete = () => {
          if (this.ONRESIZE)
            window.removeEventListener("resize", this.ONRESIZE);
          this.state.unsubscribeTrigger("props");
          if (ondelete)
            ondelete(this.props, this);
        };
      }
    } else if (name2 === "oncreate") {
      let oncreate = val;
      if (typeof oncreate === "string")
        oncreate = parseFunctionFromText2(oncreate);
      if (typeof oncreate === "function") {
        this.oncreate = oncreate;
      }
    } else if (name2 === "renderonchanged") {
      let rpc = val;
      if (typeof this.renderonchanged === "number")
        this.unsubscribeTrigger(this.renderonchanged);
      if (typeof rpc === "string")
        rpc = parseFunctionFromText2(rpc);
      if (typeof rpc === "function") {
        this.renderonchanged = this.state.subscribeTrigger("props", (p) => {
          this.render(p);
          rpc(this, p);
        });
      } else if (rpc != false)
        this.renderonchanged = this.state.subscribeTrigger("props", this.render);
    } else if (name2 === "props") {
      let newProps = val;
      if (typeof newProps === "string")
        newProps = JSON.parse(newProps);
      Object.assign(this.props, newProps);
      this.state.setState({ props: this.props });
    } else if (name2 === "template") {
      let template = val;
      this.template = template;
      this.render(this.props);
      let created = new CustomEvent("created", { detail: { props: this.props } });
      this.dispatchEvent(created);
    } else {
      let parsed = val;
      if (name2.includes("eval_")) {
        name2 = name2.split("_");
        name2.shift();
        name2 = name2.join();
        parsed = parseFunctionFromText2(val);
      } else if (typeof val === "string") {
        try {
          parsed = JSON.parse(val);
        } catch (err2) {
          parsed = val;
        }
      }
      this[name2] = parsed;
      if (name2 !== "props")
        this.props[name2] = parsed;
    }
  }
  connectedCallback() {
    let newProps = this.getAttribute("props");
    if (typeof newProps === "string")
      newProps = JSON.parse(newProps);
    Object.assign(this.props, newProps);
    this.state.setState({ props: this.props });
    Array.from(this.attributes).forEach((att) => {
      let name2 = att.name;
      let parsed = att.value;
      if (name2.includes("eval_")) {
        name2 = name2.split("_");
        name2.shift();
        name2 = name2.join();
        parsed = parseFunctionFromText2(att.value);
      } else if (typeof att.value === "string") {
        try {
          parsed = JSON.parse(att.value);
        } catch (err2) {
          parsed = att.value;
        }
      }
      if (!this[name2]) {
        Object.defineProperties(this, att, {
          value: parsed,
          writable: true,
          get() {
            return this[name2];
          },
          set(val) {
            this.setAttribute(name2, val);
          }
        });
      }
      this[name2] = parsed;
      if (name2 !== "props")
        this.props[name2] = parsed;
      this.obsAttributes.push(name2);
    });
    let resizeevent = new CustomEvent("resized", { detail: { props: this.props, self: this } });
    let changed = new CustomEvent("changed", { detail: { props: this.props, self: this } });
    let deleted = new CustomEvent("deleted", { detail: { props: this.props, self: this } });
    let created = new CustomEvent("created", { detail: { props: this.props, self: this } });
    if (this.styles) {
      let elm = `
            <style>
                ${templateStr}
            </style>
            `;
      if (this.template.indexOf("<style")) {
        this.template.splice(this.template.indexOf("<style" + 7), this.template.indexOf("</style"), templateStr);
      } else {
        if (this.template.indexOf("<head")) {
          this.template.splice(this.template.indexOf("<head" + 6), 0, elm);
        } else
          this.template = elm + this.template;
      }
      this.useShadow = true;
    }
    this.render(this.props);
    this.dispatchEvent(created);
    this.state.subscribeTrigger("props", () => {
      this.dispatchEvent(changed);
    });
    if (typeof this.onresize === "function") {
      if (this.ONRESIZE) {
        try {
          window.removeEventListener("resize", this.ONRESIZE);
        } catch (err2) {
        }
      }
      this.ONRESIZE = (ev) => {
        this.onresize(this, this.props);
        this.dispatchEvent(resizeevent);
      };
      window.addEventListener("resize", this.ONRESIZE);
    }
    if (typeof this.ondelete === "function") {
      let ondelete = this.ondelete;
      this.ondelete = (props = this.props) => {
        if (this.ONRESIZE)
          window.removeEventListener("resize", this.ONRESIZE);
        this.state.unsubscribeTrigger("props");
        this.dispatchEvent(deleted);
        ondelete(this, props);
      };
    }
    if (typeof this.onchanged === "function") {
      this.state.data.props = this.props;
      this.state.subscribeTrigger("props", this.onchanged);
    }
    if (this.renderonchanged) {
      let rpc = this.renderonchanged;
      if (typeof this.renderonchanged === "number")
        this.unsubscribeTrigger(this.renderonchanged);
      if (typeof rpc === "string")
        rpc = parseFunctionFromText2(rpc);
      if (typeof rpc === "function") {
        this.renderonchanged = this.state.subscribeTrigger("props", (p) => {
          this.render(p);
          rpc(this, p);
        });
      } else if (rpc !== false)
        this.renderonchanged = this.state.subscribeTrigger("props", this.render);
    }
  }
  get props() {
    return this.props;
  }
  set props(newProps = {}) {
    this.setAttribute("props", newProps);
  }
  get template() {
    return this.template;
  }
  set template(template) {
    this.setAttribute("template", template);
  }
  get render() {
    return this.render;
  }
  get delete() {
    return this.delete;
  }
  get state() {
    return this.state;
  }
  get onchanged() {
    return this.onchanged;
  }
  set onchanged(onchanged) {
    this.setAttribute("onchanged", onchanged);
  }
  get styles() {
    return this.styles;
  }
  set styles(templateStr2) {
    let elm = `
        <style>
            ${templateStr2}
        </style>
        `;
    if (this.template.indexOf("<style")) {
      this.template.splice(this.template.indexOf("<style" + 7), this.template.indexOf("</style"), templateStr2);
    } else {
      if (this.template.indexOf("<head")) {
        this.template.splice(this.template.indexOf("<head" + 6), 0, elm);
      } else
        this.template = elm + this.template;
    }
    if (this.querySelector("style")) {
      if (!this.useShadow) {
        this.useShadow = true;
        this.render();
      } else
        this.querySelector("style").innerHTML = templateStr2;
    } else {
      this.useShadow = true;
      this.render();
    }
  }
  get renderonchanged() {
    return this.renderonchanged;
  }
  set renderonchanged(onchanged) {
    this.setAttribute("renderonchanged", onchanged);
  }
  get onresize() {
    return this.props;
  }
  set onresize(onresize) {
    this.setAttribute("onresize", onresize);
  }
  get ondelete() {
    return this.props;
  }
  set ondelete(ondelete) {
    this.setAttribute("ondelete", ondelete);
  }
  get oncreate() {
    return this.oncreate;
  }
  set oncreate(oncreate) {
    this.setAttribute("oncreated", oncreate);
  }
};
function addCustomElement(cls, tag, extend = null) {
  try {
    if (extend) {
      if (tag)
        window.customElements.define(tag, cls, { extends: extend });
      else
        window.customElements.define(cls.name.toLowerCase() + "-", cls, { extends: extend });
    } else {
      if (tag)
        window.customElements.define(tag, cls);
      else
        window.customElements.define(cls.name.toLowerCase() + "-", cls);
    }
  } catch (err2) {
  }
}
function parseFunctionFromText2(method) {
  let getFunctionBody = (methodString) => {
    return methodString.replace(/^\W*(function[^{]+\{([\s\S]*)\}|[^=]+=>[^{]*\{([\s\S]*)\}|[^=]+=>(.+))/i, "$2$3$4");
  };
  let getFunctionHead = (methodString) => {
    let startindex = methodString.indexOf(")");
    return methodString.slice(0, methodString.indexOf("{", startindex) + 1);
  };
  let newFuncHead = getFunctionHead(method);
  let newFuncBody = getFunctionBody(method);
  let newFunc;
  try {
    if (newFuncHead.includes("function ")) {
      let varName = newFuncHead.split("(")[1].split(")")[0];
      newFunc = new Function(varName, newFuncBody);
    } else {
      if (newFuncHead.substring(0, 6) === newFuncBody.substring(0, 6)) {
        let varName = newFuncHead.split("(")[1].split(")")[0];
        newFunc = new Function(varName, newFuncBody.substring(newFuncBody.indexOf("{") + 1, newFuncBody.length - 1));
      } else {
        try {
          newFunc = (0, eval)(newFuncHead + newFuncBody + "}");
        } catch (err2) {
          newFunc = (0, eval)(method);
        }
      }
    }
  } catch (err2) {
  }
  return newFunc;
}

// ../../external/graphscript/services/Service.ts
var Service = class extends Graph {
  constructor(options = {}) {
    super(void 0, options.name, options.props);
    this.routes = {};
    this.loadDefaultRoutes = false;
    this.name = `service${Math.floor(Math.random() * 1e14)}`;
    this.keepState = true;
    this.load = (routes, includeClassName = true, routeFormat = ".") => {
      if (!routes && !this.loadDefaultRoutes)
        return;
      let service;
      if (!(routes instanceof Graph) && routes?.name) {
        if (routes.module) {
          let mod = routes;
          routes = {};
          Object.getOwnPropertyNames(routes.module).forEach((prop) => {
            if (includeClassName)
              routes[mod.name + routeFormat + prop] = routes.module[prop];
            else
              routes[prop] = routes.module[prop];
          });
        } else if (typeof routes === "function") {
          service = new routes({ loadDefaultRoutes: this.loadDefaultRoutes });
          service.load();
          routes = service.routes;
        }
      } else if (routes instanceof Graph || routes.source instanceof Graph) {
        service = routes;
        routes = {};
        let name2;
        if (includeClassName) {
          name2 = service.name;
          if (!name2) {
            name2 = service.tag;
            service.name = name2;
          }
          if (!name2) {
            name2 = `graph${Math.floor(Math.random() * 1e15)}`;
            service.name = name2;
            service.tag = name2;
          }
        }
        service.nodes.forEach((node) => {
          routes[node.tag] = node;
          let checked = {};
          let checkChildGraphNodes = (nd, prev) => {
            if (!checked[nd.tag] || prev && includeClassName && !checked[prev?.tag + routeFormat + nd.tag]) {
              if (!prev)
                checked[nd.tag] = true;
              else
                checked[prev.tag + routeFormat + nd.tag] = true;
              if (nd instanceof Graph || nd.source instanceof Graph) {
                if (includeClassName) {
                  let nm = nd.name;
                  if (!nm) {
                    nm = nd.tag;
                    nd.name = nm;
                  }
                  if (!nm) {
                    nm = `graph${Math.floor(Math.random() * 1e15)}`;
                    nd.name = nm;
                    nd.tag = nm;
                  }
                }
                nd.nodes.forEach((n) => {
                  if (includeClassName)
                    routes[nd.tag + routeFormat + n.tag] = n;
                  else if (!routes[n.tag])
                    routes[n.tag] = n;
                  checkChildGraphNodes(n, nd);
                });
              }
            }
          };
          checkChildGraphNodes(node);
        });
      } else if (typeof routes === "object") {
        let name2 = routes.constructor.name;
        if (name2 === "Object") {
          name2 = Object.prototype.toString.call(routes);
          if (name2)
            name2 = name2.split(" ")[1];
          if (name2)
            name2 = name2.split("]")[0];
        }
        if (name2 && name2 !== "Object") {
          let module = routes;
          routes = {};
          Object.getOwnPropertyNames(module).forEach((route) => {
            if (includeClassName)
              routes[name2 + routeFormat + route] = module[route];
            else
              routes[route] = module[route];
          });
        }
      }
      if (service instanceof Graph && service.name && includeClassName) {
        routes = Object.assign({}, routes);
        for (const prop in routes) {
          let route = routes[prop];
          delete routes[prop];
          routes[service.name + routeFormat + prop] = route;
        }
      }
      if (this.loadDefaultRoutes) {
        let rts = Object.assign({}, this.defaultRoutes);
        if (routes) {
          Object.assign(rts, this.routes);
          routes = Object.assign(rts, routes);
        } else
          routes = Object.assign(rts, this.routes);
        this.loadDefaultRoutes = false;
      }
      for (const tag in routes) {
        let childrenIter = (route) => {
          if (typeof route?.children === "object") {
            for (const key in route.children) {
              if (typeof route.children[key] === "object") {
                let rt = route.children[key];
                if (!rt.parent)
                  rt.parent = tag;
                if (rt.tag) {
                  routes[rt.tag] = route.children[key];
                  childrenIter(routes[rt.tag]);
                } else if (rt.id) {
                  rt.tag = rt.id;
                  routes[rt.tag] = route.children[key];
                  childrenIter(routes[rt.tag]);
                }
              }
            }
          }
        };
        childrenIter(routes[tag]);
      }
      for (const route in routes) {
        if (typeof routes[route] === "object") {
          let r = routes[route];
          if (typeof r === "object") {
            if (r.get) {
              if (typeof r.get == "object") {
              }
            }
            if (r.post) {
            }
            if (r.delete) {
            }
            if (r.put) {
            }
            if (r.head) {
            }
            if (r.patch) {
            }
            if (r.options) {
            }
            if (r.connect) {
            }
            if (r.trace) {
            }
            if (r.post && !r.operator) {
              routes[route].operator = r.post;
            } else if (!r.operator && typeof r.get == "function") {
              routes[route].operator = r.get;
            }
          }
          if (this.routes[route]) {
            if (typeof this.routes[route] === "object")
              Object.assign(this.routes[route], routes[route]);
            else
              this.routes[route] = routes[route];
          } else
            this.routes[route] = routes[route];
        } else if (this.routes[route]) {
          if (typeof this.routes[route] === "object")
            Object.assign(this.routes[route], routes[route]);
          else
            this.routes[route] = routes[route];
        } else
          this.routes[route] = routes[route];
      }
      this.setTree(this.routes);
      for (const prop in this.routes) {
        if (this.routes[prop]?.aliases) {
          let aliases = this.routes[prop].aliases;
          aliases.forEach((a) => {
            if (service)
              routes[service.name + routeFormat + a] = this.routes[prop];
            else
              routes[a] = this.routes[prop];
          });
        }
      }
      return this.routes;
    };
    this.unload = (routes = this.routes) => {
      if (!routes)
        return;
      let service;
      if (!(routes instanceof Service) && typeof routes === "function") {
        service = new Service();
        routes = service.routes;
      } else if (routes instanceof Service) {
        routes = routes.routes;
      }
      for (const r in routes) {
        delete this.routes[r];
        if (this.nodes.get(r))
          this.remove(r);
      }
      return this.routes;
    };
    this.handleMethod = (route, method, args, origin) => {
      let m = method.toLowerCase();
      if (m === "get" && this.routes[route]?.get?.transform instanceof Function) {
        if (Array.isArray(args))
          return this.routes[route].get.transform(...args);
        else
          return this.routes[route].get.transform(args);
      }
      if (this.routes[route]?.[m]) {
        if (!(this.routes[route][m] instanceof Function)) {
          if (args)
            this.routes[route][m] = args;
          return this.routes[route][m];
        } else
          return this.routes[route][m](args);
      } else
        return this.handleServiceMessage({ route, args, method, origin });
    };
    this.transmit = (...args) => {
      if (typeof args[0] === "object") {
        if (args[0].method) {
          return this.handleMethod(args[0].route, args[0].method, args[0].args);
        } else if (args[0].route) {
          return this.handleServiceMessage(args[0]);
        } else if (args[0].node) {
          return this.handleGraphNodeCall(args[0].node, args[0].args, args[0].origin);
        } else if (this.keepState) {
          if (args[0].route)
            this.setState({ [args[0].route]: args[0].args });
          if (args[0].node)
            this.setState({ [args[0].node]: args[0].args });
        }
      } else
        return args;
    };
    this.receive = (...args) => {
      if (args[0]) {
        if (typeof args[0] === "string") {
          let substr = args[0].substring(0, 8);
          if (substr.includes("{") || substr.includes("[")) {
            if (substr.includes("\\"))
              args[0] = args[0].replace(/\\/g, "");
            if (args[0][0] === '"') {
              args[0] = args[0].substring(1, args[0].length - 1);
            }
            ;
            args[0] = JSON.parse(args[0]);
          }
        }
      }
      if (typeof args[0] === "object") {
        if (args[0].method) {
          return this.handleMethod(args[0].route, args[0].method, args[0].args);
        } else if (args[0].route) {
          return this.handleServiceMessage(args[0]);
        } else if (args[0].node) {
          return this.handleGraphNodeCall(args[0].node, args[0].args, args[0].origin);
        } else if (this.keepState) {
          if (args[0].route)
            this.setState({ [args[0].route]: args[0].args });
          if (args[0].node)
            this.setState({ [args[0].node]: args[0].args });
        }
      } else
        return args;
    };
    this.pipe = (source, destination, endpoint, origin, method, callback) => {
      if (source instanceof GraphNode) {
        if (callback)
          return source.subscribe((res) => {
            let mod = callback(res);
            if (mod !== void 0)
              this.transmit({ route: destination, args: mod, origin, method });
            else
              this.transmit({ route: destination, args: res, origin, method }, endpoint);
          });
        else
          return this.subscribe(source, (res) => {
            this.transmit({ route: destination, args: res, origin, method }, endpoint);
          });
      } else if (typeof source === "string")
        return this.subscribe(source, (res) => {
          this.transmit({ route: destination, args: res, origin, method }, endpoint);
        });
    };
    this.pipeOnce = (source, destination, endpoint, origin, method, callback) => {
      if (source instanceof GraphNode) {
        if (callback)
          return source.state.subscribeTriggerOnce(source.tag, (res) => {
            let mod = callback(res);
            if (mod !== void 0)
              this.transmit({ route: destination, args: mod, origin, method });
            else
              this.transmit({ route: destination, args: res, origin, method }, endpoint);
          });
        else
          return this.state.subscribeTriggerOnce(source.tag, (res) => {
            this.transmit({ route: destination, args: res, origin, method }, endpoint);
          });
      } else if (typeof source === "string")
        return this.state.subscribeTriggerOnce(source, (res) => {
          this.transmit({ route: destination, args: res, origin, method }, endpoint);
        });
    };
    this.terminate = (...args) => {
      this.nodes.forEach((n) => {
        n.stopNode();
      });
    };
    this.recursivelyAssign = (target, obj) => {
      for (const key in obj) {
        if (typeof obj[key] === "object") {
          if (typeof target[key] === "object")
            this.recursivelyAssign(target[key], obj[key]);
          else
            target[key] = this.recursivelyAssign({}, obj[key]);
        } else
          target[key] = obj[key];
      }
      return target;
    };
    this.defaultRoutes = {
      "/": {
        get: () => {
          return this.print();
        },
        aliases: [""]
      },
      ping: () => {
        console.log("ping");
        return "pong";
      },
      echo: (...args) => {
        this.transmit(...args);
        return args;
      },
      assign: (source) => {
        if (typeof source === "object") {
          Object.assign(this, source);
          return true;
        }
        return false;
      },
      recursivelyAssign: (source) => {
        if (typeof source === "object") {
          this.recursivelyAssign(this, source);
          return true;
        }
        return false;
      },
      log: {
        post: (...args) => {
          console.log("Log: ", ...args);
        },
        aliases: ["info"]
      },
      error: (message) => {
        let er = new Error(message);
        console.error(message);
        return er;
      },
      state: (key) => {
        if (key) {
          return this.state.data[key];
        } else
          return this.state.data;
      },
      printState: (key) => {
        if (key) {
          return stringifyWithCircularRefs(this.state.data[key]);
        } else
          return stringifyWithCircularRefs(this.state.data);
      },
      transmit: this.transmit,
      receive: this.receive,
      load: this.load,
      unload: this.unload,
      pipe: this.pipe,
      terminate: this.terminate,
      run: this.run,
      _run: this._run,
      subscribe: this.subscribe,
      unsubscribe: this.unsubscribe,
      stopNode: this.stopNode,
      get: this.get,
      add: this.add,
      remove: this.remove,
      setTree: this.setTree,
      setState: this.setState,
      print: this.print,
      reconstruct: this.reconstruct,
      handleMethod: this.handleMethod,
      handleServiceMessage: this.handleServiceMessage,
      handleGraphNodeCall: this.handleGraphNodeCall
    };
    if ("loadDefaultRoutes" in options)
      this.loadDefaultRoutes = options.loadDefaultRoutes;
    if (options.name)
      this.name = options.name;
    if (Array.isArray(options.routes)) {
      options.routes.forEach((r) => {
        this.load(r);
      });
    } else if (options.routes)
      this.load(options.routes);
  }
  handleServiceMessage(message) {
    let call;
    if (typeof message === "object") {
      if (message.route)
        call = message.route;
      else if (message.node)
        call = message.node;
    }
    if (call) {
      if (message.origin) {
        if (Array.isArray(message.args))
          return this._run(call, message.origin, ...message.args);
        else
          return this._run(call, message.origin, message.args);
      } else {
        if (Array.isArray(message.args))
          return this.run(call, ...message.args);
        else
          return this.run(call, message.args);
      }
    } else
      return message;
  }
  handleGraphNodeCall(route, args, origin) {
    if (!route)
      return args;
    if (args?.args) {
      this.handleServiceMessage(args);
    } else if (origin) {
      if (Array.isArray(args))
        return this._run(route, origin, ...args);
      else
        return this._run(route, origin, args);
    } else if (Array.isArray(args))
      return this.run(route, ...args);
    else
      return this.run(route, args);
  }
  isTypedArray(x) {
    return ArrayBuffer.isView(x) && Object.prototype.toString.call(x) !== "[object DataView]";
  }
};

// ../../external/graphscript/services/dom/DOM.service.ts
var DOMService = class extends Graph {
  constructor(options, parentNode) {
    super(void 0, options.name, options.props);
    this.routes = {};
    this.loadDefaultRoutes = false;
    this.name = `dom${Math.floor(Math.random() * 1e15)}`;
    this.keepState = true;
    this.parentNode = document.body;
    this.elements = {};
    this.components = {};
    this.templates = {};
    this.addElement = (options, generateChildElementNodes = false) => {
      let elm = this.createElement(options);
      let oncreate = options.oncreate;
      delete options.oncreate;
      if (!options.element)
        options.element = elm;
      if (!options.operator)
        options.operator = (node2, origin, props) => {
          if (typeof props === "object")
            for (const key in props) {
              if (node2.element) {
                if (typeof node2.element[key] === "function" && typeof props[key] !== "function") {
                  if (Array.isArray(props[key]))
                    node2.element[key](...props[key]);
                  else
                    node2.element[key](props[key]);
                } else if (key === "style") {
                  Object.assign(node2.element[key], props[key]);
                } else
                  node2.element[key] = props[key];
              }
            }
          return props;
        };
      let node = new GraphNode(options, void 0, this);
      elm.node = node;
      let divs = Array.from(elm.querySelectorAll("*"));
      if (generateChildElementNodes) {
        divs = divs.map((d, i) => this.addElement({ element: d }));
      }
      this.elements[options.id] = { element: elm, node, parentNode: options.parentNode, divs };
      if (options.onresize) {
        let onresize = options.onresize;
        options.onresize = (ev) => {
          onresize(ev, elm, this.elements[options.id]);
        };
        window.addEventListener("resize", options.onresize);
      }
      if (!elm.parentNode) {
        setTimeout(() => {
          if (typeof options.parentNode === "object")
            options.parentNode.appendChild(elm);
          if (oncreate)
            oncreate(elm, this.elements[options.id]);
        }, 0.01);
      }
      return this.elements[options.id];
    };
    this.createElement = (options) => {
      let elm;
      if (options.element) {
        if (typeof options.element === "string") {
          elm = document.querySelector(options.element);
          if (!elm)
            elm = document.getElementById(options.element);
        } else
          elm = options.element;
      } else if (options.tagName)
        elm = document.createElement(options.tagName);
      else if (options.id && document.getElementById(options.id))
        elm = document.getElementById(options.id);
      if (!elm)
        return void 0;
      this.updateOptions(options, elm);
      return elm;
    };
    this.updateOptions = (options, element) => {
      if (!options.id)
        options.id = `${options.tagName ?? "element"}${Math.floor(Math.random() * 1e15)}`;
      if (!options.id && options.tag)
        options.id = options.tag;
      if (!options.tag && options.id)
        options.tag = options.id;
      if (!options.id)
        options.id = options.tagName;
      if (typeof options.parentNode === "string")
        options.parentNode = document.getElementById(options.parentNode);
      if (!options.parentNode) {
        if (!this.parentNode)
          this.parentNode = document.body;
        options.parentNode = this.parentNode;
      }
      element.id = options.id;
      if (options.style)
        Object.assign(element.style, options.style);
      if (options.innerHTML && element.innerHTML !== options.innerHTML)
        element.innerHTML = options.innerHTML;
      if (options.innerText && element.innerText !== options.innerText)
        element.innerText = options.innerText;
      if (options.attributes)
        Object.assign(element, options.attributes);
      return options;
    };
    this.addComponent = (options, generateChildElementNodes = true) => {
      if (options.oncreate) {
        let oncreate = options.oncreate;
        options.oncreate = (self) => {
          oncreate(self, options);
        };
      }
      if (options.onresize) {
        let onresize = options.onresize;
        options.onresize = (self) => {
          onresize(self, options);
        };
      }
      if (options.ondelete) {
        let ondelete = options.ondelete;
        options.ondelete = (self) => {
          ondelete(self, options);
        };
      }
      if (typeof options.renderonchanged === "function") {
        let renderonchanged = options.renderonchanged;
        options.renderonchanged = (self) => {
          renderonchanged(self, options);
        };
      }
      class CustomElement extends DOMElement {
        constructor() {
          super(...arguments);
          this.props = options.props;
          this.styles = options.styles;
          this.template = options.template;
          this.oncreate = options.oncreate;
          this.onresize = options.onresize;
          this.ondelete = options.ondelete;
          this.renderonchanged = options.renderonchanged;
        }
      }
      delete options.oncreate;
      if (!options.tagName)
        options.tagName = `custom-element${Math.random() * 1e15}`;
      CustomElement.addElement(options.tagName);
      let elm = document.createElement(options.tagName);
      let completeOptions = this.updateOptions(options, elm);
      this.templates[completeOptions.id] = completeOptions;
      let divs = Array.from(elm.querySelectorAll("*"));
      if (generateChildElementNodes) {
        divs = divs.map((d) => this.addElement({ element: d }));
      }
      if (!options.element)
        options.element = elm;
      if (!options.operator)
        options.operator = (node2, origin, props) => {
          if (typeof props === "object")
            for (const key in props) {
              if (node2.element) {
                if (typeof node2.element[key] === "function" && typeof props[key] !== "function") {
                  if (Array.isArray(props[key]))
                    node2.element[key](...props[key]);
                  else
                    node2.element[key](props[key]);
                } else if (key === "style") {
                  Object.assign(node2.element[key], props[key]);
                } else
                  node2.element[key] = props[key];
              }
            }
          return props;
        };
      let node = new GraphNode(options, void 0, this);
      elm.node = node;
      this.components[completeOptions.id] = {
        element: elm,
        class: CustomElement,
        node,
        divs,
        ...completeOptions
      };
      if (!elm.parentNode) {
        setTimeout(() => {
          if (typeof options.parentNode === "object")
            options.parentNode.appendChild(elm);
        }, 0.01);
      }
      return this.components[completeOptions.id];
    };
    this.addCanvasComponent = (options) => {
      if (!options.canvas) {
        options.template = `<canvas `;
        if (options.width)
          options.template += `width="${options.width}"`;
        if (options.height)
          options.template += `height="${options.height}"`;
        options.template += ` ></canvas>`;
      } else
        options.template = options.canvas;
      if (options.oncreate) {
        let oncreate = options.oncreate;
        options.oncreate = (self) => {
          oncreate(self, options);
        };
      }
      if (options.onresize) {
        let onresize = options.onresize;
        options.onresize = (self) => {
          onresize(self, options);
        };
      }
      if (options.ondelete) {
        let ondelete = options.ondelete;
        options.ondelete = (self) => {
          ondelete(self, options);
        };
      }
      if (typeof options.renderonchanged === "function") {
        let renderonchanged = options.renderonchanged;
        options.renderonchanged = (self) => {
          renderonchanged(self, options);
        };
      }
      class CustomElement extends DOMElement {
        constructor() {
          super(...arguments);
          this.props = options.props;
          this.styles = options.styles;
          this.template = options.template;
          this.oncreate = options.oncreate;
          this.onresize = options.onresize;
          this.ondelete = options.ondelete;
          this.renderonchanged = options.renderonchanged;
        }
      }
      delete options.oncreate;
      if (!options.tagName)
        options.tagName = `custom-element${Math.random() * 1e15}`;
      CustomElement.addElement(options.tagName);
      let elm = document.createElement(options.tagName);
      const completeOptions = this.updateOptions(options, elm);
      let animation = () => {
        if (this.components[completeOptions.id]?.animating) {
          this.components[completeOptions.id].draw(this.components[completeOptions.id].element, this.components[completeOptions.id]);
          requestAnimationFrame(animation);
        }
      };
      this.templates[completeOptions.id] = completeOptions;
      if (!options.element)
        options.element = elm;
      if (!options.operator)
        options.operator = (node2, origin, props) => {
          if (typeof props === "object")
            for (const key in props) {
              if (node2.element) {
                if (typeof node2.element[key] === "function" && typeof props[key] !== "function") {
                  if (Array.isArray(props[key]))
                    node2.element[key](...props[key]);
                  else
                    node2.element[key](props[key]);
                } else if (key === "style") {
                  Object.assign(node2.element[key], props[key]);
                } else
                  node2.element[key] = props[key];
              }
            }
          return props;
        };
      let node = new GraphNode(options, void 0, this);
      elm.node = node;
      let canvas = elm.querySelector("canvas");
      if (completeOptions.style)
        Object.assign(canvas.style, completeOptions.style);
      let context;
      if (typeof completeOptions.context === "object")
        context = options.context;
      else if (typeof completeOptions.context === "string")
        context = canvas.getContext(completeOptions.context);
      this.components[completeOptions.id] = {
        element: elm,
        class: CustomElement,
        template: completeOptions.template,
        canvas,
        node,
        ...completeOptions
      };
      this.components[completeOptions.id].context = context;
      elm.canvas = canvas;
      elm.context = context;
      node.canvas = canvas;
      node.context = context;
      if (!elm.parentNode) {
        setTimeout(() => {
          if (typeof options.parentNode === "object")
            options.parentNode.appendChild(elm);
        }, 0.01);
      }
      node.runAnimation(animation);
      return this.components[completeOptions.id];
    };
    this.load = (routes, includeClassName = true, routeFormat = ".") => {
      if (!routes && !this.loadDefaultRoutes)
        return;
      let service;
      if (!(routes instanceof Graph) && routes?.name) {
        if (routes.module) {
          let mod = routes;
          routes = {};
          Object.getOwnPropertyNames(routes.module).forEach((prop) => {
            if (includeClassName)
              routes[mod.name + routeFormat + prop] = routes.module[prop];
            else
              routes[prop] = routes.module[prop];
          });
        } else if (typeof routes === "function") {
          service = new routes({ loadDefaultRoutes: this.loadDefaultRoutes });
          service.load();
          routes = service.routes;
        }
      } else if (routes instanceof Graph || routes.source instanceof Graph) {
        service = routes;
        routes = {};
        let name2;
        if (includeClassName) {
          name2 = service.name;
          if (!name2) {
            name2 = service.tag;
            service.name = name2;
          }
          if (!name2) {
            name2 = `graph${Math.floor(Math.random() * 1e15)}`;
            service.name = name2;
            service.tag = name2;
          }
        }
        service.nodes.forEach((node) => {
          routes[node.tag] = node;
          let checked = {};
          let checkChildGraphNodes = (nd, prev) => {
            if (!checked[nd.tag] || prev && includeClassName && !checked[prev?.tag + routeFormat + nd.tag]) {
              if (!prev)
                checked[nd.tag] = true;
              else
                checked[prev.tag + routeFormat + nd.tag] = true;
              if (nd instanceof Graph || nd.source instanceof Graph) {
                if (includeClassName) {
                  let nm = nd.name;
                  if (!nm) {
                    nm = nd.tag;
                    nd.name = nm;
                  }
                  if (!nm) {
                    nm = `graph${Math.floor(Math.random() * 1e15)}`;
                    nd.name = nm;
                    nd.tag = nm;
                  }
                }
                nd.nodes.forEach((n) => {
                  if (includeClassName)
                    routes[nd.tag + routeFormat + n.tag] = n;
                  else if (!routes[n.tag])
                    routes[n.tag] = n;
                  checkChildGraphNodes(n, nd);
                });
              }
            }
          };
          checkChildGraphNodes(node);
        });
      } else if (typeof routes === "object") {
        let name2 = routes.constructor.name;
        if (name2 === "Object") {
          name2 = Object.prototype.toString.call(routes);
          if (name2)
            name2 = name2.split(" ")[1];
          if (name2)
            name2 = name2.split("]")[0];
        }
        if (name2 && name2 !== "Object") {
          let module = routes;
          routes = {};
          Object.getOwnPropertyNames(module).forEach((route) => {
            if (includeClassName)
              routes[name2 + routeFormat + route] = module[route];
            else
              routes[route] = module[route];
          });
        }
      }
      if (service instanceof Graph && service.name && includeClassName) {
        routes = Object.assign({}, routes);
        for (const prop in routes) {
          let route = routes[prop];
          delete routes[prop];
          routes[service.name + routeFormat + prop] = route;
        }
      }
      if (this.loadDefaultRoutes) {
        let rts = Object.assign({}, this.defaultRoutes);
        if (routes) {
          Object.assign(rts, this.routes);
          routes = Object.assign(rts, routes);
        } else
          routes = Object.assign(rts, this.routes);
        this.loadDefaultRoutes = false;
      }
      for (const tag in routes) {
        let childrenIter = (route) => {
          if (typeof route?.children === "object") {
            for (const key in route.children) {
              if (typeof route.children[key] === "object") {
                let rt = route.children[key];
                if (!rt.parent)
                  rt.parent = tag;
                if (rt.tag) {
                  routes[rt.tag] = route.children[key];
                  childrenIter(routes[rt.tag]);
                } else if (rt.id) {
                  rt.tag = rt.id;
                  routes[rt.tag] = route.children[key];
                  childrenIter(routes[rt.tag]);
                }
              }
            }
          }
        };
        childrenIter(routes[tag]);
      }
      routes = Object.assign({}, routes);
      for (const route in routes) {
        if (typeof routes[route] === "object" && !(routes[route] instanceof GraphNode)) {
          let r = routes[route];
          if (typeof r === "object") {
            if (r.template) {
              if (!routes[route].tag)
                routes[route].tag = route;
              this.addComponent(routes[route], routes[route].generateChildElementNodes);
            } else if (r.context) {
              if (!routes[route].tag)
                routes[route].tag = route;
              this.addCanvasComponent(routes[route]);
            } else if (r.tagName || r.element) {
              if (!routes[route].tag)
                routes[route].tag = route;
              this.addElement(routes[route], routes[route].generateChildElementNodes);
            }
            if (r.get) {
              if (typeof r.get == "object") {
              }
            }
            if (r.post) {
            }
            if (r.delete) {
            }
            if (r.put) {
            }
            if (r.head) {
            }
            if (r.patch) {
            }
            if (r.options) {
            }
            if (r.connect) {
            }
            if (r.trace) {
            }
            if (r.post && !r.operator) {
              routes[route].operator = r.post;
            } else if (!r.operator && typeof r.get == "function") {
              routes[route].operator = r.get;
            }
          }
          if (this.routes[route]) {
            if (typeof this.routes[route] === "object")
              Object.assign(this.routes[route], routes[route]);
            else
              this.routes[route] = routes[route];
          } else
            this.routes[route] = routes[route];
        } else if (this.routes[route]) {
          if (typeof this.routes[route] === "object")
            Object.assign(this.routes[route], routes[route]);
          else
            this.routes[route] = routes[route];
        } else
          this.routes[route] = routes[route];
      }
      this.setTree(this.routes);
      for (const prop in this.routes) {
        if (this.routes[prop]?.aliases) {
          let aliases = this.routes[prop].aliases;
          aliases.forEach((a) => {
            if (service)
              routes[service.name + "/" + a] = this.routes[prop];
            else
              routes[a] = this.routes[prop];
          });
        }
      }
      return this.routes;
    };
    this.unload = (routes = this.routes) => {
      if (!routes)
        return;
      let service;
      if (!(routes instanceof Service) && typeof routes === "function") {
        service = new Service();
        routes = service.routes;
      } else if (routes instanceof Service) {
        routes = routes.routes;
      }
      for (const r in routes) {
        delete this.routes[r];
        if (this.nodes.get(r))
          this.remove(r);
      }
      return this.routes;
    };
    this.handleMethod = (route, method, args, origin) => {
      let m = method.toLowerCase();
      if (m === "get" && this.routes[route]?.get?.transform instanceof Function) {
        if (Array.isArray(args))
          return this.routes[route].get.transform(...args);
        else
          return this.routes[route].get.transform(args);
      }
      if (this.routes[route]?.[m]) {
        if (!(this.routes[route][m] instanceof Function)) {
          if (args)
            this.routes[route][m] = args;
          return this.routes[route][m];
        } else
          return this.routes[route][m](args);
      } else
        return this.handleServiceMessage({ route, args, method, origin });
    };
    this.transmit = (...args) => {
      if (typeof args[0] === "object") {
        if (args[0].method) {
          return this.handleMethod(args[0].route, args[0].method, args[0].args);
        } else if (args[0].route) {
          return this.handleServiceMessage(args[0]);
        } else if (args[0].node) {
          return this.handleGraphNodeCall(args[0].node, args[0].args, args[0].origin);
        } else if (this.keepState) {
          if (args[0].route)
            this.setState({ [args[0].route]: args[0].args });
          if (args[0].node)
            this.setState({ [args[0].node]: args[0].args });
        }
      } else
        return args;
    };
    this.receive = (...args) => {
      if (args[0]) {
        if (typeof args[0] === "string") {
          let substr = args[0].substring(0, 8);
          if (substr.includes("{") || substr.includes("[")) {
            if (substr.includes("\\"))
              args[0] = args[0].replace(/\\/g, "");
            if (args[0][0] === '"') {
              args[0] = args[0].substring(1, args[0].length - 1);
            }
            ;
            args[0] = JSON.parse(args[0]);
          }
        }
      }
      if (typeof args[0] === "object") {
        if (args[0].method) {
          return this.handleMethod(args[0].route, args[0].method, args[0].args);
        } else if (args[0].route) {
          return this.handleServiceMessage(args[0]);
        } else if (args[0].node) {
          return this.handleGraphNodeCall(args[0].node, args[0].args, args[0].origin);
        } else if (this.keepState) {
          if (args[0].route)
            this.setState({ [args[0].route]: args[0].args });
          if (args[0].node)
            this.setState({ [args[0].node]: args[0].args });
        }
      } else
        return args;
    };
    this.pipe = (source, destination, endpoint, origin, method, callback) => {
      if (source instanceof GraphNode) {
        if (callback)
          return source.subscribe((res) => {
            let mod = callback(res);
            if (mod !== void 0)
              this.transmit({ route: destination, args: mod, origin, method });
            else
              this.transmit({ route: destination, args: res, origin, method }, endpoint);
          });
        else
          return this.subscribe(source, (res) => {
            this.transmit({ route: destination, args: res, origin, method }, endpoint);
          });
      } else if (typeof source === "string")
        return this.subscribe(source, (res) => {
          this.transmit({ route: destination, args: res, origin, method }, endpoint);
        });
    };
    this.pipeOnce = (source, destination, endpoint, origin, method, callback) => {
      if (source instanceof GraphNode) {
        if (callback)
          return source.state.subscribeTriggerOnce(source.tag, (res) => {
            let mod = callback(res);
            if (mod !== void 0)
              this.transmit({ route: destination, args: mod, origin, method });
            else
              this.transmit({ route: destination, args: res, origin, method }, endpoint);
          });
        else
          return this.state.subscribeTriggerOnce(source.tag, (res) => {
            this.transmit({ route: destination, args: res, origin, method }, endpoint);
          });
      } else if (typeof source === "string")
        return this.state.subscribeTriggerOnce(source, (res) => {
          this.transmit({ route: destination, args: res, origin, method }, endpoint);
        });
    };
    this.terminate = (element) => {
      if (typeof element === "object") {
        if (element.animating)
          element.animating = false;
        if (element.element)
          element = element.element;
      } else if (typeof element === "string" && this.components[element]) {
        if (this.components[element].node.isAnimating)
          this.components[element].node.stopNode();
        if (this.components[element].divs)
          this.components[element].divs.forEach((d) => this.terminate(d));
        let temp = this.components[element].element;
        delete this.components[element];
        element = temp;
      } else if (typeof element === "string" && this.elements[element]) {
        if (this.elements[element].divs)
          this.elements[element].divs.forEach((d) => this.terminate(d));
        let temp = this.elements[element].element;
        if (this.elements[element].onresize)
          window.removeEventListener("resize", this.elements[element].onresize);
        if (this.elements[element].ondelete)
          this.elements[element].ondelete(temp, this.elements[element]);
        delete this.elements[element];
        element = temp;
      }
      if (element) {
        if (this.nodes.get(element.id)) {
          this.removeTree(element.id);
        }
        if (element instanceof DOMElement)
          element.delete();
        else if (element?.parentNode) {
          element.parentNode.removeChild(element);
        }
        return true;
      }
      return false;
    };
    this.recursivelyAssign = (target, obj) => {
      for (const key in obj) {
        if (typeof obj[key] === "object") {
          if (typeof target[key] === "object")
            this.recursivelyAssign(target[key], obj[key]);
          else
            target[key] = this.recursivelyAssign({}, obj[key]);
        } else
          target[key] = obj[key];
      }
      return target;
    };
    this.defaultRoutes = {
      "/": {
        get: () => {
          return this.print();
        },
        aliases: [""]
      },
      ping: () => {
        console.log("ping");
        return "pong";
      },
      echo: (...args) => {
        this.transmit(...args);
        return args;
      },
      assign: (source) => {
        if (typeof source === "object") {
          Object.assign(this, source);
          return true;
        }
        return false;
      },
      recursivelyAssign: (source) => {
        if (typeof source === "object") {
          this.recursivelyAssign(this, source);
          return true;
        }
        return false;
      },
      log: {
        post: (...args) => {
          console.log("Log: ", ...args);
        },
        aliases: ["info"]
      },
      error: (message) => {
        let er = new Error(message);
        console.error(message);
        return er;
      },
      state: (key) => {
        if (key) {
          return this.state.data[key];
        } else
          return this.state.data;
      },
      printState: (key) => {
        if (key) {
          return stringifyWithCircularRefs(this.state.data[key]);
        } else
          return stringifyWithCircularRefs(this.state.data);
      },
      transmit: this.transmit,
      receive: this.receive,
      load: this.load,
      unload: this.unload,
      pipe: this.pipe,
      terminate: this.terminate,
      run: this.run,
      _run: this._run,
      subscribe: this.subscribe,
      unsubscribe: this.unsubscribe,
      stopNode: this.stopNode,
      get: this.get,
      add: this.add,
      remove: this.remove,
      setTree: this.setTree,
      setState: this.setState,
      print: this.print,
      reconstruct: this.reconstruct,
      handleMethod: this.handleMethod,
      handleServiceMessage: this.handleServiceMessage,
      handleGraphNodeCall: this.handleGraphNodeCall,
      addElement: this.addElement,
      addComponent: this.addComponent,
      addCanvasComponent: this.addCanvasComponent
    };
    if ("loadDefaultRoutes" in options)
      this.loadDefaultRoutes = options.loadDefaultRoutes;
    if (options.name)
      this.name = options.name;
    if (parentNode instanceof HTMLElement)
      this.parentNode = parentNode;
    else if (options.parentNode instanceof HTMLElement)
      this.parentNode = parentNode;
    if (Array.isArray(options.routes)) {
      options.routes.forEach((r) => {
        this.load(r);
      });
    } else if (options.routes)
      this.load(options.routes);
  }
  handleServiceMessage(message) {
    let call;
    if (typeof message === "object") {
      if (message.route)
        call = message.route;
      else if (message.node)
        call = message.node;
    }
    if (call) {
      if (message.origin) {
        if (Array.isArray(message.args))
          return this._run(call, message.origin, ...message.args);
        else
          return this._run(call, message.origin, message.args);
      } else {
        if (Array.isArray(message.args))
          return this.run(call, ...message.args);
        else
          return this.run(call, message.args);
      }
    } else
      return message;
  }
  handleGraphNodeCall(route, args, origin) {
    if (!route)
      return args;
    if (args?.args) {
      this.handleServiceMessage(args);
    } else if (origin) {
      if (Array.isArray(args))
        return this._run(route, origin, ...args);
      else
        return this._run(route, origin, args);
    } else if (Array.isArray(args))
      return this.run(route, ...args);
    else
      return this.run(route, args);
  }
  isTypedArray(x) {
    return ArrayBuffer.isView(x) && Object.prototype.toString.call(x) !== "[object DataView]";
  }
};

// ../../external/graphscript/routers/Router.ts
var Router = class {
  constructor(services, options) {
    this.id = `router${Math.floor(Math.random() * 1e15)}`;
    this.service = new Service();
    this.nodes = this.service.nodes;
    this.run = this.service.run;
    this._run = this.service._run;
    this.add = this.service.add;
    this.remove = this.service.remove;
    this.stopNode = this.service.stopNode;
    this.subscribe = this.service.subscribe;
    this.unsubscribe = this.service.unsubscribe;
    this.get = this.service.get;
    this.reconstruct = this.service.reconstruct;
    this.setState = this.service.setState;
    this.recursivelyAssign = this.service.recursivelyAssign;
    this.state = this.service.state;
    this.routes = this.service.routes;
    this.services = {};
    this.loadDefaultRoutes = false;
    this.load = (service, linkServices = true, includeClassName = true) => {
      if (!(service instanceof Graph) && typeof service === "function") {
        service = new service({ loadDefaultRoutes: this.loadDefaultRoutes }, service.name);
        service.load();
      } else if (!service)
        return;
      if (service instanceof Graph && service.name) {
        this.services[service.name] = service;
      } else {
        if (service.constructor.name === "Object") {
          let name2 = Object.prototype.toString.call(service);
          if (name2)
            name2 = name2.split(" ")[1];
          if (name2)
            name2 = name2.split("]")[0];
          if (name2 && name2 !== "Object" && name2 !== "Function") {
            this.services[name2] = service;
          }
        } else
          this.services[service.constructor.name] = service;
      }
      this.service.load(service, includeClassName);
      if (linkServices) {
        for (const name2 in this.services) {
          this.service.nodes.forEach((n) => {
            if (this.services[name2]?.nodes) {
              if (!this.services[name2].nodes.get(n.tag)) {
                this.services[name2].nodes.set(n.tag, n);
              }
            }
          });
        }
      }
      return this.services[service.name];
    };
    this.pipe = (source, destination, transmitter, origin, method, callback) => {
      if (!transmitter && source && destination) {
        if (callback)
          return this.subscribe(source, (res) => {
            let mod = callback(res);
            if (mod)
              res = mod;
            this.run(destination, res);
          });
        return this.subscribe(source, (res) => {
          this.run(destination, res);
        });
      }
      if (transmitter) {
        if (transmitter === "sockets")
          transmitter = "wss";
        const radio = this.services[transmitter];
        if (radio) {
          if (callback) {
            return this.subscribe(source, (res) => {
              let mod = callback(res);
              if (mod)
                res = mod;
              radio.transmit({ route: destination, args: res, origin, method });
            });
          } else
            return this.subscribe(source, (res) => {
              radio.transmit({ route: destination, args: res, origin, method });
            });
        } else {
          let endpoint = this.getEndpointInfo(transmitter);
          if (endpoint) {
            return this.services[endpoint.service].pipe(source, destination, transmitter, origin, method, callback);
          }
        }
      }
      return false;
    };
    this.pipeOnce = (source, destination, transmitter, origin, method, callback) => {
      if (source instanceof GraphNode)
        source = source.tag;
      if (!transmitter && typeof source === "string" && destination) {
        if (callback)
          return this.state.subscribeTriggerOnce(source, (res) => {
            let mod = callback(res);
            if (mod)
              res = mod;
            this.run(destination, res);
          });
        return this.state.subscribeTriggerOnce(source, (res) => {
          this.run(destination, res);
        });
      }
      if (transmitter) {
        if (transmitter === "sockets")
          transmitter = "wss";
        const radio = this.services[transmitter];
        if (radio) {
          if (callback) {
            return this.state.subscribeTriggerOnce(source, (res) => {
              let mod = callback(res);
              if (mod)
                res = mod;
              radio.transmit({ route: destination, args: res, origin, method });
            });
          } else
            return this.state.subscribeTriggerOnce(source, (res) => {
              radio.transmit({ route: destination, args: res, origin, method });
            });
        } else {
          let endpoint = this.getEndpointInfo(transmitter);
          if (endpoint) {
            return this.services[endpoint.service].pipeOnce(source, destination, transmitter, origin, method, callback);
          }
        }
      }
      return false;
    };
    this.sendAll = (message, connections, channel) => {
      let sent = false;
      if (typeof connections === "object") {
        for (const protocol in connections) {
          for (const info in connections[protocol]) {
            let obj = connections[protocol][info];
            if (obj.socket) {
              if (obj.socket.readyState === 1) {
                obj.socket.send(message);
                sent = true;
              } else
                delete connections[protocol][info];
            } else if (obj.wss) {
              obj.wss.clients.forEach((c) => {
                c.send(message);
              });
              sent = true;
            } else if (obj.sessions) {
              if (channel) {
                obj.channel.broadcast(message, channel);
                sent = true;
              } else
                for (const s in obj.sessions) {
                  if (obj.sessions[s].isConnected) {
                    obj.sessions[s].push(message);
                    sent = true;
                  }
                }
            } else if (obj.session) {
              if (channel) {
                obj.served.channel.broadcast(message, channel);
                sent = true;
              } else if (obj.session.isConnected) {
                obj.session.push(message);
                sent = true;
              } else
                delete connections[protocol][info];
            } else if (obj.rtc) {
              if (channel && obj.channels[channel]) {
                obj.channels[channel].send(message);
                sent = true;
              } else if (obj.channels.data) {
                obj.channels.data.send(message);
                sent = true;
              } else {
                let firstchannel = Object.keys(obj.channels)[0];
                obj.channels[firstchannel].send(message);
                sent = true;
              }
            } else if (obj.server) {
              if (this.services.http) {
                this.services.http.transmit(message, channel);
                sent = true;
              }
            }
          }
        }
      }
      return sent;
    };
    this.getEndpointInfo = (path, service) => {
      if (!path)
        return void 0;
      let testpath = (path2, service2) => {
        if (this.services[service2]) {
          if (this.services[service2].rtc?.[path2]) {
            return this.services[service2].rtc[path2];
          } else if (this.services[service2].servers?.[path2]) {
            return this.services[service2].servers[path2];
          } else if (this.services[service2].sockets?.[path2]) {
            return this.services[service2].sockets[path2];
          } else if (this.services[service2].eventsources?.[path2]) {
            return this.services[service2].eventsources[path2];
          } else if (this.services[service2].workers?.[path2]) {
            return this.services[service2].workers[path2];
          }
        }
        return void 0;
      };
      if (service) {
        let found = testpath(path, service);
        if (found)
          return {
            endpoint: found,
            service
          };
      }
      for (const s in this.services) {
        let found = testpath(path, s);
        if (found)
          return {
            endpoint: found,
            service: s
          };
      }
      return void 0;
    };
    this.pipeFastest = (source, destination, origin, method, callback, services = this.services) => {
      for (const service in services) {
        if (services[service].rtc) {
          return this.pipe(source, destination, "webrtc", origin, method, callback);
        }
        if (services[service].eventsources) {
          let keys = Object.keys(services[service].eventsources);
          if (keys[0]) {
            if (this.services[service].eventsources[keys[0]].sessions)
              return this.pipe(source, destination, "sse", origin, method, callback);
          }
        }
        if (services[service].sockets) {
          return this.pipe(source, destination, "wss", origin, method, callback);
        }
        if (services[service].servers) {
          return this.pipe(source, destination, "http", origin, method, callback);
        }
        if (services[service].workers) {
          return this.pipe(source, destination, "worker", origin, method, callback);
        }
      }
      return false;
    };
    this.getFirstRemoteEndpoint = (services = this.services) => {
      let serviceInfo;
      for (const service in services) {
        if (services[service].rtc) {
          serviceInfo = services[service].rtc;
        }
        if (services[service].eventsources && !serviceInfo) {
          let keys2 = Object.keys(services[service].eventsources);
          if (keys2[0]) {
            if (this.services[service].eventsources[keys2[0]]?.sessions)
              serviceInfo = services[service].eventsources;
          }
        }
        if (services[service].sockets && !serviceInfo) {
          serviceInfo = services[service].sockets;
        }
        if (services[service].servers && !serviceInfo) {
          serviceInfo = services[service].servers;
        }
        if (services[service].workers && !serviceInfo) {
          serviceInfo = services[service].workers;
        }
      }
      let keys = Object.keys(serviceInfo);
      if (keys[0])
        return serviceInfo[keys[0]];
      return false;
    };
    this.STREAMLATEST = 0;
    this.STREAMALLLATEST = 1;
    this.streamSettings = {};
    this.streamFunctions = {
      allLatestValues: (prop, setting) => {
        let result = void 0;
        if (Array.isArray(prop)) {
          if (prop.length !== setting.lastRead) {
            result = prop.slice(setting.lastRead);
            setting.lastRead = prop.length;
          }
        } else if (typeof prop === "object") {
          result = {};
          for (const p in prop) {
            if (Array.isArray(prop[p])) {
              if (typeof setting === "number")
                setting = { [p]: { lastRead: void 0 } };
              else if (!setting[p])
                setting[p] = { lastRead: void 0 };
              if (prop[p].length !== setting[p].lastRead) {
                result[p] = prop[p].slice(setting[p].lastRead);
                setting[p].lastRead = prop[p].length;
              }
            } else {
              if (typeof setting === "number")
                setting = { [p]: { lastRead: void 0 } };
              else if (!setting[p])
                setting[p] = { lastRead: void 0 };
              if (setting[p].lastRead !== prop[p]) {
                result[p] = prop[p];
                setting[p].lastRead = prop[p];
              }
            }
          }
          if (Object.keys(result).length === 0)
            result = void 0;
        } else {
          if (setting.lastRead !== prop) {
            result = prop;
            setting.lastRead = prop;
          }
        }
        return result;
      },
      latestValue: (prop, setting) => {
        let result = void 0;
        if (Array.isArray(prop)) {
          if (prop.length !== setting.lastRead) {
            result = prop[prop.length - 1];
            setting.lastRead = prop.length;
          }
        } else if (typeof prop === "object") {
          result = {};
          for (const p in prop) {
            if (Array.isArray(prop[p])) {
              if (typeof setting === "number")
                setting = { [p]: { lastRead: void 0 } };
              else if (!setting[p])
                setting[p] = { lastRead: void 0 };
              if (prop[p].length !== setting[p].lastRead) {
                result[p] = prop[p][prop[p].length - 1];
                setting[p].lastRead = prop[p].length;
              }
            } else {
              if (typeof setting === "number")
                setting = { [p]: { lastRead: void 0 } };
              else if (!setting[p])
                setting[p] = { lastRead: void 0 };
              if (setting[p].lastRead !== prop[p]) {
                result[p] = prop[p];
                setting[p].lastRead = prop[p];
              }
            }
          }
        } else {
          if (setting.lastRead !== prop) {
            result = prop;
            setting.lastRead = prop;
          }
        }
        return result;
      }
    };
    this.setStreamFunc = (name2, key, callback = this.streamFunctions.allLatestValues) => {
      if (!this.streamSettings[name2].settings[key])
        this.streamSettings[name2].settings[key] = { lastRead: 0 };
      if (callback === this.STREAMLATEST)
        this.streamSettings[name2].settings[key].callback = this.streamFunctions.latestValue;
      else if (callback === this.STREAMALLLATEST)
        this.streamSettings[name2].settings[key].callback = this.streamFunctions.allLatestValues;
      else if (typeof callback === "string")
        this.streamSettings[name2].settings[key].callback = this.streamFunctions[callback];
      else if (typeof callback === "function")
        this.streamSettings[name2].settings[key].callback = callback;
      if (!this.streamSettings[name2].settings[key].callback)
        this.streamSettings[name2].settings[key].callback = this.streamFunctions.allLatestValues;
      return true;
    };
    this.addStreamFunc = (name2, callback = (data) => {
    }) => {
      this.streamFunctions[name2] = callback;
    };
    this.setStream = (object = {}, settings = {}, streamName = `stream${Math.floor(Math.random() * 1e10)}`) => {
      if (settings.keys) {
        if (settings.keys.length === 0) {
          let k = Object.keys(object);
          if (k.length > 0) {
            settings.keys = Array.from(k);
          }
        }
      } else {
        settings.keys = Array.from(Object.keys(object));
      }
      this.streamSettings[streamName] = {
        object,
        settings
      };
      settings.keys.forEach((prop) => {
        if (settings[prop]?.callback)
          this.setStreamFunc(streamName, prop, settings[prop].callback);
        else
          this.setStreamFunc(streamName, prop, settings.callback);
      });
      return this.streamSettings[streamName];
    };
    this.removeStream = (streamName, key) => {
      if (streamName && !key)
        delete this.streamSettings[streamName];
      else if (key && this.streamSettings[streamName]?.settings?.keys) {
        let idx = this.streamSettings[streamName].settings.keys.indexOf(key);
        if (idx > -1)
          this.streamSettings[streamName].settings.keys.splice(idx, 1);
        if (this.streamSettings[streamName].settings[key])
          delete this.streamSettings[streamName].settings[key];
        return true;
      }
      return false;
    };
    this.updateStreamData = (streamName, data = {}) => {
      if (this.streamSettings[streamName]) {
        Object.assign(this.streamSettings[streamName].object, data);
        return this.streamSettings[streamName].object;
      }
      return false;
    };
    this.streamLoop = (connections, channel) => {
      let updateObj = {};
      for (const prop in this.streamSettings) {
        this.streamSettings[prop].settings.keys.forEach((key) => {
          if (this.streamSettings[prop].settings[key]) {
            let data = this.streamSettings[prop].settings[key].callback(this.streamSettings[prop].object[key], this.streamSettings[prop].settings[key]);
            if (data !== void 0)
              updateObj[key] = data;
          }
        });
      }
      if (connections) {
        this.sendAll(updateObj, connections, channel);
      }
      return updateObj;
    };
    this.receive = (message, service, ...args) => {
      if (service)
        for (const key in this.services) {
          if (key === service || this.services[key].name === service) {
            return this.services[key].receive(message, ...args);
          }
        }
      return this.service.receive(message, ...args);
    };
    this.transmit = (message, service, ...args) => {
      if (service)
        for (const key in this.services) {
          if (key === service || this.services[key].name === service) {
            return this.services[key].transmit(message, ...args);
          }
        }
      return this.service.transmit(message, ...args);
    };
    this.defaultRoutes = {
      getEndpointInfo: this.getEndpointInfo,
      pipeOnce: this.pipeOnce,
      pipeFastest: this.pipeFastest,
      setStream: this.setStream,
      removeStream: this.removeStream,
      updateStreamData: this.updateStreamData,
      addStreamFunc: this.addStreamFunc,
      setStreamFunc: this.setStreamFunc,
      sendAll: this.sendAll,
      streamLoop: {
        operator: this.streamLoop,
        loop: 10
      }
    };
    if (options && "loadDefaultRoutes" in options) {
      this.loadDefaultRoutes = options.loadDefaultRoutes;
    }
    if (this.loadDefaultRoutes)
      this.load(this.defaultRoutes, options?.linkServices, options?.includeClassName);
    if (Array.isArray(services)) {
      services.forEach((s) => this.load(s, options?.linkServices, options?.includeClassName));
    } else if (typeof services === "object") {
      Object.keys(services).forEach((s) => this.load(services[s], options?.linkServices, options?.includeClassName));
    }
  }
};

// src/utils.ts
var join = (...paths) => {
  const split = paths.map((path) => {
    return path.split("/");
  }).flat();
  return split.reduce((a, b) => {
    if (!a)
      a = b;
    else if (!b)
      return a;
    else if (a.split("/")[0] !== b)
      a = a + "/" + b;
    return a;
  }, "");
};
var getBase = (path) => {
  return path.split("/").slice(0, -1).join("/");
};
var dynamicImport = async (url, type7) => {
  let imported;
  if (!type7) {
    imported = await import(url);
  } else {
    imported = await import(url, { assert: { type: "json" } });
  }
  if (imported.default)
    imported = imported.default;
  return imported;
};
var importFromOrigin = async (url, scriptLocation2, local = true, type7) => {
  let imported = null;
  if (local) {
    const extraPath = scriptLocation2.replace(window.origin, "").split("/");
    url = [...extraPath.map((e) => ".."), ...url.split("/")].join("/");
    imported = await dynamicImport(url, type7);
  } else
    imported = await fetch(url).then((res) => {
      if (res.ok)
        return res[type7 ?? "text"]();
      else
        return;
    });
  return imported;
};

// src/extensions/arguments.ts
var ArgumentGraphExtension = {
  type: "tree",
  condition: (treeEntry) => {
    return !(treeEntry instanceof Graph);
  },
  transform: (treeEntry, app) => {
    const operatorArgs = getFnParamInfo(treeEntry.operator);
    if (treeEntry.arguments) {
      for (let key in treeEntry.arguments) {
        operatorArgs.set(key, treeEntry.arguments[key]);
      }
    }
    if (operatorArgs.size === 0)
      operatorArgs.set("trigger", void 0);
    let entries = Array.from(operatorArgs.entries());
    const restrictedOne = ["self", "node"];
    const restrictedTwo = ["origin", "parent", "graph", "router"];
    const notRestrictedOne = entries.reduce((a, b) => a * (restrictedOne.includes(b[0]) ? 0 : 1), 1);
    const notRestrictedTwo = entries.reduce((a, b) => a * (restrictedTwo.includes(b[0]) ? 0 : 1), 1);
    if (!notRestrictedOne)
      restrictedOne.forEach((k) => operatorArgs.delete(k));
    if (!notRestrictedTwo)
      restrictedTwo.forEach((k) => operatorArgs.delete(k));
    const instanceTree = {};
    Array.from(operatorArgs.entries()).forEach(([arg], i) => {
      instanceTree[arg] = {
        tag: arg,
        operator: (input) => {
          operatorArgs.set(arg, input);
          if (i === 0) {
            const nodeToRun = app.router.routes[`${app.name}.${treeEntry.tag}`];
            return nodeToRun.run();
          }
          return input;
        }
      };
    });
    const propsCopy = Object.assign({}, treeEntry);
    propsCopy.operator = (self, origin, ...args) => {
      let updatedArgs = [];
      let i = 0;
      operatorArgs.forEach((v, k) => {
        const isSpread = k.includes("...");
        const currentArg = isSpread ? args.slice(i) : args[i];
        let update = currentArg !== void 0 ? currentArg : v;
        operatorArgs.set(k, update);
        if (!isSpread)
          update = [update];
        updatedArgs.push(...update);
        i++;
      });
      if (!notRestrictedOne && !notRestrictedTwo)
        return treeEntry.operator(self, origin, ...updatedArgs);
      else if (!notRestrictedOne)
        return treeEntry.operator(self, ...updatedArgs);
      else if (!notRestrictedTwo)
        return treeEntry.operator(origin, ...updatedArgs);
      else
        return treeEntry.operator(...updatedArgs);
    };
    let graph = new Graph(instanceTree, treeEntry.tag, propsCopy);
    return graph;
  }
};
var arguments_default = ArgumentGraphExtension;

// src/extensions/index.ts
var extensions_default = {
  arguments: arguments_default
};

// src/App.ts
var scriptLocation = new Error().stack.match(/([^ \n])*([a-z]*:\/\/\/?)*?[a-z0-9\/\\]*\.js/ig)[0];
var App = class {
  constructor(input, options = {}) {
    this.remote = false;
    this.packagePath = "/package.json";
    this.graphPath = "/.brainsatplay/index.graph.json";
    this.ok = false;
    this.parentNode = document.body;
    this.nested = {};
    this.isNested = false;
    this.checkJSONConversion = (info) => {
      if (typeof info === "string")
        return JSON.parse(info);
      else
        return info;
    };
    this.getURL = (str) => {
      try {
        return new URL(str).href;
      } catch {
        return false;
      }
    };
    this.set = (input, name2) => {
      this.name = name2 ?? "graph";
      this.package = null;
      if (input) {
        this.plugins = this.setInfo(input);
        this.ok = false;
        this.tree = null;
      } else
        console.warn("no info specified.");
    };
    this.setInfo = (info) => {
      this.info = Object.assign({}, info);
      const appMetadata = this.info[".brainsatplay"];
      for (let key in appMetadata) {
        appMetadata[key] = this.checkJSONConversion(appMetadata[key]);
      }
      const pluginsObject = {};
      for (let key in info) {
        if (key !== ".brainsatplay")
          pluginsObject[key] = info[key];
      }
      this.plugins = pluginsObject;
      return this.plugins;
    };
    this.setTree = async (graph = this.info[".brainsatplay"].graph) => {
      const tree = {};
      this.info[".brainsatplay"].graph = graph;
      const nodes = Object.entries(graph.nodes ?? {});
      await Promise.all(nodes.map(async ([tag, info]) => {
        const [cls, id] = tag.split("_");
        const clsInfo = Object.assign({}, this.plugins[cls]) ?? {};
        for (let key in clsInfo) {
          if (typeof clsInfo[key] === "object")
            clsInfo[key] = Object.assign({}, clsInfo[key]);
        }
        if (clsInfo[".brainsatplay"]) {
          const app = this.nested[tag] = new App(clsInfo, {
            name: tag,
            router: this.router,
            debug: this.debug
          });
          app.setParent(this.parentNode);
          await app.start();
          this.router.load(app.graph, false, true);
          if (app.info[".brainsatplay"].graph.ports) {
            let input = app.info[".brainsatplay"].graph.ports.input;
            let output = app.info[".brainsatplay"].graph.ports.output;
            if (typeof input === "string")
              input = { [input]: input };
            if (typeof output === "string")
              output = { [output]: output };
            app.graph.operator = async (...args) => {
              for (let key in output) {
                return new Promise(async (resolve) => {
                  const sub = app.graph.subscribe(output[key], (res) => {
                    resolve(res);
                  });
                  await Promise.all(Object.values(input).map(async (n) => {
                    await app.graph.run(n, ...args);
                  }));
                  app.graph.unsubscribe(output[key], sub);
                });
              }
            };
          }
          tree[tag] = app.graph;
        } else {
          clsInfo.tag = tag;
          const properties = Object.assign(clsInfo, info);
          const instance = extensions_default.arguments.transform(properties, this);
          tree[tag] = instance;
        }
      }));
      if (graph.edges) {
        for (let outputInfo in graph.edges) {
          const edges = graph.edges[outputInfo];
          for (let inputInfo in edges) {
            let outputPortPath = outputInfo.split(".");
            let inputPortPath = inputInfo.split(".");
            const input = inputPortPath.slice(-1)[0];
            let ref = tree;
            outputPortPath.forEach((str) => {
              const newRef = ref[str] || (ref.nodes?.get ? ref.nodes.get(str) : void 0);
              if (newRef)
                ref = newRef;
            });
            if (!("children" in ref))
              ref.children = {};
            if (ref.addChildren instanceof Function)
              ref.addChildren({ [input]: true });
            else
              ref.children[input] = true;
          }
          ;
        }
      }
      this.tree = tree;
      this.ok = true;
      return this.tree;
    };
    this.join = join;
    this.getBase = getBase;
    this.json = async (src) => {
      return this.checkJSONConversion(await importFromOrigin(src, scriptLocation, !this.remote, "json"));
    };
    this.setPackage = (pkg) => {
      this.package = pkg;
    };
    this.init = async (input) => {
      if (input)
        this.set(input);
      if (!this.compile) {
        if (!this.info)
          return false;
        else if (!this.info[".brainsatplay"])
          return false;
      }
      if (this.compile instanceof Function) {
        if (!this.info)
          this.info = {
            ".brainsatplay": {}
          };
        await this.compile();
        return;
      } else {
        if (!this.package) {
          const pkg = this.info[".brainsatplay"].package;
          if (pkg)
            this.setPackage(pkg);
          else
            console.error("No package.json has been included...");
        }
        this.tree = await this.setTree();
      }
    };
    this.setParent = (parentNode) => {
      if (parentNode instanceof HTMLElement) {
        this.parentNode = parentNode;
      } else
        console.warn("Input is not a valid HTML element", parentNode);
    };
    this.start = async (input) => {
      this.stop();
      await this.init(input);
      if (this.ok) {
        this.graph = new DOMService({
          name: this.name,
          routes: this.tree
        }, this.parentNode);
        if (!this.isNested) {
          this.router.load(this.graph, false, true);
          this.graph.nodes.forEach((node) => {
            if (node instanceof GraphNode) {
              if (node.loop) {
                node.loop = parseFloat(node.loop);
                node.run();
              }
            } else
              console.warn(`${node.tag ?? node.name} not recognized`);
          });
          if (this.onstart instanceof Function)
            this.onstart();
        }
      }
      return this.ok;
    };
    this.stop = () => {
      if (this.onstop instanceof Function)
        this.onstop();
      for (let k in this.nested)
        this.nested[k].stop();
      if (this.graph)
        this.graph.nodes.forEach((n) => {
          this.graph.removeTree(n);
          n.stopNode();
          n.unsubscribe();
        });
      this.graph = null;
      this.nested = {};
    };
    this.onstart = () => {
    };
    this.onstop = () => {
    };
    this.debug = options.debug;
    if (options.router) {
      this.router = options.router;
      this.isNested = true;
    } else
      this.router = new Router();
    this.set(input, options.name);
    this.graph = null;
    this.animated = {};
  }
};

// src/editable/index.ts
var editable_exports = {};
__export(editable_exports, {
  App: () => EditableApp
});

// node_modules/freerange/dist/index.esm.js
var __defProp2 = Object.defineProperty;
var __export2 = (target, all) => {
  for (var name2 in all)
    __defProp2(target, name2, { get: all[name2], enumerable: true });
};
var zipped = (suffix2, mimeType, codecs) => mimeType && mimeType === codecs.getType("gz") || suffix2.includes("gz");
var fullSuffix = (fileName = "") => fileName.split(".").slice(1);
var suffix = (fileName = "") => {
  const suffix2 = fullSuffix(fileName);
  const isZip = zipped(suffix2);
  if (isZip)
    suffix2.pop();
  return suffix2.join(".");
};
var name = (path) => path ? path.split("/").slice(-1)[0] : void 0;
var directory = (path) => path ? path.split("/").slice(0, -1).join("/") : void 0;
var esm = (suffix2, type7) => {
  if (suffix2.slice(-2) === "js")
    return true;
  else if (type7 && type7.includes("javascript"))
    return true;
  else
    return false;
};
var get = (type7, name2, codecs) => {
  let mimeType = type7;
  const isZipped = zipped(fullSuffix(name2), mimeType, codecs);
  const sfx = suffix(name2);
  if (isZipped || !mimeType || mimeType === "text/plain")
    mimeType = codecs.getType(sfx);
  if (esm(sfx, mimeType))
    mimeType = codecs.getType("js");
  return { mimeType, zipped: isZipped, suffix: sfx };
};
var gzip_exports = {};
__export2(gzip_exports, {
  decode: () => decode,
  encode: () => encode,
  suffixes: () => suffixes,
  type: () => type
});
var Z_FIXED$1 = 4;
var Z_BINARY = 0;
var Z_TEXT = 1;
var Z_UNKNOWN$1 = 2;
function zero$1(buf) {
  let len = buf.length;
  while (--len >= 0) {
    buf[len] = 0;
  }
}
var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES = 2;
var MIN_MATCH$1 = 3;
var MAX_MATCH$1 = 258;
var LENGTH_CODES$1 = 29;
var LITERALS$1 = 256;
var L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
var D_CODES$1 = 30;
var BL_CODES$1 = 19;
var HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
var MAX_BITS$1 = 15;
var Buf_size = 16;
var MAX_BL_BITS = 7;
var END_BLOCK = 256;
var REP_3_6 = 16;
var REPZ_3_10 = 17;
var REPZ_11_138 = 18;
var extra_lbits = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]);
var extra_dbits = new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]);
var extra_blbits = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]);
var bl_order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var DIST_CODE_LEN = 512;
var static_ltree = new Array((L_CODES$1 + 2) * 2);
zero$1(static_ltree);
var static_dtree = new Array(D_CODES$1 * 2);
zero$1(static_dtree);
var _dist_code = new Array(DIST_CODE_LEN);
zero$1(_dist_code);
var _length_code = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
zero$1(_length_code);
var base_length = new Array(LENGTH_CODES$1);
zero$1(base_length);
var base_dist = new Array(D_CODES$1);
zero$1(base_dist);
function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
  this.static_tree = static_tree;
  this.extra_bits = extra_bits;
  this.extra_base = extra_base;
  this.elems = elems;
  this.max_length = max_length;
  this.has_stree = static_tree && static_tree.length;
}
var static_l_desc;
var static_d_desc;
var static_bl_desc;
function TreeDesc(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;
  this.max_code = 0;
  this.stat_desc = stat_desc;
}
var d_code = (dist) => {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
};
var put_short = (s, w) => {
  s.pending_buf[s.pending++] = w & 255;
  s.pending_buf[s.pending++] = w >>> 8 & 255;
};
var send_bits = (s, value, length) => {
  if (s.bi_valid > Buf_size - length) {
    s.bi_buf |= value << s.bi_valid & 65535;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> Buf_size - s.bi_valid;
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= value << s.bi_valid & 65535;
    s.bi_valid += length;
  }
};
var send_code = (s, c, tree) => {
  send_bits(s, tree[c * 2], tree[c * 2 + 1]);
};
var bi_reverse = (code, len) => {
  let res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
};
var bi_flush = (s) => {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;
  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 255;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
};
var gen_bitlen = (s, desc) => {
  const tree = desc.dyn_tree;
  const max_code = desc.max_code;
  const stree = desc.stat_desc.static_tree;
  const has_stree = desc.stat_desc.has_stree;
  const extra = desc.stat_desc.extra_bits;
  const base2 = desc.stat_desc.extra_base;
  const max_length = desc.stat_desc.max_length;
  let h;
  let n, m;
  let bits;
  let xbits;
  let f;
  let overflow = 0;
  for (bits = 0; bits <= MAX_BITS$1; bits++) {
    s.bl_count[bits] = 0;
  }
  tree[s.heap[s.heap_max] * 2 + 1] = 0;
  for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
    n = s.heap[h];
    bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n * 2 + 1] = bits;
    if (n > max_code) {
      continue;
    }
    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base2) {
      xbits = extra[n - base2];
    }
    f = tree[n * 2];
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n * 2 + 1] + xbits);
    }
  }
  if (overflow === 0) {
    return;
  }
  do {
    bits = max_length - 1;
    while (s.bl_count[bits] === 0) {
      bits--;
    }
    s.bl_count[bits]--;
    s.bl_count[bits + 1] += 2;
    s.bl_count[max_length]--;
    overflow -= 2;
  } while (overflow > 0);
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) {
        continue;
      }
      if (tree[m * 2 + 1] !== bits) {
        s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
        tree[m * 2 + 1] = bits;
      }
      n--;
    }
  }
};
var gen_codes = (tree, max_code, bl_count) => {
  const next_code = new Array(MAX_BITS$1 + 1);
  let code = 0;
  let bits;
  let n;
  for (bits = 1; bits <= MAX_BITS$1; bits++) {
    next_code[bits] = code = code + bl_count[bits - 1] << 1;
  }
  for (n = 0; n <= max_code; n++) {
    let len = tree[n * 2 + 1];
    if (len === 0) {
      continue;
    }
    tree[n * 2] = bi_reverse(next_code[len]++, len);
  }
};
var tr_static_init = () => {
  let n;
  let bits;
  let length;
  let code;
  let dist;
  const bl_count = new Array(MAX_BITS$1 + 1);
  length = 0;
  for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
    base_length[code] = length;
    for (n = 0; n < 1 << extra_lbits[code]; n++) {
      _length_code[length++] = code;
    }
  }
  _length_code[length - 1] = code;
  dist = 0;
  for (code = 0; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < 1 << extra_dbits[code]; n++) {
      _dist_code[dist++] = code;
    }
  }
  dist >>= 7;
  for (; code < D_CODES$1; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  for (bits = 0; bits <= MAX_BITS$1; bits++) {
    bl_count[bits] = 0;
  }
  n = 0;
  while (n <= 143) {
    static_ltree[n * 2 + 1] = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n * 2 + 1] = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n * 2 + 1] = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n * 2 + 1] = 8;
    n++;
    bl_count[8]++;
  }
  gen_codes(static_ltree, L_CODES$1 + 1, bl_count);
  for (n = 0; n < D_CODES$1; n++) {
    static_dtree[n * 2 + 1] = 5;
    static_dtree[n * 2] = bi_reverse(n, 5);
  }
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES$1, MAX_BITS$1);
  static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES$1, MAX_BL_BITS);
};
var init_block = (s) => {
  let n;
  for (n = 0; n < L_CODES$1; n++) {
    s.dyn_ltree[n * 2] = 0;
  }
  for (n = 0; n < D_CODES$1; n++) {
    s.dyn_dtree[n * 2] = 0;
  }
  for (n = 0; n < BL_CODES$1; n++) {
    s.bl_tree[n * 2] = 0;
  }
  s.dyn_ltree[END_BLOCK * 2] = 1;
  s.opt_len = s.static_len = 0;
  s.last_lit = s.matches = 0;
};
var bi_windup = (s) => {
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
};
var copy_block = (s, buf, len, header) => {
  bi_windup(s);
  if (header) {
    put_short(s, len);
    put_short(s, ~len);
  }
  s.pending_buf.set(s.window.subarray(buf, buf + len), s.pending);
  s.pending += len;
};
var smaller = (tree, n, m, depth) => {
  const _n2 = n * 2;
  const _m2 = m * 2;
  return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
};
var pqdownheap = (s, tree, k) => {
  const v = s.heap[k];
  let j = k << 1;
  while (j <= s.heap_len) {
    if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
      j++;
    }
    if (smaller(tree, v, s.heap[j], s.depth)) {
      break;
    }
    s.heap[k] = s.heap[j];
    k = j;
    j <<= 1;
  }
  s.heap[k] = v;
};
var compress_block = (s, ltree, dtree) => {
  let dist;
  let lc;
  let lx = 0;
  let code;
  let extra;
  if (s.last_lit !== 0) {
    do {
      dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
      lc = s.pending_buf[s.l_buf + lx];
      lx++;
      if (dist === 0) {
        send_code(s, lc, ltree);
      } else {
        code = _length_code[lc];
        send_code(s, code + LITERALS$1 + 1, ltree);
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);
        }
        dist--;
        code = d_code(dist);
        send_code(s, code, dtree);
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);
        }
      }
    } while (lx < s.last_lit);
  }
  send_code(s, END_BLOCK, ltree);
};
var build_tree = (s, desc) => {
  const tree = desc.dyn_tree;
  const stree = desc.stat_desc.static_tree;
  const has_stree = desc.stat_desc.has_stree;
  const elems = desc.stat_desc.elems;
  let n, m;
  let max_code = -1;
  let node;
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE$1;
  for (n = 0; n < elems; n++) {
    if (tree[n * 2] !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;
    } else {
      tree[n * 2 + 1] = 0;
    }
  }
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
    tree[node * 2] = 1;
    s.depth[node] = 0;
    s.opt_len--;
    if (has_stree) {
      s.static_len -= stree[node * 2 + 1];
    }
  }
  desc.max_code = max_code;
  for (n = s.heap_len >> 1; n >= 1; n--) {
    pqdownheap(s, tree, n);
  }
  node = elems;
  do {
    n = s.heap[1];
    s.heap[1] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1);
    m = s.heap[1];
    s.heap[--s.heap_max] = n;
    s.heap[--s.heap_max] = m;
    tree[node * 2] = tree[n * 2] + tree[m * 2];
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n * 2 + 1] = tree[m * 2 + 1] = node;
    s.heap[1] = node++;
    pqdownheap(s, tree, 1);
  } while (s.heap_len >= 2);
  s.heap[--s.heap_max] = s.heap[1];
  gen_bitlen(s, desc);
  gen_codes(tree, max_code, s.bl_count);
};
var scan_tree = (s, tree, max_code) => {
  let n;
  let prevlen = -1;
  let curlen;
  let nextlen = tree[0 * 2 + 1];
  let count = 0;
  let max_count = 7;
  let min_count = 4;
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code + 1) * 2 + 1] = 65535;
  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1];
    if (++count < max_count && curlen === nextlen) {
      continue;
    } else if (count < min_count) {
      s.bl_tree[curlen * 2] += count;
    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        s.bl_tree[curlen * 2]++;
      }
      s.bl_tree[REP_3_6 * 2]++;
    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10 * 2]++;
    } else {
      s.bl_tree[REPZ_11_138 * 2]++;
    }
    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
};
var send_tree = (s, tree, max_code) => {
  let n;
  let prevlen = -1;
  let curlen;
  let nextlen = tree[0 * 2 + 1];
  let count = 0;
  let max_count = 7;
  let min_count = 4;
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1];
    if (++count < max_count && curlen === nextlen) {
      continue;
    } else if (count < min_count) {
      do {
        send_code(s, curlen, s.bl_tree);
      } while (--count !== 0);
    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count - 3, 2);
    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count - 3, 3);
    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count - 11, 7);
    }
    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
};
var build_bl_tree = (s) => {
  let max_blindex;
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
  build_tree(s, s.bl_desc);
  for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
      break;
    }
  }
  s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
  return max_blindex;
};
var send_all_trees = (s, lcodes, dcodes, blcodes) => {
  let rank2;
  send_bits(s, lcodes - 257, 5);
  send_bits(s, dcodes - 1, 5);
  send_bits(s, blcodes - 4, 4);
  for (rank2 = 0; rank2 < blcodes; rank2++) {
    send_bits(s, s.bl_tree[bl_order[rank2] * 2 + 1], 3);
  }
  send_tree(s, s.dyn_ltree, lcodes - 1);
  send_tree(s, s.dyn_dtree, dcodes - 1);
};
var detect_data_type = (s) => {
  let black_mask = 4093624447;
  let n;
  for (n = 0; n <= 31; n++, black_mask >>>= 1) {
    if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
      return Z_BINARY;
    }
  }
  if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS$1; n++) {
    if (s.dyn_ltree[n * 2] !== 0) {
      return Z_TEXT;
    }
  }
  return Z_BINARY;
};
var static_init_done = false;
var _tr_init$1 = (s) => {
  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }
  s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
  s.bi_buf = 0;
  s.bi_valid = 0;
  init_block(s);
};
var _tr_stored_block$1 = (s, buf, stored_len, last) => {
  send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
  copy_block(s, buf, stored_len, true);
};
var _tr_align$1 = (s) => {
  send_bits(s, STATIC_TREES << 1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
};
var _tr_flush_block$1 = (s, buf, stored_len, last) => {
  let opt_lenb, static_lenb;
  let max_blindex = 0;
  if (s.level > 0) {
    if (s.strm.data_type === Z_UNKNOWN$1) {
      s.strm.data_type = detect_data_type(s);
    }
    build_tree(s, s.l_desc);
    build_tree(s, s.d_desc);
    max_blindex = build_bl_tree(s);
    opt_lenb = s.opt_len + 3 + 7 >>> 3;
    static_lenb = s.static_len + 3 + 7 >>> 3;
    if (static_lenb <= opt_lenb) {
      opt_lenb = static_lenb;
    }
  } else {
    opt_lenb = static_lenb = stored_len + 5;
  }
  if (stored_len + 4 <= opt_lenb && buf !== -1) {
    _tr_stored_block$1(s, buf, stored_len, last);
  } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {
    send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);
  } else {
    send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  init_block(s);
  if (last) {
    bi_windup(s);
  }
};
var _tr_tally$1 = (s, dist, lc) => {
  s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
  s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
  s.last_lit++;
  if (dist === 0) {
    s.dyn_ltree[lc * 2]++;
  } else {
    s.matches++;
    dist--;
    s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2]++;
    s.dyn_dtree[d_code(dist) * 2]++;
  }
  return s.last_lit === s.lit_bufsize - 1;
};
var _tr_init_1 = _tr_init$1;
var _tr_stored_block_1 = _tr_stored_block$1;
var _tr_flush_block_1 = _tr_flush_block$1;
var _tr_tally_1 = _tr_tally$1;
var _tr_align_1 = _tr_align$1;
var trees = {
  _tr_init: _tr_init_1,
  _tr_stored_block: _tr_stored_block_1,
  _tr_flush_block: _tr_flush_block_1,
  _tr_tally: _tr_tally_1,
  _tr_align: _tr_align_1
};
var adler32 = (adler, buf, len, pos) => {
  let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
  while (len !== 0) {
    n = len > 2e3 ? 2e3 : len;
    len -= n;
    do {
      s1 = s1 + buf[pos++] | 0;
      s2 = s2 + s1 | 0;
    } while (--n);
    s1 %= 65521;
    s2 %= 65521;
  }
  return s1 | s2 << 16 | 0;
};
var adler32_1 = adler32;
var makeTable = () => {
  let c, table = [];
  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    }
    table[n] = c;
  }
  return table;
};
var crcTable = new Uint32Array(makeTable());
var crc32 = (crc, buf, len, pos) => {
  const t = crcTable;
  const end = pos + len;
  crc ^= -1;
  for (let i = pos; i < end; i++) {
    crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
  }
  return crc ^ -1;
};
var crc32_1 = crc32;
var messages = {
  2: "need dictionary",
  1: "stream end",
  0: "",
  "-1": "file error",
  "-2": "stream error",
  "-3": "data error",
  "-4": "insufficient memory",
  "-5": "buffer error",
  "-6": "incompatible version"
};
var constants$2 = {
  Z_NO_FLUSH: 0,
  Z_PARTIAL_FLUSH: 1,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_TREES: 6,
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_ERRNO: -1,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
  Z_BINARY: 0,
  Z_TEXT: 1,
  Z_UNKNOWN: 2,
  Z_DEFLATED: 8
};
var { _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align } = trees;
var {
  Z_NO_FLUSH: Z_NO_FLUSH$2,
  Z_PARTIAL_FLUSH,
  Z_FULL_FLUSH: Z_FULL_FLUSH$1,
  Z_FINISH: Z_FINISH$3,
  Z_BLOCK: Z_BLOCK$1,
  Z_OK: Z_OK$3,
  Z_STREAM_END: Z_STREAM_END$3,
  Z_STREAM_ERROR: Z_STREAM_ERROR$2,
  Z_DATA_ERROR: Z_DATA_ERROR$2,
  Z_BUF_ERROR: Z_BUF_ERROR$1,
  Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
  Z_FILTERED,
  Z_HUFFMAN_ONLY,
  Z_RLE,
  Z_FIXED,
  Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY$1,
  Z_UNKNOWN,
  Z_DEFLATED: Z_DEFLATED$2
} = constants$2;
var MAX_MEM_LEVEL = 9;
var MAX_WBITS$1 = 15;
var DEF_MEM_LEVEL = 8;
var LENGTH_CODES = 29;
var LITERALS = 256;
var L_CODES = LITERALS + 1 + LENGTH_CODES;
var D_CODES = 30;
var BL_CODES = 19;
var HEAP_SIZE = 2 * L_CODES + 1;
var MAX_BITS = 15;
var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
var PRESET_DICT = 32;
var INIT_STATE = 42;
var EXTRA_STATE = 69;
var NAME_STATE = 73;
var COMMENT_STATE = 91;
var HCRC_STATE = 103;
var BUSY_STATE = 113;
var FINISH_STATE = 666;
var BS_NEED_MORE = 1;
var BS_BLOCK_DONE = 2;
var BS_FINISH_STARTED = 3;
var BS_FINISH_DONE = 4;
var OS_CODE = 3;
var err = (strm, errorCode) => {
  strm.msg = messages[errorCode];
  return errorCode;
};
var rank = (f) => {
  return (f << 1) - (f > 4 ? 9 : 0);
};
var zero = (buf) => {
  let len = buf.length;
  while (--len >= 0) {
    buf[len] = 0;
  }
};
var HASH_ZLIB = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
var HASH = HASH_ZLIB;
var flush_pending = (strm) => {
  const s = strm.state;
  let len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) {
    return;
  }
  strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
};
var flush_block_only = (s, last) => {
  _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
};
var put_byte = (s, b) => {
  s.pending_buf[s.pending++] = b;
};
var putShortMSB = (s, b) => {
  s.pending_buf[s.pending++] = b >>> 8 & 255;
  s.pending_buf[s.pending++] = b & 255;
};
var read_buf = (strm, buf, start, size) => {
  let len = strm.avail_in;
  if (len > size) {
    len = size;
  }
  if (len === 0) {
    return 0;
  }
  strm.avail_in -= len;
  buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32_1(strm.adler, buf, len, start);
  } else if (strm.state.wrap === 2) {
    strm.adler = crc32_1(strm.adler, buf, len, start);
  }
  strm.next_in += len;
  strm.total_in += len;
  return len;
};
var longest_match = (s, cur_match) => {
  let chain_length = s.max_chain_length;
  let scan = s.strstart;
  let match;
  let len;
  let best_len = s.prev_length;
  let nice_match = s.nice_match;
  const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
  const _win = s.window;
  const wmask = s.w_mask;
  const prev = s.prev;
  const strend = s.strstart + MAX_MATCH;
  let scan_end1 = _win[scan + best_len - 1];
  let scan_end = _win[scan + best_len];
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  if (nice_match > s.lookahead) {
    nice_match = s.lookahead;
  }
  do {
    match = cur_match;
    if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
      continue;
    }
    scan += 2;
    match++;
    do {
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;
    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1 = _win[scan + best_len - 1];
      scan_end = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
};
var fill_window = (s) => {
  const _w_size = s.w_size;
  let p, n, m, more, str;
  do {
    more = s.window_size - s.lookahead - s.strstart;
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
      s.window.set(s.window.subarray(_w_size, _w_size + _w_size), 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      s.block_start -= _w_size;
      n = s.hash_size;
      p = n;
      do {
        m = s.head[--p];
        s.head[p] = m >= _w_size ? m - _w_size : 0;
      } while (--n);
      n = _w_size;
      p = n;
      do {
        m = s.prev[--p];
        s.prev[p] = m >= _w_size ? m - _w_size : 0;
      } while (--n);
      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];
      s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
      while (s.insert) {
        s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
};
var deflate_stored = (s, flush) => {
  let max_block_size = 65535;
  if (max_block_size > s.pending_buf_size - 5) {
    max_block_size = s.pending_buf_size - 5;
  }
  for (; ; ) {
    if (s.lookahead <= 1) {
      fill_window(s);
      if (s.lookahead === 0 && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    s.strstart += s.lookahead;
    s.lookahead = 0;
    const max_start = s.block_start + max_block_size;
    if (s.strstart === 0 || s.strstart >= max_start) {
      s.lookahead = s.strstart - max_start;
      s.strstart = max_start;
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.strstart > s.block_start) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_NEED_MORE;
};
var deflate_fast = (s, flush) => {
  let hash_head;
  let bflush;
  for (; ; ) {
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    hash_head = 0;
    if (s.lookahead >= MIN_MATCH) {
      s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
    }
    if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
      s.match_length = longest_match(s, hash_head);
    }
    if (s.match_length >= MIN_MATCH) {
      bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
      s.lookahead -= s.match_length;
      if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
        s.match_length--;
        do {
          s.strstart++;
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        } while (--s.match_length !== 0);
        s.strstart++;
      } else {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
      }
    } else {
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
var deflate_slow = (s, flush) => {
  let hash_head;
  let bflush;
  let max_insert;
  for (; ; ) {
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    hash_head = 0;
    if (s.lookahead >= MIN_MATCH) {
      s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
    }
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH - 1;
    if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
      s.match_length = longest_match(s, hash_head);
      if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
        s.match_length = MIN_MATCH - 1;
      }
    }
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
      s.lookahead -= s.prev_length - 1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH - 1;
      s.strstart++;
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    } else if (s.match_available) {
      bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
      if (bflush) {
        flush_block_only(s, false);
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  if (s.match_available) {
    bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
var deflate_rle = (s, flush) => {
  let bflush;
  let prev;
  let scan, strend;
  const _win = s.window;
  for (; ; ) {
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
        } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
    }
    if (s.match_length >= MIN_MATCH) {
      bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
var deflate_huff = (s, flush) => {
  let bflush;
  for (; ; ) {
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        break;
      }
    }
    s.match_length = 0;
    bflush = _tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
function Config(good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
}
var configuration_table = [
  new Config(0, 0, 0, 0, deflate_stored),
  new Config(4, 4, 8, 4, deflate_fast),
  new Config(4, 5, 16, 8, deflate_fast),
  new Config(4, 6, 32, 32, deflate_fast),
  new Config(4, 4, 16, 16, deflate_slow),
  new Config(8, 16, 32, 32, deflate_slow),
  new Config(8, 16, 128, 128, deflate_slow),
  new Config(8, 32, 128, 256, deflate_slow),
  new Config(32, 128, 258, 1024, deflate_slow),
  new Config(32, 258, 258, 4096, deflate_slow)
];
var lm_init = (s) => {
  s.window_size = 2 * s.w_size;
  zero(s.head);
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;
  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
};
function DeflateState() {
  this.strm = null;
  this.status = 0;
  this.pending_buf = null;
  this.pending_buf_size = 0;
  this.pending_out = 0;
  this.pending = 0;
  this.wrap = 0;
  this.gzhead = null;
  this.gzindex = 0;
  this.method = Z_DEFLATED$2;
  this.last_flush = -1;
  this.w_size = 0;
  this.w_bits = 0;
  this.w_mask = 0;
  this.window = null;
  this.window_size = 0;
  this.prev = null;
  this.head = null;
  this.ins_h = 0;
  this.hash_size = 0;
  this.hash_bits = 0;
  this.hash_mask = 0;
  this.hash_shift = 0;
  this.block_start = 0;
  this.match_length = 0;
  this.prev_match = 0;
  this.match_available = 0;
  this.strstart = 0;
  this.match_start = 0;
  this.lookahead = 0;
  this.prev_length = 0;
  this.max_chain_length = 0;
  this.max_lazy_match = 0;
  this.level = 0;
  this.strategy = 0;
  this.good_match = 0;
  this.nice_match = 0;
  this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
  this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
  this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);
  this.l_desc = null;
  this.d_desc = null;
  this.bl_desc = null;
  this.bl_count = new Uint16Array(MAX_BITS + 1);
  this.heap = new Uint16Array(2 * L_CODES + 1);
  zero(this.heap);
  this.heap_len = 0;
  this.heap_max = 0;
  this.depth = new Uint16Array(2 * L_CODES + 1);
  zero(this.depth);
  this.l_buf = 0;
  this.lit_bufsize = 0;
  this.last_lit = 0;
  this.d_buf = 0;
  this.opt_len = 0;
  this.static_len = 0;
  this.matches = 0;
  this.insert = 0;
  this.bi_buf = 0;
  this.bi_valid = 0;
}
var deflateResetKeep = (strm) => {
  if (!strm || !strm.state) {
    return err(strm, Z_STREAM_ERROR$2);
  }
  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;
  const s = strm.state;
  s.pending = 0;
  s.pending_out = 0;
  if (s.wrap < 0) {
    s.wrap = -s.wrap;
  }
  s.status = s.wrap ? INIT_STATE : BUSY_STATE;
  strm.adler = s.wrap === 2 ? 0 : 1;
  s.last_flush = Z_NO_FLUSH$2;
  _tr_init(s);
  return Z_OK$3;
};
var deflateReset = (strm) => {
  const ret = deflateResetKeep(strm);
  if (ret === Z_OK$3) {
    lm_init(strm.state);
  }
  return ret;
};
var deflateSetHeader = (strm, head) => {
  if (!strm || !strm.state) {
    return Z_STREAM_ERROR$2;
  }
  if (strm.state.wrap !== 2) {
    return Z_STREAM_ERROR$2;
  }
  strm.state.gzhead = head;
  return Z_OK$3;
};
var deflateInit2 = (strm, level, method, windowBits, memLevel, strategy) => {
  if (!strm) {
    return Z_STREAM_ERROR$2;
  }
  let wrap = 1;
  if (level === Z_DEFAULT_COMPRESSION$1) {
    level = 6;
  }
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  } else if (windowBits > 15) {
    wrap = 2;
    windowBits -= 16;
  }
  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) {
    return err(strm, Z_STREAM_ERROR$2);
  }
  if (windowBits === 8) {
    windowBits = 9;
  }
  const s = new DeflateState();
  strm.state = s;
  s.strm = strm;
  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;
  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
  s.window = new Uint8Array(s.w_size * 2);
  s.head = new Uint16Array(s.hash_size);
  s.prev = new Uint16Array(s.w_size);
  s.lit_bufsize = 1 << memLevel + 6;
  s.pending_buf_size = s.lit_bufsize * 4;
  s.pending_buf = new Uint8Array(s.pending_buf_size);
  s.d_buf = 1 * s.lit_bufsize;
  s.l_buf = (1 + 2) * s.lit_bufsize;
  s.level = level;
  s.strategy = strategy;
  s.method = method;
  return deflateReset(strm);
};
var deflateInit = (strm, level) => {
  return deflateInit2(strm, level, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
};
var deflate$2 = (strm, flush) => {
  let beg, val;
  if (!strm || !strm.state || flush > Z_BLOCK$1 || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
  }
  const s = strm.state;
  if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH$3) {
    return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR$1 : Z_STREAM_ERROR$2);
  }
  s.strm = strm;
  const old_flush = s.last_flush;
  s.last_flush = flush;
  if (s.status === INIT_STATE) {
    if (s.wrap === 2) {
      strm.adler = 0;
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) {
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
      } else {
        put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16));
        put_byte(s, s.gzhead.time & 255);
        put_byte(s, s.gzhead.time >> 8 & 255);
        put_byte(s, s.gzhead.time >> 16 & 255);
        put_byte(s, s.gzhead.time >> 24 & 255);
        put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
        put_byte(s, s.gzhead.os & 255);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 255);
          put_byte(s, s.gzhead.extra.length >> 8 & 255);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    } else {
      let header = Z_DEFLATED$2 + (s.w_bits - 8 << 4) << 8;
      let level_flags = -1;
      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= level_flags << 6;
      if (s.strstart !== 0) {
        header |= PRESET_DICT;
      }
      header += 31 - header % 31;
      s.status = BUSY_STATE;
      putShortMSB(s, header);
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 65535);
      }
      strm.adler = 1;
    }
  }
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra) {
      beg = s.pending;
      while (s.gzindex < (s.gzhead.extra.length & 65535)) {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            break;
          }
        }
        put_byte(s, s.gzhead.extra[s.gzindex] & 255);
        s.gzindex++;
      }
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (s.gzindex === s.gzhead.extra.length) {
        s.gzindex = 0;
        s.status = NAME_STATE;
      }
    } else {
      s.status = NAME_STATE;
    }
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name) {
      beg = s.pending;
      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.gzindex = 0;
        s.status = COMMENT_STATE;
      }
    } else {
      s.status = COMMENT_STATE;
    }
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment) {
      beg = s.pending;
      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.status = HCRC_STATE;
      }
    } else {
      s.status = HCRC_STATE;
    }
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
      }
      if (s.pending + 2 <= s.pending_buf_size) {
        put_byte(s, strm.adler & 255);
        put_byte(s, strm.adler >> 8 & 255);
        strm.adler = 0;
        s.status = BUSY_STATE;
      }
    } else {
      s.status = BUSY_STATE;
    }
  }
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      s.last_flush = -1;
      return Z_OK$3;
    }
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH$3) {
    return err(strm, Z_BUF_ERROR$1);
  }
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR$1);
  }
  if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH$2 && s.status !== FINISH_STATE) {
    let bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
      }
      return Z_OK$3;
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        _tr_align(s);
      } else if (flush !== Z_BLOCK$1) {
        _tr_stored_block(s, 0, 0, false);
        if (flush === Z_FULL_FLUSH$1) {
          zero(s.head);
          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    }
  }
  if (flush !== Z_FINISH$3) {
    return Z_OK$3;
  }
  if (s.wrap <= 0) {
    return Z_STREAM_END$3;
  }
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 255);
    put_byte(s, strm.adler >> 8 & 255);
    put_byte(s, strm.adler >> 16 & 255);
    put_byte(s, strm.adler >> 24 & 255);
    put_byte(s, strm.total_in & 255);
    put_byte(s, strm.total_in >> 8 & 255);
    put_byte(s, strm.total_in >> 16 & 255);
    put_byte(s, strm.total_in >> 24 & 255);
  } else {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 65535);
  }
  flush_pending(strm);
  if (s.wrap > 0) {
    s.wrap = -s.wrap;
  }
  return s.pending !== 0 ? Z_OK$3 : Z_STREAM_END$3;
};
var deflateEnd = (strm) => {
  if (!strm || !strm.state) {
    return Z_STREAM_ERROR$2;
  }
  const status = strm.state.status;
  if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
    return err(strm, Z_STREAM_ERROR$2);
  }
  strm.state = null;
  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$2) : Z_OK$3;
};
var deflateSetDictionary = (strm, dictionary) => {
  let dictLength = dictionary.length;
  if (!strm || !strm.state) {
    return Z_STREAM_ERROR$2;
  }
  const s = strm.state;
  const wrap = s.wrap;
  if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
    return Z_STREAM_ERROR$2;
  }
  if (wrap === 1) {
    strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
  }
  s.wrap = 0;
  if (dictLength >= s.w_size) {
    if (wrap === 0) {
      zero(s.head);
      s.strstart = 0;
      s.block_start = 0;
      s.insert = 0;
    }
    let tmpDict = new Uint8Array(s.w_size);
    tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
    dictionary = tmpDict;
    dictLength = s.w_size;
  }
  const avail = strm.avail_in;
  const next = strm.next_in;
  const input = strm.input;
  strm.avail_in = dictLength;
  strm.next_in = 0;
  strm.input = dictionary;
  fill_window(s);
  while (s.lookahead >= MIN_MATCH) {
    let str = s.strstart;
    let n = s.lookahead - (MIN_MATCH - 1);
    do {
      s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
      s.prev[str & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = str;
      str++;
    } while (--n);
    s.strstart = str;
    s.lookahead = MIN_MATCH - 1;
    fill_window(s);
  }
  s.strstart += s.lookahead;
  s.block_start = s.strstart;
  s.insert = s.lookahead;
  s.lookahead = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  strm.next_in = next;
  strm.input = input;
  strm.avail_in = avail;
  s.wrap = wrap;
  return Z_OK$3;
};
var deflateInit_1 = deflateInit;
var deflateInit2_1 = deflateInit2;
var deflateReset_1 = deflateReset;
var deflateResetKeep_1 = deflateResetKeep;
var deflateSetHeader_1 = deflateSetHeader;
var deflate_2$1 = deflate$2;
var deflateEnd_1 = deflateEnd;
var deflateSetDictionary_1 = deflateSetDictionary;
var deflateInfo = "pako deflate (from Nodeca project)";
var deflate_1$2 = {
  deflateInit: deflateInit_1,
  deflateInit2: deflateInit2_1,
  deflateReset: deflateReset_1,
  deflateResetKeep: deflateResetKeep_1,
  deflateSetHeader: deflateSetHeader_1,
  deflate: deflate_2$1,
  deflateEnd: deflateEnd_1,
  deflateSetDictionary: deflateSetDictionary_1,
  deflateInfo
};
var _has = (obj, key) => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};
var assign = function(obj) {
  const sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    const source = sources.shift();
    if (!source) {
      continue;
    }
    if (typeof source !== "object") {
      throw new TypeError(source + "must be non-object");
    }
    for (const p in source) {
      if (_has(source, p)) {
        obj[p] = source[p];
      }
    }
  }
  return obj;
};
var flattenChunks = (chunks) => {
  let len = 0;
  for (let i = 0, l = chunks.length; i < l; i++) {
    len += chunks[i].length;
  }
  const result = new Uint8Array(len);
  for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
    let chunk = chunks[i];
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
};
var common = {
  assign,
  flattenChunks
};
var STR_APPLY_UIA_OK = true;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch (__) {
  STR_APPLY_UIA_OK = false;
}
var _utf8len = new Uint8Array(256);
for (let q = 0; q < 256; q++) {
  _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
}
_utf8len[254] = _utf8len[254] = 1;
var string2buf = (str) => {
  if (typeof TextEncoder === "function" && TextEncoder.prototype.encode) {
    return new TextEncoder().encode(str);
  }
  let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
  for (m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 64512) === 56320) {
        c = 65536 + (c - 55296 << 10) + (c2 - 56320);
        m_pos++;
      }
    }
    buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
  }
  buf = new Uint8Array(buf_len);
  for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 64512) === 56320) {
        c = 65536 + (c - 55296 << 10) + (c2 - 56320);
        m_pos++;
      }
    }
    if (c < 128) {
      buf[i++] = c;
    } else if (c < 2048) {
      buf[i++] = 192 | c >>> 6;
      buf[i++] = 128 | c & 63;
    } else if (c < 65536) {
      buf[i++] = 224 | c >>> 12;
      buf[i++] = 128 | c >>> 6 & 63;
      buf[i++] = 128 | c & 63;
    } else {
      buf[i++] = 240 | c >>> 18;
      buf[i++] = 128 | c >>> 12 & 63;
      buf[i++] = 128 | c >>> 6 & 63;
      buf[i++] = 128 | c & 63;
    }
  }
  return buf;
};
var buf2binstring = (buf, len) => {
  if (len < 65534) {
    if (buf.subarray && STR_APPLY_UIA_OK) {
      return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
    }
  }
  let result = "";
  for (let i = 0; i < len; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
};
var buf2string = (buf, max) => {
  const len = max || buf.length;
  if (typeof TextDecoder === "function" && TextDecoder.prototype.decode) {
    return new TextDecoder().decode(buf.subarray(0, max));
  }
  let i, out;
  const utf16buf = new Array(len * 2);
  for (out = 0, i = 0; i < len; ) {
    let c = buf[i++];
    if (c < 128) {
      utf16buf[out++] = c;
      continue;
    }
    let c_len = _utf8len[c];
    if (c_len > 4) {
      utf16buf[out++] = 65533;
      i += c_len - 1;
      continue;
    }
    c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
    while (c_len > 1 && i < len) {
      c = c << 6 | buf[i++] & 63;
      c_len--;
    }
    if (c_len > 1) {
      utf16buf[out++] = 65533;
      continue;
    }
    if (c < 65536) {
      utf16buf[out++] = c;
    } else {
      c -= 65536;
      utf16buf[out++] = 55296 | c >> 10 & 1023;
      utf16buf[out++] = 56320 | c & 1023;
    }
  }
  return buf2binstring(utf16buf, out);
};
var utf8border = (buf, max) => {
  max = max || buf.length;
  if (max > buf.length) {
    max = buf.length;
  }
  let pos = max - 1;
  while (pos >= 0 && (buf[pos] & 192) === 128) {
    pos--;
  }
  if (pos < 0) {
    return max;
  }
  if (pos === 0) {
    return max;
  }
  return pos + _utf8len[buf[pos]] > max ? pos : max;
};
var strings = {
  string2buf,
  buf2string,
  utf8border
};
function ZStream() {
  this.input = null;
  this.next_in = 0;
  this.avail_in = 0;
  this.total_in = 0;
  this.output = null;
  this.next_out = 0;
  this.avail_out = 0;
  this.total_out = 0;
  this.msg = "";
  this.state = null;
  this.data_type = 2;
  this.adler = 0;
}
var zstream = ZStream;
var toString$1 = Object.prototype.toString;
var {
  Z_NO_FLUSH: Z_NO_FLUSH$1,
  Z_SYNC_FLUSH,
  Z_FULL_FLUSH,
  Z_FINISH: Z_FINISH$2,
  Z_OK: Z_OK$2,
  Z_STREAM_END: Z_STREAM_END$2,
  Z_DEFAULT_COMPRESSION,
  Z_DEFAULT_STRATEGY,
  Z_DEFLATED: Z_DEFLATED$1
} = constants$2;
function Deflate$1(options) {
  this.options = common.assign({
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED$1,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY
  }, options || {});
  let opt = this.options;
  if (opt.raw && opt.windowBits > 0) {
    opt.windowBits = -opt.windowBits;
  } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
    opt.windowBits += 16;
  }
  this.err = 0;
  this.msg = "";
  this.ended = false;
  this.chunks = [];
  this.strm = new zstream();
  this.strm.avail_out = 0;
  let status = deflate_1$2.deflateInit2(this.strm, opt.level, opt.method, opt.windowBits, opt.memLevel, opt.strategy);
  if (status !== Z_OK$2) {
    throw new Error(messages[status]);
  }
  if (opt.header) {
    deflate_1$2.deflateSetHeader(this.strm, opt.header);
  }
  if (opt.dictionary) {
    let dict;
    if (typeof opt.dictionary === "string") {
      dict = strings.string2buf(opt.dictionary);
    } else if (toString$1.call(opt.dictionary) === "[object ArrayBuffer]") {
      dict = new Uint8Array(opt.dictionary);
    } else {
      dict = opt.dictionary;
    }
    status = deflate_1$2.deflateSetDictionary(this.strm, dict);
    if (status !== Z_OK$2) {
      throw new Error(messages[status]);
    }
    this._dict_set = true;
  }
}
Deflate$1.prototype.push = function(data, flush_mode) {
  const strm = this.strm;
  const chunkSize = this.options.chunkSize;
  let status, _flush_mode;
  if (this.ended) {
    return false;
  }
  if (flush_mode === ~~flush_mode)
    _flush_mode = flush_mode;
  else
    _flush_mode = flush_mode === true ? Z_FINISH$2 : Z_NO_FLUSH$1;
  if (typeof data === "string") {
    strm.input = strings.string2buf(data);
  } else if (toString$1.call(data) === "[object ArrayBuffer]") {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }
  strm.next_in = 0;
  strm.avail_in = strm.input.length;
  for (; ; ) {
    if (strm.avail_out === 0) {
      strm.output = new Uint8Array(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
      this.onData(strm.output.subarray(0, strm.next_out));
      strm.avail_out = 0;
      continue;
    }
    status = deflate_1$2.deflate(strm, _flush_mode);
    if (status === Z_STREAM_END$2) {
      if (strm.next_out > 0) {
        this.onData(strm.output.subarray(0, strm.next_out));
      }
      status = deflate_1$2.deflateEnd(this.strm);
      this.onEnd(status);
      this.ended = true;
      return status === Z_OK$2;
    }
    if (strm.avail_out === 0) {
      this.onData(strm.output);
      continue;
    }
    if (_flush_mode > 0 && strm.next_out > 0) {
      this.onData(strm.output.subarray(0, strm.next_out));
      strm.avail_out = 0;
      continue;
    }
    if (strm.avail_in === 0)
      break;
  }
  return true;
};
Deflate$1.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};
Deflate$1.prototype.onEnd = function(status) {
  if (status === Z_OK$2) {
    this.result = common.flattenChunks(this.chunks);
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};
function deflate$1(input, options) {
  const deflator = new Deflate$1(options);
  deflator.push(input, true);
  if (deflator.err) {
    throw deflator.msg || messages[deflator.err];
  }
  return deflator.result;
}
function deflateRaw$1(input, options) {
  options = options || {};
  options.raw = true;
  return deflate$1(input, options);
}
function gzip$1(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate$1(input, options);
}
var Deflate_1$1 = Deflate$1;
var deflate_2 = deflate$1;
var deflateRaw_1$1 = deflateRaw$1;
var gzip_1$1 = gzip$1;
var constants$1 = constants$2;
var deflate_1$1 = {
  Deflate: Deflate_1$1,
  deflate: deflate_2,
  deflateRaw: deflateRaw_1$1,
  gzip: gzip_1$1,
  constants: constants$1
};
var BAD$1 = 30;
var TYPE$1 = 12;
var inffast = function inflate_fast(strm, start) {
  let _in;
  let last;
  let _out;
  let beg;
  let end;
  let dmax;
  let wsize;
  let whave;
  let wnext;
  let s_window;
  let hold;
  let bits;
  let lcode;
  let dcode;
  let lmask;
  let dmask;
  let here;
  let op;
  let len;
  let dist;
  let from;
  let from_source;
  let input, output;
  const state2 = strm.state;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
  dmax = state2.dmax;
  wsize = state2.wsize;
  whave = state2.whave;
  wnext = state2.wnext;
  s_window = state2.window;
  hold = state2.hold;
  bits = state2.bits;
  lcode = state2.lencode;
  dcode = state2.distcode;
  lmask = (1 << state2.lenbits) - 1;
  dmask = (1 << state2.distbits) - 1;
  top:
    do {
      if (bits < 15) {
        hold += input[_in++] << bits;
        bits += 8;
        hold += input[_in++] << bits;
        bits += 8;
      }
      here = lcode[hold & lmask];
      dolen:
        for (; ; ) {
          op = here >>> 24;
          hold >>>= op;
          bits -= op;
          op = here >>> 16 & 255;
          if (op === 0) {
            output[_out++] = here & 65535;
          } else if (op & 16) {
            len = here & 65535;
            op &= 15;
            if (op) {
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
              len += hold & (1 << op) - 1;
              hold >>>= op;
              bits -= op;
            }
            if (bits < 15) {
              hold += input[_in++] << bits;
              bits += 8;
              hold += input[_in++] << bits;
              bits += 8;
            }
            here = dcode[hold & dmask];
            dodist:
              for (; ; ) {
                op = here >>> 24;
                hold >>>= op;
                bits -= op;
                op = here >>> 16 & 255;
                if (op & 16) {
                  dist = here & 65535;
                  op &= 15;
                  if (bits < op) {
                    hold += input[_in++] << bits;
                    bits += 8;
                    if (bits < op) {
                      hold += input[_in++] << bits;
                      bits += 8;
                    }
                  }
                  dist += hold & (1 << op) - 1;
                  if (dist > dmax) {
                    strm.msg = "invalid distance too far back";
                    state2.mode = BAD$1;
                    break top;
                  }
                  hold >>>= op;
                  bits -= op;
                  op = _out - beg;
                  if (dist > op) {
                    op = dist - op;
                    if (op > whave) {
                      if (state2.sane) {
                        strm.msg = "invalid distance too far back";
                        state2.mode = BAD$1;
                        break top;
                      }
                    }
                    from = 0;
                    from_source = s_window;
                    if (wnext === 0) {
                      from += wsize - op;
                      if (op < len) {
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = _out - dist;
                        from_source = output;
                      }
                    } else if (wnext < op) {
                      from += wsize + wnext - op;
                      op -= wnext;
                      if (op < len) {
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = 0;
                        if (wnext < len) {
                          op = wnext;
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = _out - dist;
                          from_source = output;
                        }
                      }
                    } else {
                      from += wnext - op;
                      if (op < len) {
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = _out - dist;
                        from_source = output;
                      }
                    }
                    while (len > 2) {
                      output[_out++] = from_source[from++];
                      output[_out++] = from_source[from++];
                      output[_out++] = from_source[from++];
                      len -= 3;
                    }
                    if (len) {
                      output[_out++] = from_source[from++];
                      if (len > 1) {
                        output[_out++] = from_source[from++];
                      }
                    }
                  } else {
                    from = _out - dist;
                    do {
                      output[_out++] = output[from++];
                      output[_out++] = output[from++];
                      output[_out++] = output[from++];
                      len -= 3;
                    } while (len > 2);
                    if (len) {
                      output[_out++] = output[from++];
                      if (len > 1) {
                        output[_out++] = output[from++];
                      }
                    }
                  }
                } else if ((op & 64) === 0) {
                  here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                  continue dodist;
                } else {
                  strm.msg = "invalid distance code";
                  state2.mode = BAD$1;
                  break top;
                }
                break;
              }
          } else if ((op & 64) === 0) {
            here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
            continue dolen;
          } else if (op & 32) {
            state2.mode = TYPE$1;
            break top;
          } else {
            strm.msg = "invalid literal/length code";
            state2.mode = BAD$1;
            break top;
          }
          break;
        }
    } while (_in < last && _out < end);
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
  strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
  state2.hold = hold;
  state2.bits = bits;
  return;
};
var MAXBITS = 15;
var ENOUGH_LENS$1 = 852;
var ENOUGH_DISTS$1 = 592;
var CODES$1 = 0;
var LENS$1 = 1;
var DISTS$1 = 2;
var lbase = new Uint16Array([
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  13,
  15,
  17,
  19,
  23,
  27,
  31,
  35,
  43,
  51,
  59,
  67,
  83,
  99,
  115,
  131,
  163,
  195,
  227,
  258,
  0,
  0
]);
var lext = new Uint8Array([
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  21,
  21,
  21,
  21,
  16,
  72,
  78
]);
var dbase = new Uint16Array([
  1,
  2,
  3,
  4,
  5,
  7,
  9,
  13,
  17,
  25,
  33,
  49,
  65,
  97,
  129,
  193,
  257,
  385,
  513,
  769,
  1025,
  1537,
  2049,
  3073,
  4097,
  6145,
  8193,
  12289,
  16385,
  24577,
  0,
  0
]);
var dext = new Uint8Array([
  16,
  16,
  16,
  16,
  17,
  17,
  18,
  18,
  19,
  19,
  20,
  20,
  21,
  21,
  22,
  22,
  23,
  23,
  24,
  24,
  25,
  25,
  26,
  26,
  27,
  27,
  28,
  28,
  29,
  29,
  64,
  64
]);
var inflate_table = (type7, lens, lens_index, codes, table, table_index, work, opts) => {
  const bits = opts.bits;
  let len = 0;
  let sym = 0;
  let min = 0, max = 0;
  let root = 0;
  let curr = 0;
  let drop = 0;
  let left = 0;
  let used = 0;
  let huff = 0;
  let incr;
  let fill;
  let low;
  let mask;
  let next;
  let base2 = null;
  let base_index = 0;
  let end;
  const count = new Uint16Array(MAXBITS + 1);
  const offs = new Uint16Array(MAXBITS + 1);
  let extra = null;
  let extra_index = 0;
  let here_bits, here_op, here_val;
  for (len = 0; len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
    if (count[max] !== 0) {
      break;
    }
  }
  if (root > max) {
    root = max;
  }
  if (max === 0) {
    table[table_index++] = 1 << 24 | 64 << 16 | 0;
    table[table_index++] = 1 << 24 | 64 << 16 | 0;
    opts.bits = 1;
    return 0;
  }
  for (min = 1; min < max; min++) {
    if (count[min] !== 0) {
      break;
    }
  }
  if (root < min) {
    root = min;
  }
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }
  }
  if (left > 0 && (type7 === CODES$1 || max !== 1)) {
    return -1;
  }
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }
  if (type7 === CODES$1) {
    base2 = extra = work;
    end = 19;
  } else if (type7 === LENS$1) {
    base2 = lbase;
    base_index -= 257;
    extra = lext;
    extra_index -= 257;
    end = 256;
  } else {
    base2 = dbase;
    extra = dext;
    end = -1;
  }
  huff = 0;
  sym = 0;
  len = min;
  next = table_index;
  curr = root;
  drop = 0;
  low = -1;
  used = 1 << root;
  mask = used - 1;
  if (type7 === LENS$1 && used > ENOUGH_LENS$1 || type7 === DISTS$1 && used > ENOUGH_DISTS$1) {
    return 1;
  }
  for (; ; ) {
    here_bits = len - drop;
    if (work[sym] < end) {
      here_op = 0;
      here_val = work[sym];
    } else if (work[sym] > end) {
      here_op = extra[extra_index + work[sym]];
      here_val = base2[base_index + work[sym]];
    } else {
      here_op = 32 + 64;
      here_val = 0;
    }
    incr = 1 << len - drop;
    fill = 1 << curr;
    min = fill;
    do {
      fill -= incr;
      table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
    } while (fill !== 0);
    incr = 1 << len - 1;
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }
    sym++;
    if (--count[len] === 0) {
      if (len === max) {
        break;
      }
      len = lens[lens_index + work[sym]];
    }
    if (len > root && (huff & mask) !== low) {
      if (drop === 0) {
        drop = root;
      }
      next += min;
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) {
          break;
        }
        curr++;
        left <<= 1;
      }
      used += 1 << curr;
      if (type7 === LENS$1 && used > ENOUGH_LENS$1 || type7 === DISTS$1 && used > ENOUGH_DISTS$1) {
        return 1;
      }
      low = huff & mask;
      table[low] = root << 24 | curr << 16 | next - table_index | 0;
    }
  }
  if (huff !== 0) {
    table[next + huff] = len - drop << 24 | 64 << 16 | 0;
  }
  opts.bits = root;
  return 0;
};
var inftrees = inflate_table;
var CODES = 0;
var LENS = 1;
var DISTS = 2;
var {
  Z_FINISH: Z_FINISH$1,
  Z_BLOCK,
  Z_TREES,
  Z_OK: Z_OK$1,
  Z_STREAM_END: Z_STREAM_END$1,
  Z_NEED_DICT: Z_NEED_DICT$1,
  Z_STREAM_ERROR: Z_STREAM_ERROR$1,
  Z_DATA_ERROR: Z_DATA_ERROR$1,
  Z_MEM_ERROR: Z_MEM_ERROR$1,
  Z_BUF_ERROR,
  Z_DEFLATED
} = constants$2;
var HEAD = 1;
var FLAGS = 2;
var TIME = 3;
var OS = 4;
var EXLEN = 5;
var EXTRA = 6;
var NAME = 7;
var COMMENT = 8;
var HCRC = 9;
var DICTID = 10;
var DICT = 11;
var TYPE = 12;
var TYPEDO = 13;
var STORED = 14;
var COPY_ = 15;
var COPY = 16;
var TABLE = 17;
var LENLENS = 18;
var CODELENS = 19;
var LEN_ = 20;
var LEN = 21;
var LENEXT = 22;
var DIST = 23;
var DISTEXT = 24;
var MATCH = 25;
var LIT = 26;
var CHECK = 27;
var LENGTH = 28;
var DONE = 29;
var BAD = 30;
var MEM = 31;
var SYNC = 32;
var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
var MAX_WBITS = 15;
var DEF_WBITS = MAX_WBITS;
var zswap32 = (q) => {
  return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
};
function InflateState() {
  this.mode = 0;
  this.last = false;
  this.wrap = 0;
  this.havedict = false;
  this.flags = 0;
  this.dmax = 0;
  this.check = 0;
  this.total = 0;
  this.head = null;
  this.wbits = 0;
  this.wsize = 0;
  this.whave = 0;
  this.wnext = 0;
  this.window = null;
  this.hold = 0;
  this.bits = 0;
  this.length = 0;
  this.offset = 0;
  this.extra = 0;
  this.lencode = null;
  this.distcode = null;
  this.lenbits = 0;
  this.distbits = 0;
  this.ncode = 0;
  this.nlen = 0;
  this.ndist = 0;
  this.have = 0;
  this.next = null;
  this.lens = new Uint16Array(320);
  this.work = new Uint16Array(288);
  this.lendyn = null;
  this.distdyn = null;
  this.sane = 0;
  this.back = 0;
  this.was = 0;
}
var inflateResetKeep = (strm) => {
  if (!strm || !strm.state) {
    return Z_STREAM_ERROR$1;
  }
  const state2 = strm.state;
  strm.total_in = strm.total_out = state2.total = 0;
  strm.msg = "";
  if (state2.wrap) {
    strm.adler = state2.wrap & 1;
  }
  state2.mode = HEAD;
  state2.last = 0;
  state2.havedict = 0;
  state2.dmax = 32768;
  state2.head = null;
  state2.hold = 0;
  state2.bits = 0;
  state2.lencode = state2.lendyn = new Int32Array(ENOUGH_LENS);
  state2.distcode = state2.distdyn = new Int32Array(ENOUGH_DISTS);
  state2.sane = 1;
  state2.back = -1;
  return Z_OK$1;
};
var inflateReset = (strm) => {
  if (!strm || !strm.state) {
    return Z_STREAM_ERROR$1;
  }
  const state2 = strm.state;
  state2.wsize = 0;
  state2.whave = 0;
  state2.wnext = 0;
  return inflateResetKeep(strm);
};
var inflateReset2 = (strm, windowBits) => {
  let wrap;
  if (!strm || !strm.state) {
    return Z_STREAM_ERROR$1;
  }
  const state2 = strm.state;
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  } else {
    wrap = (windowBits >> 4) + 1;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR$1;
  }
  if (state2.window !== null && state2.wbits !== windowBits) {
    state2.window = null;
  }
  state2.wrap = wrap;
  state2.wbits = windowBits;
  return inflateReset(strm);
};
var inflateInit2 = (strm, windowBits) => {
  if (!strm) {
    return Z_STREAM_ERROR$1;
  }
  const state2 = new InflateState();
  strm.state = state2;
  state2.window = null;
  const ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK$1) {
    strm.state = null;
  }
  return ret;
};
var inflateInit = (strm) => {
  return inflateInit2(strm, DEF_WBITS);
};
var virgin = true;
var lenfix;
var distfix;
var fixedtables = (state2) => {
  if (virgin) {
    lenfix = new Int32Array(512);
    distfix = new Int32Array(32);
    let sym = 0;
    while (sym < 144) {
      state2.lens[sym++] = 8;
    }
    while (sym < 256) {
      state2.lens[sym++] = 9;
    }
    while (sym < 280) {
      state2.lens[sym++] = 7;
    }
    while (sym < 288) {
      state2.lens[sym++] = 8;
    }
    inftrees(LENS, state2.lens, 0, 288, lenfix, 0, state2.work, { bits: 9 });
    sym = 0;
    while (sym < 32) {
      state2.lens[sym++] = 5;
    }
    inftrees(DISTS, state2.lens, 0, 32, distfix, 0, state2.work, { bits: 5 });
    virgin = false;
  }
  state2.lencode = lenfix;
  state2.lenbits = 9;
  state2.distcode = distfix;
  state2.distbits = 5;
};
var updatewindow = (strm, src, end, copy) => {
  let dist;
  const state2 = strm.state;
  if (state2.window === null) {
    state2.wsize = 1 << state2.wbits;
    state2.wnext = 0;
    state2.whave = 0;
    state2.window = new Uint8Array(state2.wsize);
  }
  if (copy >= state2.wsize) {
    state2.window.set(src.subarray(end - state2.wsize, end), 0);
    state2.wnext = 0;
    state2.whave = state2.wsize;
  } else {
    dist = state2.wsize - state2.wnext;
    if (dist > copy) {
      dist = copy;
    }
    state2.window.set(src.subarray(end - copy, end - copy + dist), state2.wnext);
    copy -= dist;
    if (copy) {
      state2.window.set(src.subarray(end - copy, end), 0);
      state2.wnext = copy;
      state2.whave = state2.wsize;
    } else {
      state2.wnext += dist;
      if (state2.wnext === state2.wsize) {
        state2.wnext = 0;
      }
      if (state2.whave < state2.wsize) {
        state2.whave += dist;
      }
    }
  }
  return 0;
};
var inflate$2 = (strm, flush) => {
  let state2;
  let input, output;
  let next;
  let put;
  let have, left;
  let hold;
  let bits;
  let _in, _out;
  let copy;
  let from;
  let from_source;
  let here = 0;
  let here_bits, here_op, here_val;
  let last_bits, last_op, last_val;
  let len;
  let ret;
  const hbuf = new Uint8Array(4);
  let opts;
  let n;
  const order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
    return Z_STREAM_ERROR$1;
  }
  state2 = strm.state;
  if (state2.mode === TYPE) {
    state2.mode = TYPEDO;
  }
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state2.hold;
  bits = state2.bits;
  _in = have;
  _out = left;
  ret = Z_OK$1;
  inf_leave:
    for (; ; ) {
      switch (state2.mode) {
        case HEAD:
          if (state2.wrap === 0) {
            state2.mode = TYPEDO;
            break;
          }
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state2.wrap & 2 && hold === 35615) {
            state2.check = 0;
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state2.check = crc32_1(state2.check, hbuf, 2, 0);
            hold = 0;
            bits = 0;
            state2.mode = FLAGS;
            break;
          }
          state2.flags = 0;
          if (state2.head) {
            state2.head.done = false;
          }
          if (!(state2.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
            strm.msg = "incorrect header check";
            state2.mode = BAD;
            break;
          }
          if ((hold & 15) !== Z_DEFLATED) {
            strm.msg = "unknown compression method";
            state2.mode = BAD;
            break;
          }
          hold >>>= 4;
          bits -= 4;
          len = (hold & 15) + 8;
          if (state2.wbits === 0) {
            state2.wbits = len;
          } else if (len > state2.wbits) {
            strm.msg = "invalid window size";
            state2.mode = BAD;
            break;
          }
          state2.dmax = 1 << state2.wbits;
          strm.adler = state2.check = 1;
          state2.mode = hold & 512 ? DICTID : TYPE;
          hold = 0;
          bits = 0;
          break;
        case FLAGS:
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state2.flags = hold;
          if ((state2.flags & 255) !== Z_DEFLATED) {
            strm.msg = "unknown compression method";
            state2.mode = BAD;
            break;
          }
          if (state2.flags & 57344) {
            strm.msg = "unknown header flags set";
            state2.mode = BAD;
            break;
          }
          if (state2.head) {
            state2.head.text = hold >> 8 & 1;
          }
          if (state2.flags & 512) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state2.check = crc32_1(state2.check, hbuf, 2, 0);
          }
          hold = 0;
          bits = 0;
          state2.mode = TIME;
        case TIME:
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state2.head) {
            state2.head.time = hold;
          }
          if (state2.flags & 512) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            hbuf[2] = hold >>> 16 & 255;
            hbuf[3] = hold >>> 24 & 255;
            state2.check = crc32_1(state2.check, hbuf, 4, 0);
          }
          hold = 0;
          bits = 0;
          state2.mode = OS;
        case OS:
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state2.head) {
            state2.head.xflags = hold & 255;
            state2.head.os = hold >> 8;
          }
          if (state2.flags & 512) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state2.check = crc32_1(state2.check, hbuf, 2, 0);
          }
          hold = 0;
          bits = 0;
          state2.mode = EXLEN;
        case EXLEN:
          if (state2.flags & 1024) {
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state2.length = hold;
            if (state2.head) {
              state2.head.extra_len = hold;
            }
            if (state2.flags & 512) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state2.check = crc32_1(state2.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
          } else if (state2.head) {
            state2.head.extra = null;
          }
          state2.mode = EXTRA;
        case EXTRA:
          if (state2.flags & 1024) {
            copy = state2.length;
            if (copy > have) {
              copy = have;
            }
            if (copy) {
              if (state2.head) {
                len = state2.head.extra_len - state2.length;
                if (!state2.head.extra) {
                  state2.head.extra = new Uint8Array(state2.head.extra_len);
                }
                state2.head.extra.set(input.subarray(next, next + copy), len);
              }
              if (state2.flags & 512) {
                state2.check = crc32_1(state2.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              state2.length -= copy;
            }
            if (state2.length) {
              break inf_leave;
            }
          }
          state2.length = 0;
          state2.mode = NAME;
        case NAME:
          if (state2.flags & 2048) {
            if (have === 0) {
              break inf_leave;
            }
            copy = 0;
            do {
              len = input[next + copy++];
              if (state2.head && len && state2.length < 65536) {
                state2.head.name += String.fromCharCode(len);
              }
            } while (len && copy < have);
            if (state2.flags & 512) {
              state2.check = crc32_1(state2.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            if (len) {
              break inf_leave;
            }
          } else if (state2.head) {
            state2.head.name = null;
          }
          state2.length = 0;
          state2.mode = COMMENT;
        case COMMENT:
          if (state2.flags & 4096) {
            if (have === 0) {
              break inf_leave;
            }
            copy = 0;
            do {
              len = input[next + copy++];
              if (state2.head && len && state2.length < 65536) {
                state2.head.comment += String.fromCharCode(len);
              }
            } while (len && copy < have);
            if (state2.flags & 512) {
              state2.check = crc32_1(state2.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            if (len) {
              break inf_leave;
            }
          } else if (state2.head) {
            state2.head.comment = null;
          }
          state2.mode = HCRC;
        case HCRC:
          if (state2.flags & 512) {
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (hold !== (state2.check & 65535)) {
              strm.msg = "header crc mismatch";
              state2.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          if (state2.head) {
            state2.head.hcrc = state2.flags >> 9 & 1;
            state2.head.done = true;
          }
          strm.adler = state2.check = 0;
          state2.mode = TYPE;
          break;
        case DICTID:
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          strm.adler = state2.check = zswap32(hold);
          hold = 0;
          bits = 0;
          state2.mode = DICT;
        case DICT:
          if (state2.havedict === 0) {
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state2.hold = hold;
            state2.bits = bits;
            return Z_NEED_DICT$1;
          }
          strm.adler = state2.check = 1;
          state2.mode = TYPE;
        case TYPE:
          if (flush === Z_BLOCK || flush === Z_TREES) {
            break inf_leave;
          }
        case TYPEDO:
          if (state2.last) {
            hold >>>= bits & 7;
            bits -= bits & 7;
            state2.mode = CHECK;
            break;
          }
          while (bits < 3) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state2.last = hold & 1;
          hold >>>= 1;
          bits -= 1;
          switch (hold & 3) {
            case 0:
              state2.mode = STORED;
              break;
            case 1:
              fixedtables(state2);
              state2.mode = LEN_;
              if (flush === Z_TREES) {
                hold >>>= 2;
                bits -= 2;
                break inf_leave;
              }
              break;
            case 2:
              state2.mode = TABLE;
              break;
            case 3:
              strm.msg = "invalid block type";
              state2.mode = BAD;
          }
          hold >>>= 2;
          bits -= 2;
          break;
        case STORED:
          hold >>>= bits & 7;
          bits -= bits & 7;
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
            strm.msg = "invalid stored block lengths";
            state2.mode = BAD;
            break;
          }
          state2.length = hold & 65535;
          hold = 0;
          bits = 0;
          state2.mode = COPY_;
          if (flush === Z_TREES) {
            break inf_leave;
          }
        case COPY_:
          state2.mode = COPY;
        case COPY:
          copy = state2.length;
          if (copy) {
            if (copy > have) {
              copy = have;
            }
            if (copy > left) {
              copy = left;
            }
            if (copy === 0) {
              break inf_leave;
            }
            output.set(input.subarray(next, next + copy), put);
            have -= copy;
            next += copy;
            left -= copy;
            put += copy;
            state2.length -= copy;
            break;
          }
          state2.mode = TYPE;
          break;
        case TABLE:
          while (bits < 14) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state2.nlen = (hold & 31) + 257;
          hold >>>= 5;
          bits -= 5;
          state2.ndist = (hold & 31) + 1;
          hold >>>= 5;
          bits -= 5;
          state2.ncode = (hold & 15) + 4;
          hold >>>= 4;
          bits -= 4;
          if (state2.nlen > 286 || state2.ndist > 30) {
            strm.msg = "too many length or distance symbols";
            state2.mode = BAD;
            break;
          }
          state2.have = 0;
          state2.mode = LENLENS;
        case LENLENS:
          while (state2.have < state2.ncode) {
            while (bits < 3) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state2.lens[order[state2.have++]] = hold & 7;
            hold >>>= 3;
            bits -= 3;
          }
          while (state2.have < 19) {
            state2.lens[order[state2.have++]] = 0;
          }
          state2.lencode = state2.lendyn;
          state2.lenbits = 7;
          opts = { bits: state2.lenbits };
          ret = inftrees(CODES, state2.lens, 0, 19, state2.lencode, 0, state2.work, opts);
          state2.lenbits = opts.bits;
          if (ret) {
            strm.msg = "invalid code lengths set";
            state2.mode = BAD;
            break;
          }
          state2.have = 0;
          state2.mode = CODELENS;
        case CODELENS:
          while (state2.have < state2.nlen + state2.ndist) {
            for (; ; ) {
              here = state2.lencode[hold & (1 << state2.lenbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (here_val < 16) {
              hold >>>= here_bits;
              bits -= here_bits;
              state2.lens[state2.have++] = here_val;
            } else {
              if (here_val === 16) {
                n = here_bits + 2;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                if (state2.have === 0) {
                  strm.msg = "invalid bit length repeat";
                  state2.mode = BAD;
                  break;
                }
                len = state2.lens[state2.have - 1];
                copy = 3 + (hold & 3);
                hold >>>= 2;
                bits -= 2;
              } else if (here_val === 17) {
                n = here_bits + 3;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                len = 0;
                copy = 3 + (hold & 7);
                hold >>>= 3;
                bits -= 3;
              } else {
                n = here_bits + 7;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                len = 0;
                copy = 11 + (hold & 127);
                hold >>>= 7;
                bits -= 7;
              }
              if (state2.have + copy > state2.nlen + state2.ndist) {
                strm.msg = "invalid bit length repeat";
                state2.mode = BAD;
                break;
              }
              while (copy--) {
                state2.lens[state2.have++] = len;
              }
            }
          }
          if (state2.mode === BAD) {
            break;
          }
          if (state2.lens[256] === 0) {
            strm.msg = "invalid code -- missing end-of-block";
            state2.mode = BAD;
            break;
          }
          state2.lenbits = 9;
          opts = { bits: state2.lenbits };
          ret = inftrees(LENS, state2.lens, 0, state2.nlen, state2.lencode, 0, state2.work, opts);
          state2.lenbits = opts.bits;
          if (ret) {
            strm.msg = "invalid literal/lengths set";
            state2.mode = BAD;
            break;
          }
          state2.distbits = 6;
          state2.distcode = state2.distdyn;
          opts = { bits: state2.distbits };
          ret = inftrees(DISTS, state2.lens, state2.nlen, state2.ndist, state2.distcode, 0, state2.work, opts);
          state2.distbits = opts.bits;
          if (ret) {
            strm.msg = "invalid distances set";
            state2.mode = BAD;
            break;
          }
          state2.mode = LEN_;
          if (flush === Z_TREES) {
            break inf_leave;
          }
        case LEN_:
          state2.mode = LEN;
        case LEN:
          if (have >= 6 && left >= 258) {
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state2.hold = hold;
            state2.bits = bits;
            inffast(strm, _out);
            put = strm.next_out;
            output = strm.output;
            left = strm.avail_out;
            next = strm.next_in;
            input = strm.input;
            have = strm.avail_in;
            hold = state2.hold;
            bits = state2.bits;
            if (state2.mode === TYPE) {
              state2.back = -1;
            }
            break;
          }
          state2.back = 0;
          for (; ; ) {
            here = state2.lencode[hold & (1 << state2.lenbits) - 1];
            here_bits = here >>> 24;
            here_op = here >>> 16 & 255;
            here_val = here & 65535;
            if (here_bits <= bits) {
              break;
            }
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (here_op && (here_op & 240) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;
            for (; ; ) {
              here = state2.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (last_bits + here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            hold >>>= last_bits;
            bits -= last_bits;
            state2.back += last_bits;
          }
          hold >>>= here_bits;
          bits -= here_bits;
          state2.back += here_bits;
          state2.length = here_val;
          if (here_op === 0) {
            state2.mode = LIT;
            break;
          }
          if (here_op & 32) {
            state2.back = -1;
            state2.mode = TYPE;
            break;
          }
          if (here_op & 64) {
            strm.msg = "invalid literal/length code";
            state2.mode = BAD;
            break;
          }
          state2.extra = here_op & 15;
          state2.mode = LENEXT;
        case LENEXT:
          if (state2.extra) {
            n = state2.extra;
            while (bits < n) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state2.length += hold & (1 << state2.extra) - 1;
            hold >>>= state2.extra;
            bits -= state2.extra;
            state2.back += state2.extra;
          }
          state2.was = state2.length;
          state2.mode = DIST;
        case DIST:
          for (; ; ) {
            here = state2.distcode[hold & (1 << state2.distbits) - 1];
            here_bits = here >>> 24;
            here_op = here >>> 16 & 255;
            here_val = here & 65535;
            if (here_bits <= bits) {
              break;
            }
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if ((here_op & 240) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;
            for (; ; ) {
              here = state2.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (last_bits + here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            hold >>>= last_bits;
            bits -= last_bits;
            state2.back += last_bits;
          }
          hold >>>= here_bits;
          bits -= here_bits;
          state2.back += here_bits;
          if (here_op & 64) {
            strm.msg = "invalid distance code";
            state2.mode = BAD;
            break;
          }
          state2.offset = here_val;
          state2.extra = here_op & 15;
          state2.mode = DISTEXT;
        case DISTEXT:
          if (state2.extra) {
            n = state2.extra;
            while (bits < n) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state2.offset += hold & (1 << state2.extra) - 1;
            hold >>>= state2.extra;
            bits -= state2.extra;
            state2.back += state2.extra;
          }
          if (state2.offset > state2.dmax) {
            strm.msg = "invalid distance too far back";
            state2.mode = BAD;
            break;
          }
          state2.mode = MATCH;
        case MATCH:
          if (left === 0) {
            break inf_leave;
          }
          copy = _out - left;
          if (state2.offset > copy) {
            copy = state2.offset - copy;
            if (copy > state2.whave) {
              if (state2.sane) {
                strm.msg = "invalid distance too far back";
                state2.mode = BAD;
                break;
              }
            }
            if (copy > state2.wnext) {
              copy -= state2.wnext;
              from = state2.wsize - copy;
            } else {
              from = state2.wnext - copy;
            }
            if (copy > state2.length) {
              copy = state2.length;
            }
            from_source = state2.window;
          } else {
            from_source = output;
            from = put - state2.offset;
            copy = state2.length;
          }
          if (copy > left) {
            copy = left;
          }
          left -= copy;
          state2.length -= copy;
          do {
            output[put++] = from_source[from++];
          } while (--copy);
          if (state2.length === 0) {
            state2.mode = LEN;
          }
          break;
        case LIT:
          if (left === 0) {
            break inf_leave;
          }
          output[put++] = state2.length;
          left--;
          state2.mode = LEN;
          break;
        case CHECK:
          if (state2.wrap) {
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold |= input[next++] << bits;
              bits += 8;
            }
            _out -= left;
            strm.total_out += _out;
            state2.total += _out;
            if (_out) {
              strm.adler = state2.check = state2.flags ? crc32_1(state2.check, output, _out, put - _out) : adler32_1(state2.check, output, _out, put - _out);
            }
            _out = left;
            if ((state2.flags ? hold : zswap32(hold)) !== state2.check) {
              strm.msg = "incorrect data check";
              state2.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          state2.mode = LENGTH;
        case LENGTH:
          if (state2.wrap && state2.flags) {
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (hold !== (state2.total & 4294967295)) {
              strm.msg = "incorrect length check";
              state2.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          state2.mode = DONE;
        case DONE:
          ret = Z_STREAM_END$1;
          break inf_leave;
        case BAD:
          ret = Z_DATA_ERROR$1;
          break inf_leave;
        case MEM:
          return Z_MEM_ERROR$1;
        case SYNC:
        default:
          return Z_STREAM_ERROR$1;
      }
    }
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state2.hold = hold;
  state2.bits = bits;
  if (state2.wsize || _out !== strm.avail_out && state2.mode < BAD && (state2.mode < CHECK || flush !== Z_FINISH$1)) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out))
      ;
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state2.total += _out;
  if (state2.wrap && _out) {
    strm.adler = state2.check = state2.flags ? crc32_1(state2.check, output, _out, strm.next_out - _out) : adler32_1(state2.check, output, _out, strm.next_out - _out);
  }
  strm.data_type = state2.bits + (state2.last ? 64 : 0) + (state2.mode === TYPE ? 128 : 0) + (state2.mode === LEN_ || state2.mode === COPY_ ? 256 : 0);
  if ((_in === 0 && _out === 0 || flush === Z_FINISH$1) && ret === Z_OK$1) {
    ret = Z_BUF_ERROR;
  }
  return ret;
};
var inflateEnd = (strm) => {
  if (!strm || !strm.state) {
    return Z_STREAM_ERROR$1;
  }
  let state2 = strm.state;
  if (state2.window) {
    state2.window = null;
  }
  strm.state = null;
  return Z_OK$1;
};
var inflateGetHeader = (strm, head) => {
  if (!strm || !strm.state) {
    return Z_STREAM_ERROR$1;
  }
  const state2 = strm.state;
  if ((state2.wrap & 2) === 0) {
    return Z_STREAM_ERROR$1;
  }
  state2.head = head;
  head.done = false;
  return Z_OK$1;
};
var inflateSetDictionary = (strm, dictionary) => {
  const dictLength = dictionary.length;
  let state2;
  let dictid;
  let ret;
  if (!strm || !strm.state) {
    return Z_STREAM_ERROR$1;
  }
  state2 = strm.state;
  if (state2.wrap !== 0 && state2.mode !== DICT) {
    return Z_STREAM_ERROR$1;
  }
  if (state2.mode === DICT) {
    dictid = 1;
    dictid = adler32_1(dictid, dictionary, dictLength, 0);
    if (dictid !== state2.check) {
      return Z_DATA_ERROR$1;
    }
  }
  ret = updatewindow(strm, dictionary, dictLength, dictLength);
  if (ret) {
    state2.mode = MEM;
    return Z_MEM_ERROR$1;
  }
  state2.havedict = 1;
  return Z_OK$1;
};
var inflateReset_1 = inflateReset;
var inflateReset2_1 = inflateReset2;
var inflateResetKeep_1 = inflateResetKeep;
var inflateInit_1 = inflateInit;
var inflateInit2_1 = inflateInit2;
var inflate_2$1 = inflate$2;
var inflateEnd_1 = inflateEnd;
var inflateGetHeader_1 = inflateGetHeader;
var inflateSetDictionary_1 = inflateSetDictionary;
var inflateInfo = "pako inflate (from Nodeca project)";
var inflate_1$2 = {
  inflateReset: inflateReset_1,
  inflateReset2: inflateReset2_1,
  inflateResetKeep: inflateResetKeep_1,
  inflateInit: inflateInit_1,
  inflateInit2: inflateInit2_1,
  inflate: inflate_2$1,
  inflateEnd: inflateEnd_1,
  inflateGetHeader: inflateGetHeader_1,
  inflateSetDictionary: inflateSetDictionary_1,
  inflateInfo
};
function GZheader() {
  this.text = 0;
  this.time = 0;
  this.xflags = 0;
  this.os = 0;
  this.extra = null;
  this.extra_len = 0;
  this.name = "";
  this.comment = "";
  this.hcrc = 0;
  this.done = false;
}
var gzheader = GZheader;
var toString = Object.prototype.toString;
var {
  Z_NO_FLUSH,
  Z_FINISH,
  Z_OK,
  Z_STREAM_END,
  Z_NEED_DICT,
  Z_STREAM_ERROR,
  Z_DATA_ERROR,
  Z_MEM_ERROR
} = constants$2;
function Inflate$1(options) {
  this.options = common.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, options || {});
  const opt = this.options;
  if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
    opt.windowBits = -opt.windowBits;
    if (opt.windowBits === 0) {
      opt.windowBits = -15;
    }
  }
  if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
    opt.windowBits += 32;
  }
  if (opt.windowBits > 15 && opt.windowBits < 48) {
    if ((opt.windowBits & 15) === 0) {
      opt.windowBits |= 15;
    }
  }
  this.err = 0;
  this.msg = "";
  this.ended = false;
  this.chunks = [];
  this.strm = new zstream();
  this.strm.avail_out = 0;
  let status = inflate_1$2.inflateInit2(this.strm, opt.windowBits);
  if (status !== Z_OK) {
    throw new Error(messages[status]);
  }
  this.header = new gzheader();
  inflate_1$2.inflateGetHeader(this.strm, this.header);
  if (opt.dictionary) {
    if (typeof opt.dictionary === "string") {
      opt.dictionary = strings.string2buf(opt.dictionary);
    } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
      opt.dictionary = new Uint8Array(opt.dictionary);
    }
    if (opt.raw) {
      status = inflate_1$2.inflateSetDictionary(this.strm, opt.dictionary);
      if (status !== Z_OK) {
        throw new Error(messages[status]);
      }
    }
  }
}
Inflate$1.prototype.push = function(data, flush_mode) {
  const strm = this.strm;
  const chunkSize = this.options.chunkSize;
  const dictionary = this.options.dictionary;
  let status, _flush_mode, last_avail_out;
  if (this.ended)
    return false;
  if (flush_mode === ~~flush_mode)
    _flush_mode = flush_mode;
  else
    _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
  if (toString.call(data) === "[object ArrayBuffer]") {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }
  strm.next_in = 0;
  strm.avail_in = strm.input.length;
  for (; ; ) {
    if (strm.avail_out === 0) {
      strm.output = new Uint8Array(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    status = inflate_1$2.inflate(strm, _flush_mode);
    if (status === Z_NEED_DICT && dictionary) {
      status = inflate_1$2.inflateSetDictionary(strm, dictionary);
      if (status === Z_OK) {
        status = inflate_1$2.inflate(strm, _flush_mode);
      } else if (status === Z_DATA_ERROR) {
        status = Z_NEED_DICT;
      }
    }
    while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap > 0 && data[strm.next_in] !== 0) {
      inflate_1$2.inflateReset(strm);
      status = inflate_1$2.inflate(strm, _flush_mode);
    }
    switch (status) {
      case Z_STREAM_ERROR:
      case Z_DATA_ERROR:
      case Z_NEED_DICT:
      case Z_MEM_ERROR:
        this.onEnd(status);
        this.ended = true;
        return false;
    }
    last_avail_out = strm.avail_out;
    if (strm.next_out) {
      if (strm.avail_out === 0 || status === Z_STREAM_END) {
        if (this.options.to === "string") {
          let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
          let tail = strm.next_out - next_out_utf8;
          let utf8str = strings.buf2string(strm.output, next_out_utf8);
          strm.next_out = tail;
          strm.avail_out = chunkSize - tail;
          if (tail)
            strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
          this.onData(utf8str);
        } else {
          this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
        }
      }
    }
    if (status === Z_OK && last_avail_out === 0)
      continue;
    if (status === Z_STREAM_END) {
      status = inflate_1$2.inflateEnd(this.strm);
      this.onEnd(status);
      this.ended = true;
      return true;
    }
    if (strm.avail_in === 0)
      break;
  }
  return true;
};
Inflate$1.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};
Inflate$1.prototype.onEnd = function(status) {
  if (status === Z_OK) {
    if (this.options.to === "string") {
      this.result = this.chunks.join("");
    } else {
      this.result = common.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};
function inflate$1(input, options) {
  const inflator = new Inflate$1(options);
  inflator.push(input);
  if (inflator.err)
    throw inflator.msg || messages[inflator.err];
  return inflator.result;
}
function inflateRaw$1(input, options) {
  options = options || {};
  options.raw = true;
  return inflate$1(input, options);
}
var Inflate_1$1 = Inflate$1;
var inflate_2 = inflate$1;
var inflateRaw_1$1 = inflateRaw$1;
var ungzip$1 = inflate$1;
var constants = constants$2;
var inflate_1$1 = {
  Inflate: Inflate_1$1,
  inflate: inflate_2,
  inflateRaw: inflateRaw_1$1,
  ungzip: ungzip$1,
  constants
};
var { Deflate, deflate, deflateRaw, gzip } = deflate_1$1;
var { Inflate, inflate, inflateRaw, ungzip } = inflate_1$1;
var Deflate_1 = Deflate;
var deflate_1 = deflate;
var deflateRaw_1 = deflateRaw;
var gzip_1 = gzip;
var Inflate_1 = Inflate;
var inflate_1 = inflate;
var inflateRaw_1 = inflateRaw;
var ungzip_1 = ungzip;
var constants_1 = constants$2;
var pako = {
  Deflate: Deflate_1,
  deflate: deflate_1,
  deflateRaw: deflateRaw_1,
  gzip: gzip_1,
  Inflate: Inflate_1,
  inflate: inflate_1,
  inflateRaw: inflateRaw_1,
  ungzip: ungzip_1,
  constants: constants_1
};
var decode = (o) => {
  return new Promise((resolve, reject) => {
    try {
      o.buffer = pako.inflate(o.buffer).buffer;
      resolve(o);
    } catch (e) {
      console.error(e);
      return reject(false);
    }
  });
};
var encode = (o) => pako.deflate(o);
var type = "application/x-gzip";
var suffixes = "gz";
var text_exports = {};
__export2(text_exports, {
  decode: () => decode2,
  encode: () => encode2,
  suffixes: () => suffixes2,
  type: () => type2
});
var type2 = "text/plain";
var suffixes2 = "txt";
var encode2 = (o) => new TextEncoder().encode(o ? o.toString() : "");
var decode2 = (o) => new TextDecoder().decode(o.buffer);
var decode3 = async (o, type7, name2, config, defaultCodec = text_exports, codecs) => {
  const { mimeType, zipped: zipped2 } = get(type7, name2, codecs);
  if (zipped2)
    o = await decode(o);
  if (mimeType && (mimeType.includes("image/") || mimeType.includes("video/")))
    return o.dataurl;
  const codec = codecs ? codecs.get(mimeType) : null;
  if (codec && codec.decode instanceof Function)
    return codec.decode(o, config);
  else {
    console.warn(`No decoder for ${mimeType}. Defaulting to ${defaultCodec.type}...`);
    return defaultCodec.decode(o, config);
  }
};
var decode_default = decode3;
var encode3 = (o) => {
  var byteString = atob(o.split(",")[1]);
  const ab = new ArrayBuffer(byteString.length);
  var iab = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    iab[i] = byteString.charCodeAt(i);
  }
  return iab;
};
var encode4 = async (o, type7, name2, config, defaultCodec = text_exports, codecs) => {
  let buffer = new ArrayBuffer(0);
  const { mimeType, zipped: zipped2 } = get(type7, name2, codecs);
  if (mimeType && (mimeType.includes("image/") || mimeType.includes("video/")))
    return encode3(o);
  const codec = codecs ? codecs.get(mimeType) : null;
  if (codec && codec.encode instanceof Function)
    buffer = codec.encode(o, config);
  else {
    console.warn(`No encoder for ${mimeType}. Defaulting to ${defaultCodec.type}...`);
    buffer = defaultCodec.encode(o, config);
  }
  if (zipped2)
    buffer = await encode(buffer);
  return buffer;
};
var encode_default = encode4;
var transferEach = async (f, system) => {
  const path = f.path;
  if (!f.storage.buffer)
    f.storage = await f.getFileData();
  const blob = new Blob([f.storage.buffer]);
  blob.name = f.name;
  await system.open(path, true);
  await f.sync();
};
var transfer = async (previousSystem, targetSystem, transferList) => {
  if (!transferList)
    transferList = Array.from(previousSystem.files.list.values());
  const notTransferred = transferList.filter((f) => f.method != "transferred");
  if (notTransferred.length > 0) {
    if (!targetSystem) {
      const SystemConstructor = previousSystem.constructor;
      targetSystem = new SystemConstructor(void 0, {
        native: previousSystem.native,
        debug: previousSystem.debug,
        ignore: previousSystem.ignore,
        writable: true,
        progress: previousSystem.progress,
        codecs: previousSystem.codecs
      });
      await targetSystem.init();
    }
    console.warn(`Starting transfer of ${notTransferred.length} files from ${previousSystem.name} to ${targetSystem.name}`, transferList);
    const tic = performance.now();
    await Promise.all(notTransferred.map(async (f) => transferEach(f, targetSystem)));
    const toc = performance.now();
    console.warn(`Time to transfer files to ${targetSystem.name}: ${toc - tic}ms`);
    targetSystem.writable = false;
    await previousSystem.apply(targetSystem);
    await Promise.all(notTransferred.map(async (f) => f.save(true)));
  }
};
var transfer_default = transfer;
function isClass(obj = {}) {
  const isCtorClass = obj.constructor && obj.constructor.toString().substring(0, 5) === "class";
  if (obj.prototype === void 0) {
    return isCtorClass;
  }
  const isPrototypeCtorClass = obj.prototype.constructor && obj.prototype.constructor.toString && obj.prototype.constructor.toString().substring(0, 5) === "class";
  return isCtorClass || isPrototypeCtorClass;
}
var get2 = (path, rel = "") => {
  if (rel[rel.length - 1] === "/")
    rel = rel.slice(0, -1);
  let dirTokens = rel.split("/");
  if (dirTokens.length === 1 && dirTokens[0] === "")
    dirTokens = [];
  const potentialFile = dirTokens.pop();
  if (potentialFile) {
    const splitPath = potentialFile.split(".");
    if (splitPath.length == 1 || splitPath.length > 1 && splitPath.includes(""))
      dirTokens.push(potentialFile);
  }
  const pathTokens = path.split("/").filter((str) => !!str);
  const extensionTokens = pathTokens.filter((str) => {
    if (str === "..") {
      if (dirTokens.length == 0)
        console.error("Derived path is going out of the valid filesystem!");
      dirTokens.pop();
      return false;
    } else if (str === ".")
      return false;
    else
      return true;
  });
  const newPath = [...dirTokens, ...extensionTokens].join("/");
  return newPath;
};
var networkErrorMessages = ["Failed to fetch", "NetworkError when attempting to fetch resource.", "Network request failed"];
var isNetworkErrorMessage = (msg) => networkErrorMessages.includes(msg);
var isNetworkError = (error) => error.name === "TypeError" && isNetworkErrorMessage(error.message);
var getURL = (path) => {
  let url;
  try {
    url = new URL(path).href;
  } catch {
    url = get2(path, globalThis.location.href);
  }
  return url;
};
var handleFetch = async (path, options = {}, progressCallback) => {
  if (!options.mode)
    options.mode = "cors";
  const url = getURL(path);
  const response = await fetchRemote(url, options, progressCallback);
  if (!response)
    throw new Error("No response received.");
  const type7 = response.type.split(";")[0];
  return {
    url,
    type: type7,
    buffer: response.buffer
  };
};
var fetchRemote = async (url, options = {}, progressCallback) => {
  options.timeout = 3e3;
  const response = await fetchWithTimeout(url, options);
  return new Promise(async (resolve) => {
    if (response) {
      const type7 = response.headers.get("Content-Type");
      if (globalThis.FREERANGE_NODE) {
        const buffer = await response.arrayBuffer();
        resolve({ buffer, type: type7 });
      } else {
        const reader = response.body.getReader();
        const bytes = parseInt(response.headers.get("Content-Length"), 10);
        let bytesReceived = 0;
        let buffer = [];
        const processBuffer = async ({ done, value }) => {
          if (done) {
            const config = {};
            if (typeof type7 === "string")
              config.type = type7;
            const blob = new Blob(buffer, config);
            const ab = await blob.arrayBuffer();
            resolve({ buffer: new Uint8Array(ab), type: type7 });
            return;
          }
          bytesReceived += value.length;
          const chunk = value;
          buffer.push(chunk);
          if (progressCallback instanceof Function)
            progressCallback(response.headers.get("Range"), bytesReceived / bytes, bytes);
          return reader.read().then(processBuffer);
        };
        reader.read().then(processBuffer);
      }
    } else {
      console.warn("Response not received!", options.headers);
      resolve(void 0);
    }
  });
};
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8e3 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => {
    console.warn(`Request to ${resource} took longer than ${(timeout / 1e3).toFixed(2)}s`);
    controller.abort();
    throw new Error(`Request timeout`);
  }, timeout);
  const response = await globalThis.fetch(resource, {
    ...options,
    signal: controller.signal
  }).catch((e) => {
    clearTimeout(id);
    const networkError = isNetworkError(e);
    if (networkError) {
      throw new Error("No internet.");
    } else
      throw e;
  });
  clearTimeout(id);
  if (!response.ok) {
    if (response.status === 404)
      throw new Error(`Resource not found.`);
    else
      throw response;
  }
  return response;
}
var iterAsync = async (iterable, asyncCallback) => {
  const promises = [];
  let i = 0;
  for await (const entry of iterable) {
    promises.push(asyncCallback(entry, i));
    i++;
  }
  const arr = await Promise.all(promises);
  return arr;
};
var iterate_default = iterAsync;
var useRawArrayBuffer = ["nii", "nwb"];
var RangeFile = class {
  constructor(file, options) {
    this.rangeConfig = null;
    this.rangeSupported = false;
    this.createFile = async (buffer, oldFile = this.file, create = false) => {
      let newFile = new Blob([buffer], oldFile);
      newFile.lastModified = oldFile.lastModified;
      newFile.name = oldFile.name;
      newFile.webkitRelativePath = oldFile.webkitRelativePath || get2(this.path || this.name, this.system.root);
      if (create && !this.fileSystemHandle) {
        console.warn(`Native file handle for ${this.path} does not exist. Choosing a filesystem to mount...`);
        await transfer_default(this.system);
        return;
      }
      return newFile;
    };
    this.loadFileInfo = (file2 = this.file) => {
      if (file2) {
        this.name = file2.name;
        this.type = file2.type;
        const { mimeType, zipped: zipped2, suffix: suffix2 } = get(file2.type, file2.name, this.system.codecs);
        this.mimeType = mimeType;
        this.zipped = zipped2;
        this.suffix = suffix2;
      } else
        console.warn("Valid file object not provided...");
    };
    this.init = async (file2 = this.file) => {
      if (!file2 && this.fileSystemHandle) {
        file2 = await this.fileSystemHandle.getFile();
        this.loadFileInfo(file2);
      }
      const loader = this.system.codecs.get(this.mimeType);
      const rangeConfig = loader?.config;
      if (rangeConfig)
        this.rangeConfig = rangeConfig;
      else {
        if (!loader)
          console.warn(`Cannot find a configuration file for ${this.path}. Please provide the correct codec.`);
      }
      this.rangeSupported = !!this.rangeConfig;
      let converted = false;
      if (this.method != "remote") {
        this.storage = await this.getFileData(file2).catch(this.onError);
        if (!converted) {
          if (this.storage?.buffer)
            this.file = await this.createFile(this.storage.buffer);
          else if (this.debug)
            console.warn(`No buffer created for ${this.path}...`);
        }
      }
      await this.setupByteGetters();
    };
    this.setOriginal = async (reference = "body") => {
      if (this.rangeSupported) {
        this[`#original${reference}`] = null;
        if (this.debug)
          console.warn("Will not stringify bodies that support range requests.");
      } else if (isClass(this[`#${reference}`])) {
        this[`#original${reference}`] = null;
        if (this.debug)
          console.warn("Will not deep clone file bodies that are class instances");
      } else {
        try {
          const tic = performance.now();
          const value = await this[`#${reference}`];
          if (typeof this[`#${reference}`] === "object")
            this[`#original${reference}`] = JSON.parse(JSON.stringify(value));
          else
            this[`#original${reference}`] = value;
          const toc = performance.now();
          if (this.debug)
            console.warn(`Time to Deep Clone (${this.path}): ${toc - tic}ms`);
        } catch (e) {
          this[`#original${reference}`] = null;
          if (this.debug)
            console.warn("Could not deep clone", e);
        }
      }
    };
    this.get = async (ref = "body", codec) => {
      try {
        if (!this[`#${ref}`]) {
          const ticDecode = performance.now();
          const storageExists = this.storage.buffer;
          if (!storageExists && !this.rangeSupported)
            this.storage = await this.getFileData();
          this[`#${ref}`] = codec ? await codec.decode(this.storage, this.config) : await this.system.codecs.decode(this.storage, this.mimeType, this.file.name, this.config).catch(this.onError);
          const tocDecode = performance.now();
          if (this.debug)
            console.warn(`Time to Decode (${this.path}): ${tocDecode - ticDecode}ms`);
        }
        if (this[`#original${ref}`] === void 0)
          await this.setOriginal(ref);
        return this[`#${ref}`];
      } catch (e) {
        const msg = `Decoder failed for ${this.path} - ${this.mimeType || "No file type recognized"}`;
        if (this.debug)
          console.warn(msg, e);
        return {};
      }
    };
    this.set = (val, ref = "body") => this[`#${ref}`] = val;
    this.reencode = async (ref = "body", codec) => {
      try {
        const value = await this[`${ref}`];
        const modifiedString = JSON.stringify(value);
        const ogString = JSON.stringify(this[`#original${ref}`]);
        const different = modifiedString !== ogString;
        if (different) {
          if (this.debug)
            console.warn(`Synching file contents with buffer (${this.path})`, different ? `${ogString} > ${modifiedString}` : modifiedString);
          const toEncode = value ?? "";
          try {
            const ticEncode = performance.now();
            const buffer = codec ? await codec.encode(toEncode, this.config) : await this.system.codecs.encode(toEncode, this.mimeType, this.file.name, this.config);
            const tocEncode = performance.now();
            if (this.debug)
              console.warn(`Time to Encode (${this.path}): ${tocEncode - ticEncode}ms`);
            return buffer;
          } catch (e) {
            console.error("Could not encode as a buffer", toEncode, this.mimeType, this.zipped, codec);
            this.onError(e);
          }
        }
      } catch (e) {
        console.warn(e, this[`#${ref}`], this[`#original${ref}`]);
      }
    };
    this.sync = async (force = !(this.file instanceof Blob), create = void 0) => {
      if (this.rangeSupported) {
        if (this.debug)
          console.warn(`Write access is disabled for RangeFile with range-gettable properties (${this.path})`);
        return true;
      } else {
        const bodyEncoded = await this.reencode();
        const textEncoded = await this.reencode("text", text_exports);
        const toSave = bodyEncoded ?? textEncoded;
        if (force || toSave) {
          if (toSave)
            this.storage.buffer = toSave;
          const newFile = await this.createFile(this.storage.buffer, this.file, create);
          if (newFile)
            this.file = newFile;
          else {
            if (this.debug)
              console.warn(`New file not created for ${this.path}`);
            return;
          }
          if (toSave) {
            if (textEncoded)
              this["#body"] = null;
            if (bodyEncoded)
              this["#text"] = null;
          } else {
            await this.setOriginal();
            await this.setOriginal("text");
          }
          return this.file;
        } else
          return true;
      }
    };
    this.save = async (force = !!this.remote) => {
      const file2 = await this.sync(force, true);
      if (file2 instanceof Blob) {
        const writable = await this.fileSystemHandle.createWritable();
        const stream = file2.stream();
        const tic = performance.now();
        await stream.pipeTo(writable);
        const toc = performance.now();
        if (this.debug)
          console.warn(`Time to stream into file (${this.path}): ${toc - tic}ms`);
      }
      const dependents = this.system.dependents[this.path];
      if (dependents)
        await iterate_default(dependents.values(), async (f) => f["#body"] = null);
    };
    this.onError = (e) => {
      console.error(e);
    };
    this.getFromBytes = async (key, property = this.rangeConfig.properties[key], parent, i) => {
      if (property) {
        let start = await this.getProperty(property.start, parent, i);
        const length = await this.getProperty(property.length, parent, i);
        let bytes = new ArrayBuffer(0);
        if (this.method === "remote") {
          bytes = await this.getRemote({ start, length });
        } else {
          let tempBytes = [];
          if (!Array.isArray(start))
            start = [start];
          start.forEach((i2) => tempBytes.push(this.storage.buffer.slice(i2, i2 + length)));
          const totalLen = tempBytes.reduce((a, b) => a + b.length, 0);
          const tic2 = performance.now();
          let offset = 0;
          let uBytes = new Uint8Array(totalLen);
          tempBytes.forEach((arr) => {
            uBytes.set(arr, offset);
            offset += arr.length;
          });
          bytes = uBytes;
          const toc2 = performance.now();
          if (this.debug && start.length > 1)
            console.warn(`Time to merge arrays (${this.path}): ${toc2 - tic2}ms`);
        }
        const tic = performance.now();
        let output = property.ignoreGlobalPostprocess ? bytes : this.rangeConfig.preprocess(bytes);
        if (property.postprocess instanceof Function)
          output = await property.postprocess(output, this["#body"], i);
        const toc = performance.now();
        if (this.debug)
          console.warn(`Time to postprocess bytes (${this.path}, ${key}, ${start}-${start + length}): ${toc - tic}ms`);
        return output;
      } else {
        if (this.debug)
          console.warn(`No getter for ${key}`);
      }
    };
    this.getProperty = async (property, parent, i = void 0) => {
      if (property instanceof Function) {
        try {
          return property(this["#body"], parent, i).catch((e) => console.error(e));
        } catch {
          return property(this["#body"], parent, i);
        }
      } else
        return property;
    };
    this.defineProperty = async (key, property, parent, i = void 0) => {
      if ("start" in property && property.length) {
        Object.defineProperties(parent, {
          [key]: {
            enumerable: true,
            get: () => {
              if (!parent[`#${key}`])
                parent[`#${key}`] = this.getFromBytes(key, property, parent, i);
              return parent[`#${key}`];
            }
          },
          [`#${key}`]: {
            writable: true,
            enumerable: false
          }
        });
      } else if (property.n && property.properties) {
        this["#body"][key] = [];
        const n = await this.getProperty(property.n, property);
        for (let i2 = 0; i2 < n; i2++) {
          const value = {};
          Object.defineProperty(value, "n", { get: () => n });
          for (let prop in property.properties) {
            await this.defineProperty(prop, property.properties[prop], value, i2);
          }
          this["#body"][key].push(value);
        }
      }
    };
    this.setupByteGetters = async () => {
      if (!("body" in this)) {
        Object.defineProperties(this, {
          ["body"]: {
            enumerable: true,
            get: async () => this.get(),
            set: (val) => this.set(val)
          },
          [`#body`]: {
            writable: true,
            enumerable: false
          }
        });
      }
      if (!("text" in this)) {
        Object.defineProperties(this, {
          ["text"]: {
            enumerable: true,
            get: async () => this.get("text", text_exports),
            set: (val) => this.set(val, "text")
          },
          [`#text`]: {
            writable: true,
            enumerable: false
          }
        });
      }
      this["#body"] = "";
      this["#text"] = "";
      if (this.rangeSupported) {
        this[`#body`] = {};
        for (let key in this.rangeConfig.properties)
          await this.defineProperty(key, this.rangeConfig.properties[key], this["#body"]);
        if (this.rangeConfig.metadata instanceof Function)
          await this.rangeConfig.metadata(this["#body"], this.rangeConfig);
      }
    };
    this.apply = async (newFile, applyData = true) => {
      if (!this.fileSystemHandle) {
        this.fileSystemHandle = newFile.fileSystemHandle;
        this.method = "transferred";
      }
      if (applyData)
        await this.init(newFile.file);
      this["#body"] = null;
      this["#text"] = null;
    };
    this.getRemote = async (property = {}) => {
      let { start, length } = property;
      const options2 = Object.assign({}, this.remoteOptions);
      if (!Array.isArray(start))
        start = [start];
      if (start.length < 1)
        return new Uint8Array();
      else {
        const isDefined = start[0] != void 0;
        if (isDefined) {
          let Range = `bytes=${start.map((val) => `${length ? `${val}-${val + length - 1}` : val}`).join(", ")}`;
          const maxHeaderLength = 15e3;
          if (Range.length > maxHeaderLength) {
            const splitRange = Range.slice(0, maxHeaderLength).split(", ");
            console.warn(`Only sending ${splitRange.length - 1} from ${start.length} range requests to remain under the --max-http-header-size=${1600} limit`);
            Range = splitRange.slice(0, splitRange.length - 1).join(", ");
          }
          options2.headers = Object.assign({ Range }, options2.headers);
        }
        const o = await fetchRemote(get2(this.remote.path, this.remote.origin), options2);
        return o.buffer;
      }
    };
    this.getFileData = (file2 = this.file) => {
      return new Promise(async (resolve, reject) => {
        if (this.method === "remote") {
          const buffer = await this.getRemote();
          this.file = file2 = await this.createFile(buffer);
          resolve({ file: file2, buffer });
        } else {
          this.file = file2;
          let method = "buffer";
          if (file2.type && (file2.type.includes("image/") || file2.type.includes("video/")))
            method = "dataurl";
          if (globalThis.FREERANGE_NODE) {
            const methods = {
              "dataurl": "dataURL",
              "buffer": "arrayBuffer"
            };
            const data = await file2[methods[method]]();
            resolve({ file: file2, [method]: this.handleData(data) });
          } else {
            const methods = {
              "dataurl": "readAsDataURL",
              "buffer": "readAsArrayBuffer"
            };
            const reader = new FileReader();
            reader.onloadend = (e) => {
              if (e.target.readyState == FileReader.DONE) {
                if (!e.target.result)
                  return reject(`No result returned using the ${method} method on ${this.file.name}`);
                let data = e.target.result;
                resolve({ file: file2, [method]: this.handleData(data) });
              } else if (e.target.readyState == FileReader.EMPTY) {
                if (this.debug)
                  console.warn(`${this.file.name} is empty`);
                resolve({ file: file2, [method]: new Uint8Array() });
              }
            };
            reader[methods[method]](file2);
          }
        }
      });
    };
    this.handleData = (data) => {
      if ((data["byteLength"] ?? data["length"]) === 0) {
        if (this.debug)
          console.warn(`${this.file.name} appears to be empty`);
        return new Uint8Array();
      } else if (data instanceof ArrayBuffer && !useRawArrayBuffer.includes(this.suffix))
        return new Uint8Array(data);
      else
        return data;
    };
    if (file.constructor.name === "FileSystemFileHandle")
      this.fileSystemHandle = file;
    else
      this.file = file;
    this.config = options;
    this.debug = options.debug;
    this.system = options.system;
    this.path = options.path;
    this.method = file.origin != void 0 && file.path != void 0 ? "remote" : "native";
    if (this.method === "remote") {
      this.remote = file;
      const split = file.path.split("/");
      file.name = split[split.length - 1];
      this.remoteOptions = file.options;
      this.type = null;
    }
    if (this.file)
      this.loadFileInfo(this.file);
    this.storage = {};
    this.rangeSupported = false;
    this[`#originalbody`] = void 0;
    this[`#originaltext`] = void 0;
  }
};
var codecs_exports = {};
__export2(codecs_exports, {
  csv: () => csv_exports,
  gzip: () => gzip_exports,
  js: () => js_exports,
  json: () => json_exports,
  text: () => text_exports,
  tsv: () => tsv_exports
});
var json_exports = {};
__export2(json_exports, {
  decode: () => decode4,
  encode: () => encode5,
  suffixes: () => suffixes3,
  type: () => type3
});
var type3 = "application/json";
var suffixes3 = "json";
var encode5 = (o) => encode2(JSON.stringify(o));
var decode4 = (o) => {
  const textContent = !o.text ? decode2(o) : o.text;
  return JSON.parse(textContent || `{}`);
};
var tsv_exports = {};
__export2(tsv_exports, {
  decode: () => decode6,
  encode: () => encode7,
  suffixes: () => suffixes5,
  type: () => type5
});
var csv_exports = {};
__export2(csv_exports, {
  decode: () => decode5,
  encode: () => encode6,
  suffixes: () => suffixes4,
  type: () => type4
});
var stripBOM = (str) => str.replace(/^\uFEFF/, "");
var normalizeEOL = (str) => str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
var isContentfulRow = (row) => row && !/^\s*$/.test(row);
var addBOM = (str) => `\uFEFF${str}`;
var suffixes4 = "csv";
var type4 = "text/csv";
var encode6 = (arr, separator) => {
  const rows = arr.length ? [Object.keys(arr[0]), ...arr.map((o) => Object.values(o))] : [];
  let content = rows.map((row) => row.join(separator)).join("\n");
  content = addBOM(content);
  return new TextEncoder().encode(content);
};
var decode5 = (o, separator = ",") => {
  if (!o.text)
    o.text = new TextDecoder().decode(o.buffer);
  let contents = o.text;
  const collection = [];
  contents = stripBOM(contents);
  const rows = normalizeEOL(contents).split("\n").filter(isContentfulRow).map((str) => str.split(separator));
  const headers = rows.length ? rows.splice(0, 1)[0] : [];
  rows.forEach((arr, i) => {
    let strObject = `{`;
    strObject += arr.map((val, j) => {
      try {
        const parsed = JSON.parse(val);
        return `"${headers[j]}":${parsed}`;
      } catch {
        return `"${headers[j]}":"${val}"`;
      }
    }).join(",");
    strObject += "}";
    collection.push(strObject);
  });
  return collection.map((v) => JSON.parse(v));
};
var type5 = "text/tab-separated-values";
var suffixes5 = "tsv";
var encode7 = (arr) => encode6(arr, "	");
var decode6 = (arr) => decode5(arr, "	");
var js_exports = {};
__export2(js_exports, {
  decode: () => decode7,
  encode: () => encode8,
  suffixes: () => suffixes6,
  type: () => type6
});
var objToString = (obj) => {
  let ret = "{";
  for (let k in obj) {
    let v = obj[k];
    if (typeof v === "function") {
      v = v.toString();
    } else if (v instanceof Array) {
      v = JSON.stringify(v);
    } else if (typeof v === "object" && !!v) {
      v = objToString(v);
    } else if (typeof v === "string") {
      v = `"${v}"`;
    } else {
      v = `${v}`;
    }
    ret += `
  "${k}": ${v},`;
  }
  ret += "\n}";
  return ret;
};
var re = /import([ \n\t]*(?:\* (?:as .*))?(?:[^ \n\t\{\}]+[ \n\t]*,?)?(?:[ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)from[ \n\t]*(['"])([^'"\n]+)(?:['"])([ \n\t]*assert[ \n\t]*{type:[ \n\t]*(['"])([^'"\n]+)(?:['"])})?/g;
var esmImport = async (text) => {
  const moduleDataURI = "data:text/javascript;base64," + btoa(text);
  let imported = await import(moduleDataURI);
  if (imported.default && Object.keys(imported).length === 1)
    imported = imported.default;
  return imported;
};
var safeESMImport = async (text, config = {}, onBlob) => {
  try {
    return await esmImport(text);
  } catch (e) {
    console.warn(`${config.path} contains ES6 imports. Manually importing these modules...`);
    const base2 = get2("", config.path);
    const needsRoot = config.system.root && !config.system.native;
    let childBase = needsRoot ? get2(base2, config.system.root) : base2;
    const importInfo = {};
    let m;
    do {
      m = re.exec(text);
      if (m == null)
        m = re.exec(text);
      if (m) {
        text = text.replace(m[0], ``);
        const variables = m[1].trim().split(",");
        importInfo[m[3]] = variables;
      }
    } while (m);
    for (let path in importInfo) {
      let correctPath = get2(path, childBase);
      const variables = importInfo[path];
      let existingFile = config.system.files.list.get(get2(correctPath));
      if (!existingFile?.file) {
        const info = await handleFetch(correctPath);
        let blob = new Blob([info.buffer], { type: info.type });
        existingFile = await config.system.load(blob, correctPath);
      }
      config.system.trackDependency(correctPath, config.path);
      let imported = await existingFile.body;
      if (variables.length > 1) {
        variables.forEach((str) => {
          text = `const ${str} = ${objToString(imported[str])}
${text}`;
        });
      } else {
        text = `const ${variables[0]} = ${objToString(imported)}
${text}`;
      }
    }
    const tryImport = await esmImport(text);
    return tryImport;
  }
};
var import_default = safeESMImport;
var type6 = "application/javascript";
var suffixes6 = "js";
var encode8 = () => void 0;
var decode7 = async (o, config) => {
  const textContent = !o.text ? await decode2(o) : o.text;
  const imported = await import_default(textContent, config);
  if (imported)
    return imported;
  else
    return textContent;
};
var Codecs = class {
  constructor(codecsInput) {
    this.suffixToType = {};
    this.collection = /* @__PURE__ */ new Map();
    this.add = (codec) => {
      this.collection.set(codec.type, codec);
      let suffixes72 = codec.suffixes ? codec.suffixes : codec.type.split("-").splice(-1)[0];
      if (!Array.isArray(suffixes72))
        suffixes72 = [suffixes72];
      suffixes72.forEach((suffix2) => this.suffixToType[suffix2] = codec.type);
    };
    this.get = (mimeType) => this.collection.get(mimeType);
    this.getType = (suffix2) => {
      let k = Object.keys(this.suffixToType).find((k2) => suffix2.slice(-k2.length) === k2);
      return this.suffixToType[k];
    };
    this.decode = (o, type7, name2, config) => decode_default(o, type7, name2, config, void 0, this);
    this.encode = (o, type7, name2, config) => encode_default(o, type7, name2, config, void 0, this);
    this.hasDependencies = (file) => {
      return file.mimeType === "application/javascript";
    };
    if (!Array.isArray(codecsInput))
      codecsInput = [codecsInput];
    codecsInput.forEach((codecs) => {
      if (codecs instanceof Codecs)
        codecs.collection.forEach(this.add);
      else
        for (let key in codecs)
          this.add(codecs[key]);
    });
  }
};
var deepClone = (o = {}) => {
  return JSON.parse(JSON.stringify(o));
};
var clone_default = deepClone;
var open = async (path, config) => {
  config = Object.assign({}, config);
  const useNative = !!config.system?.native;
  let file = config.system.files.list.get(path);
  if (file)
    return file;
  else {
    if (useNative && config.system.openNative instanceof Function)
      file = await config.system.openNative(path, config);
    else
      file = await config.system.openRemote(path, config);
    if (file)
      return file;
  }
};
var open_default = open;
var createFile = (file = {}, path, system) => {
  return Object.assign(file, {
    origin: system.root,
    path,
    options: {
      mode: "cors"
    }
  });
};
var load = async (file, config) => {
  let { path, system, codecs, debug } = config;
  if (!path)
    path = file.webkitRelativePath ?? file.relativePath ?? file.path ?? "";
  config.path = path;
  let fileConfig = config;
  if (!(file instanceof RangeFile)) {
    if (system.native) {
      if (file.constructor.name !== "FileSystemFileHandle") {
        const openInfo = await open_default(path, {
          path,
          system,
          create: config.create,
          codecs,
          debug
        });
        if (openInfo && openInfo.constructor.name === "FileSystemDirectoryHandle") {
          file = openInfo;
        }
      }
    } else {
      if (fileConfig.system.root) {
        const directoryPath = new URL(fileConfig.system.root).pathname.split("/");
        const url = new URL(fileConfig.path);
        path = file.path = fileConfig.path = url.pathname.split("/").filter((str, i) => directoryPath?.[i] != str).join("/");
      } else
        path = file.path = fileConfig.path;
    }
    file = new RangeFile(file, fileConfig);
    await file.init();
  }
  system.add(file);
  return file;
};
var createFile2 = (file = {}, path, system) => {
  if (system.native)
    return file;
  else
    return createFile(file, path, system);
};
var saveEach = async (rangeFile, config, counter, length) => {
  await rangeFile.save(config.force);
  counter = counter + 1;
  if (config.progressCallback instanceof Function)
    config.progressCallback(config.name, counter / length, length);
};
var save = (name2, files, force, progressCallback) => {
  let length = files;
  return new Promise(async (resolve, reject) => {
    let i = 0;
    const firstFile = files.shift();
    await saveEach(firstFile, { progressCallback, name: name2, force }, i, length);
    await iterate_default(files, (f) => saveEach(f, { progressCallback, name: name2, force }, i, length));
    resolve();
  });
};
var save_default = save;
var openRemote = async (path, config) => {
  let {
    system
  } = config;
  return await handleFetch(path).then(async (info) => {
    const splitURL = info.url.split("/");
    const fileName = splitURL.pop();
    let blob = new Blob([info.buffer], { type: info.type });
    blob.name = fileName;
    const file = createFile(blob, info.url, system);
    const rangeFile = await system.load(file, info.url);
    return rangeFile;
  });
};
var open_default2 = openRemote;
var mountRemote = async (url, config) => {
  let filePath;
  await handleFetch(url, void 0, config.progress).then(async (response) => {
    if (response.type === "application/json") {
      config.system.name = config.system.root = filePath = response.url;
      const datasets = JSON.parse(new TextDecoder().decode(response.buffer));
      let files = [];
      const drill = (o) => {
        for (let key in o) {
          const target = o[key];
          if (typeof target === "string") {
            const path = `${response.url}/${target}`;
            const file = createFile(void 0, path, config.system);
            files.push({ file, path });
          } else
            drill(target);
        }
      };
      drill(datasets);
      let filesIterable = files.entries();
      await iterate_default(filesIterable, async ([i, { file, path }]) => await config.system.load(file, path));
    } else
      throw "Endpoint is not a freerange filesystem!";
  }).catch((e) => {
    throw "Unable to connect to freerange filesystem!";
  });
  return filePath;
};
var mount_default = mountRemote;
var isURL = (path) => {
  try {
    const url = new URL(path);
    return true;
  } catch {
    return false;
  }
};
var System = class {
  constructor(name2, systemInfo = {}) {
    this.dependencies = {};
    this.dependents = {};
    this.changelog = [];
    this.files = {};
    this.ignore = [];
    this.groups = {};
    this.groupConditions = /* @__PURE__ */ new Set();
    this.init = async () => {
      let mountConfig = {
        system: this,
        progress: this.progress
      };
      if (this.isNative(this.name)) {
        const native = await this.mountNative(this.name, mountConfig);
        if (!native)
          console.error("Unable to mount native filesystem!");
        else {
          if (this.oninit instanceof Function)
            this.oninit(native);
        }
      } else {
        const path = this.name;
        const isURL2 = isURL(path);
        const fileName = name(path);
        const suffix2 = suffix(path);
        if (isURL2) {
          if (fileName && suffix2) {
            const path2 = this.name;
            this.root = directory(path2);
            const file = await this.open(fileName);
            await file.body;
          } else {
            await this.mountRemote(this.name, mountConfig).catch((e) => console.warn("System initialization failed.", e));
          }
        } else if (this.name)
          this.root = "";
        if (this.oninit instanceof Function)
          this.oninit(this.name);
      }
    };
    this.addGroup = (name22, initial, condition) => {
      this.files[name22] = initial;
      this.groups[name22] = this.cloneGroup({ initial, condition });
      this.groupConditions.add(condition);
    };
    this.cloneGroup = (o) => {
      let newO = { condition: o.condition };
      if (o.initial instanceof Map)
        newO.initial = new Map(o.initial);
      else
        newO.initial = clone_default(o.initial);
      return newO;
    };
    this.subsystem = async (path) => {
      const split = path.split("/");
      const name22 = split[split.length - 1];
      const subDir = split.shift();
      path = split.join("/");
      let target = this.files.system[subDir];
      split.forEach((str) => target = target[str]);
      const systemConstructor = this.constructor;
      const system = new systemConstructor(name22, {
        native: this.native,
        debug: this.debug,
        ignore: this.ignore,
        writable: this.writable,
        progress: this.progress,
        codecs: this.codecs
      });
      await system.init();
      let drill = async (target2, base2) => {
        for (let key in target2) {
          const newBase = get2(key, base2);
          const file = target2[key];
          if (file instanceof RangeFile)
            await system.load(file, get2(key, base2));
          else
            await drill(file, newBase);
        }
      };
      await drill(target, path);
      return system;
    };
    this.reset = () => {
      this.changelog = [];
      this.files = this.createFileSystemInfo();
    };
    this.createFileSystemInfo = () => {
      const files = {};
      for (let name22 in this.groups) {
        let group = this.groups[name22];
        const groupInfo = this.cloneGroup(group);
        files[name22] = groupInfo.initial;
      }
      return files;
    };
    this.checkToLoad = (path) => {
      const split = path.split("/");
      const fileName = split.pop();
      const toLoad = this.ignore.reduce((a, b) => {
        if (fileName === b)
          return a * 0;
        else if (path.includes(`${b}/`))
          return a * 0;
        else
          return a * 1;
      }, 1);
      return toLoad;
    };
    this.load = async (file, path, dependent) => {
      const existingFile = this.files.list.get(path);
      if (existingFile)
        return existingFile;
      else {
        if (!file.name)
          file.name = name(path);
        if (!this.native)
          file = createFile(file, path, this);
        const toLoad = this.checkToLoad(file.path ?? path);
        if (toLoad) {
          const rangeFile = await load(file, {
            path,
            system: this,
            debug: this.debug,
            codecs: this.codecs,
            create: this.writable
          });
          if (dependent) {
            if (!this.dependencies[dependent])
              this.dependencies[dependent] = /* @__PURE__ */ new Map();
            this.dependencies[dependent].set(rangeFile.path, rangeFile);
            if (!this.dependents[rangeFile.path])
              this.dependents[rangeFile.path] = /* @__PURE__ */ new Map();
            const file2 = this.files.list.get(dependent);
            this.dependents[rangeFile.path].set(file2.path, file2);
          }
          return rangeFile;
        } else
          console.warn(`Ignoring ${file.name}`);
      }
    };
    this.trackDependency = (path, dependent) => {
      const rangeFile = this.files.list.get(path);
      if (!this.dependencies[dependent])
        this.dependencies[dependent] = /* @__PURE__ */ new Map();
      this.dependencies[dependent].set(path, rangeFile);
      if (!this.dependents[path])
        this.dependents[path] = /* @__PURE__ */ new Map();
      const file = this.files.list.get(dependent);
      this.dependents[path].set(file.path, file);
    };
    this.add = (file) => {
      if (!this.files.list.has(file.path)) {
        this.groupConditions.forEach((func) => func(file, file.path, this.files));
      } else
        console.warn(`${file.path} already exists in the ${this.name} system!`);
    };
    this.isNative = () => false;
    this.openRemote = open_default2;
    this.mountRemote = mount_default;
    this.open = async (path, create) => {
      if (!this.native)
        path = get2(path, this.root);
      const rangeFile = await open_default(path, {
        path,
        debug: this.debug,
        system: this,
        create: create ?? this.writable,
        codecs: this.codecs
      });
      return rangeFile;
    };
    this.save = async (force, progress = this.progress) => await save_default(this.name, Array.from(this.files.list.values()), force, progress);
    this.sync = async () => await iterate_default(this.files.list.values(), async (entry) => await entry.sync());
    this.transfer = async (target) => await transfer_default(this, target);
    this.apply = async (system) => {
      this.name = system.name;
      if (system.native)
        this.native = system.native;
      if (system.debug)
        this.debug = system.debug;
      if (system.ignore)
        this.ignore = system.ignore ?? [];
      if (system.writable)
        this.writable = system.writable;
      if (system.progress)
        this.progress = system.progress;
      if (system.codecs instanceof Codecs)
        this.codecs = system.codecs;
      else
        this.codecs = new Codecs([codecs_exports, system.codecs]);
      const files = system.files?.list;
      if (files) {
        await iterate_default(Array.from(files.values()), async (newFile) => {
          console.log("NewFile", newFile);
          const path = newFile.path;
          let f = this.files.list.get(newFile.path);
          if (!f)
            await this.load(newFile, path);
          else
            await f.apply(newFile, false);
        });
      }
      this.root = system.root;
    };
    const info = Object.assign({}, systemInfo);
    this.apply(Object.assign(info, { name: name2 }));
    this.addGroup("system", {}, (file, path, files) => {
      let target = files.system;
      let split = path.split("/");
      split = split.slice(0, split.length - 1);
      if (path)
        split.forEach((k, i) => {
          if (!target[k])
            target[k] = {};
          target = target[k];
        });
      target[file.name] = file;
    });
    this.addGroup("types", {}, (file, _, files) => {
      const suffix2 = file.suffix ?? file.name;
      if (suffix2) {
        if (!files.types[suffix2])
          files.types[suffix2] = [];
        files.types[suffix2].push(file);
      }
    });
    this.addGroup("n", 0, (_, __, files) => files.n++);
    this.addGroup("list", /* @__PURE__ */ new Map(), (file, _, files) => files.list.set(file.path, file));
  }
};
var openNative = async (path, config) => {
  let nativeHandle = config.system.native;
  let fileSystem = config.system?.files?.["system"];
  let { system, create } = config;
  let pathTokens = path.split("/");
  let fileName = config.type === "directory" ? null : pathTokens.pop();
  pathTokens = pathTokens.filter((f) => !!f);
  if (pathTokens.length > 0) {
    for (const token of pathTokens) {
      const handle = await nativeHandle.getDirectoryHandle(token, { create }).catch((e) => {
        if (create)
          console.warn(`${token} is an invalid file system handle`, e);
        else
          console.warn(`Directory ${token} does not already exist.`);
      });
      if (handle) {
        nativeHandle = handle;
        if (!fileSystem[token])
          fileSystem[token] = {};
        if (!(fileSystem[token] instanceof RangeFile))
          fileSystem = fileSystem[token];
      }
    }
  }
  if (fileName) {
    let existingFile = fileSystem[fileName];
    if (!(existingFile instanceof RangeFile)) {
      const fileHandle = await nativeHandle.getFileHandle(fileName, { create }).catch((e) => {
        if (config.create)
          console.warn(`Could not create ${fileName}. There may be a directory of the same name...`, e);
        else
          console.warn(`No file found at ${path}.`);
      });
      if (!fileHandle)
        return;
      const file = createFile2(fileHandle, path, system);
      existingFile = await system.load(file, path);
    }
    return existingFile;
  } else
    return nativeHandle;
};
var open_default3 = openNative;
var verifyPermission = async (fileHandle, withWrite = false) => {
  const opts = {};
  if (withWrite)
    opts.mode = "readwrite";
  const state2 = await fileHandle.queryPermission(opts);
  if (await state2 === "granted")
    return true;
  const requestState = await fileHandle.requestPermission(opts);
  if (requestState === "granted")
    return true;
  return false;
};
var verify_default = verifyPermission;
var onhandle = async (handle, base2 = "", system, progressCallback = void 0) => {
  await verify_default(handle, true);
  if (handle.name != system.name)
    base2 = base2 ? get2(handle.name, base2) : handle.name;
  const files = [];
  if (handle.kind === "file") {
    if (progressCallback instanceof Function)
      files.push({ handle, base: base2 });
    else
      await system.load(handle, base2);
  } else if (handle.kind === "directory") {
    const arr = await iterate_default(handle.values(), (entry) => {
      return onhandle(entry, base2, system, progressCallback);
    });
    files.push(...arr.flat());
  }
  if (!base2) {
    let count = 0;
    await iterate_default(files, async (o) => {
      await system.load(o.handle, o.base);
      count++;
      progressCallback(system.name, count / files.length, files.length);
    });
  }
  return files;
};
var mountNative = async (handle, config) => {
  if (!handle)
    handle = await window.showDirectoryPicker();
  if (config?.system) {
    config.system.name = config.system.root = handle.name;
    config.system.native = handle;
  }
  await onhandle(handle, null, config?.system, config?.progress);
  return handle;
};
var mount_default2 = mountNative;
function idbReady() {
  var isSafari = !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent);
  if (!isSafari || !indexedDB.databases)
    return Promise.resolve();
  var intervalId;
  return new Promise(function(resolve) {
    var tryIdb = function() {
      return indexedDB.databases().finally(resolve);
    };
    intervalId = setInterval(tryIdb, 100);
    tryIdb();
  }).finally(function() {
    return clearInterval(intervalId);
  });
}
var dist_default = idbReady;
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.oncomplete = request.onsuccess = () => resolve(request.result);
    request.onabort = request.onerror = () => reject(request.error);
  });
}
function createStore(dbName, storeName) {
  const dbp = dist_default().then(() => {
    const request = indexedDB.open(dbName);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    return promisifyRequest(request);
  });
  return (txMode, callback) => dbp.then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)));
}
var defaultGetStoreFunc;
function defaultGetStore() {
  if (!defaultGetStoreFunc) {
    defaultGetStoreFunc = createStore("keyval-store", "keyval");
  }
  return defaultGetStoreFunc;
}
function get3(key, customStore = defaultGetStore()) {
  return customStore("readonly", (store) => promisifyRequest(store.get(key)));
}
function set(key, value, customStore = defaultGetStore()) {
  return customStore("readwrite", (store) => {
    store.put(value, key);
    return promisifyRequest(store.transaction);
  });
}
var cacheName = `freerange-history`;
var maxHistory = 10;
var setCache = async (info) => {
  let history = await get3(cacheName);
  if (!history)
    history = [info];
  else if (!history.includes(info)) {
    history.push(info);
    if (history.length > maxHistory)
      history.shift();
  }
  console.log(cacheName, history);
  set(cacheName, history);
};
var LocalSystem = class extends System {
  constructor(name2, info) {
    super(name2, info);
    this.isNative = (info2) => !info2 || info2 instanceof FileSystemDirectoryHandle;
    this.openNative = open_default3;
    this.mountNative = mount_default2;
    this.oninit = setCache;
  }
};

// src/editable/Plugins.ts
var base = ".brainsatplay";
var suffixes7 = {
  metadata: "metadata.json",
  graph: "graph.json",
  plugins: "plugins.json"
};
var regexp = {};
Object.keys(suffixes7).forEach((k) => {
  regexp[k] = new RegExp(`${base}/(.+).${suffixes7[k]}`, "g");
});
var Plugins = class {
  constructor(source = "https://raw.githubusercontent.com/brainsatplay/awesome-brainsatplay/main/plugins.js") {
    this.readyState = false;
    this.checkedPackageLocations = {};
    this.list = /* @__PURE__ */ new Set();
    this.base = base;
    this.suffixes = suffixes7;
    this.regexp = regexp;
    this.init = async () => {
      if (!this.filesystem) {
        this.filesystem = new LocalSystem("plugins", {
          ignore: ["DS_Store"]
        });
        await this.filesystem.init();
        const file = await this.filesystem.open(this.source);
        const plugins = await file.body;
        for (let key in plugins) {
          this.list.add(key);
          const path = plugins[key];
          this["#plugins"][key] = { path };
        }
      } else {
        this.filesystem.files.list.forEach((f) => this.set(f));
      }
      this.filesystem.addGroup("plugins", void 0, (f) => this.set(f));
      this.readyState = true;
    };
    this.set = (f) => {
      this.list.add(f.path);
      this["#plugins"][f.path] = {
        path: f.path,
        module: f
      };
      this.metadata(f.path);
    };
    this.getFile = async (url) => {
      return await this.filesystem.open(url);
    };
    this.package = async (name2) => {
      if (this["#plugins"][name2]) {
        let path = this.getPath(name2);
        const splitPath = path.split("/").slice(0, -1);
        let packageFile;
        do {
          try {
            path = splitPath.length ? `${splitPath.join("/")}/package.json` : "package.json";
            if (this.checkedPackageLocations[path] !== false) {
              this.checkedPackageLocations[path] = false;
              packageFile = this["#plugins"][name2].package ?? await this.getFile(path);
              this.checkedPackageLocations[path] = true;
            }
          } catch (e) {
          }
          if (splitPath.length === 0)
            break;
          splitPath.pop();
        } while (!packageFile);
        if (packageFile) {
          this["#plugins"][name2].package = packageFile;
          return await this["#plugins"][name2].package.body;
        } else
          return {};
      } else {
        console.warn(`No package for ${name2}.`);
        return {};
      }
    };
    this.get = async (name2, type7 = "metadata") => {
      if (type7 === "module")
        return await this.module(name2);
      else {
        let path = this.getPath(name2);
        if (this["#plugins"][name2] && !path.includes(this.base) && !path.includes("package.json")) {
          let path2 = this.getPath(name2);
          const thisPath = this.path(path2, type7);
          if (!path2.includes(thisPath))
            path2 = thisPath;
          const file = this["#plugins"][name2][type7] ?? await this.getFile(path2);
          if (file) {
            this["#plugins"][name2][type7] = file;
            const imported = await file.body;
            if (type7 === "plugins") {
              const pkg = await this.package(name2);
              const imports = {};
              for (name2 in imported) {
                const path3 = imported[name2];
                const file2 = await this.getFile(join(getBase(pkg.main), path3));
                imports[name2] = await file2.body;
              }
              return imports;
            }
            return imported;
          } else
            return {};
        } else {
          console.warn(`No ${type7} for ${name2}.`);
          return {};
        }
      }
    };
    this.metadata = async (name2) => await this.get(name2, "metadata");
    this.plugins = async (name2) => await this.get(name2, "plugins");
    this.graph = async (name2) => await this.get(name2, "graph");
    this.getPath = (name2) => {
      const base2 = this["#plugins"][name2]?.module?.path ?? this["#plugins"][name2]?.path ?? name2;
      return base2.split("/").filter((v) => v != "").join("/");
    };
    this.path = (path, type7 = "metadata") => {
      if (this.regexp[type7].test(path))
        return path;
      else {
        const splitPath = path.split("/");
        const fullFileName = splitPath.pop();
        if (fullFileName) {
          const filePrefix = fullFileName.split(".").at(-2);
          return `${splitPath.join("/")}/${this.base}/${filePrefix}.${this.suffixes[type7]}`;
        } else {
          console.warn("Something went wrong...");
          return path;
        }
      }
    };
    this.module = async (name2) => {
      let path = this.getPath(name2);
      let isMetadata = false;
      const match = path.match(this.regexp.metadata)?.[0];
      if (match) {
        name2 = name2.replace(match, `${match.split("/").at(-1).split(".")[0]}.js`);
        isMetadata = true;
      }
      if (this["#plugins"][name2]) {
        const path2 = this.getPath(name2);
        const pluginModule = this["#plugins"][name2].module ?? await this.getFile(path2);
        if (pluginModule) {
          this["#plugins"][name2].module = pluginModule;
          if (isMetadata)
            return await this.metadata(name2);
          else
            return await this["#plugins"][name2].module.body;
        } else
          return {};
      } else {
        console.error(`Module for ${name2} not found.`);
        return {};
      }
    };
    if (typeof source === "string")
      this.source = source;
    else {
      this.source = source.name;
      this.filesystem = source;
    }
    this["#plugins"] = {};
  }
};
"#plugins";

// src/editable/App.ts
var EditableApp = class {
  constructor(input, options = {}) {
    this.ignore = [".DS_Store", ".git"];
    this.debug = false;
    this.options = {
      ignore: [".DS_Store", ".git"],
      debug: false
    };
    this.packagePath = "/package.json";
    this.parentNode = document.body;
    this.compile = async () => {
      const packageContents = await (await this.filesystem.open("package.json")).body;
      if (packageContents) {
        const file = await this.filesystem.open(packageContents.main);
        this.plugins = new Plugins(this.filesystem);
        await this.plugins.init();
        if (file) {
          const main = await this.plugins.get(packageContents.main, "module");
          const mainGraph = await this.plugins.get(packageContents.main, "graph");
          this.active.setPackage(packageContents);
          await this.active.setInfo(main);
          await this.active.setTree(mainGraph);
        } else
          console.error('The "main" field in the supplied package.json is not pointing to an appropriate entrypoint.');
      }
    };
    this.join = join;
    this.createFilesystem = async (input = this.filesystem, options = this.options) => {
      try {
        new URL(input ?? "").href;
        input = this.join(input, this.packagePath);
      } catch {
      }
      let clonedOptions = Object.assign({}, options);
      let system = new LocalSystem(input, clonedOptions);
      return await system.init().then(() => system).catch(() => void 0);
    };
    this.setParent = (parentNode) => {
      if (parentNode instanceof HTMLElement) {
        this.parentNode = parentNode;
      } else
        console.warn("Input is not a valid HTML element", parentNode);
    };
    this.start = async (input = this.filesystem) => {
      this.filesystem = input;
      await this.stop();
      const system = await this.createFilesystem(input);
      this.active = new App(void 0, this.options);
      if (system) {
        this.filesystem = system;
        this.active.compile = this.compile;
      } else {
        this.active.set(input);
        delete this.filesystem;
        delete this.compile;
      }
      this.active.setParent(this.parentNode);
      this.active.onstart = this.onstart;
      this.active.onstop = this.onstop;
      return await this.active.start();
    };
    this.stop = async () => {
      if (this.active)
        await this.active.stop();
    };
    this.save = async () => {
      await this.stop();
      if (this.filesystem)
        await this.filesystem.save();
      await this.active.start();
    };
    this.filesystem = input;
    this.options = Object.assign(this.options, options);
  }
};
export {
  App,
  Plugins,
  editable_exports as editable
};
/*! pako 2.0.4 https://github.com/nodeca/pako @license (MIT AND Zlib) */
