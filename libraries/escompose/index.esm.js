var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};

// ../common/check.js
var moduleStringTag = "[object Module]";
var esm = (object) => {
  const res = object && (!!Object.keys(object).reduce((a, b) => {
    const desc = Object.getOwnPropertyDescriptor(object, b);
    const isModule = desc && desc.get && !desc.set ? 1 : 0;
    return a + isModule;
  }, 0) || Object.prototype.toString.call(object) === moduleStringTag);
  return !!res;
};

// ../esmonitor/src/utils.ts
var isSame = (a, b) => {
  if (a && typeof a === "object" && b && typeof b === "object") {
    const jA = JSON.stringify(a);
    const jB = JSON.stringify(b);
    return jA === jB;
  } else
    return a === b;
};
var iterateSymbols = (obj, callback) => {
  return Promise.all(Object.getOwnPropertySymbols(obj).map((sym) => callback(sym, obj[sym])));
};
var getPath = (type, info2) => {
  const pathType = info2.path[type];
  if (!pathType)
    throw new Error("Invalid Path Type");
  const filtered = pathType.filter((v) => typeof v === "string");
  return filtered.join(info2.keySeparator);
};
var getPathInfo = (path, options) => {
  let splitPath = path;
  if (typeof path === "string")
    splitPath = path.split(options.keySeparator);
  else if (typeof path === "symbol")
    splitPath = [path];
  return {
    id: splitPath[0],
    path: splitPath.slice(1)
  };
};
var runCallback = (callback, path, info2, output, setGlobal = true) => {
  if (callback instanceof Function) {
    if (output && typeof output === "object" && typeof output.then === "function")
      output.then((value2) => callback(path, info2, value2));
    else
      callback(path, info2, output);
  }
  if (setGlobal && window.ESMonitorState) {
    const callback2 = window.ESMonitorState.callback;
    window.ESMonitorState.state[path] = { output, value: info2 };
    runCallback(callback2, path, info2, output, false);
  }
};

