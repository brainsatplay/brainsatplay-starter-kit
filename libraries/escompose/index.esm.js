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
      output.then((value) => callback(path, info2, value));
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

// ../common/standards.ts
var keySeparator = ".";
var defaultPath = "default";

// ../common/pathHelpers.ts
var hasKey = (key, obj) => key in obj;
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
    if (ref.esDOM)
      ref = ref.esDOM;
  }
  ref[last] = value;
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
  constructor(target = {}, opts = {}, name, parent) {
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
      if (name)
        this.path.push(name);
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
          let value = target[key];
          if (typeof value === "function") {
            target[key] = async (...args) => await this.proxy[key]({ [fromInspectable]: true, value }, ...args);
          } else {
            try {
              Object.defineProperty(target, key, {
                get: () => value,
                set: (val) => {
                  value = val;
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
var setFromOptions = (path, value, baseOptions, opts) => {
  const ref = opts.reference;
  const id = Array.isArray(path) ? path[0] : typeof path === "string" ? path.split(baseOptions.keySeparator)[0] : path;
  let isDynamic = opts.hasOwnProperty("static") ? !opts.static : false;
  if (isDynamic && !globalThis.Proxy) {
    isDynamic = false;
    console.warn("Falling back to using function interception and setters...");
  }
  if (isDynamic) {
    value = new Inspectable(value, {
      pathFormat: baseOptions.pathFormat,
      keySeparator: baseOptions.keySeparator,
      listeners: opts.listeners,
      path: (path2) => path2.filter((str) => !baseOptions.fallbacks || !baseOptions.fallbacks.includes(str))
    }, id);
  }
  let options = { keySeparator: baseOptions.keySeparator, ...opts };
  setFromPath(path, value, ref, options);
  return value;
};

// ../esmonitor/src/listeners.ts
var info = (id, callback, path, originalValue, base, listeners2, options) => {
  if (typeof path === "string")
    path = path.split(options.keySeparator);
  const relativePath = path.join(options.keySeparator);
  const refs = base;
  const get3 = (path2) => {
    return getFromPath(base, path2, {
      keySeparator: options.keySeparator,
      fallbacks: options.fallbacks
    });
  };
  const set2 = (path2, value) => setFromOptions(path2, value, options, {
    reference: base,
    listeners: listeners2
  });
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
      return get3(info2.path.absolute);
    },
    set current(val) {
      set2(info2.path.absolute, val);
    },
    get parent() {
      return get3(info2.path.parent);
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
var registerInLookup = (name, sub, lookups) => {
  if (lookups) {
    const id = Math.random();
    lookups.symbol[sub] = {
      name,
      id
    };
    if (!lookups.name[name])
      lookups.name[name] = {};
    lookups.name[name][id] = sub;
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
var set = (type, absPath, value, callback, base, allListeners, options) => {
  const { id, path } = getPathInfo(absPath, options);
  const fullInfo = info(id, callback, path, value, base, listeners, options);
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
var setterExecution = (listeners2, value) => {
  return iterateSymbols(listeners2, (_, o) => {
    const path = getPath("output", o);
    runCallback(o.callback, path, {}, value);
  });
};
function setters(info2, collection, lookups) {
  handler(info2, collection, (value, parent) => {
    let val = value;
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
        return functionExecution(this, listeners2, info2.original, args);
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
        const name = info2.name;
        const isESM = esm(val);
        if (isESM || name === "Object" || name === "Array") {
          info2.simple = true;
          const idx = seen.indexOf(val);
          if (idx !== -1)
            acc[key] = fromSeen[idx];
          else {
            seen.push(val);
            const pass2 = condition instanceof Function ? condition(key, val, info2) : condition;
            info2.pass = pass2;
            acc[key] = callback(key, val, info2);
            if (pass2) {
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
    this.get = (path, output) => {
      return getFromPath(this.references, path, {
        keySeparator: this.options.keySeparator,
        fallbacks: this.options.fallbacks,
        output
      });
    };
    this.set = (path, value, opts = {}) => {
      const optsCopy = { ...opts };
      if (!optsCopy.reference)
        optsCopy.reference = this.references;
      if (!optsCopy.listeners)
        optsCopy.listeners = this.listeners;
      return setFromOptions(path, value, this.options, optsCopy);
    };
    this.on = (absPath, callback) => {
      const info2 = getPathInfo(absPath, this.options);
      return this.listen(info2.id, callback, info2.path);
    };
    this.getInfo = (label, callback, path, original) => {
      const info2 = info(label, callback, path, original, this.references, this.listeners, this.options);
      const id = Math.random();
      const lookups = this.listeners.lookup;
      const name = getPath("absolute", info2);
      lookups.symbol[info2.sub] = {
        name,
        id
      };
      if (!lookups.name[name])
        lookups.name[name] = {};
      lookups.name[name][id] = info2.sub;
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
        console.error(`Reference ${id} does not exist.`);
        return;
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
        if (__internalComplete.poll) {
          info2 = this.getInfo(id, callback, arrayPath, ref);
          this.poller.add(info2);
        } else {
          let type = "setters";
          if (typeof ref === "function")
            type = "functions";
          info2 = this.getInfo(id, callback, arrayPath, ref);
          this.add(type, info2);
        }
      } catch (e) {
        console.error("Fallback to polling:", path, e);
        info2 = this.getInfo(id, callback, arrayPath, ref);
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
          const value = parent[last];
          Object.defineProperty(parent, last, { value, writable: true });
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

// src/utils.ts
var isPromise = (o) => typeof o === "object" && typeof o.then === "function";
var resolve = (object, callback) => {
  if (typeof object === "object" && Array.isArray(object) && object.find((v) => isPromise(v)))
    object = Promise.all(object);
  if (isPromise(object)) {
    return new Promise((resolve3) => {
      object.then((res) => {
        const output = callback ? callback(res) : res;
        resolve3(output);
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
        if (!isFunc || !original.functionList.includes(newFunc)) {
          const func = copy[k] = function(...args) {
            if (isFunc)
              original.call(this, ...args);
            newFunc.call(this, ...args);
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

// src/create/element.ts
function create(id, esm2, parent, states, utilities = {}) {
  let element = esm2.esElement;
  let info2;
  if (!(element instanceof Element)) {
    const hasChildren = esm2.esDOM && Object.keys(esm2.esDOM).length > 0;
    const defaultTagName = hasChildren ? "div" : "link";
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
          this.esElement.innerText = input;
        return this.esElement;
      };
    }
  }
  if (!(element instanceof Element))
    console.warn("Element not found for", id);
  let intermediateStates = states || {};
  intermediateStates.element = element, intermediateStates.attributes = esm2.esAttributes, intermediateStates.parentNode = esm2.esParent ?? (parent?.esElement instanceof Element ? parent.esElement : void 0), intermediateStates.onresize = esm2.esOnResize, intermediateStates.onresizeEventCallback = void 0;
  const finalStates = intermediateStates;
  if (element instanceof Element) {
    if (typeof id !== "string")
      id = `${element.tagName ?? "element"}${Math.floor(Math.random() * 1e15)}`;
    if (!element.id)
      element.id = id;
  }
  let isReady;
  Object.defineProperty(esm2, "esReady", {
    value: new Promise((resolve3) => isReady = async () => {
      resolve3(true);
    }),
    writable: false,
    enumerable: false
  });
  Object.defineProperty(esm2, "__esReady", { value: isReady, writable: false, enumerable: false });
  const isEventListener = (key, value) => key.slice(0, 2) === "on" && typeof value === "function";
  const handleAttribute = (key, value, context) => {
    if (!isEventListener(key, value) && typeof value === "function")
      return value.call(context);
    else
      return value;
  };
  const setAttributes = (attributes) => {
    if (esm2.esElement instanceof Element) {
      for (let key in attributes) {
        if (key === "style") {
          for (let styleKey in attributes.style)
            esm2.esElement.style[styleKey] = handleAttribute(key, attributes.style[styleKey], esm2);
        } else {
          const value = attributes[key];
          if (isEventListener(key, value)) {
            const func = value;
            esm2.esElement[key] = (...args) => {
              const context = esm2.__esProxy ?? esm2;
              return func.call(context ?? esm2, ...args);
            };
          } else
            esm2.esElement[key] = handleAttribute(key, value, esm2);
        }
      }
    }
  };
  Object.defineProperty(esm2, "esAttributes", {
    get: () => states.attributes,
    set: (value) => {
      states.attributes = value;
      if (states.attributes)
        setAttributes(states.attributes);
    }
  });
  Object.defineProperty(esm2, "esElement", {
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
        if (esm2.__isESComponent !== void 0) {
          for (let name in esm2.esDOM) {
            const component = esm2.esDOM[name];
            resolve(component, (res) => {
              res.esParent = v;
            });
          }
        }
        setAttributes(states.attributes);
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
        if (v) {
          const desiredPosition = esm2.esChildPosition;
          const nextPosition = v.children.length;
          let ref = esm2.esElement;
          if (esm2.__esCode) {
            esm2.__esCode.setComponent(esm2);
            ref = esm2.__esCode;
          }
          if (desiredPosition !== void 0 && desiredPosition < nextPosition)
            v.children[desiredPosition].insertAdjacentElement("beforebegin", ref);
          else
            v.appendChild(ref);
        }
      } else {
        console.error("No element was created for this Component...", esm2);
      }
      if (v instanceof HTMLElement) {
        esm2.__esReady();
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
  if (esm2.esCode) {
    let config = esm2.esCode;
    let cls = utilities.code?.class;
    if (!cls) {
      if (typeof esm2.esCode === "function")
        cls = esm2.esCode;
      else
        console.error("Editor class not provided in options.utilities.code");
    }
    if (cls) {
      let options = utilities.code?.options ?? {};
      options = typeof config === "boolean" ? options : { ...options, ...config };
      const esCode = new cls(options);
      esCode.start();
      Object.defineProperty(esm2, "__esCode", { value: esCode });
    }
  }
  if (esm2.esElement instanceof Element) {
    esm2.esElement.esComponent = esm2;
    esm2.esElement.setAttribute("__isescomponent", "");
  }
  if (!states) {
    esm2.esOnResize = finalStates.onresize;
    esm2.esParent = finalStates.parentNode;
  }
  return element;
}

// src/create/component.ts
var registry = {};
var ogCreateElement = document.createElement;
document.createElement = function(name, options) {
  const info2 = registry[name];
  const created = info2 && !info2.autonomous ? ogCreateElement.call(this, info2.tag, { is: name }) : ogCreateElement.call(this, name, options);
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
      attributeChangedCallback(name, oldValue, newValue) {
        console.log("Custom element attributes changed.", name, oldValue, newValue);
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

// src/create/index.ts
var animations = {};
var create_default = (id, esm2, parent, utilities = {}) => {
  const states = {
    connected: false
  };
  const copy = deep(esm2);
  try {
    for (let name in esm2.esDOM) {
      const value = esm2.esDOM[name];
      const isUndefined = value == void 0;
      const type = isUndefined ? JSON.stringify(value) : typeof value;
      if (type != "object") {
        console.error(`Removing ${name} esDOM field that which is not an ES Component object. Got ${isUndefined ? type : `a ${type}`} instead.`);
        delete esm2.esDOM[name];
      }
    }
    let registry2 = esm2.esComponents ?? {};
    for (let key in registry2) {
      const esm3 = registry2[key];
      const info2 = esm3.esElement;
      if (info2.name && info2.extends)
        define(info2, esm3);
    }


    if (esm2.__esmpileSourceBundle) {
      esm2.esSource =  esm2.__esmpileSourceBundle()
      delete esm2.__esmpileSourceBundle
    }

    let el = create(id, esm2, parent, states, utilities);
    const finalStates = states;
    esm2.esElement = el;
    const ogInit = esm2.esConnected;
    esm2.esConnected = async (onReadyCallback) => {
      await esm2.esReady;
      states.connected = true;
      for (let name in esm2.esDOM) {
        let component = esm2.esDOM[name];
        if (typeof component === "object" && typeof component.then === "function")
          component = esm2.esDOM[name] = await component;
        const init = component.esConnected;
        if (typeof init === "function")
          await init();
        else
          console.error(`Could not start component ${name} because it does not have an esConnected function`);
      }
      if (onReadyCallback)
        await onReadyCallback();
      const esCode = esm2.esParent?.esComponent?.__esCode;
      if (esCode)
        esm2.__esCode = esCode;

      const source = esm2.esSource;
      const path = esm2.__isESComponent;

      if (source) {

        if (esm2.__esCode)
          esm2.__esCode.addFile(path, source);
      }
      



      const context = esm2.__esProxy ?? esm2;
      if (ogInit)
        ogInit.call(context);
      if (esm2.hasOwnProperty("esTrigger")) {
        if (!Array.isArray(esm2.esTrigger))
          esm2.esTrigger = [];
        esm2.default(...esm2.esTrigger);
        delete esm2.esTrigger;
      }
      if (esm2.esAnimate) {
        let original = esm2.esAnimate;
        const id2 = Math.random();
        const interval = typeof original === "number" ? original : "global";
        if (!animations[interval]) {
          const info2 = animations[interval] = { objects: { [id2]: esm2 } };
          const objects2 = info2.objects;
          const runFuncs = () => {
            for (let key in objects2)
              objects2[key].default();
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
            info2.id = setInterval(() => runFuncs(), 1e3 / interval);
            animations[interval].stop = () => clearInterval(info2.id);
          }
        } else
          animations[interval].objects[id2] = esm2;
        esm2.esAnimate = {
          id: id2,
          original,
          stop: () => {
            delete animations[interval].objects[id2];
            esm2.esAnimate = original;
            if (Object.keys(animations[interval].objects).length === 0) {
              animations[interval].stop();
              delete animations[interval];
            }
          }
        };
      }
    };
    const ogDelete = esm2.esDisconnected;
    esm2.esDisconnected = function() {
      if (this.esElement instanceof Element) {
        this.esElement.remove();
        if (this.onremove) {
          const context2 = esm2.__esProxy ?? esm2;
          this.onremove.call(context2);
        }
      }
      if (esm2.esAnimate && typeof esm2.esAnimate.stop === "function")
        esm2.esAnimate.stop();
      if (esm2.esListeners)
        esm2.esListeners.__manager.clear();
      if (esm2.esDOM) {
        for (let name in esm2.esDOM) {
          const component = esm2.esDOM[name];
          if (typeof component.esDisconnected === "function")
            component.esDisconnected();
          else
            console.error("Could not disconnect component because it does not have an esDisconnected function", name, esm2.esDOM);
        }
      }
      if (esm2.__esCode)
        esm2.__esCode.remove();
      const context = esm2.__esProxy ?? esm2;
      if (ogDelete)
        ogDelete.call(context);
      esm2.esConnected = ogInit;
      esm2.esDisconnected = ogDelete;
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
    const isESC = { value: "", enumerable: false };
    if (typeof id === "string") {
      if (parent?.__isESComponent)
        isESC.value = [parent.__isESComponent, id];
      else
        isESC.value = [id];
      isESC.value = isESC.value.join(keySeparator);
    }
    Object.defineProperty(esm2, "__isESComponent", isESC);
    Object.defineProperty(esm2, "esOriginal", { value: copy, enumerable: false });
    esm2.esOnResize = finalStates.onresize;
    esm2.esParent = finalStates.parentNode;
    return esm2;
  } catch (e) {
    console.error(`Failed to create an ES Component (${id}):`, e);
    return copy;
  }
};

// src/index.ts
var listenerObject = Symbol("listenerObject");
var createErrorComponent = (message) => {
  return {
    esElement: "p",
    esDOM: {
      b: {
        esElement: "b",
        esAttributes: {
          innerText: "Error: "
        }
      },
      span: {
        esElement: "span",
        esAttributes: {
          innerText: message
        }
      }
    }
  };
};
var esCompile = (o, utilities) => {
  let uri = typeof o === "string" ? o : o.esURI;
  if (uri) {
    return new Promise(async (resolve3) => {
      try {
        if (typeof utilities.bundle.function === "function") {
          const foo = utilities.bundle.function;
          const options = utilities.bundle.options ?? {};
          if (!options.bundler)
            options.bundler = "datauri";
          if (!options.bundle)
            options.collection = "global";
            
          const bundle = foo(uri, options);
          await bundle.compile();
          o = Object.assign({}, bundle.result);
        } else if (typeof utilities.compile.function === "function") {
          const resolved = await utilities.compile.function(o, utilities.compile.options);
          o = resolved;
        } else {
          throw new Error("Cannot transform esCompose string without a compose utility function");
        }
      } catch (e) {
        if (o.esReference) {
          console.warn("[escompose]: Falling back to ES Component reference...", e);
          o = o.esReference;
        } else
          o = createErrorComponent(e.message);
      }
      resolve3(deep(o));
    });
  }
  return deep(o);
};
var esMerge = (base, esCompose = {}, path = [], utilities = {}) => {
  if (!Array.isArray(esCompose))
    esCompose = [esCompose];
  let promise = resolve(esCompose.map((o) => {
    const compiled = esCompile(o, utilities);
    return resolve(compiled, (compiled2) => {
      let arr = [compiled2];
      let target = compiled2;
      while (target.esCompose) {
        const val = target.esCompose;
        delete target.esCompose;

        target = resolve(esCompile(val, utilities));
        
        arr.push(target);
      }
      return arr;
    });
  }));
  return resolve(promise, (clonedEsCompose) => {
    const flat = clonedEsCompose.flat();
    let merged = Object.assign({}, base);

    flat.forEach((toCompose) => {
      merged = merge(toCompose, merged, path);
    });
    return merged;
  });
};
var esDrill = (o, id, toMerge = {}, parent, opts) => {
  const parentId = parent?.__isESComponent;
  const path = parentId ? [parentId, id] : typeof id === "string" ? [id] : [];
  const firstMerge = merge(toMerge, o, path);
  const merged = esMerge(firstMerge, o.esCompose, path, opts.utilities);
  return resolve(merged, (merged2) => {
    delete merged2.esCompose;
    const instance = create_default(id, merged2, parent, opts.utilities);
    const savePath = path.join(opts.keySeparator ?? keySeparator);
    if (opts?.components)
      opts.components[savePath] = { instance, depth: parent ? path.length + 1 : path.length };
    if (instance.esDOM) {
      let positions = /* @__PURE__ */ new Set();
      let position = 0;
      for (let name in instance.esDOM) {
        const base = instance.esDOM[name];
        const pos = base.esChildPosition;
        if (pos !== void 0) {
          if (positions.has(pos))
            console.warn(`[escompose]: Duplicate esChildPosition value of ${pos} found in ${name} of ${instance.__isESComponent}`);
          else
            positions.add(pos);
        } else {
          while (positions.has(position))
            position++;
          base.esChildPosition = position;
          positions.add(position);
        }
        const promise = esDrill(base, name, void 0, instance, opts);
        instance.esDOM[name] = promise;
        resolve2(promise, (res) => {
          instance.esDOM[name] = res;
        });
      }
    }
    return instance;
  });
};
var handleListenerValue = ({
  context,
  root,
  fromPath,
  toPath,
  config,
  listeners: listeners2
}) => {
  const fromSubscriptionPath = [context.id];
  const topPath = [];
  if (root)
    topPath.push(...root.split(context.options.keySeparator));
  if (fromPath)
    topPath.push(...fromPath.split(context.options.keySeparator));
  fromSubscriptionPath.push(...topPath);
  const obj = context.monitor.get(fromSubscriptionPath);
  if (obj?.hasOwnProperty("__isESComponent"))
    fromSubscriptionPath.push(defaultPath);
  const value = config;
  const fromStringPath = topPath.join(context.options.keySeparator);
  const sub = !listeners2.has(fromStringPath) ? context.monitor.on(fromSubscriptionPath, (path, _, update) => passToListeners(context, listeners2, path, update)) : void 0;
  listeners2.add(fromStringPath, toPath, { value, root }, sub);
  return {
    path: fromSubscriptionPath,
    config
  };
};
var ListenerManager = class {
  constructor(monitor, listeners2 = {}) {
    this.original = {};
    this.active = {};
    this.register = (listeners2) => {
      this.original = listeners2;
      Object.defineProperty(listeners2, "__manager", {
        value: this,
        enumerable: false,
        writable: true
      });
    };
    this.add = (from, to, value = true, subscription = this.active[from].sub) => {
      let root = "";
      if (value?.hasOwnProperty("root"))
        root = value.root;
      if (value?.hasOwnProperty("value"))
        value = value.value;
      else
        console.error("No root provided for new edge...");
      if (!this.active[from])
        this.active[from] = {};
      this.active[from][to] = {
        value,
        root,
        subscription,
        [listenerObject]: true
      };
      let base = this.original[to];
      if (!base)
        base = this.original[to] = {};
      if (typeof base !== "object") {
        if (typeof base === "function")
          base = this.original[to] = { [Symbol("function listener")]: base };
        else
          base = this.original[to] = { [base]: true };
      }
      base[from] = value;
    };
    this.remove = (from, to) => {
      const toRemove = [
        { ref: this.active, path: [from, to], unlisten: true },
        { ref: this.original, path: [to, from] }
      ];
      toRemove.forEach((o) => {
        const { ref, path, unlisten } = o;
        let base = ref[path[0]];
        if (typeof base === "object") {
          const info2 = base[path[1]];
          delete base[path[1]];
          if (Object.keys(base).length === 0) {
            delete ref[path[0]];
            if (unlisten && info2.subscription)
              this.monitor.remove(info2.subscription);
          }
        } else
          delete ref[path[0]];
      });
    };
    this.clear = () => {
      Object.keys(this.active).forEach((from) => {
        Object.keys(this.active[from]).forEach((to) => {
          this.remove(from, to);
        });
      });
    };
    this.has = (from) => !!this.active[from];
    this.get = (from) => this.active[from];
    this.monitor = monitor;
    this.register(listeners2);
  }
};
var setListeners = (context, components) => {
  let toTrigger = [];
  for (let root in components) {
    const info2 = components[root];
    const to = info2.instance.esListeners;
    const listeners2 = new ListenerManager(context.monitor, to);
    for (let toPath in to) {
      const from = to[toPath];
      const mainInfo = {
        context,
        root,
        toPath,
        listeners: listeners2
      };
      if (from && typeof from === "object") {
        for (let fromPath in from) {
          const config = from[fromPath];
          const info3 = handleListenerValue({ ...mainInfo, fromPath, config });
          if (info3.config.esTrigger)
            toTrigger.push(info3);
        }
      } else {
        if (typeof toPath === "string")
          handleListenerValue({ ...mainInfo, fromPath: from, config: toPath });
        else
          console.error("Improperly Formatted Listener", to);
      }
    }
  }
  return toTrigger;
};
function pass(from, target, update, context) {
  const id = context.id;
  let parent, key, root, subscription;
  const isValue = target?.__value;
  parent = target.parent;
  key = target.key;
  root = target.root;
  subscription = target.subscription;
  const rootArr = root.split(context.options.keySeparator);
  const info2 = target.parent[key];
  target = info2.value;
  let config = info2?.esConfig;
  let ogValue = target;
  const type = typeof target;
  const checkIfSetter = (path, willSet) => {
    const info3 = context.monitor.get(path, "info");
    if (info3.exists) {
      const val = info3.value;
      const noDefault = typeof val !== "function" && !val?.default;
      const value = noDefault ? toSet : val;
      const res = {
        value,
        root,
        subscription
      };
      if (willSet) {
        target = res.value;
        parent[key] = res;
      }
      return res;
    } else
      return { value: void 0, root: void 0 };
  };
  const transform = (willSet) => {
    const fullPath = [id];
    if (root)
      fullPath.push(...rootArr);
    fullPath.push(...key.split(context.options.keySeparator));
    return checkIfSetter(fullPath, willSet);
  };
  if (typeof target === "boolean") {
    if (!isValue)
      transform(true);
    else
      console.error("Cannot use a boolean for esListener...");
  } else if (type === "string") {
    const path = [id];
    const topPath = [];
    if (root)
      topPath.push(...rootArr);
    topPath.push(...ogValue.split(context.options.keySeparator));
    path.push(...topPath);
    checkIfSetter(path, true);
    if (isValue) {
      parent[key] = { [ogValue]: parent[key] };
      key = ogValue;
    }
  } else if (target && type === "object") {
    const isConfig = "esFormat" in ogValue || "esBranch" in ogValue || "esTrigger" in ogValue;
    if (isConfig) {
      transform(true);
      if (ogValue) {
        if (ogValue)
          config = ogValue;
        Object.defineProperty(parent[key], "esConfig", { value: config });
      }
    }
  }
  let isValidInput = true;
  if (config) {
    if ("esBranch" in config) {
      const isValid = config.esBranch.find((o) => {
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
    if ("esFormat" in config) {
      try {
        update = config.esFormat(update);
        if (update === void 0)
          isValidInput = false;
      } catch (e) {
        console.error("Failed to format arguments", e);
      }
    }
  }
  if (isValidInput && update !== void 0) {
    const arrayUpdate = Array.isArray(update) ? update : [update];
    if (target === toSet) {
      const parentPath = [id];
      if (root)
        parentPath.push(...rootArr);
      parentPath.push(...key.split(context.options.keySeparator));
      const idx = parentPath.pop();
      const info3 = context.monitor.get(parentPath, "info");
      info3.value[idx] = update;
    } else if (target?.default)
      target.default.call(target, ...arrayUpdate);
    else if (typeof target === "function") {
      const noContext = parent[key][listenerObject];
      if (noContext)
        target.call(context.instance, ...arrayUpdate);
      else
        target(...arrayUpdate);
    } else {
      let baseMessage = `listener: ${from} \u2014> ${key}`;
      if (parent) {
        console.error(`Deleting ${baseMessage}`, parent[key], target);
        delete parent[key];
      } else
        console.error(`Failed to add ${baseMessage}`, target);
    }
  }
}
function passToListeners(context, listeners2, name, update) {
  const sep = context.options.keySeparator;
  const check = `${sep}${defaultPath}`;
  const noDefault = name.slice(-check.length) === check ? name.slice(0, -check.length) : name;
  const listenerGroups = [{
    info: listeners2.get(noDefault),
    name: noDefault
  }];
  listenerGroups.forEach((group) => {
    const info2 = group.info;
    if (info2) {
      if (info2[listenerObject]) {
        pass(noDefault, {
          value: info2.value,
          parent: listeners2.active,
          key: group.name,
          root: info2.root,
          subscription: info2.subscription,
          __value: true
        }, update, context);
      } else if (typeof info2 === "object") {
        for (let key in info2) {
          pass(noDefault, {
            parent: info2,
            key,
            root: info2[key].root,
            subscription: info2[key].subscription,
            value: info2[key].value
          }, update, context);
        }
      } else
        console.error("Improperly Formatted Listener", info2);
    }
  });
}
var toSet = Symbol("toSet");
var create2 = (config, toMerge = {}, options = {}) => {
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
  if (options.clone)
    config = deep(config);
  monitor.options.fallbacks = ["esDOM"];
  const fullOptions = options;
  const components = {};
  const drillOpts = {
    components,
    keySeparator: fullOptions.keySeparator,
    utilities: fullOptions.utilities
  };
  let instancePromiseOrObject;
  let context;
  const onConnected = (instance) => {
    instance.esConnected(() => {
      if (context) {
        const toTrigger = setListeners(context, components);
        toTrigger.forEach((o) => {
          const res = monitor.get(o.path, "info");
          if (typeof res.value === "function") {
            const args = Array.isArray(o.config.esTrigger) ? o.config.esTrigger : [o.config.esTrigger];
            res.value(...args);
          } else
            console.error("Cannot yet trigger values...", o);
        });
      }
    }, true);
  };
  if (options.nested?.parent && options.nested?.name) {
    instancePromiseOrObject = esDrill(config, options.nested.name, toMerge, options.nested.parent, drillOpts);
    resolve(instancePromiseOrObject, onConnected);
  } else {
    const id = Symbol("root");
    instancePromiseOrObject = esDrill(config, id, toMerge, void 0, drillOpts);
    const set2 = (instance) => {
      monitor.set(id, instance, fullOptions.listeners);
      context = {
        id,
        instance,
        monitor,
        options: fullOptions
      };
      onConnected(instance);
    };
    resolve(instancePromiseOrObject, set2);
  }
  return instancePromiseOrObject;
};
var src_default2 = create2;
var merge2 = esMerge;
var clone = deep;
var resolve2 = resolve;
export {
  clone,
  create2 as create,
  src_default2 as default,
  merge2 as merge,
  resolve2 as resolve
};
