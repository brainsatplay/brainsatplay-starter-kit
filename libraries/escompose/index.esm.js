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
  if (callback instanceof Function)
    callback(path, info2, output);
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
var get = async (func, args, info2) => {
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
  result.output = await func(...args);
  return result;
};

// ../esmonitor/src/globals.ts
var isProxy = Symbol("isProxy");
var fromInspectable = Symbol("fromInspectable");

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
  let inInspectable = false;
  for (let i = 0; i < path.length; i++) {
    if (!ref) {
      const message = `Could not get path`;
      console.error(message, path, ref);
      throw new Error(message);
    }
    if (!inInspectable)
      inInspectable = !!ref.__esInspectable;
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
    else {
      if (!inInspectable)
        console.error(`Will not get updates from: ${path.filter((str2) => typeof str2 === "string").join(keySeparator2)}`);
      else if (!ref.__esInspectable)
        console.warn("Might be ignoring incorrectly...");
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
          executionInfo = await functionExecution(thisArg, toActivate, foo, argumentsList);
          output = executionInfo.output;
        } else {
          output = await foo.apply(thisArg, argumentsList);
          executionInfo = proxy?.state?.[pathStr]?.value ?? {};
        }
        const callback = proxy.options.callback;
        runCallback(callback, pathStr, executionInfo, output);
        return output;
      } catch (e) {
        console.warn(`Cannot run function:`, e, proxy.path, proxy.parent, target, argumentsList);
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
            target[key] = async (...args) => {
              return await this.proxy[key]({ [fromInspectable]: true, value }, ...args);
            };
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
    callback: async (...args) => {
      const output = await callback(...args);
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
var register = (info2, collection, lookup) => {
  const absolute = getPath("absolute", info2);
  if (!collection[absolute])
    collection[absolute] = {};
  collection[absolute][info2.sub] = info2;
  if (lookup)
    lookup[info2.sub] = absolute;
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
      allListeners.lookup[fullInfo.sub] = path2;
  }
};
var get2 = (info2, collection) => collection[getPath("absolute", info2)];
var handler = (info2, collection, subscribeCallback, lookup) => {
  if (!get2(info2, collection)) {
    let parent = info2.parent;
    let val = parent[info2.last];
    subscribeCallback(val, parent);
  }
  register(info2, collection, lookup);
};
var setterExecution = async (listeners2, value) => {
  await iterateSymbols(listeners2, (_, o) => {
    const path = getPath("output", o);
    runCallback(o.callback, path, {}, value);
  });
};
function setters(info2, collection, lookup) {
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
  }, lookup);
}
var functionExecution = async (context, listeners2, func, args) => {
  listeners2 = Object.assign({}, listeners2);
  const keys = Object.getOwnPropertySymbols(listeners2);
  const infoTemplate = listeners2[keys[0]] ?? {};
  const executionInfo = await get(async (...args2) => await func.call(context, ...args2), args, infoTemplate.infoToOutput);
  await iterateSymbols(listeners2, (_, o) => {
    const path = getPath("output", o);
    runCallback(o.callback, path, executionInfo.value, executionInfo.output);
  });
  return executionInfo;
};
function functions2(info2, collection, lookup) {
  handler(info2, collection, (_, parent) => {
    if (!parent[isProxy]) {
      parent[info2.last] = async function(...args) {
        const listeners2 = collection[getPath("absolute", info2)];
        return functionExecution(this, listeners2, info2.original, args);
      };
    }
  }, lookup);
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
  let drill2 = (obj2, acc = {}, globalInfo) => {
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
        if (name === "Object" || name === "Array") {
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
              acc[key] = drill2(val, acc[key], { ...globalInfo, path: newPath });
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
  return drill2(obj, accumulator, { path });
};

// ../esmonitor/src/Monitor.ts
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
      lookup: {}
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
    this.getInfo = (id, callback, path, original) => {
      const info2 = info(id, callback, path, original, this.references, this.listeners, this.options);
      this.listeners.lookup[info2.sub] = getPath("absolute", info2);
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
      } else {
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
      const absPath = this.listeners.lookup[sub];
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
          Object.defineProperty(parent, last, { value, writable: true });
        }
      } else
        return false;
      delete this.listeners.lookup[sub];
    };
    Object.defineProperty(this.listeners, "lookup", {
      value: {},
      enumerable: false,
      configurable: false
    });
    Object.assign(this.options, opts);
    this.poller.setOptions(opts.polling);
  }
};

// ../esmonitor/src/index.ts
var src_default = Monitor;