// ../esmonitor/src/Poller.ts
var defaultSamplingRate = 60;
var Poller = class {
  constructor(listeners2, sps) {
    this.listeners = {};
    this.setOptions = (opts = {}) => {
      for (let key in opts)
        this[key] = opts[key];
    };
    this.add = (info2) => {
      const sub = info2.sub;
      this.listeners[sub] = info2;
      this.start();
    };
    this.get = (sub) => this.listeners[sub];
    this.remove = (sub) => {
      delete this.listeners[sub];
      if (!Object.keys(this.listeners).length)
        this.stop();
    };
    this.poll = (listeners2) => {
      iterateSymbols(listeners2, (sym, o) => {
        let { callback, current, history } = o;
        if (!o.path.resolved)
          o.path.resolved = getPath("output", o);
        if (!isSame(current, history)) {
          runCallback(callback, o.path.resolved, {}, current);
          if (typeof current === "object") {
            if (Array.isArray(current))
              history = [...current];
            else
              history = { ...current };
          } else
            listeners2[sym].history = current;
        }
      });
    };
    this.start = (listeners2 = this.listeners) => {
      if (!this.sps)
        this.sps = defaultSamplingRate;
      else if (!this.#pollingId) {
        console.warn("[escode]: Starting Polling!");
        this.#pollingId = setInterval(() => this.poll(listeners2), 1e3 / this.sps);
      }
    };
    this.stop = () => {
      if (this.#pollingId) {
        console.warn("[escode]: Stopped Polling!");
        clearInterval(this.#pollingId);
        this.#pollingId = void 0;
      }
    };
    if (listeners2)
      this.listeners = listeners2;
    if (sps)
      this.sps = sps;
  }
  #pollingId;
  #sps;
  get sps() {
    return this.#sps;
  }
  set sps(sps) {
    this.#sps = sps;
    const listeners2 = this.listeners;
    const nListeners = Object.keys(listeners2).length;
    if (nListeners) {
      this.stop();
      this.start();
    }
  }
};

// ../esmonitor/src/listeners.ts
var listeners_exports = {};
__export(listeners_exports, {
  functionExecution: () => functionExecution,
  functions: () => functions2,
  info: () => info,
  register: () => register,
  set: () => set,
  setterExecution: () => setterExecution,
  setters: () => setters
});

// ../esmonitor/src/global.ts
window.ESMonitorState = {
  state: {},
  callback: void 0,
  info: {}
};
var global_default = window.ESMonitorState;

// ../esmonitor/src/info.ts
var performance = async (callback, args) => {
  const tic = globalThis.performance.now();
  const output = await callback(...args);
  const toc = globalThis.performance.now();
  return {
    output,
    value: toc - tic
  };
};
var infoFunctions = {
  performance
};
var get = (func, args, info2) => {
  let result = {
    value: {},
    output: void 0
  };
  const infoToGet = { ...global_default.info, ...info2 };
  for (let key in infoToGet) {
    if (infoToGet[key] && infoFunctions[key]) {
      const ogFunc = func;
      func = async (...args2) => {
        const o = await infoFunctions[key](ogFunc, args2);
        result.value[key] = o.value;
        return o.output;
      };
    }
  }
  result.output = func(...args);
  return result;
};

// ../esmonitor/src/globals.ts
var isProxy = Symbol("isProxy");
var fromInspectable = Symbol("fromInspectable");

// ../esc/standards.js
var keySeparator = ".";
var defaultPath = "default";
var esSourceKey = "__esmpileSourceBundle";
var isPrivate = (key) => false;
var specialKeys = {
  start: "esConnected",
  stop: "esDisconnected",
  connected: "esReady",
  hierarchy: "esDOM",
  element: "esElement",
  webcomponents: "esComponents",
  attributes: "esAttributes",
  listeners: {
    value: "esListeners",
    branch: "esBranch",
    bind: "esBind",
    trigger: "esTrigger",
    format: "esFormat"
  },
  trigger: "esTrigger",
  compose: "esCompose",
  uri: "esURI",
  reference: "esReference",
  childPosition: "esChildPosition",
  attribute: "__isescomponent",
  parent: "esParent",
  component: "esComponent",
  source: "esSource",
  path: "__isESComponent",
  animate: "esAnimate",
  options: "__esOptions",
  states: "__esStates",
  promise: "__esComponentPromise",
  proxy: "__esProxy",
  editor: "esCode",
  flow: "__esManager",
  original: "esOriginal",
  resize: "esOnResize"
};

// ../common/pathHelpers.ts
var hasKey = (key, obj) => key in obj;
var getShortcut = (path, shortcuts, keySeparator2) => {
  const sc = shortcuts[path[0]];
  if (sc) {
    const value2 = sc[path.slice(1).join(keySeparator2)];
    if (value2)
      return value2;
  }
};
var getFromPath = (baseObject, path, opts = {}) => {
  const fallbackKeys = opts.fallbacks ?? [];
  const keySeparator2 = opts.keySeparator ?? keySeparator;
  if (opts.shortcuts) {
    const shortcut = getShortcut(path, opts.shortcuts, keySeparator2);
    if (shortcut) {
      if (opts.output === "info")
        return { value: shortcut, exists: true, shortcut: true };
      else
        return shortcut;
    }
  }
  if (typeof path === "string")
    path = path.split(keySeparator2);
  else if (typeof path == "symbol")
    path = [path];
  let exists;
  path = [...path];
  let ref = baseObject;
  for (let i = 0; i < path.length; i++) {
    if (!ref) {
      const message = `Could not get path`;
      console.error(message, path, ref);
      throw new Error(message);
    }
    const str = path[i];
    if (!hasKey(str, ref) && "esDOM" in ref) {
      for (let i2 in fallbackKeys) {
        const key = fallbackKeys[i2];
        if (hasKey(key, ref)) {
          ref = ref[key];
          break;
        }
      }
    }
    exists = hasKey(str, ref);
    if (exists)
      ref = ref[str];
    else {
      ref = void 0;
      exists = true;
    }
  }
  if (opts.output === "info")
    return { value: ref, exists };
  else
    return ref;
};
var setFromPath = (path, value2, ref, opts = {}) => {
  const create3 = opts?.create ?? false;
  const keySeparator2 = opts?.keySeparator ?? keySeparator;
  if (typeof path === "string")
    path = path.split(keySeparator2);
  else if (typeof path == "symbol")
    path = [path];
  path = [...path];
  const copy = [...path];
  const last = copy.pop();
  if (ref.esDOM)
    ref = ref.esDOM;
  for (let i = 0; i < copy.length; i++) {
    const str = copy[i];
    let has = hasKey(str, ref);
    if (create3 && !has) {
      ref[str] = {};
      has = true;
    }
    if (has)
      ref = ref[str];
    else {
      const message = `Could not set path`;
      console.error(message, path);
      throw new Error(message);
    }
    if (ref.esDOM)
      ref = ref.esDOM;
  }
  ref[last] = value2;
};

// ../esmonitor/src/inspectable/handlers.ts
var handlers_exports = {};
__export(handlers_exports, {
  functions: () => functions,
  objects: () => objects
});
var functions = (proxy) => {
  return {
    apply: async function(target, thisArg, argumentsList) {
      try {
        let foo = target;
        const isFromInspectable = argumentsList[0]?.[fromInspectable];
        if (isFromInspectable) {
          foo = argumentsList[0].value;
          argumentsList = argumentsList.slice(1);
        }
        let listeners2 = proxy.listeners.functions;
        const pathStr = proxy.path.join(proxy.options.keySeparator);
        const toActivate = listeners2 ? listeners2[pathStr] : void 0;
        let output, executionInfo = {};
        if (toActivate) {
          executionInfo = functionExecution(thisArg, toActivate, foo, argumentsList);
          output = executionInfo.output;
        } else {
          output = foo.apply(thisArg, argumentsList);
          executionInfo = proxy?.state?.[pathStr]?.value ?? {};
        }
        const callback = proxy.options.callback;
        runCallback(callback, pathStr, executionInfo, output);
        return output;
      } catch (e) {
        console.warn(`Function failed:`, e, proxy.path);
      }
    }
  };
};
var objects = (proxy) => {
  return {
    get(target, prop, receiver) {
      if (prop === isProxy)
        return true;
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, newVal, receiver) {
      if (prop === isProxy)
        return true;
      const pathStr = [...proxy.path, prop].join(proxy.options.keySeparator);
      const isFromInspectable = newVal?.[fromInspectable];
      if (isFromInspectable)
        newVal = newVal.value;
      const listeners2 = proxy.listeners.setters;
      if (!target.hasOwnProperty(prop)) {
        if (typeof proxy.options.globalCallback === "function") {
          const id = proxy.path[0];
          set("setters", pathStr, newVal, proxy.options.globalCallback, { [id]: proxy.root }, proxy.listeners, proxy.options);
        }
      }
      if (newVal) {
        const newProxy = proxy.create(prop, target, newVal);
        if (newProxy)
          newVal = newProxy;
      }
      if (listeners2) {
        const toActivate = listeners2[pathStr];
        if (toActivate)
          setterExecution(toActivate, newVal);
      }
      const callback = proxy.options.callback;
      const info2 = proxy?.state?.[pathStr]?.value ?? {};
      runCallback(callback, pathStr, info2, newVal);
      if (isFromInspectable)
        return true;
      else
        return Reflect.set(target, prop, newVal, receiver);
    }
  };
};

// ../esmonitor/src/inspectable/index.ts
var canCreate = (parent, key, val) => {
  try {
    if (val === void 0)
      val = parent[key];
  } catch (e) {
    return e;
  }
  const alreadyIs = parent[key] && parent[key][isProxy];
  if (alreadyIs)
    return false;
  const type = typeof val;
  const isObject = type === "object";
  const isFunction = type == "function";
  const notObjOrFunc = !val || !(isObject || isFunction);
  if (notObjOrFunc)
    return false;
  if (val instanceof Element)
    return false;
  if (val instanceof EventTarget)
    return false;
  const isESM = isObject && esm(val);
  if (isFunction)
    return true;
  else {
    const desc = Object.getOwnPropertyDescriptor(parent, key);
    if (desc && (desc.value && desc.writable || desc.set)) {
      if (!isESM)
        return true;
    } else if (!parent.hasOwnProperty(key))
      return true;
  }
  return false;
};
var Inspectable = class {
  constructor(target = {}, opts = {}, name2, parent) {
    this.path = [];
    this.listeners = {};
    this.state = {};
    this.set = (path, info2, update) => {
      this.state[path] = {
        output: update,
        value: info2
      };
      setFromPath(path, update, this.proxy, { create: true });
    };
    this.check = canCreate;
    this.create = (key, parent, val, set2 = false) => {
      const create3 = this.check(parent, key, val);
      if (val === void 0)
        val = parent[key];
      if (create3 && !(create3 instanceof Error)) {
        parent[key] = new Inspectable(val, this.options, key, this);
        return parent[key];
      }
      if (set2) {
        try {
          this.proxy[key] = val ?? parent[key];
        } catch (e) {
          const isESM = esm(parent);
          const path = [...this.path, key];
          console.error(`Could not set value (${path.join(this.options.keySeparator)})${isESM ? " because the parent is an ESM." : ""}`, isESM ? "" : e);
        }
      }
      return;
    };
    if (!opts.pathFormat)
      opts.pathFormat = "relative";
    if (!opts.keySeparator)
      opts.keySeparator = keySeparator;
    if (target.__esProxy)
      this.proxy = target.__esProxy;
    else if (target[isProxy])
      this.proxy = target;
    else {
      this.target = target;
      this.options = opts;
      this.parent = parent;
      if (this.parent) {
        this.root = this.parent.root;
        this.path = [...this.parent.path];
        this.state = this.parent.state ?? {};
      } else
        this.root = target;
      if (name2)
        this.path.push(name2);
      if (this.options.listeners)
        this.listeners = this.options.listeners;
      if (this.options.path) {
        if (this.options.path instanceof Function)
          this.path = this.options.path(this.path);
        else if (Array.isArray(this.options.path))
          this.path = this.options.path;
        else
          console.log("Invalid path", this.options.path);
      }
      if (this.path)
        this.path = this.path.filter((str) => typeof str === "string");
      if (!this.options.keySeparator)
        this.options.keySeparator = keySeparator;
      let type = this.options.type;
      if (type != "object")
        type = typeof target === "function" ? "function" : "object";
      const handler2 = handlers_exports[`${type}s`](this);
      this.proxy = new Proxy(target, handler2);
      Object.defineProperty(target, "__esProxy", { value: this.proxy, enumerable: false });
      Object.defineProperty(target, "__esInspectable", { value: this, enumerable: false });
      for (let key in target) {
        if (!this.parent) {
          let value2 = target[key];
          if (typeof value2 === "function") {
            target[key] = async (...args) => await this.proxy[key]({ [fromInspectable]: true, value: value2 }, ...args);
          } else {
            try {
              Object.defineProperty(target, key, {
                get: () => value2,
                set: (val) => {
                  value2 = val;
                  this.proxy[key] = { [fromInspectable]: true, value: val };
                },
                enumerable: true,
                configurable: true
              });
            } catch (e) {
              console.error(`Could not reassign ${key} to a top-level setter...`);
            }
          }
        }
        this.create(key, target, void 0, true);
      }
    }
    return this.proxy;
  }
};

// ../esmonitor/src/optionsHelpers.ts
var setFromOptions = (path, value2, baseOptions, opts) => {
  const ref = opts.reference;
  const id = Array.isArray(path) ? path[0] : typeof path === "string" ? path.split(baseOptions.keySeparator)[0] : path;
  let isDynamic = opts.hasOwnProperty("static") ? !opts.static : false;
  if (isDynamic && !globalThis.Proxy) {
    isDynamic = false;
    console.warn("Falling back to using function interception and setters...");
  }
  if (isDynamic) {
    value2 = new Inspectable(value2, {
      pathFormat: baseOptions.pathFormat,
      keySeparator: baseOptions.keySeparator,
      listeners: opts.listeners,
      path: (path2) => path2.filter((str) => !baseOptions.fallbacks || !baseOptions.fallbacks.includes(str))
    }, id);
  }
  let options = { keySeparator: baseOptions.keySeparator, ...opts };
  setFromPath(path, value2, ref, options);
  return value2;
};

// ../esmonitor/src/listeners.ts
var info = (id, callback, path, originalValue, base, listeners2, options, refShortcut = {}) => {
  if (typeof path === "string")
    path = path.split(options.keySeparator);
  const relativePath = path.join(options.keySeparator);
  const refs = base;
  const shortcutRef = refShortcut.ref;
  const shortcutPath = refShortcut.path;
  const get3 = (path2) => {
    const thisBase = shortcutRef ?? base;
    const res = getFromPath(thisBase, path2, {
      keySeparator: options.keySeparator,
      fallbacks: options.fallbacks
    });
    return res;
  };
  const set2 = (path2, value2) => {
    const thisBase = shortcutRef ?? base;
    setFromOptions(path2, value2, options, {
      reference: thisBase,
      listeners: listeners2
    });
  };
  let onUpdate = options.onUpdate;
  let infoToOutput = {};
  if (onUpdate && typeof onUpdate === "object" && onUpdate.callback instanceof Function) {
    infoToOutput = onUpdate.info ?? {};
    onUpdate = onUpdate.callback;
  }
  const absolute = [id, ...path];
  let pathInfo = {
    absolute,
    relative: relativePath.split(options.keySeparator),
    parent: absolute.slice(0, -1)
  };
  pathInfo.output = pathInfo[options.pathFormat];
  const completePathInfo = pathInfo;
  const info2 = {
    id,
    path: completePathInfo,
    keySeparator: options.keySeparator,
    infoToOutput,
    callback: (...args) => {
      const output = callback(...args);
      if (onUpdate instanceof Function)
        onUpdate(...args);
      return output;
    },
    get current() {
      return get3(shortcutPath ?? info2.path.absolute);
    },
    set current(val) {
      set2(shortcutPath ?? info2.path.absolute, val);
    },
    get parent() {
      return get3(shortcutPath ? shortcutPath?.slice(0, -1) : info2.path.parent);
    },
    get reference() {
      return refs[id];
    },
    set reference(val) {
      refs[id] = val;
    },
    original: originalValue,
    history: typeof originalValue === "object" ? Object.assign({}, originalValue) : originalValue,
    sub: Symbol("subscription"),
    last: path.slice(-1)[0]
  };
  return info2;
};
var registerInLookup = (name2, sub, lookups) => {
  if (lookups) {
    const id = Math.random();
    lookups.symbol[sub] = {
      name: name2,
      id
    };
    if (!lookups.name[name2])
      lookups.name[name2] = {};
    lookups.name[name2][id] = sub;
  }
};
var register = (info2, collection, lookups) => {
  const absolute = getPath("absolute", info2);
  if (!collection[absolute])
    collection[absolute] = {};
  collection[absolute][info2.sub] = info2;
  registerInLookup(absolute, info2.sub, lookups);
};
var listeners = {
  functions: functions2,
  setters
};
var set = (type, absPath, value2, callback, base, allListeners, options) => {
  const { id, path } = getPathInfo(absPath, options);
  const fullInfo = info(id, callback, path, value2, base, listeners, options);
  if (listeners[type])
    listeners[type](fullInfo, allListeners[type], allListeners.lookup);
  else {
    const path2 = getPath("absolute", fullInfo);
    allListeners[type][path2][fullInfo.sub] = fullInfo;
    if (allListeners.lookup)
      registerInLookup(path2, fullInfo.sub, allListeners.lookup);
  }
};
var get2 = (info2, collection) => collection[getPath("absolute", info2)];
var handler = (info2, collection, subscribeCallback, lookups) => {
  if (!get2(info2, collection)) {
    let parent = info2.parent;
    let val = parent[info2.last];
    subscribeCallback(val, parent);
  }
  register(info2, collection, lookups);
};
var setterExecution = (listeners2, value2) => {
  return iterateSymbols(listeners2, (_, o) => {
    const path = getPath("output", o);
    runCallback(o.callback, path, {}, value2);
  });
};
function setters(info2, collection, lookups) {
  handler(info2, collection, (value2, parent) => {
    let val = value2;
    if (!parent[isProxy]) {
      let redefine = true;
      try {
        delete parent[info2.last];
      } catch (e) {
        console.error("Unable to redeclare setters. May already be a dynamic object...");
        redefine = false;
      }
      if (redefine) {
        try {
          Object.defineProperty(parent, info2.last, {
            get: () => val,
            set: async (v) => {
              val = v;
              const listeners2 = Object.assign({}, collection[getPath("absolute", info2)]);
              setterExecution(listeners2, v);
            },
            enumerable: true,
            configurable: true
          });
        } catch (e) {
          throw e;
        }
      }
    }
  }, lookups);
}
var functionExecution = (context, listeners2, func, args) => {
  listeners2 = Object.assign({}, listeners2);
  const keys = Object.getOwnPropertySymbols(listeners2);
  const infoTemplate = listeners2[keys[0]] ?? {};
  const executionInfo = get((...args2) => func.call(context, ...args2), args, infoTemplate.infoToOutput);
  iterateSymbols(listeners2, (_, o) => {
    const path = getPath("output", o);
    runCallback(o.callback, path, executionInfo.value, executionInfo.output);
  });
  return executionInfo;
};
function functions2(info2, collection, lookups) {
  handler(info2, collection, (_, parent) => {
    if (!parent[isProxy]) {
      parent[info2.last] = function(...args) {
        const listeners2 = collection[getPath("absolute", info2)];
        const got = functionExecution(this, listeners2, info2.original, args);
        return got;
      };
    }
  }, lookups);
}

// ../common/drill.js
var drillSimple = (obj, callback, options) => {
  let accumulator = options.accumulator;
  if (!accumulator)
    accumulator = options.accumulator = {};
  const ignore = options.ignore || [];
  const path = options.path || [];
  const condition = options.condition || true;
  const seen = [];
  const fromSeen = [];
  let drill = (obj2, acc = {}, globalInfo) => {
    for (let key in obj2) {
      if (ignore.includes(key))
        continue;
      const val = obj2[key];
      const newPath = [...globalInfo.path, key];
      const info2 = {
        typeof: typeof val,
        name: val?.constructor?.name,
        simple: true,
        object: val && typeof val === "object",
        path: newPath
      };
      if (info2.object) {
        const name2 = info2.name;
        const isESM = esm(val);
        if (isESM || name2 === "Object" || name2 === "Array") {
          info2.simple = true;
          const idx = seen.indexOf(val);
          if (idx !== -1)
            acc[key] = fromSeen[idx];
          else {
            seen.push(val);
            const pass = condition instanceof Function ? condition(key, val, info2) : condition;
            info2.pass = pass;
            acc[key] = callback(key, val, info2);
            if (pass) {
              fromSeen.push(acc[key]);
              acc[key] = drill(val, acc[key], { ...globalInfo, path: newPath });
            }
          }
        } else {
          info2.simple = false;
          acc[key] = callback(key, val, info2);
        }
      } else
        acc[key] = callback(key, val, info2);
    }
    return acc;
  };
  return drill(obj, accumulator, { path });
};

// ../esmonitor/src/Monitor.ts
var createLookup = () => {
  return { symbol: {}, name: {} };
};
var Monitor = class {
  constructor(opts = {}) {
    this.poller = new Poller();
    this.options = {
      pathFormat: "relative",
      keySeparator
    };
    this.listeners = {
      polling: this.poller.listeners,
      functions: {},
      setters: {},
      lookup: createLookup()
    };
    this.references = {};
    this.get = (path, output, reference = this.references) => {
      return getFromPath(reference, path, {
        keySeparator: this.options.keySeparator,
        fallbacks: this.options.fallbacks,
        output
      });
    };
    this.set = (path, value2, opts = {}) => {
      const optsCopy = { ...opts };
      if (!optsCopy.reference)
        optsCopy.reference = this.references;
      if (!optsCopy.listeners)
        optsCopy.listeners = this.listeners;
      return setFromOptions(path, value2, this.options, optsCopy);
    };
    this.on = (absPath, callback) => {
      const info2 = getPathInfo(absPath, this.options);
      return this.listen(info2.id, callback, info2.path);
    };
    this.getInfo = (label, callback, path, original) => {
      const info2 = info(label, callback, path, original, this.references, this.listeners, this.options);
      const id = Math.random();
      const lookups = this.listeners.lookup;
      const name2 = getPath("absolute", info2);
      lookups.symbol[info2.sub] = {
        name: name2,
        id
      };
      if (!lookups.name[name2])
        lookups.name[name2] = {};
      lookups.name[name2][id] = info2.sub;
      return info2;
    };
    this.listen = (id, callback, path = [], __internal = {}) => {
      if (typeof path === "string")
        path = path.split(this.options.keySeparator);
      else if (typeof path === "symbol")
        path = [path];
      const arrayPath = path;
      let baseRef = this.references[id];
      if (!baseRef) {
        console.error(`Reference does not exist.`, id);
        return;
      }
      if (!__internal.poll)
        __internal.poll = esm(baseRef);
      if (!__internal.seen)
        __internal.seen = [];
      const __internalComplete = __internal;
      if (!this.references[id])
        this.references[id] = baseRef;
      const ref = this.get([id, ...arrayPath]);
      const toMonitorInternally = (val, allowArrays = false) => {
        const first = val && typeof val === "object";
        if (!first)
          return false;
        const isEl = val instanceof Element;
        if (isEl)
          return false;
        if (allowArrays)
          return true;
        else
          return !Array.isArray(val);
      };
      let subs = {};
      if (toMonitorInternally(ref, true)) {
        if (ref.__esInspectable)
          ref.__esInspectable.options.globalCallback = callback;
        drillSimple(ref, (_, __, drillInfo) => {
          if (drillInfo.pass)
            return;
          else {
            const fullPath = [...arrayPath, ...drillInfo.path];
            const internalSubs = this.listen(id, callback, fullPath, __internalComplete);
            Object.assign(subs, internalSubs);
          }
        }, {
          condition: (_, val) => toMonitorInternally(val)
        });
      }
      let info2;
      try {
        info2 = this.getInfo(id, callback, arrayPath, ref);
        if (__internalComplete.poll) {
          this.poller.add(info2);
        } else {
          let type = "setters";
          if (typeof ref === "function")
            type = "functions";
          this.add(type, info2);
        }
      } catch (e) {
        console.error("Fallback to polling:", path, e);
        this.poller.add(info2);
      }
      subs[getPath("absolute", info2)] = info2.sub;
      if (this.options.onInit instanceof Function) {
        const executionInfo = {};
        for (let key in info2.infoToOutput)
          executionInfo[key] = void 0;
        this.options.onInit(getPath("output", info2), executionInfo);
      }
      return subs;
    };
    this.add = (type, info2) => {
      if (listeners_exports[type])
        listeners_exports[type](info2, this.listeners[type], this.listeners.lookup);
      else
        this.listeners[type][getPath("absolute", info2)][info2.sub] = info2;
    };
    this.remove = (subs) => {
      if (!subs) {
        subs = {
          ...this.listeners.functions,
          ...this.listeners.setters,
          ...this.listeners.polling
        };
      }
      if (typeof subs !== "object")
        subs = { sub: subs };
      for (let key in subs) {
        let innerSub = subs[key];
        const handleUnsubscribe = (sub) => {
          const res = this.unsubscribe(sub);
          if (res === false)
            console.warn(`Subscription for ${key} does not exist.`, sub);
        };
        if (typeof innerSub !== "symbol")
          iterateSymbols(innerSub, handleUnsubscribe);
        else
          handleUnsubscribe(innerSub);
      }
      return true;
    };
    this.unsubscribe = (sub) => {
      const info2 = this.listeners.lookup.symbol[sub];
      const absPath = info2.name;
      const polling = this.poller.get(sub);
      const funcs = this.listeners.functions[absPath];
      const func = funcs?.[sub];
      const setters2 = this.listeners.setters[absPath];
      const setter = setters2?.[sub];
      if (polling)
        this.poller.remove(sub);
      else if (func) {
        delete funcs[sub];
        if (!Object.getOwnPropertySymbols(funcs).length) {
          func.current = func.original;
          delete this.listeners.functions[absPath];
        }
      } else if (setter) {
        delete setters2[sub];
        if (!Object.getOwnPropertySymbols(setters2).length) {
          const parent = setter.parent;
          const last = setter.last;
          const value2 = parent[last];
          Object.defineProperty(parent, last, { value: value2, writable: true });
          delete this.listeners.setters[absPath];
        }
      } else
        return false;
      delete this.listeners.lookup.symbol[sub];
      const nameLookup = this.listeners.lookup.name[info2.name];
      delete nameLookup[info2.id];
      if (!Object.getOwnPropertyNames(nameLookup).length)
        delete this.listeners.lookup.name[info2.name];
    };
    Object.defineProperty(this.listeners, "lookup", {
      value: createLookup(),
      enumerable: false,
      configurable: false
    });
    Object.assign(this.options, opts);
    this.poller.setOptions(opts.polling);
  }
};

// ../esmonitor/src/index.ts
var src_default = Monitor;

// ../common/clone.js
var deep = (obj, opts = {}) => {
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      obj = [...obj];
      opts.accumulator = [];
    } else {
      obj = { ...obj };
      opts.accumulator = {};
    }
  } else
    return obj;
  drillSimple(obj, (key, val, info2) => {
    if (info2.simple && info2.object)
      return Array.isArray(val) ? [] : {};
    else
      return val;
  }, opts);
  return opts.accumulator;
};

