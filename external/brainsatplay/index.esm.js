var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../external/graphscript/Graph.ts
function getFnParamInfo(fn) {
  var fstr = fn.toString();
  const matches = fstr.match(/\(.*?\)/)[0].replace(/[()]/gi, "").replace(/\s/gi, "").split(",");
  const info = /* @__PURE__ */ new Map();
  matches.forEach((v) => {
    const arr = v.split("=");
    if (arr[0])
      info.set(arr[0], (0, eval)(arr[1]));
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
  nodes = /* @__PURE__ */ new Map();
  arguments = /* @__PURE__ */ new Map();
  tag;
  parent;
  children;
  graph;
  state = state;
  isLooping = false;
  isAnimating = false;
  looper = void 0;
  animation = void 0;
  forward = true;
  backward = false;
  runSync = false;
  firstRun = true;
  DEBUGNODE = false;
  constructor(properties = {}, parentNode, graph) {
    if (typeof properties === "function") {
      properties = { operator: properties };
    }
    if (typeof properties === "object") {
      if (properties.tag) {
        if (graph?.nodes) {
          let hasnode = graph.nodes.get(properties.tag);
          if (hasnode)
            return hasnode;
        }
        if (parentNode?.nodes) {
          let hasnode = parentNode.nodes.get(properties.tag);
          if (hasnode)
            return hasnode;
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
        graph.nNodes++;
        graph.nodes.set(this.tag, this);
      }
      if (this.children)
        this.convertChildrenToNodes(this);
    } else
      return properties;
  }
  operator = (self = this, origin, ...args) => {
    return args;
  };
  runOp = (node = this, origin = this, ...args) => {
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
  setOperator = (operator) => {
    if (typeof operator !== "function")
      return operator;
    let params = getFnParamInfo(operator);
    if (params.size === 0)
      params.set("input", void 0);
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
      this.arguments = params;
    }
    this.operator = operator;
    return operator;
  };
  run = (...args) => {
    return this._run(this, void 0, ...args);
  };
  runAsync = (...args) => {
    return new Promise((res, rej) => {
      res(this._run(this, void 0, ...args));
    });
  };
  _run = (node = this, origin, ...args) => {
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
  runParent = async (node, ...args) => {
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
  runChildren = async (node, ...args) => {
    if (Array.isArray(node.children)) {
      for (let i = 0; i < node.children.length; i++) {
        if (typeof node.children[i] === "string") {
          if (node.graph && node.graph?.get(node.children[i])) {
            node.children[i] = node.graph.get(node.children[i]);
            if (!node.nodes.get(node.children[i].tag))
              node.nodes.set(node.children[i].tag, node.children[i]);
          }
          if (!node.children[i] && node.nodes.get(node.children[i]))
            node.children[i] = node.nodes.get(node.children[i]);
        }
        if (node.children[i]?.runOp)
          await node.children[i]._run(node.children[i], node, ...args);
      }
    } else if (node.children) {
      if (typeof node.children === "string") {
        if (node.graph && node.graph?.get(node.children)) {
          node.children = node.graph.get(node.children);
          if (!node.nodes.get(node.children.tag))
            node.nodes.set(node.children.tag, node.children);
        }
        if (!node.children && node.nodes.get(node.children))
          node.children = node.nodes.get(node.children);
      }
      if (node.children?.runOp)
        await node.children._run(node.children, node, ...args);
    }
  };
  runBranch = async (node, output) => {
    if (node.branch) {
      let keys = Object.keys(node.branch);
      await Promise.all(keys.map(async (k) => {
        if (typeof output === "object") {
          if (typeof node.branch[k].if === "object")
            node.branch[k].if = stringifyFast(node.branch[k].if);
          if (stringifyFast(output) === node.branch[k].if) {
            if (node.branch[k].then instanceof GraphNode) {
              if (Array.isArray(output))
                await node.branch[k].then.run(...output);
              else
                await node.branch[k].then.run(output);
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
                  await node.branch[k].then.run(...output);
                else
                  await node.branch[k].then.run(output);
              }
            }
            return true;
          }
        } else {
          await node.branch[k].then(output);
          return true;
        }
      }));
    }
  };
  runAnimation = (animation = this.animation, args = [], node = this, origin) => {
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
  runLoop = (loop = this.looper, args = [], node = this, origin, timeout = node.loop) => {
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
  setParent = (parent) => {
    this.parent = parent;
    if (this.backward)
      this.runSync = false;
  };
  setChildren = (children) => {
    this.children = children;
    if (this.forward)
      this.runSync = false;
  };
  add = (node = {}) => {
    if (typeof node === "function")
      node = { operator: node };
    if (!(node instanceof GraphNode))
      node = new GraphNode(node, this, this.graph);
    this.nodes.set(node.tag, node);
    if (this.graph)
      this.graph.nodes.set(node.tag, node);
    return node;
  };
  remove = (node) => {
    if (typeof node === "string")
      node = this.nodes.get(node);
    if (node instanceof GraphNode) {
      this.nodes.delete(node.tag);
      if (this.graph)
        this.graph.nodes.delete(node.tag);
      this.nodes.forEach((n) => {
        if (n.nodes.get(node.tag))
          n.nodes.delete(node.tag);
      });
    }
  };
  append = (node, parentNode = this) => {
    if (typeof node === "string")
      node = this.nodes.get(node);
    if (node instanceof GraphNode) {
      parentNode.addChildren(node);
      if (node.forward)
        node.runSync = false;
    }
  };
  subscribe = (callback, tag = this.tag) => {
    if (callback instanceof GraphNode) {
      return this.subscribeNode(callback);
    } else
      return this.state.subscribeTrigger(tag, callback);
  };
  unsubscribe = (sub, tag = this.tag) => {
    this.state.unsubscribeTrigger(tag, sub);
  };
  addChildren = (children) => {
    if (!this.children)
      this.children = [];
    if (!Array.isArray(this.children)) {
      this.children = [children];
      if (typeof children === "object" && children.tag) {
        this.nodes.set(children.tag, children);
        if (this.graph)
          this.graph.nodes.set(children.tag, children);
      }
    } else if (Array.isArray(children)) {
      this.children.push(...children);
      children.forEach((c) => {
        if (typeof c === "object" && c.tag) {
          this.nodes.set(c.tag, c);
          if (this.graph)
            this.graph.nodes.set(c.tag, c);
        }
      });
    } else {
      this.children.push(children);
      if (typeof children === "object" && children.tag) {
        this.nodes.set(children.tag, children);
        if (this.graph)
          this.graph.nodes.set(children.tag, children);
      }
    }
    if (this.forward)
      this.runSync = false;
  };
  callParent = (...args) => {
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
  callChildren = (idx, ...args) => {
    const origin = this;
    let result;
    if (Array.isArray(this.children)) {
      if (idx) {
        if (typeof this.children[idx] === "string") {
          if (this.graph && this.graph.get(this.children[idx])) {
            this.children[idx] = this.graph.get(this.children[idx]);
            if (!this.nodes.get(this.children[idx].tag))
              this.nodes.set(this.children[idx].tag, this.children[idx]);
          }
          if (!this.children[idx] && this.nodes.get(this.children[idx]))
            this.children[idx] = this.nodes.get(this.children[idx]);
        }
        if (this.children[idx]?.runOp)
          result = this.children[idx].runOp(this.children[idx], origin, ...args);
      } else {
        result = [];
        for (let i = 0; i < this.children.length; i++) {
          if (typeof this.children[i] === "string") {
            if (this.graph && this.graph.get(this.children[i])) {
              this.children[i] = this.graph.get(this.children[i]);
              if (!this.nodes.get(this.children[i].tag))
                this.nodes.set(this.children[i].tag, this.children[i]);
            }
            if (!this.children[i] && this.nodes.get(this.children[i]))
              this.children[i] = this.nodes.get(this.children[i]);
          }
          if (this.children[i]?.runOp)
            result.push(this.children[i].runOp(this.children[i], origin, ...args));
        }
      }
    } else if (this.children) {
      if (typeof this.children === "string") {
        if (this.graph && this.graph.get(this.children)) {
          this.children = this.graph.get(this.children);
          if (!this.nodes.get(this.children.tag))
            this.nodes.set(this.children.tag, this.children);
        }
        if (!this.children && this.nodes.get(this.children))
          this.children = this.nodes.get(this.children);
      }
      result = this.children.runOp(this.children, origin, ...args);
    }
    return result;
  };
  setProps = (props = {}) => {
    Object.assign(this, props);
    if (!(this.children && this.forward || this.parent && this.backward || this.repeat || this.delay || this.frame || this.recursive))
      this.runSync = true;
  };
  removeTree = (node) => {
    if (node) {
      if (typeof node === "string")
        node = this.nodes.get(node);
    }
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
        recursivelyRemove(node);
        if (this.graph)
          this.graph.removeTree(node);
      }
    }
  };
  convertChildrenToNodes = (n) => {
    if (n?.children instanceof GraphNode) {
      if (!this.graph?.nodes.get(n.tag))
        this.graph.nodes.set(n.tag, n);
      if (!this.nodes.get(n.tag))
        this.nodes.set(n.tag, n);
    } else if (Array.isArray(n.children)) {
      for (let i = 0; i < n.children.length; i++) {
        if (n.children[i] instanceof GraphNode) {
          if (!this.graph?.nodes.get(n.children[i].tag))
            this.graph.nodes.set(n.children[i].tag, n.children[i]);
          if (!this.nodes.get(n.children[i].tag))
            this.nodes.set(n.children[i].tag, n.children[i]);
          continue;
        } else if (typeof n.children[i] === "object" || typeof n.children[i] === "function") {
          n.children[i] = new GraphNode(n.children[i], n, this.graph);
          this.nodes.set(n.children[i].tag, n.children[i]);
          this.convertChildrenToNodes(n.children[i]);
        } else if (typeof n.children[i] === "string") {
          if (this.graph && this.graph.get(n.children[i])) {
            n.children[i] = this.graph.get(n.children[i]);
            if (!this.nodes.get(n.children[i].tag))
              this.nodes.set(n.children[i].tag, n.children[i]);
          }
          if (!n.children[i] && this.nodes.get(n.children[i]))
            n.children[i] = this.nodes.get(n.children[i]);
        }
      }
    } else if (typeof n.children === "object" || typeof n.children === "function") {
      n.children = new GraphNode(n.children, n, this.graph);
      this.nodes.set(n.children.tag, n.children);
      this.convertChildrenToNodes(n.children);
    } else if (typeof n.children === "string") {
      if (this.graph && this.graph.get(n.children)) {
        n.children = this.graph.get(n.children);
        if (!this.nodes.get(n.children.tag))
          this.nodes.set(n.children.tag, n.children);
      }
      if (!n.children && this.nodes.get(n.children))
        n.children = this.nodes.get(n.children);
    }
    return n.children;
  };
  get = (tag) => {
    return this.nodes.get(tag);
  };
  stopLooping = (node = this) => {
    node.isLooping = false;
  };
  stopAnimating = (node = this) => {
    node.isAnimating = false;
  };
  stopNode = (node = this) => {
    node.stopAnimating(node);
    node.stopLooping(node);
  };
  subscribeNode = (node) => {
    if (node.tag)
      this.nodes.set(node.tag, node);
    return this.state.subscribeTrigger(this.tag, (res) => {
      node._run(node, this, res);
    });
  };
  print = (node = this, printChildren = true, nodesPrinted = []) => {
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
      if (node.children) {
        if (Array.isArray(node.children)) {
          node.children = node.children.map((c) => {
            if (typeof c === "string")
              return c;
            if (nodesPrinted.includes(c.tag))
              return c.tag;
            else if (!printChildren) {
              return c.tag;
            } else
              return c.print(c, printChildren, nodesPrinted);
          });
        } else if (typeof node.children === "object") {
          if (!printChildren) {
            jsonToPrint.children = [node.children.tag];
          }
          if (nodesPrinted.includes(node.children.tag))
            jsonToPrint.children = [node.children.tag];
          else
            jsonToPrint.children = [node.children.print(node.children, printChildren, nodesPrinted)];
        } else if (typeof node.children === "string")
          jsonToPrint.children = [node.children];
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
  reconstruct = (json) => {
    let parsed = reconstructObject(json);
    if (parsed)
      return this.add(parsed);
  };
  setState = this.state.setState;
  DEBUGNODES = (debugging = true) => {
    this.DEBUGNODE = debugging;
    this.nodes.forEach((n) => {
      if (debugging)
        n.DEBUGNODE = true;
      else
        n.DEBUGNODE = false;
    });
  };
};
var Graph = class {
  nNodes = 0;
  tag;
  nodes = /* @__PURE__ */ new Map();
  state = state;
  tree = {};
  constructor(tree, tag) {
    this.tag = tag ? tag : `graph${Math.floor(Math.random() * 1e11)}`;
    if (tree || Object.keys(this.tree).length > 0)
      this.setTree(tree);
  }
  add = (node = {}) => {
    let props = node;
    if (!(node instanceof GraphNode))
      node = new GraphNode(props, void 0, this);
    if (node.tag)
      this.tree[node.tag] = props;
    return node;
  };
  setTree = (tree = this.tree) => {
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
      }
    }
  };
  get = (tag) => {
    return this.nodes.get(tag);
  };
  run = (node, ...args) => {
    if (typeof node === "string")
      node = this.nodes.get(node);
    if (node instanceof GraphNode)
      return node._run(node, this, ...args);
    else
      return void 0;
  };
  runAsync = (node, ...args) => {
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
  _run = (node, origin = this, ...args) => {
    if (typeof node === "string")
      node = this.nodes.get(node);
    if (node instanceof GraphNode)
      return node._run(node, origin, ...args);
    else
      return void 0;
  };
  removeTree = (node) => {
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
        recursivelyRemove(node);
      }
    }
    return node;
  };
  remove = (node) => {
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
  append = (node, parentNode) => {
    parentNode.addChildren(node);
  };
  callParent = async (node, origin = node, ...args) => {
    if (node?.parent) {
      return await node.callParent(node, origin, ...args);
    }
  };
  callChildren = async (node, idx, ...args) => {
    if (node?.children) {
      return await node.callChildren(idx, ...args);
    }
  };
  subscribe = (node, callback) => {
    if (!callback)
      return;
    if (node instanceof GraphNode) {
      return node.subscribe(callback);
    } else if (typeof node == "string")
      return this.state.subscribeTrigger(node, callback);
  };
  unsubscribe = (tag, sub) => {
    this.state.unsubscribeTrigger(tag, sub);
  };
  subscribeNode = (inputNode, outputNode) => {
    let tag;
    if (inputNode?.tag)
      tag = inputNode.tag;
    else if (typeof inputNode === "string")
      tag = inputNode;
    return this.state.subscribeTrigger(tag, (res) => {
      this.run(outputNode, inputNode, ...res);
    });
  };
  stopNode = (node) => {
    if (typeof node === "string") {
      node = this.nodes.get(node);
    }
    if (node instanceof GraphNode) {
      node.stopNode();
    }
  };
  print = (node = void 0, printChildren = true) => {
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
  reconstruct = (json) => {
    let parsed = reconstructObject(json);
    if (parsed)
      return this.add(parsed);
  };
  create = (operator, parentNode, props) => {
    return createNode(operator, parentNode, props, this);
  };
  setState = this.state.setState;
  DEBUGNODES = (debugging = true) => {
    this.nodes.forEach((n) => {
      if (debugging)
        n.DEBUGNODE = true;
      else
        n.DEBUGNODE = false;
    });
  };
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
  } catch (err) {
    console.error(err);
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

// src/App.ts
var scriptLocation = new Error().stack.match(/([^ \n])*([a-z]*:\/\/\/?)*?[a-z0-9\/\\]*\.js/ig)[0];
var dynamicImport = async (url) => {
  const extraPath = scriptLocation.replace(window.origin, "").split("/");
  url = [...extraPath.map((e) => ".."), ...url.split("/")].join("/");
  let res = await import(url);
  if (res.default)
    res = res.default;
  return res;
};
var App = class {
  src;
  info;
  plugins;
  tree;
  graph;
  animated;
  constructor(src) {
    this.set(src);
    this.graph = null;
    this.animated = {};
  }
  get base() {
    return this.src.replace("index.js", "");
  }
  checkJSONConversion = (info) => {
    if (typeof info === "string") {
      console.warn(`Converting to an object from a JSON string`);
      return JSON.parse(info);
    } else
      return info;
  };
  set = (src) => {
    this.src = null;
    if (typeof src === "string") {
      this.src = src;
      this.info = null;
    } else {
      this.info = src;
      for (let key in this.info) {
        if (key === "src")
          this.src = this.info[key];
        else
          this.info[key] = this.checkJSONConversion(this.info[key]);
      }
      if (!this.src)
        console.warn('The "src" property may be required in the app info');
    }
    this.tree = null;
  };
  getPlugins = async () => {
    const plugins = {};
    for (const name in this.info.plugins) {
      if (typeof this.info.plugins[name] === "string")
        plugins[name] = await dynamicImport(this.base + this.info.plugins[name]);
      else
        plugins[name] = this.info.plugins[name];
    }
    return plugins;
  };
  getTree = async () => {
    const tree = {};
    this.info.graph.nodes.map((tag) => {
      const [cls, id] = tag.split("_");
      const instance = Object.assign({}, this.plugins[cls]);
      instance.tag = tag;
      tree[tag] = instance;
    });
    this.info.graph.edges.forEach(([outputInfo, inputInfo]) => {
      const [output, outputPort] = outputInfo.split(":");
      const [input, inputPort] = inputInfo.split(":");
      if (!("children" in tree[output]))
        tree[output].children = [];
      tree[output].children.push(input);
    });
    return tree;
  };
  init = async () => {
    if (!this.info)
      this.info = await dynamicImport(this.src);
  };
  start = async () => {
    await this.init();
    await this.compile();
    console.log("Tree", this.tree);
    this.graph = new Graph(this.tree, "graph");
    console.log("Graph", this.graph);
    for (let key in this.graph.tree) {
      const nodeInfo = this.graph.tree[key];
      const node = this.graph.nodes.get(nodeInfo.tag);
      if (node.loop)
        node.loop = parseFloat(node.loop);
      node.run();
    }
    if (this.onstart instanceof Function)
      this.onstart();
  };
  compile = async () => {
    if (this.graph)
      this.graph.nodes.forEach(this.graph.removeTree);
    this.graph = null;
    if (this.oncompile instanceof Function)
      this.tree = await this.oncompile();
    return this.tree;
  };
  oncompile = async () => {
    this.plugins = await this.getPlugins();
    this.tree = await this.getTree();
    return this.tree;
  };
  save = async () => {
    if (this.onsave instanceof Function)
      await this.onsave();
    await this.start();
  };
  onsave = () => {
  };
  onstart = () => {
  };
};

// src/editable/index.ts
var editable_exports = {};
__export(editable_exports, {
  App: () => EditableApp
});

// src/Plugins.ts
var freerange = {};
var Plugins = class {
  readyState = false;
  source;
  filesystem;
  plugins;
  checkedPackageLocations = {};
  list = /* @__PURE__ */ new Set();
  metadataDirBase = ".brainsatplay";
  metadataFileSuffix = "metadata.js";
  metaRegExp = new RegExp(`${this.metadataDirBase}/(.+).${this.metadataFileSuffix}`, "g");
  constructor(source = "https://raw.githubusercontent.com/brainsatplay/awesome-brainsatplay/main/plugins.js") {
    if (typeof source === "string")
      this.source = source;
    else {
      this.source = source.name;
      this.filesystem = source;
    }
    this.plugins = {};
  }
  init = async () => {
    if (!this.filesystem) {
      this.filesystem = new freerange.System("plugins", {
        ignore: ["DS_Store"]
      });
      await this.filesystem.init();
      const file = await this.filesystem.open(this.source);
      const plugins = await file.body;
      for (let key in plugins) {
        this.list.add(key);
        const path = plugins[key];
        this.plugins[key] = { path };
      }
    } else {
      this.filesystem.files.list.forEach((f) => this.set(f));
    }
    this.filesystem.addGroup("plugins", void 0, (f) => this.set(f));
    this.readyState = true;
  };
  set = (f) => {
    this.list.add(f.path);
    this.plugins[f.path] = {
      path: f.path,
      module: f
    };
    this.metadata(f.path);
  };
  get = async (url) => {
    return await this.filesystem.open(url);
  };
  package = async (name) => {
    if (this.plugins[name]) {
      let path = this.getPath(name);
      const splitPath = path.split("/").slice(0, -1);
      let packageFile;
      do {
        try {
          path = splitPath.length ? `${splitPath.join("/")}/package.json` : "package.json";
          if (this.checkedPackageLocations[path] !== false) {
            this.checkedPackageLocations[path] = false;
            packageFile = this.plugins[name].package ?? await this.get(path);
            this.checkedPackageLocations[path] = true;
          }
        } catch (e) {
        }
        if (splitPath.length === 0)
          break;
        splitPath.pop();
      } while (!packageFile);
      if (packageFile) {
        this.plugins[name].package = packageFile;
        return await this.plugins[name].package.body;
      } else
        return {};
    } else {
      console.warn(`No package for ${name}.`);
      return {};
    }
  };
  metadata = async (name) => {
    let path = this.getPath(name);
    if (this.plugins[name] && !path.includes(".metadata.js") && path != "package.json") {
      let path2 = this.getPath(name);
      const metadataPath = this.metadataPath(path2);
      if (!path2.includes(metadataPath))
        path2 = metadataPath;
      const metadata = this.plugins[name].metadata ?? await this.get(path2);
      if (metadata) {
        this.plugins[name].metadata = metadata;
        return await metadata.body;
      } else
        return {};
    } else {
      console.warn(`No metadata for ${name}.`);
      return {};
    }
  };
  getPath = (name) => {
    const base = this.plugins[name]?.module?.path ?? this.plugins[name]?.path ?? name;
    return base.split("/").filter((v) => v != "").join("/");
  };
  metadataPath = (path) => {
    if (this.metaRegExp.test(path))
      return path;
    else {
      const splitPath = path.split("/");
      const fullFileName = splitPath.pop();
      const filePrefix = fullFileName.split(".").at(-2);
      return `${splitPath.join("/")}/${this.metadataDirBase}/${filePrefix}.${this.metadataFileSuffix}`;
    }
  };
  module = async (name) => {
    let path = this.getPath(name);
    let isMetadata = false;
    const match = path.match(this.metaRegExp)?.[0];
    if (match) {
      name = name.replace(match, `${match.split("/").at(-1).split(".")[0]}.js`);
      isMetadata = true;
    }
    if (this.plugins[name]) {
      const path2 = this.getPath(name);
      const pluginModule = this.plugins[name].module ?? await this.get(path2);
      if (pluginModule) {
        this.plugins[name].module = pluginModule;
        if (isMetadata)
          return await this.metadata(name);
        else
          return await this.plugins[name].module.body;
      } else
        return {};
    } else {
      console.error(`Module for ${name} not found.`);
      return {};
    }
  };
};

// src/editable/App.ts
var EditableApp = class {
  active;
  plugins;
  filesystem;
  oncompile;
  constructor(system) {
    this.filesystem = system;
  }
  start = async (system = this.filesystem) => {
    this.filesystem = system;
    this.active = new App(this.filesystem);
    this.active.onsave = async () => await this.filesystem.save();
    this.active.oncompile = async () => {
      const packageContents = await (await this.filesystem.open("package.json")).body;
      if (packageContents) {
        const file = await this.filesystem.open(packageContents.main);
        this.plugins = new Plugins(this.filesystem);
        await this.plugins.init();
        if (file) {
          const imported = await file.body;
          this.oncompile();
          return imported;
        } else
          console.error('The "main" field in the supplied package.json is not pointing to an appropriate entrypoint.');
      }
    };
    await this.active.start();
  };
  save = async () => await this.active.save();
};
export {
  App,
  Plugins,
  editable_exports as editable
};