// src/create/element.ts
function create(id, esm2, parent) {
  let element = esm2.esElement;
  let info2;
  if (!(element instanceof Element)) {
    if (typeof element === "object") {
      info2 = element;
      const id2 = info2.id;
      if (info2.element instanceof Element)
        element = info2.element;
      else if (info2.selectors)
        element = document.querySelector(info2.selectors);
      else if (info2.id)
        element = document.getElementById(info2.id);
      else
        element = info2.element;
    }
    if (typeof element === "string")
      element = document.createElement(element);
  }
  if (!(element instanceof Element))
    console.warn("Element not found for", id);
  let states = {
    element,
    parentNode: esm2.esParent ?? info2?.parentNode ?? (parent?.esElement instanceof Element ? parent.esElement : void 0),
    onresize: esm2.esOnResize,
    onresizeEventCallback: void 0
  };
  if (element instanceof Element) {
    if (typeof id !== "string")
      id = `${element.tagName ?? "element"}${Math.floor(Math.random() * 1e15)}`;
    if (!element.id)
      element.id = id;
    if (info2) {
      if (info2.attributes) {
        for (let key in info2.attributes) {
          if (typeof info2.attributes[key] === "function") {
            const func = info2.attributes[key];
            element[key] = (...args) => {
              const context = esm2.__esProxy ?? esm2;
              return func.call(context ?? esm2, ...args);
            };
          } else
            element[key] = info2.attributes[key];
        }
      }
      if (element instanceof HTMLElement && info2.style)
        Object.assign(element.style, info2.style);
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
      if (!Array.isArray(esm2.esTrigger))
        esm2.esTrigger = [];
      esm2.default(...esm2.esTrigger);
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
  drillSimple(obj, (key, val, info2) => {
    if (info2.simple && info2.object)
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
    const info2 = components[absPath];
    const listeners2 = info2.instance.esListeners;
    for (let path in listeners2) {
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
      const value = listeners2[path];
      if (typeof value === "object")
        context.listeners[joined] = { ...listeners2[path] };
      else
        context.listeners[joined] = value;
      context.monitor.on(basePath, (path2, info3, args) => {
        passToListeners(context, absPath, path2, info3, args), context.options.listeners;
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
  const rootArr = root.split(context.options.keySeparator);
  target = target.parent[key];
  let ogValue = target;
  const type = typeof target;
  const checkIfSetter = (path) => {
    const info2 = context.monitor.get(path, "info");
    if (info2.exists) {
      const val = info2.value;
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
        fullPath.push(...rootArr);
      fullPath.push(...key.split(context.options.keySeparator));
      checkIfSetter(fullPath);
    } else
      console.error("Cannot use a boolean for esListener...");
  } else if (type === "string") {
    const path = [id];
    const topPath = [];
    if (root)
      topPath.push(...rootArr);
    topPath.push(...ogValue.split(context.options.keySeparator));
    path.push(...topPath);
    checkIfSetter(path);
    const absPath = topPath.join(context.options.keySeparator);
    if (isValue) {
      parent[key] = { [absPath]: parent[key] };
      key = absPath;
    }
  }
  if (target === toSet) {
    const parentPath = [id];
    parentPath.push(...key.split(context.options.keySeparator));
    const idx = parentPath.pop();
    const info2 = context.monitor.get(parentPath, "info");
    info2.value[idx] = args[0];
  } else if (target?.default)
    target.default(...args);
  else if (typeof target === "function")
    target(...args);
  else {
    try {
      const parentPath = [id];
      if (root)
        parentPath.push(...rootArr);
      parentPath.push(...key.split(context.options.keySeparator));
      const idx = parentPath.pop();
      const info2 = context.monitor.get(parentPath, "info");
      const arg = args[0];
      if (target.esBranch) {
        target.esBranch.forEach((o) => {
          if (o.equals === arg)
            info2.value[idx] = o.value;
        });
      } else
        info2.value[idx] = target;
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
function passToListeners(context, root, name, info2, ...args) {
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
    const info3 = group.info;
    if (info3) {
      if (typeof info3 === "object") {
        for (let key in info3) {
          pass(name, {
            parent: info3,
            key,
            root,
            value: info3[key]
          }, args, context);
        }
      } else {
        pass(name, {
          value: info3,
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
  monitor.options.fallbacks = ["esComponents"];
  const fullOptions = options;
  const id = Symbol("root");
  const components = {};
  const instance = drill(config, id, void 0, void 0, {
    components,
    keySeparator: fullOptions.keySeparator
  });
  let fullInstance = instance;
  monitor.set(id, fullInstance, { static: false });
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