// src/utils.ts
var isPromise = (o) => typeof o === "object" && typeof o.then === "function";
var resolve = (object, callback) => {
  if (typeof object === "object" && Array.isArray(object) && object.find((v) => isPromise(v)))
    object = Promise.all(object);
  if (isPromise(object)) {
    return new Promise((resolvePromise) => {
      object.then(async (res) => {
        const output = callback ? callback(res) : res;
        resolvePromise(output);
      });
    });
  } else {
    return callback ? callback(object) : object;
  }
};
var merge = (main, override, path = []) => {
  const copy = Object.assign({}, main);
  if (override) {
    const keys = Object.keys(copy);
    const newKeys = new Set(Object.keys(override));
    keys.forEach((k) => {
      newKeys.delete(k);
      const thisPath = [...path, k];
      if (typeof override[k] === "object" && !Array.isArray(override[k])) {
        if (typeof copy[k] === "object")
          copy[k] = merge(copy[k], override[k], thisPath);
        else
          copy[k] = override[k];
      } else if (typeof override[k] === "function") {
        const original = copy[k];
        const isFunc = typeof original === "function";
        if (isFunc && !original.functionList)
          original.functionList = [original];
        const newFunc = override[k];
        if (!isFunc)
          copy[k] = newFunc;
        else if (!original.functionList.includes(newFunc)) {
          const func = copy[k] = function(...args) {
            original.call(this, ...args);
            return newFunc.call(this, ...args);
          };
          if (!func.functionList)
            func.functionList = [original];
          func.functionList.push(override);
        } else
          console.warn(`This function was already merged into ${thisPath.join(".")}. Ignoring duplicate.`);
      } else if (k in override)
        copy[k] = override[k];
    });
    newKeys.forEach((k) => copy[k] = override[k]);
  }
  return copy;
};

