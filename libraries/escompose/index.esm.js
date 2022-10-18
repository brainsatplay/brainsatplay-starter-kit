var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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
var getPath = (type, info) => {
  const pathType = info.path[type];
  if (!pathType)
    throw new Error("Invalid Path Type");
  const filtered = pathType.filter((v) => typeof v === "string");
  return filtered.join(info.keySeparator);
};

// ../esmonitor/src/Poller.ts
var defaultSamplingRate = 60;
var Poller = class {
  constructor(listeners, sps) {
    this.listeners = {};
    this.setOptions = (opts = {}) => {
      for (let key in opts)
        this[key] = opts[key];
    };
    this.add = (info) => {
      const sub = info.sub;
      this.listeners[sub] = info;
      this.start();
    };
    this.get = (sub) => this.listeners[sub];
    this.remove = (sub) => {
      delete this.listeners[sub];
      if (!Object.keys(this.listeners).length)
        this.stop();
    };
    this.poll = (listeners) => {
      iterateSymbols(listeners, (sym, o) => {
        let { callback, current, history } = o;
        if (!o.path.resolved)
          o.path.resolved = getPath("output", o);
        if (!isSame(current, history)) {
          const info = {};
          callback(o.path.resolved, info, current);
          if (typeof current === "object") {
            if (Array.isArray(current))
              history = [...current];
            else
              history = { ...current };
          } else
            listeners[sym].history = current;
        }
      });
    };
    this.start = (listeners = this.listeners) => {
      if (!this.sps)
        this.sps = defaultSamplingRate;
      else if (!this.#pollingId) {
        console.warn("Starting Polling!");
        this.#pollingId = setInterval(() => this.poll(listeners), 1e3 / this.sps);
      }
    };
    this.stop = () => {
      if (this.#pollingId) {
        console.warn("Stopped Polling!");
        clearInterval(this.#pollingId);
      }
    };
    if (listeners)
      this.listeners = listeners;
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
    const listeners = this.listeners;
    const nListeners = Object.keys(listeners).length;
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
  functions: () => functions,
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
var get = async (func, args, info) => {
  let result = {
    value: {},
    output: void 0
  };
  const infoToGet = { ...global_default.info, ...info };
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
  result.output = await func(...args);
  return result;
};

// ../esmonitor/src/listeners.ts
var register = (info, collection) => {
  const absolute = getPath("absolute", info);
  if (!collection[absolute])
    collection[absolute] = {};
  collection[absolute][info.sub] = info;
};
var get2 = (info, collection) => collection[getPath("absolute", info)];
var handler = (info, collection, subscribeCallback, monitor = true) => {
  if (monitor) {
    if (!get2(info, collection)) {
      let parent = info.parent;
      let val = parent[info.last];
      subscribeCallback(val, parent);
    }
  }
  register(info, collection);
};
var setterExecution = async (listeners, value) => {
  const executionInfo = {};
  await iterateSymbols(listeners, (_, o) => o.callback(getPath("output", o), executionInfo, value));
};
var setters = (info, collection, monitor = true) => {
  handler(info, collection, (value, parent) => {
    let val = value;
    delete parent[info.last];
    try {
      Object.defineProperty(parent, info.last, {
        get: () => val,
        set: async (v) => {
          const listeners = Object.assign({}, collection[getPath("absolute", info)]);
          setterExecution(listeners, v);
          val = v;
        },
        enumerable: true
      });
    } catch (e) {
      throw e;
    }
  }, monitor);
};
var functionExecution = async (context, listeners, func, args) => {
  listeners = Object.assign({}, listeners);
  const keys = Object.getOwnPropertySymbols(listeners);
  const info = listeners[keys[0]];
  const executionInfo = await get(async (...args2) => await func.call(context, ...args2), args, info.infoToOutput);
  await iterateSymbols(listeners, (_, o) => {
    o.callback(getPath("output", o), executionInfo.value, executionInfo.output);
  });
  return executionInfo;
};
var functions = (info, collection, monitor = true) => {
  handler(info, collection, (_, parent) => {
    parent[info.last] = async function(...args) {
      const listeners = collection[getPath("absolute", info)];
      functionExecution(this, listeners, info.original, args);
    };
  }, monitor);
};

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
  let drill2 = (obj2, acc = {}, globalInfo) => {
    for (let key in obj2) {
      if (ignore.includes(key))
        continue;
      const val = obj2[key];
      const newPath = [...globalInfo.path, key];
      const info = {
        typeof: typeof val,
        name: val?.constructor?.name,
        simple: true,
        object: val && typeof val === "object",
        path: newPath
      };
      if (info.object) {
        const name = info.name;
        if (name === "Object" || name === "Array") {
          info.simple = true;
          const idx = seen.indexOf(val);
          if (idx !== -1)
            acc[key] = fromSeen[idx];
          else {
            seen.push(val);
            const pass2 = condition instanceof Function ? condition(key, val, info) : condition;
            info.pass = pass2;
            acc[key] = callback(key, val, info);
            if (pass2) {
              fromSeen.push(acc[key]);
              acc[key] = drill2(val, acc[key], { ...globalInfo, path: newPath });
            }
          }
        } else {
          info.simple = false;
          acc[key] = callback(key, val, info);
        }
      } else
        acc[key] = callback(key, val, info);
    }
    return acc;
  };
  return drill2(obj, accumulator, { path });
};

// ../common/standards.ts
var keySeparator = ".";
var defaultPath = "default";

// ../common/pathHelpers.ts
var hasKey = (key, obj) => {
  return obj.hasOwnProperty(key) || key in obj;
};
var getFromPath = (baseObject, path, opts = {}) => {
  const fallbackKeys = opts.fallbacks ?? [];
  const keySeparator2 = opts.keySeparator ?? keySeparator;
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
    if (!hasKey(str, ref) && ref.hasOwnProperty("esComponents")) {
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
    else if (i === path.length - 1) {
      if (!opts.dynamic)
        console.error(`Final path key not found: ${str}`, path, ref, baseObject);
      return;
    }
  }
  if (opts.output === "info")
    return { value: ref, exists };
  else
    return ref;
};
var setFromPath = (path, value, ref, opts = {}) => {
  const create3 = opts?.create ?? false;
  const keySeparator2 = opts?.keySeparator ?? keySeparator;
  if (typeof path === "string")
    path = path.split(keySeparator2);
  else if (typeof path == "symbol")
    path = [path];
  path = [...path];
  const copy = [...path];
  const last = copy.pop();
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
    if (ref.esComponents)
      ref = ref.esComponents;
  }
  ref[last] = value;
};

// ../esmonitor/src/inspectable/handlers.ts
var handlers_exports = {};
__export(handlers_exports, {
  functions: () => functions2,
  isProxy: () => isProxy,
  objects: () => objects,
  runCallback: () => runCallback
});
var isProxy = Symbol("isProxy");
var runCallback = (callback, path, info, output, setGlobal = true) => {
  if (callback instanceof Function)
    callback(path, info, output);
  if (setGlobal && window.ESMonitorState) {
    const callback2 = window.ESMonitorState.callback;
    window.ESMonitorState.state[path] = {
      output,
      value: info
    };
    runCallback(callback2, path, info, output, false);
  }
};
var functions2 = (proxy) => {
  return {
    apply: async function(target, thisArg, argumentsList) {
      try {
        const pathStr = proxy.path.join(proxy.options.keySeparator);
        const listeners = proxy.listeners ? proxy.listeners.functions[pathStr] : void 0;
        let output, executionInfo = {};
        if (listeners) {
          executionInfo = await functionExecution(thisArg, listeners, target, argumentsList);
          output = executionInfo.output;
        } else {
          output = await target.apply(thisArg, argumentsList);
          executionInfo = proxy?.state?.[pathStr]?.value ?? {};
        }
        const callback = proxy.options.callback;
        runCallback(callback, pathStr, executionInfo, output);
        return output;
      } catch (e) {
        console.warn(`Cannot run function:`, e, proxy.proxy.path, proxy.parent, target, argumentsList);
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
      if (newVal) {
        const newProxy = proxy.create(prop, target, newVal);
        if (newProxy)
          newVal = newProxy;
      }
      if (proxy.listeners) {
        const listeners = proxy.listeners.setters[pathStr];
        if (listeners)
          setterExecution(listeners, newVal);
      }
      const callback = proxy.options.callback;
      const info = proxy?.state?.[pathStr]?.value ?? {};
      runCallback(callback, pathStr, info, newVal);
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
      else
        console.warn("Cannot create proxy for ESM:", key, val);
    } else if (!parent.hasOwnProperty(key))
      return true;
  }
  return false;
};
var Inspectable = class {
  constructor(target = {}, opts = {}, name, parent) {
    this.path = [];
    this.state = {};
    this.set = (path, info, update) => {
      this.state[path] = {
        output: update,
        value: info
      };
      setFromPath(path, update, this.proxy, { create: true });
    };
    this.check = canCreate;
    this.create = (key, parent, val, set = false) => {
      const create3 = this.check(parent, key, val);
      if (val === void 0)
        val = parent[key];
      if (create3 && !(create3 instanceof Error)) {
        parent[key] = new Inspectable(val, this.options, key, this);
        return parent[key];
      }
      if (set) {
        try {
          this.proxy[key] = val ?? parent[key];
        } catch (e) {
          const isESM = esm(parent);
          const path = [...this.path, key];
          console.warn(`Could not set value (${path.join(this.options.keySeparator)})${isESM ? " because the parent is an ESM." : ""}`);
        }
      }
      return;
    };
    if (target.__esProxy)
      this.proxy = target.__esProxy;
    else {
      this.target = target;
      this.options = opts;
      this.parent = parent;
      if (this.parent) {
        this.path = [...this.parent.path];
        this.state = this.parent.state ?? {};
      }
      if (name)
        this.path.push(name);
      if (opts.listeners)
        this.listeners = opts.listeners;
      if (opts.path) {
        if (opts.path instanceof Function)
          this.path = opts.path(this.path);
        else if (Array.isArray(opts.path))
          this.path = opts.path;
        else
          console.log("Invalid path", opts.path);
      }
      if (!this.options.keySeparator)
        this.options.keySeparator = keySeparator;
      let type = opts.type;
      if (type != "object")
        type = typeof target === "function" ? "function" : "object";
      const handler2 = handlers_exports[`${type}s`](this);
      this.proxy = new Proxy(target, handler2);
      Object.defineProperty(target, "__esProxy", { value: this.proxy, enumerable: false });
      Object.defineProperty(target, "__esInspectable", { value: this, enumerable: false });
      for (let key in target)
        this.create(key, target, void 0, true);
    }
    return this.proxy;
  }
};

// ../esmonitor/src/Monitor.ts
var fallback = "esComponents";
var Monitor = class {
  constructor(opts = {}) {
    this.poller = new Poller();
    this.options = {
      pathFormat: "relative",
      keySeparator
    };
    this.listenerLookup = {};
    this.listeners = {
      polling: this.poller.listeners,
      functions: {},
      setters: {}
    };
    this.references = {};
    this.get = (path, output) => getFromPath(this.references, path, {
      keySeparator: this.options.keySeparator,
      fallbacks: [fallback],
      output,
      dynamic: this.references[path[0]][isProxy]
    });
    this.set = (path, value, ref = this.references, opts = {}) => setFromPath(path, value, ref, opts);
    this.on = (absPath, callback, options = {}) => {
      let splitPath = absPath;
      if (typeof absPath === "string")
        splitPath = absPath.split(this.options.keySeparator);
      else if (typeof absPath === "symbol")
        splitPath = [absPath];
      const id = splitPath[0];
      return this.listen(id, callback, splitPath.slice(1), options);
    };
    this.getInfo = (id, type, callback, path, original) => {
      if (typeof path === "string")
        path = path.split(this.options.keySeparator);
      const relativePath = path.join(this.options.keySeparator);
      const refs = this.references;
      const get3 = this.get;
      const set = this.set;
      let onUpdate = this.options.onUpdate;
      let infoToOutput = {};
      if (onUpdate && typeof onUpdate === "object" && onUpdate.callback instanceof Function) {
        infoToOutput = onUpdate.info ?? {};
        onUpdate = onUpdate.callback;
      }
      const absolute = [id, ...path];
      let pathInfo = {
        absolute,
        relative: relativePath.split(this.options.keySeparator),
        parent: absolute.slice(0, -1)
      };
      pathInfo.output = pathInfo[this.options.pathFormat];
      const completePathInfo = pathInfo;
      const info = {
        id,
        path: completePathInfo,
        keySeparator: this.options.keySeparator,
        infoToOutput,
        callback: async (...args) => {
          const output = await callback(...args);
          if (onUpdate instanceof Function)
            onUpdate(...args);
          return output;
        },
        get current() {
          return get3(info.path.absolute);
        },
        set current(val) {
          set(info.path.absolute, val);
        },
        get parent() {
          return get3(info.path.parent);
        },
        get reference() {
          return refs[id];
        },
        set reference(val) {
          refs[id] = val;
        },
        original,
        history: typeof original === "object" ? Object.assign({}, original) : original,
        sub: Symbol("subscription"),
        last: path.slice(-1)[0]
      };
      this.listenerLookup[info.sub] = getPath("absolute", info);
      return info;
    };
    this.listen = (id, callback, path = [], options, __internal = {}) => {
      let isDynamic = options.static ? !options.static : true;
      if (typeof path === "string")
        path = path.split(this.options.keySeparator);
      else if (typeof path === "symbol")
        path = [path];
      const arrayPath = path;
      let baseRef = this.references[id];
      if (!baseRef) {
        console.error(`Reference ${id} does not exist.`);
        return;
      }
      if (isDynamic && !globalThis.Proxy) {
        isDynamic = false;
        console.warn("Falling back to using function interception and setters...");
      }
      let isInspectable = baseRef[isProxy];
      if (isDynamic && !isInspectable) {
        const inspector = new Inspectable(baseRef, {
          keySeparator: this.options.keySeparator,
          listeners: this.listeners,
          path: (path2) => path2.filter((str) => str !== fallback)
        });
        this.set(id, inspector);
        baseRef = inspector;
        isInspectable = true;
      }
      if (!__internal.poll)
        __internal.poll = esm(baseRef);
      if (!__internal.seen)
        __internal.seen = [];
      const __internalComplete = __internal;
      if (!this.references[id])
        this.references[id] = baseRef;
      let ref = this.get([id, ...arrayPath]);
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
        drillSimple(ref, (key, val, drillInfo) => {
          if (drillInfo.pass)
            return;
          else {
            const fullPath = [...arrayPath, ...drillInfo.path];
            const internalSubs = this.listen(id, callback, fullPath, options, __internalComplete);
            Object.assign(subs, internalSubs);
          }
        }, {
          condition: (_, val) => toMonitorInternally(val)
        });
      } else {
        let info;
        try {
          if (__internalComplete.poll) {
            info = this.getInfo(id, "polling", callback, arrayPath, ref);
            this.poller.add(info);
          } else {
            let type = "setters";
            if (typeof ref === "function")
              type = "functions";
            info = this.getInfo(id, type, callback, arrayPath, ref);
            this.add(type, info, !isInspectable);
          }
        } catch (e) {
          console.warn("Falling to polling:", path, e);
          info = this.getInfo(id, "polling", callback, arrayPath, ref);
          this.poller.add(info);
        }
        subs[getPath("absolute", info)] = info.sub;
        if (this.options.onInit instanceof Function) {
          const executionInfo = {};
          for (let key in info.infoToOutput)
            executionInfo[key] = void 0;
          this.options.onInit(getPath("output", info), executionInfo);
        }
      }
    };
    this.add = (type, info, monitor = true) => {
      if (listeners_exports[type])
        listeners_exports[type](info, this.listeners[type], monitor);
      else
        this.listeners[type][getPath("absolute", info)][info.sub] = info;
    };
    this.remove = (subs) => {
      if (!subs) {
        subs = subs = {
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
      const absPath = this.listenerLookup[sub];
      const polling = this.poller.get(sub);
      const funcs = this.listeners.functions[absPath];
      const func = funcs?.[sub];
      const setters2 = this.listeners.setters[absPath];
      const setter = setters2?.[sub];
      if (polling)
        this.poller.remove(sub);
      else if (func) {
        delete funcs[sub];
        if (!Object.getOwnPropertySymbols(funcs).length)
          func.current = func.original;
      } else if (setter) {
        delete setters2[sub];
        if (!Object.getOwnPropertySymbols(setters2).length) {
          const parent = setter.parent;
          const last = setter.last;
          const value = parent[last];
          Object.defineProperty(parent, last, { value });
        }
      } else
        return false;
      delete this.listenerLookup[sub];
    };
    Object.assign(this.options, opts);
    this.poller.setOptions(opts.polling);
  }
};

// ../esmonitor/src/index.ts
var src_default = Monitor;

// src/create/element.ts
function create(id, esm2, parent) {
  let element = esm2.esElement;
  let info;
  if (!(element instanceof Element)) {
    if (typeof element === "object") {
      info = element;
      const id2 = info.id;
      if (info.element instanceof Element)
        element = info.element;
      else if (info.selectors)
        element = document.querySelector(info.selectors);
      else if (info.id)
        element = document.getElementById(info.id);
      else
        element = info.element;
    }
    if (typeof element === "string")
      element = document.createElement(element);
  }
  if (!(element instanceof Element))
    console.warn("Element not found for", id);
  let states = {
    element,
    parentNode: esm2.esParent ?? info?.parentNode ?? (parent?.esElement instanceof Element ? parent.esElement : void 0),
    onresize: esm2.esOnResize,
    onresizeEventCallback: void 0
  };
  if (element instanceof Element) {
    if (typeof id !== "string")
      id = `${element.tagName ?? "element"}${Math.floor(Math.random() * 1e15)}`;
    if (!element.id)
      element.id = id;
    if (info) {
      if (info.attributes) {
        for (let key in info.attributes) {
          if (typeof info.attributes[key] === "function") {
            const func = info.attributes[key];
            element[key] = (...args) => {
              const context = esm2.__esProxy ?? esm2;
              return func.call(context ?? esm2, ...args);
            };
          } else
            element[key] = info.attributes[key];
        }
      }
      if (element instanceof HTMLElement && info.style)
        Object.assign(element.style, info.style);
    }
  }
  Object.defineProperty(esm2, "esElement", {
    get: function() {
      if (states.element instanceof Element)
        return states.element;
    },
    set: function(v) {
      if (v instanceof Element) {
        states.element = v;
        for (let name in esm2.esComponents) {
          const component = esm2.esComponents[name];
          component.esParent = v;
        }
      }
    },
    enumerable: true,
    configurable: false
  });
  Object.defineProperty(esm2, "esParent", {
    get: function() {
      if (esm2.esElement instanceof Element)
        return esm2.esElement.parentNode;
    },
    set: (v) => {
      if (typeof v === "string") {
        const newValue = document.querySelector(v);
        if (newValue)
          v = newValue;
        else
          v = document.getElementById(v);
      }
      if (v?.esElement instanceof Element)
        v = v.esElement;
      if (esm2.esElement instanceof Element) {
        if (esm2.esElement.parentNode)
          esm2.esElement.remove();
        if (v)
          v.appendChild(esm2.esElement);
      } else {
        for (let name in esm2.esComponents) {
          const component = esm2.esComponents[name];
          component.esParent = v;
        }
      }
    },
    enumerable: true
  });
  let onresize = esm2.esOnResize;
  Object.defineProperty(esm2, "esOnResize", {
    get: function() {
      return onresize;
    },
    set: function(foo) {
      states.onresize = foo;
      if (states.onresizeEventCallback)
        window.removeEventListener("resize", states.onresizeEventCallback);
      if (states.onresize) {
        states.onresizeEventCallback = (ev) => {
          if (states.onresize && esm2.esElement instanceof Element) {
            const context = esm2.__esProxy ?? esm2;
            return foo.call(context, ev);
          }
        };
        window.addEventListener("resize", states.onresizeEventCallback);
      }
    },
    enumerable: true
  });
  esm2.esOnResize = states.onresize;
  esm2.esParent = states.parentNode;
  if (esm2.esElement instanceof Element) {
    esm2.esElement.esComponent = esm2;
    esm2.esElement.setAttribute("__isescomponent", "");
  }
  return element;
}

// src/create/index.ts
var create_default = (id, esm2, parent) => {
  let el = create(id, esm2, parent);
  esm2.esElement = el;
  const onInit = esm2.esInit;
  esm2.esInit = () => {
    for (let name in esm2.esComponents) {
      const init = esm2.esComponents[name].esInit;
      if (typeof init === "function")
        init();
      else
        console.error(`Could not start component ${name} because it does not have an esInit function`);
    }
    if (esm2.hasOwnProperty("esTrigger")) {
      esm2.default(esm2.esTrigger);
      delete esm2.esTrigger;
    }
    const context = esm2.__esProxy ?? esm2;
    if (onInit)
      onInit.call(context);
  };
  esm2.esDelete = function() {
    if (this.esElement instanceof Element) {
      this.esElement.remove();
      if (this.onremove) {
        const context = esm2.__esProxy ?? esm2;
        this.onremove.call(context);
      }
    }
  };
  for (let key in esm2) {
    if (typeof esm2[key] === "function") {
      const desc = Object.getOwnPropertyDescriptor(esm2, key);
      if (desc && desc.get && !desc.set)
        esm2 = Object.assign({}, esm2);
      const og = esm2[key];
      esm2[key] = (...args) => {
        const context = esm2.__esProxy ?? esm2;
        return og.call(context, ...args);
      };
    }
  }
  Object.defineProperty(esm2, "__isESComponent", {
    value: true,
    enumerable: false
  });
  return esm2;
};

// ../common/clone.js
var deep = (obj, opts = {}) => {
  opts.accumulator = {};
  drillSimple(obj, (key, val, info) => {
    if (info.simple && info.object)
      return Array.isArray(val) ? [] : {};
    else
      return val;
  }, opts);
  return opts.accumulator;
};

// src/index.ts
var drill = (o, id, parent, path = [], opts) => {
  const clonedEsCompose = deep(o.esCompose) ?? {};
  let merged = Object.assign({}, Object.assign(Object.assign({}, clonedEsCompose), o));
  delete merged.esCompose;
  const instance = create_default(id, merged, parent);
  const savePath = path.join(opts.keySeparator ?? keySeparator);
  if (opts?.components)
    opts.components[savePath] = { instance, depth: parent ? path.length + 1 : path.length };
  if (instance.esComponents) {
    for (let name in instance.esComponents) {
      const base = instance.esComponents[name];
      let thisPath = [...path, name];
      const thisInstance = drill(base, name, instance, thisPath, opts);
      instance.esComponents[name] = thisInstance;
    }
  }
  return instance;
};
var setListeners = (context, components) => {
  context.listeners = {};
  for (let absPath in components) {
    const info = components[absPath];
    const listeners = info.instance.esListeners;
    for (let path in listeners) {
      const basePath = [context.id];
      const topPath = [];
      if (absPath)
        topPath.push(...absPath.split(context.options.keySeparator));
      if (path)
        topPath.push(...path.split(context.options.keySeparator));
      basePath.push(...topPath);
      const obj = context.monitor.get(basePath);
      if (obj?.__isESComponent)
        basePath.push(defaultPath);
      const joined = topPath.join(context.options.keySeparator);
      if (!context.listeners[joined])
        context.listeners[joined] = {};
      const value = listeners[path];
      if (typeof value === "object")
        context.listeners[joined] = { ...listeners[path] };
      else
        context.listeners[joined] = value;
      context.monitor.on(basePath, (path2, info2, args) => {
        passToListeners(context, absPath, path2, info2, args), context.options.listeners;
      });
    }
  }
};
function pass(from, target, args, context) {
  const id = context.id;
  let parent, key, root;
  const isValue = target?.__value;
  parent = target.parent;
  key = target.key;
  root = target.root;
  target = target.parent[key];
  let ogValue = target;
  const type = typeof target;
  const checkIfSetter = (path) => {
    const info = context.monitor.get(path, "info");
    if (info.exists) {
      const val = info.value;
      const noDefault = typeof val !== "function" && !val?.default;
      if (noDefault)
        target = toSet;
      else
        target = val;
      parent[key] = target;
    }
  };
  if (typeof target === "boolean") {
    if (!isValue) {
      const fullPath = [id];
      if (root)
        fullPath.push(root);
      fullPath.push(...key.split(context.options.keySeparator));
      checkIfSetter(fullPath);
    } else
      console.error("Cannot use a boolean for esListener...");
  } else if (type === "string") {
    const path = [id];
    const topPath = [];
    if (root)
      topPath.push(root);
    topPath.push(...target.split(context.options.keySeparator));
    path.push(...topPath);
    checkIfSetter(path);
    if (isValue)
      parent[key] = { [ogValue]: parent[key] };
  }
  if (target === toSet) {
    const parentPath = [id];
    if (root)
      parentPath.push(root);
    parentPath.push(...key.split(context.options.keySeparator));
    const idx = parentPath.pop();
    const info = context.monitor.get(parentPath, "info");
    info.value[idx] = args[0];
  } else if (target?.default)
    target.default(...args);
  else if (typeof target === "function")
    target(...args);
  else {
    try {
      const parentPath = [id];
      if (root)
        parentPath.push(root);
      parentPath.push(...key.split(context.options.keySeparator));
      const idx = parentPath.pop();
      const info = context.monitor.get(parentPath, "info");
      const arg = args[0];
      if (target.esBranch) {
        target.esBranch.forEach((o) => {
          if (o.equals === arg)
            info.value[idx] = o.value;
        });
      } else
        info.value[idx] = target;
    } catch (e) {
      let baseMessage = `listener: ${from} \u2014> ${key}`;
      if (parent) {
        console.error(`Deleting ${baseMessage}`, parent[key], e);
        delete parent[key];
      } else
        console.error(`Failed to add ${baseMessage}`, target);
    }
  }
}
function passToListeners(context, root, name, info, ...args) {
  const sep = context.options.keySeparator;
  const noDefault = name.slice(0, -`${sep}${defaultPath}`.length);
  const listenerGroups = [{
    info: context.listeners[name],
    name
  }, {
    info: context.listeners[noDefault],
    name: noDefault
  }];
  listenerGroups.forEach((group) => {
    const info2 = group.info;
    if (info2) {
      if (typeof info2 === "object") {
        for (let key in info2) {
          pass(name, {
            parent: info2,
            key,
            root,
            value: info2[key]
          }, args, context);
        }
      } else {
        pass(name, {
          value: info2,
          parent: context.listeners,
          key: group.name,
          root,
          __value: true
        }, args, context);
      }
    }
  });
}
var toSet = Symbol("toSet");
var create2 = (config, options = {}) => {
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
    monitor = new src_default(options.monitor);
  }
  const fullOptions = options;
  const id = Symbol("root");
  const components = {};
  const instance = drill(config, id, void 0, void 0, {
    components,
    keySeparator: fullOptions.keySeparator
  });
  let fullInstance = instance;
  monitor.set(id, fullInstance);
  const context = {
    id,
    instance: fullInstance,
    monitor,
    options: fullOptions
  };
  setListeners(context, components);
  fullInstance.esInit();
  return fullInstance;
};
var src_default2 = create2;
export {
  src_default2 as default
};