// ../drafts/edgelord/index.ts
var listenerObject = Symbol("listenerObject");
var toSet = Symbol("toSet");
var isConfigObject = (o) => specialKeys.listeners.format in o || specialKeys.listeners.branch in o || specialKeys.listeners.trigger in o || specialKeys.listeners.bind in o;
var initializedStatus = "INITIALIZED";
var registeredStatus = "REGISTERED";
var globalFrom = {};
var globalTo = {};
var globalActive = {};
var subscriptionKey = Symbol("subscriptionKey");
var configKey = Symbol("configKey");
var toResolveWithKey = Symbol("toResolveWithKey");
var Edgelord = class {
  constructor(listeners2 = {}, root, context) {
    this.original = {};
    this.active = {};
    this.globals = {};
    this.context = {};
    this.rootPath = "";
    this.status = "";
    this.#triggers = [];
    this.#queue = [];
    this.getManager = (mode = "from") => {
      let target = mode === "to" ? this.globals.to : this.globals.from;
      this.rootPath.split(this.context.options.keySeparator).forEach((key) => {
        if (!target[key])
          target[key] = {};
        target = target[key];
      });
      return target[toResolveWithKey] ?? this;
    };
    this.onStart = (f) => {
      const res = this.#toResolveWith;
      const isSame2 = res === this;
      if (isSame2) {
        if (this.status === initializedStatus)
          f();
        else
          this.#queue.push(f);
      } else
        res.onStart(f);
    };
    this.runEachListener = (listeners2, callback) => {
      if (!callback)
        return;
      for (let toPath in listeners2) {
        const from = listeners2[toPath];
        if (!from) {
          console.warn("Skipping empty listener:", toPath);
          continue;
        }
        if (from && typeof from === "object") {
          for (let fromPath in from)
            callback(fromPath, toPath, from[fromPath]);
        } else {
          if (typeof toPath === "string")
            callback(from, toPath, toPath);
          else
            console.error("Improperly Formatted Listener", toPath);
        }
      }
    };
    this.register = (listeners2 = this.original) => {
      this.runEachListener(listeners2, this.add);
      this.status = registeredStatus;
    };
    this.#initialize = (o) => {
      const res = this.context.monitor.get(o.path, "info");
      if (typeof res.value === "function") {
        const args = Array.isArray(o.args) ? o.args : [o.args];
        res.value(...args);
      } else
        console.error("Cannot yet trigger values...", o);
    };
    this.initialize = (o) => {
      if (!this.status)
        this.#triggers.push(o);
      else if (this.status === registeredStatus) {
        this.status = initializedStatus;
        this.#triggers.forEach(this.#initialize);
        this.#queue.forEach((f) => f());
        this.#queue = [];
        this.#triggers = [];
      } else
        this.#initialize(o);
    };
    this.start = () => {
      this.register();
      this.initialize();
    };
    this.#getAbsolutePath = (name2) => {
      return !name2 || !this.rootPath || name2.includes(this.rootPath) ? name2 : [this.rootPath, name2].join(this.context.monitor.options.keySeparator);
    };
    this.#getPathInfo = (path) => {
      const output = {
        absolute: {},
        relative: {}
      };
      path = this.#getAbsolutePath(path);
      let rel = this.rootPath ? path.replace(`${this.rootPath}.`, "") : path;
      const baseArr = path.split(this.context.options.keySeparator);
      output.absolute.array = [this.context.id, ...baseArr];
      output.relative.array = rel.split(this.context.options.keySeparator);
      const obj = this.context.monitor.get(output.relative.array, void 0, this.context.instance);
      const isComponent = obj?.hasOwnProperty(specialKeys.path);
      if (isComponent) {
        output.absolute.array.push(defaultPath);
        output.relative.array.push(defaultPath);
      }
      output.absolute.value = output.absolute.array.slice(1).join(this.context.options.keySeparator);
      output.relative.value = output.relative.array.join(this.context.options.keySeparator);
      return output;
    };
    this.add = (from, to, value2 = true, subscription) => {
      const fromInfo = this.#getPathInfo(from);
      const toInfo = this.#getPathInfo(to);
      const absPath = fromInfo.absolute.value;
      if (!subscription)
        subscription = this.globals.active[absPath]?.[subscriptionKey];
      if (!subscription) {
        subscription = this.context.monitor.on(fromInfo.absolute.array, (path, _, update) => this.activate(path, update), {
          ref: this.context.instance,
          path: fromInfo.relative.array
        });
      }
      const info2 = {
        value: value2,
        [listenerObject]: true
      };
      const refs = [this.active, this.globals.active];
      refs.forEach((ref) => {
        if (!ref[absPath])
          ref[absPath] = {};
        const base = ref[absPath];
        if (!base[subscriptionKey]) {
          Object.defineProperty(base, subscriptionKey, {
            value: subscription,
            configurable: true
          });
        }
        base[toInfo.absolute.value] = info2;
      });
      const args = value2[specialKeys.listeners.trigger];
      if (args)
        this.#toResolveWith.initialize({
          path: fromInfo.absolute.array,
          args
        });
      this.addToGlobalLog(absPath);
      return info2;
    };
    this.addToGlobalLog = (path, mode = "from") => {
      const absolutePath = this.#getAbsolutePath(path);
      let target = mode === "to" ? this.globals.to : this.globals.from;
      const globalPath = absolutePath.split(this.context.options.keySeparator);
      globalPath.forEach((key) => {
        if (!target[key])
          target[key] = {};
        target = target[key];
        if (!target[toResolveWithKey])
          target[toResolveWithKey] = this;
      });
    };
    this.remove = (from, to) => {
      const fromInfo = this.#getPathInfo(from);
      const toInfo = this.#getPathInfo(to);
      const path = [fromInfo.absolute.value, toInfo.absolute.value];
      const toRemove = [
        { ref: this.active, path },
        { ref: this.globals.active, path, unlisten: true }
      ];
      toRemove.forEach((o) => {
        const { ref, path: path2, unlisten } = o;
        let base = ref[path2[0]];
        if (typeof base === "object") {
          delete base[path2[1]];
          if (Object.keys(base).length === 0) {
            delete ref[path2[0]];
            const sub = base[subscriptionKey];
            if (unlisten && sub) {
              this.context.monitor.remove(sub);
            }
            delete base[subscriptionKey];
          }
        } else
          delete ref[path2[0]];
      });
    };
    this.clear = (name2) => {
      const value2 = this.#getAbsolutePath(name2);
      Object.keys(this.active).forEach((from) => {
        Object.keys(this.active[from]).forEach((to) => {
          if (!value2 || from.slice(0, value2.length) === value2 || to.slice(0, value2.length) === value2)
            this.remove(from, to);
        });
      });
    };
    this.has = (from, ref = this.active) => !!ref[from];
    this.get = (from, ref = this.active) => ref[from];
    this.activate = (from, update) => {
      const listenerGroups = [{
        info: this.get(from, this.globals.active),
        name
      }];
      listenerGroups.forEach((group) => {
        const info2 = group.info;
        if (info2) {
          if (info2[listenerObject]) {
            this.pass(from, {
              value: info2.value,
              parent: this.active,
              key: group.name,
              subscription: info2.subscription,
              __value: true
            }, update);
          } else if (typeof info2 === "object") {
            for (let key in info2) {
              this.pass(from, {
                parent: info2,
                key,
                subscription: info2[key].subscription,
                value: info2[key].value
              }, update);
            }
          } else
            console.error("Improperly Formatted Listener", info2);
        }
      });
    };
    this.pass = (from, target, update) => {
      const id = this.context.id;
      let parent, key, subscription;
      const isValue = target?.__value;
      parent = target.parent;
      key = target.key;
      subscription = target.subscription;
      const info2 = target.parent[key];
      target = info2.value;
      let config = info2?.[configKey];
      let ogValue = target;
      const type = typeof target;
      const checkIfSetter = (path, willSet) => {
        const info3 = this.context.monitor.get(path, "info");
        if (info3.exists) {
          const val = info3.value;
          const noDefault = typeof val !== "function" && !val?.default;
          const value2 = noDefault ? toSet : val;
          const res = { value: value2 };
          if (willSet) {
            target = res.value;
            parent[key] = res;
          }
          return res;
        } else
          return { value: void 0 };
      };
      const transform = (willSet) => {
        const fullPath = [id];
        fullPath.push(...key.split(this.context.options.keySeparator));
        return checkIfSetter(fullPath, willSet);
      };
      const getPathArray = (latest) => {
        const path = [id];
        const topPath = [];
        if (this.rootPath)
          topPath.push(...this.rootPath.split(this.context.options.keySeparator));
        topPath.push(...latest.split(this.context.options.keySeparator));
        path.push(...topPath);
        return path;
      };
      if (typeof target === "boolean") {
        if (!isValue)
          transform(true);
        else
          console.error(`Cannot use a boolean for ${specialKeys.listeners.value}...`);
      } else if (type === "string") {
        const path = getPathArray(ogValue);
        checkIfSetter(path, true);
        if (isValue) {
          parent[key] = { [ogValue]: parent[key] };
          key = ogValue;
        }
      } else if (target && type === "object") {
        const isConfig = isConfigObject(ogValue);
        if (isConfig) {
          if ("value" in ogValue) {
            if (isValue) {
              target = parent[key] = ogValue.value;
            } else {
              target = parent[key].value = ogValue.value;
            }
          } else
            transform(true);
          if (ogValue) {
            if (ogValue)
              config = ogValue;
          }
          Object.defineProperty(parent[key], configKey, { value: config });
        }
      }
      let isValidInput = true;
      if (config) {
        const bindKey = specialKeys.listeners.value;
        if (bindKey in config) {
          const path = getPathArray(config[bindKey].original ?? config[bindKey]);
          if (typeof config[bindKey] === "string") {
            const res = this.context.monitor.get(path);
            if (!res)
              target = `because ${path.slice(1).join(this.context.options.keySeparator)} does not point correctly to an existing component.`;
            else {
              config[bindKey] = {
                value: res,
                original: config[bindKey]
              };
            }
          } else if (!config[bindKey].value.esParent) {
            target = `because ${config[bindKey].original ?? id.toString()} has become unparented.`;
          }
        } else {
          const branchKey = specialKeys.listeners.branch;
          const formatKey = specialKeys.listeners.format;
          if (branchKey in config) {
            const isValid = config[branchKey].find((o) => {
              let localValid = [];
              if ("condition" in o)
                localValid.push(o.condition(update));
              if ("equals" in o)
                localValid.push(o.equals === update);
              const isValidLocal = localValid.length > 0 && localValid.reduce((a, b) => a && b, true);
              if (isValidLocal) {
                if ("value" in o)
                  update = o.value;
              }
              return isValidLocal;
            });
            if (!isValid)
              isValidInput = false;
          }
          if (formatKey in config) {
            try {
              update = config[formatKey](update);
              if (update === void 0)
                isValidInput = false;
            } catch (e) {
              console.error("Failed to format arguments", e);
            }
          }
        }
      }
      if (isValidInput && update !== void 0) {
        const arrayUpdate = Array.isArray(update) ? update : [update];
        if (target === toSet) {
          const parentPath = [id];
          parentPath.push(...key.split(this.context.options.keySeparator));
          const idx = parentPath.pop();
          const info3 = this.context.monitor.get(parentPath, "info");
          info3.value[idx] = update;
        } else if (target?.default)
          target.default.call(target, ...arrayUpdate);
        else if (typeof target === "function") {
          const noContext = parent[key][listenerObject];
          if (noContext)
            target.call(config?.[specialKeys.listeners.bind]?.value ?? this.context.instance, ...arrayUpdate);
          else
            target(...arrayUpdate);
        } else {
          let baseMessage = key ? `listener: ${from} \u2014> ${key}` : `listener from ${from}`;
          if (parent) {
            console.warn(`Deleting ${baseMessage}`, target);
            delete parent[key];
          } else
            console.error(`Failed to add ${baseMessage}`, target);
        }
      }
    };
    this.context = context;
    this.rootPath = root;
    this.original = listeners2;
    const globals = [{ name: "active", ref: globalActive }, { name: "from", ref: globalFrom }, { name: "to", ref: globalTo }];
    globals.forEach((o) => {
      if (!o.ref[this.context.id])
        o.ref[this.context.id] = {};
      this.globals[o.name] = o.ref[this.context.id];
    });
    this.#toResolveWith = this.getManager();
    this.runEachListener(listeners2, this.addToGlobalLog);
  }
  #triggers;
  #queue;
  #toResolveWith;
  #initialize;
  #getAbsolutePath;
  #getPathInfo;
};
var edgelord_default = Edgelord;

// src/create/helpers/compile.ts
var catchError = (o, e) => {
  if (o[specialKeys.reference]) {
    console.warn("[escompose]: Falling back to ES Component reference...", e);
    return o[specialKeys.reference];
  } else
    return createErrorComponent(e.message);
};
var genericErrorMessage = `Cannot transform ${specialKeys.compose} string without a compose utility function`;
function compile(o, opts) {
  let uri = typeof o === "string" ? o : o[specialKeys.uri];
  if (uri && opts.utilities) {
    const bundleOpts = opts.utilities.bundle;
    const gotBundleOpts = bundleOpts && typeof bundleOpts.function === "function";
    const compileOpts = opts.utilities.compile;
    const gotCompileOpts = compileOpts && typeof compileOpts.function === "function";
    if (!gotBundleOpts && !gotCompileOpts)
      o = catchError(o, new Error(genericErrorMessage));
    else {
      return new Promise(async (resolve3) => {
        try {
          if (gotBundleOpts) {
            const options = bundleOpts.options ?? {};
            if (!options.bundler)
              options.bundler = "datauri";
            if (!options.bundle)
              options.collection = "global";
            const bundle = bundleOpts.function(uri, options);
            await bundle.compile();
            o = Object.assign({}, bundle.result);
          } else if (gotCompileOpts) {
            const resolved = await compileOpts.function(o, compileOpts.options);
            o = resolved;
          } else {
            throw new Error(genericErrorMessage);
          }
        } catch (e) {
          o = catchError(o, e);
        }
        resolve3(deep(o));
      });
    }
  }
  return deep(o);
}
function createErrorComponent(message) {
  return {
    [specialKeys.element]: "p",
    [specialKeys.hierarchy]: {
      b: {
        [specialKeys.element]: "b",
        [specialKeys.attributes]: {
          innerText: "Error: "
        }
      },
      span: {
        [specialKeys.element]: "span",
        [specialKeys.attributes]: {
          innerText: message
        }
      }
    }
  };
}

// src/create/helpers/merge.ts
function merge2(base, esCompose = {}, path = [], opts = {}) {
  if (!Array.isArray(esCompose))
    esCompose = [esCompose];
  let promise = resolve(esCompose.map((o) => {
    const compiled = compile(o, opts);
    return resolve(compiled, (compiled2) => {
      let arr = [compiled2];
      let target = compiled2;
      while (target[specialKeys.compose]) {
        const val = target[specialKeys.compose];
        delete target[specialKeys.compose];
        target = resolve(compile(val, opts));
        arr.push(target);
      }
      return arr;
    });
  }));
  return resolve(promise, (clonedEsCompose) => {
    const flat = clonedEsCompose.flat();
    let merged = Object.assign({}, base);
    delete merged[specialKeys.compose];
    flat.forEach((toCompose) => {
      merged = merge(toCompose, merged, path);
    });
    return merged;
  });
}

// src/create/element.ts
function checkESCompose(esCompose) {
  if (!esCompose)
    return false;
  const isArr = Array.isArray(esCompose);
  return isArr ? !esCompose.reduce((a, b) => a * (checkForInternalElements(b) ? 0 : 1), true) : checkForInternalElements(esCompose);
}
function checkForInternalElements(node) {
  if (node.esElement || checkESCompose(node.esCompose))
    return true;
  else if (node.esDOM)
    return check(node.esDOM);
}
function check(target) {
  for (let key in target) {
    const node = target[key];
    let res = checkForInternalElements(node);
    if (res)
      return true;
  }
}
function create(id, esm2, parent, states, utilities = {}) {
  let element = esm2[specialKeys.element];
  const attributes = esm2[specialKeys.attributes];
  let info2;
  if (!(element instanceof Element)) {
    const mustShow = attributes && Object.keys(attributes).length || checkForInternalElements(esm2);
    const defaultTagName = mustShow ? "div" : "link";
    if (element === void 0)
      element = defaultTagName;
    else if (Array.isArray(element))
      element = document.createElement(...element);
    else if (typeof element === "object") {
      info2 = element;
      if (info2.selectors)
        element = document.querySelector(info2.selectors);
      else if (info2.id)
        element = document.getElementById(info2.id);
      else
        element = defaultTagName;
    }
    if (typeof element === "string")
      element = document.createElement(element);
    const noInput = Symbol("no input to the default function");
    if (!esm2.hasOwnProperty("default")) {
      esm2.default = function(input = noInput) {
        if (input !== noInput)
          this[specialKeys.element].innerText = input;
        return this[specialKeys.element];
      };
    }
  }
  if (!(element instanceof Element))
    console.warn("Element not found for", id);
  let intermediateStates = states || {};
  intermediateStates.element = element, intermediateStates.attributes = attributes, intermediateStates.parentNode = esm2[specialKeys.parent] ?? (parent?.[specialKeys.element] instanceof Element ? parent[specialKeys.element] : void 0), intermediateStates.onresize = esm2[specialKeys.resize], intermediateStates.onresizeEventCallback = void 0;
  const finalStates = intermediateStates;
  if (element instanceof Element) {
    if (typeof id !== "string")
      id = `${element.tagName ?? "element"}${Math.floor(Math.random() * 1e15)}`;
    if (!element.id)
      element.id = id;
  }
  let isReady;
  Object.defineProperty(esm2, `${specialKeys.connected}`, {
    value: new Promise((resolve3) => isReady = async () => {
      resolve3(true);
    }),
    writable: false,
    enumerable: false
  });
  Object.defineProperty(esm2, `__${specialKeys.connected}`, { value: isReady, writable: false, enumerable: false });
  const isEventListener = (key, value2) => key.slice(0, 2) === "on" && typeof value2 === "function";
  const handleAttribute = (key, value2, context) => {
    if (!isEventListener(key, value2) && typeof value2 === "function")
      return value2.call(context);
    else
      return value2;
  };
  const setAttributes = (attributes2) => {
    if (esm2[specialKeys.element] instanceof Element) {
      for (let key in attributes2) {
        if (key === "style") {
          for (let styleKey in attributes2.style)
            esm2[specialKeys.element].style[styleKey] = handleAttribute(key, attributes2.style[styleKey], esm2);
        } else {
          const value2 = attributes2[key];
          if (isEventListener(key, value2)) {
            const func = value2;
            esm2[specialKeys.element][key] = (...args) => {
              const context = esm2[specialKeys.proxy] ?? esm2;
              return func.call(context ?? esm2, ...args);
            };
          } else
            esm2[specialKeys.element][key] = handleAttribute(key, value2, esm2);
        }
      }
    }
  };
  Object.defineProperty(esm2, specialKeys.attributes, {
    get: () => states.attributes,
    set: (value2) => {
      states.attributes = value2;
      if (states.attributes)
        setAttributes(states.attributes);
    }
  });
  Object.defineProperty(esm2, specialKeys.element, {
    get: function() {
      if (states.element instanceof Element)
        return states.element;
    },
    set: function(v) {
      if (v instanceof Element) {
        if (states.element !== v) {
          states.element.insertAdjacentElement("afterend", v);
          states.element.remove();
        }
        states.element = v;
        if (esm2[specialKeys.path] !== void 0) {
          for (let name2 in esm2[specialKeys.hierarchy]) {
            const component = esm2[specialKeys.hierarchy][name2];
            resolve(component, (res) => {
              res[specialKeys.parent] = v;
            });
          }
        }
        setAttributes(states.attributes);
      }
    },
    enumerable: true,
    configurable: false
  });
  Object.defineProperty(esm2, specialKeys.parent, {
    get: function() {
      if (esm2[specialKeys.element] instanceof Element)
        return esm2[specialKeys.element].parentNode;
    },
    set: (v) => {
      if (typeof v === "string") {
        const newValue = document.querySelector(v);
        if (newValue)
          v = newValue;
        else
          v = document.getElementById(v);
      }
      if (v?.[specialKeys.element] instanceof Element)
        v = v[specialKeys.element];
      if (esm2[specialKeys.element] instanceof Element) {
        if (esm2[specialKeys.element].parentNode)
          esm2[specialKeys.element].remove();
        if (v instanceof Element) {
          const desiredPosition = esm2[specialKeys.childPosition];
          const nextPosition = v.children.length;
          let ref = esm2[specialKeys.element];
          const esCode = esm2[`__${specialKeys.editor}`];
          if (esCode) {
            ref = esCode;
          }
          if (desiredPosition !== void 0 && desiredPosition < nextPosition)
            v.children[desiredPosition].insertAdjacentElement("beforebegin", ref);
          else
            v.appendChild(ref);
          if (esCode)
            esCode.setComponent(esm2);
        }
      } else {
        console.error("No element was created for this Component...", esm2);
      }
      if (v instanceof HTMLElement) {
        esm2[`__${specialKeys.connected}`]();
      }
    },
    enumerable: true
  });
  let onresize = esm2[specialKeys.resize];
  Object.defineProperty(esm2, specialKeys.resize, {
    get: function() {
      return onresize;
    },
    set: function(foo) {
      states.onresize = foo;
      if (states.onresizeEventCallback)
        window.removeEventListener("resize", states.onresizeEventCallback);
      if (states.onresize) {
        states.onresizeEventCallback = (ev) => {
          if (states.onresize && esm2[specialKeys.element] instanceof Element) {
            const context = esm2[specialKeys.proxy] ?? esm2;
            return foo.call(context, ev);
          }
        };
        window.addEventListener("resize", states.onresizeEventCallback);
      }
    },
    enumerable: true
  });
  if (esm2[specialKeys.editor]) {
    let config = esm2[specialKeys.editor];
    let cls = utilities.code?.class;
    if (!cls) {
      if (typeof config === "function")
        cls = config;
      else
        console.error("Editor class not provided in options.utilities.code");
    }
    if (cls) {
      let options = utilities.code?.options ?? {};
      options = typeof config === "boolean" ? options : { ...options, ...config };
      const esCode = new cls(options);
      esCode.start();
      Object.defineProperty(esm2, `__${specialKeys.editor}`, { value: esCode });
    }
  }
  if (esm2.esElement instanceof Element) {
    esm2[specialKeys.element][specialKeys.component] = esm2;
    esm2[specialKeys.element].setAttribute(specialKeys.component, "");
  }
  if (!states) {
    esm2[specialKeys.resize] = finalStates.onresize;
    if (finalStates.parentNode)
      esm2.esParent = finalStates.parentNode;
  }
  return element;
}

// src/create/component.ts
var registry = {};
var ogCreateElement = document.createElement;
document.createElement = function(name2, options) {
  const info2 = registry[name2];
  const created = info2 && !info2.autonomous ? ogCreateElement.call(this, info2.tag, { is: name2 }) : ogCreateElement.call(this, name2, options);
  return created;
};
var tagToClassMap = {
  li: "LI"
};
var isAutonomous = false;
var define = (config, esm2) => {
  esm2 = Object.assign({}, esm2);
  if (!registry[config.name]) {
    const clsName = isAutonomous ? "" : tagToClassMap[config.extends] ?? config.extends[0].toUpperCase() + config.extends.slice(1);
    const BaseClass = new Function(`

        class ESComponentBase extends HTML${clsName}Element { 
            #properties;
            constructor(properties={}){
                super()
               this.#properties = properties
            }
        }
        return ESComponentBase;

        `)();
    class ESComponent extends BaseClass {
      constructor(properties) {
        super(properties);
        resolve(src_default2(esm2), (res) => {
          res.esElement = this;
          this.esComponent = res;
        });
      }
      connectedCallback() {
        console.log("Custom element added to page.");
        this.esComponent.__esReady();
      }
      disconnectedCallback() {
        console.log("Custom element removed from page.");
      }
      adoptedCallback() {
        console.log("Custom element moved to new page.");
      }
      attributeChangedCallback(name2, oldValue, newValue) {
        console.log("Custom element attributes changed.", name2, oldValue, newValue);
      }
    }
    registry[config.name] = {
      class: ESComponent,
      autonomous: isAutonomous,
      tag: config.extends
    };
    const cls = registry[config.name].class;
    if (isAutonomous)
      customElements.define(config.name, cls);
    else
      customElements.define(config.name, cls, { extends: config.extends });
  } else {
    console.log("Already created component...");
  }
};

// src/create/define.ts
var value = (name2, value2, object) => {
  Object.defineProperty(object, name2, {
    value: value2,
    writable: false,
    configurable: false,
    enumerable: false
  });
};

// src/create/helpers/start.ts
function start_default(keys, callbacks, asyncCallback) {
  if (this[keys.options].await) {
    return asyncConnect.call(this, keys, async () => {
      if (asyncCallback)
        await asyncCallback();
      connect.call(this, keys, callbacks);
    });
  } else {
    asyncConnect.call(this, keys, asyncCallback);
    return connect.call(this, keys);
  }
}
async function asyncConnect(keys, onReadyCallback) {
  await this[keys.connected];
  this[keys.states].connected = true;
  for (let name2 in this[keys.hierarchy]) {
    let component = this[keys.hierarchy][name2];
    const promise = component[keys.promise];
    if (promise && typeof promise.then === "function")
      component = this[keys.hierarchy][name2] = await promise;
    const init = component[keys.start];
    if (typeof init === "function")
      await init();
    else
      console.error(`Could not start component ${name2} because it does not have an esConnected function`);
  }
  if (onReadyCallback)
    await onReadyCallback();
  return this;
}
function connect(keys, callbacks = []) {
  const privateEditorKey = `__${keys.editor}`;
  const esCode = this[keys.parent]?.[keys.component]?.[privateEditorKey];
  if (esCode)
    value(privateEditorKey, esCode, this);
  let source = this[esSourceKey];
  if (source) {
    if (typeof source === "function")
      source = this[keys.source] = source();
    delete this[esSourceKey];
    const path = this[keys.path];
    if (this[privateEditorKey])
      this[privateEditorKey].addFile(path, source);
  }
  const context = this[keys.proxy] ?? this;
  if (this[keys.states].initial.start)
    this[keys.states].initial.start.call(context);
  callbacks.forEach((f) => f.call(this));
  return this;
}

// src/create/helpers/stop.ts
function stop_default(keys) {
  if (this[keys.animate] && typeof this[keys.animate].stop === "function")
    this[keys.animate].stop();
  this[keys.flow].clear();
  let target = this;
  while (target[keys.parent].hasAttribute(keys.attribute)) {
    const res = target[keys.element][keys.parent]?.[keys.component];
    if (res) {
      target = res;
      if (target && target[keys.flow])
        target[keys.flow].clear(this[keys.path]);
    } else
      break;
  }
  if (this[keys.hierarchy]) {
    for (let name2 in this[keys.hierarchy]) {
      const component = this[keys.hierarchy][name2];
      if (typeof component[keys.stop] === "function")
        component[keys.stop]();
      else
        console.warn("Could not disconnect component because it does not have an esDisconnected function", name2, this.esDOM);
    }
  }
  if (this[keys.element] instanceof Element) {
    this[keys.element].remove();
    if (this[keys.remove]) {
      const context2 = this[keys.proxy] ?? this;
      this[keys.remove].call(context2);
    }
  }
  const privateEditorKey = `__${keys.editor}`;
  if (this[privateEditorKey])
    this[privateEditorKey].remove();
  const context = this[keys.proxy] ?? this;
  const ogStop = this[keys.states].initial.stop;
  if (ogStop)
    ogStop.call(context);
  this[keys.start] = this[keys.states].initial.start;
  this[keys.stop] = ogStop;
  return this;
}

// src/create/helpers/animate.ts
var animations = {};
function animate(keys) {
  const key = keys.animate ?? "animate";
  if (this[key]) {
    let original = this[key];
    const id = Math.random();
    const interval = typeof original === "number" ? original : "global";
    if (!animations[interval]) {
      const info2 = animations[interval] = { objects: { [id]: this } };
      const objects2 = info2.objects;
      const runFuncs = () => {
        for (let key2 in objects2)
          objects2[key2].default();
      };
      if (interval === "global") {
        const callback = () => {
          runFuncs();
          info2.id = window.requestAnimationFrame(callback);
        };
        callback();
        animations[interval].stop = () => {
          window.cancelAnimationFrame(info2.id);
          info2.cancel = true;
        };
      } else {
        runFuncs();
        info2.id = setInterval(() => runFuncs(), 1e3 / interval);
        animations[interval].stop = () => clearInterval(info2.id);
      }
    } else {
      this.default();
      animations[interval].objects[id] = this;
    }
    this[key] = {
      id,
      original,
      stop: () => {
        delete animations[interval].objects[id];
        this[key] = original;
        if (Object.keys(animations[interval].objects).length === 0) {
          animations[interval].stop();
          delete animations[interval];
        }
      }
    };
  }
}

// src/create/helpers/index.ts
function start(keys) {
  return start_default.call(this, keys, [
    function() {
      animate.call(this, keys);
    }
  ]);
}

// src/create/index.ts
var create_default = (id, esm2, parent, opts = {}) => {
  const states = {
    connected: false,
    initial: {
      start: esm2[specialKeys.start],
      stop: esm2[specialKeys.stop]
    }
  };
  value(specialKeys.states, states, esm2);
  value(specialKeys.options, opts, esm2);
  const copy = deep(esm2);
  try {
    const hierarchyKey = specialKeys.hierarchy;
    for (let name2 in esm2[hierarchyKey]) {
      const value2 = esm2[hierarchyKey][name2];
      const isUndefined = value2 == void 0;
      const type = isUndefined ? JSON.stringify(value2) : typeof value2;
      if (type != "object") {
        console.error(`Removing ${name2} ${hierarchyKey} field that which is not an ES Component object. Got ${isUndefined ? type : `a ${type}`} instead.`);
        delete esm2[hierarchyKey][name2];
      }
    }
    let registry2 = esm2[specialKeys.webcomponents] ?? {};
    for (let key in registry2) {
      const esm3 = registry2[key];
      const info2 = esm3[specialKeys.element];
      if (info2.name && info2.extends)
        define(info2, esm3);
    }
    let el = create(id, esm2, parent, states, opts.utilities);
    const finalStates = states;
    esm2[specialKeys.element] = el;
    esm2[specialKeys.start] = () => start.call(esm2, specialKeys);
    esm2[specialKeys.stop] = () => stop_default.call(esm2, specialKeys);
    for (let key in esm2) {
      if (isPrivate(key))
        continue;
      if (typeof esm2[key] === "function") {
        const desc = Object.getOwnPropertyDescriptor(esm2, key);
        if (desc && desc.get && !desc.set)
          esm2 = Object.assign({}, esm2);
        const og = esm2[key];
        esm2[key] = (...args) => {
          const context = esm2[specialKeys.proxy] ?? esm2;
          return og.call(context, ...args);
        };
      }
    }
    const isESC = { value: "", enumerable: false };
    if (typeof id === "string") {
      const path = parent[specialKeys.path];
      if (path)
        isESC.value = [path, id];
      else
        isESC.value = [id];
      isESC.value = isESC.value.join(keySeparator);
    }
    Object.defineProperty(esm2, specialKeys.path, isESC);
    Object.defineProperty(esm2, specialKeys.original, { value: copy, enumerable: false });
    esm2[specialKeys.resize] = finalStates.onresize;
    esm2[specialKeys.parent] = finalStates.parentNode;
    return esm2;
  } catch (e) {
    console.error(`Failed to create an ES Component (${typeof id === "string" ? id : id.toString()}):`, e);
    return copy;
  }
};

// src/create/helpers/hierarchy.ts
function hierarchy(o, id, toMerge = {}, parent, directParent, opts = {}, callbacks = {}, waitForChildren = false) {
  const parentId = parent?.[specialKeys.path];
  const path = parentId ? [parentId, id] : typeof id === "string" ? [id] : [];
  const firstMerge = merge(toMerge, o, path);
  const merged = merge2(firstMerge, o[specialKeys.compose], path, opts);
  const res = resolve(merged, (merged2) => {
    delete merged2[specialKeys.compose];
    const instance = create_default(id, merged2, parent, opts);
    const absolutePath = path.join(opts.keySeparator ?? keySeparator);
    if (directParent)
      directParent[id] = instance;
    if (callbacks[id])
      callbacks[id](instance);
    if (callbacks.onInstanceCreated)
      callbacks.onInstanceCreated(absolutePath, instance);
    const isReady = () => {
      if (callbacks.onInstanceReady)
        callbacks.onInstanceReady(absolutePath, instance);
    };
    if (instance[specialKeys.hierarchy]) {
      let positions = /* @__PURE__ */ new Set();
      let position = 0;
      const promises = Object.entries(instance[specialKeys.hierarchy]).map(async ([name2, base], i) => {
        base = Object.assign({}, base);
        const pos = base[specialKeys.childPosition];
        if (pos !== void 0) {
          if (positions.has(pos))
            console.warn(`[escompose]: Duplicate ${specialKeys.childPosition} value of ${pos} found in ${name2} of ${instance[specialKeys.path]}`);
          else
            positions.add(pos);
        } else {
          while (positions.has(position))
            position++;
          base[specialKeys.childPosition] = position;
          positions.add(position);
        }
        const promise = hierarchy(base, name2, void 0, instance, instance[specialKeys.hierarchy], opts, callbacks, true);
        Object.defineProperty(instance[specialKeys.hierarchy][name2], specialKeys.promise, {
          value: promise,
          writable: false
        });
        return resolve(promise);
      });
      const res2 = resolve(promises, (resolved) => {
        isReady();
        return resolved;
      });
      if (waitForChildren)
        return resolve(res2, () => instance);
    } else
      isReady();
    return instance;
  });
  return res;
}

// src/index.ts
var create2 = (config, toMerge = {}, options = {}) => {
  options = deep(options);
  let monitor;
  if (options.monitor instanceof src_default) {
    monitor = options.monitor;
    options.keySeparator = monitor.options.keySeparator;
  } else {
    if (!options.monitor)
      options.monitor = {};
    if (!options.monitor.keySeparator) {
      if (!options.keySeparator)
        options.keySeparator = keySeparator;
      options.monitor.keySeparator = options.keySeparator;
    }
    options.monitor = new src_default(options.monitor);
  }
  if (options.clone)
    config = deep(config);
  options.monitor.options.fallbacks = [specialKeys.hierarchy];
  const fullOptions = options;
  let instancePromiseOrObject;
  const onConnected = (instance) => {
    const noParent = !instance[specialKeys.parent];
    if (noParent)
      return instance;
    else
      return resolve(instance[specialKeys.start](), resolve2);
  };
  if (options.nested?.parent && options.nested?.name) {
    instancePromiseOrObject = hierarchy(config, options.nested.name, toMerge, options.nested.parent, void 0, fullOptions);
  } else {
    const id = Symbol("root");
    let listeners2 = {};
    instancePromiseOrObject = hierarchy(config, id, toMerge, void 0, void 0, fullOptions, {
      [id]: (instance) => {
        options.monitor.set(id, instance, fullOptions.listeners);
      },
      onInstanceCreated: (absolutePath, instance) => {
        if (fullOptions.listen !== false) {
          const to = instance[specialKeys.listeners.value] ?? {};
          const manager = listeners2[absolutePath] = new edgelord_default(to, absolutePath, {
            id,
            instance,
            monitor: fullOptions.monitor,
            options: fullOptions
          });
          instance[specialKeys.listeners.value] = to;
          Object.defineProperty(instance, specialKeys.flow, {
            value: manager,
            enumerable: false,
            writable: false
          });
          if (specialKeys.trigger in instance) {
            if (!Array.isArray(instance[specialKeys.trigger]))
              instance[specialKeys.trigger] = [];
            const args = instance[specialKeys.trigger];
            manager.onStart(() => instance.default(...args));
            delete instance[specialKeys.trigger];
          }
        }
      },
      onInstanceReady: (absolutePath) => {
        listeners2[absolutePath].start();
      }
    });
  }
  return resolve(instancePromiseOrObject, onConnected);
};
var src_default2 = create2;
var clone = deep;
var resolve2 = resolve;
export {
  clone,
  create2 as create,
  src_default2 as default,
  resolve2 as resolve
};
