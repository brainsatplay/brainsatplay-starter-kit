var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/utils/path.js
var path_exports = {};
__export(path_exports, {
  absolute: () => absolute,
  base: () => base,
  extension: () => extension,
  get: () => get2,
  noBase: () => noBase,
  pathId: () => pathId,
  url: () => url
});

// src/utils/mimeTypes.js
var js = "application/javascript";
var isJS = (type) => !type || type === "application/javascript";
var map = {
  "js": js,
  "mjs": js,
  "cjs": js,
  "ts": "text/typescript",
  "json": "application/json",
  "html": "text/html",
  "css": "text/css",
  "txt": "text/plain",
  "svg": "image/svg+xml",
  "png": "image/png",
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "gif": "image/gif",
  "webp": "image/webp",
  "mp3": "audio/mpeg",
  "mp4": "video/mp4",
  "webm": "video/webm",
  "ogg": "application/ogg",
  "wav": "audio/wav"
};
var get = (extension2) => map[extension2];

// src/utils/defaults.js
var defaults_default = {
  nodeModules: {
    nodeModules: "node_modules",
    relativeTo: "./"
  }
};

// src/utils/path.js
var urlSep = "://";
var get2 = (path3, rel = "", keepRelativeImports = false, isDirectory = false) => {
  if (url(path3))
    return path3;
  let prefix = "";
  const getPrefix = (str) => {
    prefix = str.includes(urlSep) ? str.split(urlSep).splice(0, 1) : void 0;
    if (prefix)
      return str.replace(`${prefix}${urlSep}`, "");
    else
      return str;
  };
  if (path3.includes(urlSep))
    path3 = getPrefix(path3);
  if (rel.includes(urlSep))
    rel = getPrefix(rel);
  if (!keepRelativeImports)
    rel = rel.split("/").filter((v) => v != "..").join("/");
  if (rel[rel.length - 1] === "/")
    rel = rel.slice(0, -1);
  let dirTokens = rel.split("/");
  if (dirTokens.length === 1 && dirTokens[0] === "")
    dirTokens = [];
  if (!isDirectory) {
    const potentialFile = dirTokens.pop();
    if (potentialFile) {
      const splitPath2 = potentialFile.split(".");
      if (splitPath2.length == 1 || splitPath2.length > 1 && splitPath2.includes(""))
        dirTokens.push(potentialFile);
    }
  }
  const splitPath = path3.split("/");
  const pathTokens = splitPath.filter((str, i) => !!str);
  const extensionTokens = pathTokens.filter((str, i) => {
    if (str === "..") {
      dirTokens.pop();
      return false;
    } else if (str === ".")
      return false;
    else
      return true;
  });
  const newPath = [...dirTokens, ...extensionTokens].join("/");
  if (prefix)
    return prefix + "://" + newPath;
  else
    return newPath;
};
function absolute(uri, urlWorks) {
  const absolutePath = uri[0] !== ".";
  const isRemote = url(uri);
  return absolutePath && (urlWorks || !isRemote);
}
function url(uri) {
  try {
    new URL(uri);
    return true;
  } catch {
    return false;
  }
}
var extension = (path3) => {
  const ext = path3.split("/").slice(-1)[0].split(".").slice(-1)[0];
  if (map[ext])
    return ext;
};
var base = (str) => str.substring(0, str.lastIndexOf("/"));
var noBase = (path3, opts, removeNode) => {
  path3 = globalThis.location ? path3.replace(`${base(globalThis.location.href)}/`, "./") : path3;
  const absolutePath = absolute(path3, true);
  const relativeTo = opts.relativeTo ?? defaults_default.nodeModules.relativeTo;
  const nodeModulePath = opts.nodeModules ?? defaults_default.nodeModules.nodeModules;
  if (absolutePath)
    return path3;
  else {
    let noBase2 = path3;
    if (removeNode)
      noBase2 = noBase2.replace(`${nodeModulePath}/`, "");
    noBase2 = noBase2.replace(`${relativeTo.split("/").slice(0, -1).join("/")}/`, "");
    if (noBase2[0] !== ".")
      noBase2 = `./${noBase2}`;
    return noBase2;
  }
};
var pathId = (path3, opts) => get2(noBase(path3, opts));

// src/utils/nodeModules.js
var nodeModules_exports = {};
__export(nodeModules_exports, {
  getMainPath: () => getMainPath,
  path: () => path,
  resolve: () => resolve,
  transformation: () => transformation
});
var path = (opts) => {
  const nodeModules = opts.nodeModules ?? defaults_default.nodeModules.nodeModules;
  const relativeTo = opts.relativeTo ?? defaults_default.nodeModules.relativeTo;
  return get2(nodeModules, relativeTo);
};
var resolve = async (uri, opts) => {
  const absoluteNodeModules = path(opts);
  const split = uri.split("/");
  let base2 = get2(uri, absoluteNodeModules);
  if (split.length > 1) {
    const hasExt = extension(base2);
    if (hasExt)
      return base2;
    else
      base2 += "/package.json";
  }
  return await getMainPath(uri, base2, opts).catch((e) => {
    console.warn(`${base2} does not exist or is not at the root of the project.`);
  });
};
var getPath = (str, path3, base2) => get2(str, base2, false, path3.split("/").length === 1);
var getPackagePath = (path3, base2 = path3) => getPath("package.json", path3, base2);
var getMainPath = async (path3, base2 = path3, opts = {}) => {
  const pkg = await getPackage(path3, base2, opts);
  if (!pkg)
    return base2;
  const destination = pkg.module || pkg.main || "index.js";
  return getPath(destination, path3, base2);
};
var getPackage = async (path3, base2 = path3, opts) => {
  const pkgPath = getPackagePath(path3, base2);
  const isURL = url(pkgPath);
  const correct = isURL ? pkgPath : new URL(pkgPath, window.location.href).href;
  return (await import(correct, { assert: { type: "json" } })).default;
};
var transformation = {
  name: "node_modules",
  handler: resolve
};

// src/utils/sourceMap.js
var sourceMap_exports = {};
__export(sourceMap_exports, {
  get: () => get5
});

// src/utils/transformations.js
var extensionTransformations = ["ts", "js"];
var allTransformations = [null, ...extensionTransformations, transformation];
var get3 = (uri) => {
  const pathExt = extension(uri);
  const abs = absolute(uri);
  const baseNodeModule = abs ? uri.split("/").length === 1 : false;
  const noExt = !pathExt;
  if (!baseNodeModule && abs && noExt) {
    const mapped = extensionTransformations.map((ext) => {
      return {
        extension: ext,
        name: `${transformation.name} + ${ext}`,
        handler: transformation.handler
      };
    });
    if (uri.split("/").length === 1)
      return [transformation, uri, ...mapped];
    else
      return [uri, ...mapped, transformation];
  } else if (abs)
    return [...allTransformations].reverse();
  else if (noExt)
    return [...allTransformations];
  else
    return [];
};

// src/utils/errors.js
var middle = "was not resolved locally. You can provide a direct reference to use in";
var create = (uri, key = uri) => new Error(`${uri} ${middle} options.filesystem._fallbacks['${key}'].`);

// src/utils/handlers.js
var noExtension = (path3, repExt = "js") => {
  const absolutePath = absolute(path3);
  const split = path3.split("/");
  const ext = extension(path3);
  if (!absolutePath || absolutePath && split.length > 1) {
    if (!ext)
      return `${path3}.${repExt}`;
  }
  return path3;
};
var transformation2 = async (path3, transformation3, opts, force) => {
  if (!transformation3)
    return path3;
  const type = typeof transformation3;
  if (type === "string" && (!force || force === "string")) {
    return noExtension(path3, transformation3);
  } else if (type === "object" && (!force || force === "object")) {
    if (transformation3.extension)
      path3 = noExtension(path3, transformation3.extension);
    return await transformation3.handler(path3, opts).catch((e) => {
      throw create(path3, noBase(path3, opts));
    });
  }
};

// src/utils/request.js
var getURL = (path3) => {
  let url2;
  try {
    url2 = new URL(path3).href;
  } catch {
    url2 = get2(path3, globalThis.location.href);
  }
  return url2;
};
var handleFetch = async (path3, options = {}) => {
  if (!options.fetch)
    options.fetch = {};
  if (!options.fetch.mode)
    options.fetch.mode = "cors";
  const url2 = getURL(path3);
  const progressCallback = options?.callbacks?.progress?.fetch;
  const info = await fetchRemote(url2, options, {
    path: path3,
    progress: progressCallback
  });
  if (!info.buffer)
    throw new Error("No response received.");
  const type = info.type.split(";")[0];
  return {
    ...info,
    url: url2,
    type
  };
};
var fetchRemote = async (url2, options = {}, additionalArgs) => {
  const path3 = additionalArgs.path ?? url2;
  const pathId2 = get2(noBase(path3, options));
  const response = await globalThis.fetch(url2, options.fetch);
  let bytesReceived = 0;
  let buffer = [];
  let bytes = 0;
  const hasProgressFunction = typeof additionalArgs.progress === "function";
  const info = await new Promise(async (resolve3) => {
    if (response) {
      bytes = parseInt(response.headers.get("Content-Length"), 10);
      const type = response.headers.get("Content-Type");
      if (globalThis.REMOTEESM_NODE) {
        const buffer2 = await response.arrayBuffer();
        resolve3({ buffer: buffer2, type });
      } else {
        const reader = response.body.getReader();
        const processBuffer = async ({ done, value }) => {
          if (done) {
            const config = {};
            if (typeof type === "string")
              config.type = type;
            const blob = new Blob(buffer, config);
            const ab = await blob.arrayBuffer();
            resolve3({ buffer: new Uint8Array(ab), type });
            return;
          }
          bytesReceived += value.length;
          const chunk = value;
          buffer.push(chunk);
          if (hasProgressFunction)
            additionalArgs.progress(pathId2, bytesReceived, bytes, null, null, response.headers.get("Range"));
          return reader.read().then(processBuffer);
        };
        reader.read().then(processBuffer);
      }
    } else {
      console.warn("Response not received!", options.headers);
      resolve3(void 0);
    }
  });
  const output = {
    response,
    ...info
  };
  if (hasProgressFunction) {
    const status = [null, null];
    if (response.ok)
      status[0] = output;
    else
      status[1] = output;
    additionalArgs.progress(pathId2, bytesReceived, bytes, ...status, response.headers.get("Range"));
  }
  return output;
};

// src/utils/response.js
var enc = new TextDecoder("utf-8");
var get4 = async (uri, opts, expectedType) => {
  const info = { uri, text: { original: "", updated: "" }, buffer: null };
  if (globalThis.REMOTEESM_NODE) {
    const absPath = uri.replace("file://", "");
    info.buffer = globalThis.fs.readFileSync(absPath);
    info.text.original = info.text.updated = enc.decode(info.buffer);
  } else {
    const fetchInfo = await handleFetch(uri, opts);
    const response = fetchInfo.response;
    info.response = response;
    if (response.ok) {
      if (expectedType) {
        const mimeType = response.headers.get("Content-Type");
        if (!mimeType.includes(expectedType))
          throw new Error(`Expected Content Type ${expectedType} but received ${mimeType} for  ${uri}`);
      }
      info.buffer = fetchInfo.buffer;
      info.text.original = info.text.updated = enc.decode(info.buffer);
    } else {
      throw new Error(response.statusText);
    }
  }
  return info;
};
var find = async (uri, opts, callback) => {
  const transArray = get3(uri);
  let response;
  if (transArray.length > 0) {
    do {
      const ext = transArray.shift();
      const name = ext?.name ?? ext;
      const warning = (e) => {
        if (opts.debug)
          console.error(`Import using ${name ?? ext} transformation failed for ${uri}`);
      };
      const transformed = await transformation2(uri, ext, opts);
      const correctURI = get2(transformed, opts.relativeTo);
      const expectedType = ext ? null : "application/javascript";
      response = await callback(correctURI, opts, expectedType).then((res) => {
        if (opts.debug)
          console.warn(`Import using ${name ?? ext} transformation succeeded for ${uri}`);
        return res;
      }).catch(warning);
    } while (!response && transArray.length > 0);
    if (!response)
      throw new Error(`No valid transformation found for ${uri}`);
  } else
    response = await callback(get2(uri, opts.relativeTo), opts);
  return response;
};
var findModule = async (uri, opts) => {
  const pathExt = extension(uri);
  const isJSON = pathExt === "json";
  const info = {};
  await find(uri, opts, async (transformed) => {
    info.uri = transformed;
    info.result = await (isJSON ? import(transformed, { assert: { type: "json" } }) : import(transformed));
  });
  return info;
};
var findText = async (uri, opts) => await find(uri, opts, get4);

// src/utils/sourceMap.js
var sourceReg = /\/\/# sourceMappingURL=(.*\.map)/;
var get5 = async (uri, opts, text, evaluate = true) => {
  if (!text) {
    const info = await get4(uri, opts);
    text = info.text.original;
  }
  if (text) {
    const srcMap = text.match(sourceReg);
    if (srcMap) {
      const getMap = async () => {
        const loc = get2(srcMap[1], uri);
        let info = await get4(loc, opts);
        let newText = info.text.original;
        if (newText.slice(0, 3) === ")]}") {
          console.warn("Removing source map invalidation characters");
          newText = newText.substring(newText.indexOf("\n"));
        }
        const outInfo = { result: JSON.parse(newText) };
        outInfo.text = { original: newText, updated: null };
        return outInfo;
      };
      return evaluate ? getMap() : getMap;
    }
  }
};

// src/utils/load.js
var load_exports = {};
__export(load_exports, {
  script: () => script
});
var script = async (uri) => {
  return await new Promise((resolve3, reject) => {
    const script2 = document.createElement("script");
    let r = false;
    script2.onload = script2.onreadystatechange = function() {
      if (!r && (!this.readyState || this.readyState == "complete")) {
        r = true;
        resolve3(window);
      }
    };
    script2.onerror = reject;
    script2.src = uri;
    document.body.insertAdjacentElement("beforeend", script2);
  });
};

// src/Bundle.js
var Bundle_exports = {};
__export(Bundle_exports, {
  default: () => Bundle,
  get: () => get9
});

// src/utils/encode/index.js
var encode_exports = {};
__export(encode_exports, {
  datauri: () => datauri,
  objecturl: () => objecturl
});

// src/utils/encode/datauri.js
function _arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
var get6 = (o, mimeType = js, safe = false) => {
  const method = typeof o === "string" ? "text" : "buffer";
  const base64 = method === "buffer" ? _arrayBufferToBase64(o) : btoa(safe ? unescape(encodeURIComponent(o)) : o);
  return `data:${mimeType};base64,` + base64;
};

// src/utils/encode/objecturl.js
function get7(input, mimeType = js) {
  if (typeof input === "string")
    input = new TextEncoder().encode(input);
  const blob = new Blob([input], { type: mimeType });
  return URL.createObjectURL(blob);
}

// src/utils/encode/index.js
var datauri = async (...args) => await get8(get6, ...args);
var objecturl = async (...args) => await get8(get7, ...args);
var importEncoded = async (uri, isJSON) => await (isJSON ? import(uri, { assert: { type: "json" } }) : import(uri)).catch((e) => {
  throw e;
});
async function get8(encoder, input, uriForExtension, mimeType) {
  let encoded, module;
  if (!mimeType) {
    const pathExt = extension(uriForExtension);
    mimeType = get(pathExt);
  }
  let isJSON = mimeType === "application/json";
  try {
    encoded = encoder(input, mimeType);
    module = await importEncoded(encoded, isJSON);
  } catch (e) {
    encoded = encoder(input, mimeType, true);
    if (isJS(mimeType))
      module = encoded = await catchFailedModule(encoded, e).catch((e2) => {
        throw e2;
      });
    else
      module = encoded;
  }
  return {
    encoded,
    module
  };
}
async function catchFailedModule(uri, e) {
  if (e.message.includes("The string to be encoded contains characters outside of the Latin1 range.") || e.message.includes("Cannot set properties of undefined"))
    return await script(uri);
  else
    throw e;
}

// src/utils/compile.js
var tsconfig = {
  compilerOptions: {
    "target": "ES2015",
    "module": "ES2020",
    "strict": false,
    "esModuleInterop": true
  }
};
var typescript = (response, type = "text") => {
  if (window.ts) {
    const tsCode = type !== "buffer" ? response[type].updated : new TextDecoder().decode(response[type]);
    response.text.updated = window.ts.transpile(tsCode, tsconfig.compilerOptions);
    if (type === "buffer") {
      response.buffer = new TextEncoder().encode(response.text.updated);
      return response.buffer;
    } else
      return response.text.updated;
  } else
    throw new Error("Must load TypeScript extension to compile TypeScript files using remoteESM.load.script(...);");
};

// src/utils/polyfills.js
var fetch;
var fs;
var Blob2;
var isReady = new Promise(async (resolve3, reject) => {
  try {
    if (typeof process === "object") {
      if (!fetch) {
        globalThis.REMOTEESM_NODE = true;
        fetch = globalThis.fetch = (await import("node-fetch")).default;
        if (typeof globalThis.fetch !== "function")
          globalThis.fetch = fetch;
      }
      if (!fs)
        fs = globalThis.fs = (await import("fs")).default;
      if (!Blob2) {
        const buffer = (await import("node:buffer")).default;
        Blob2 = globalThis.Blob = buffer.Blob;
      }
      resolve3(true);
    } else
      resolve3(true);
  } catch (err) {
    reject(err);
  }
});
var ready = isReady;

// ../esc/standards.js
var esSourceKey = "__esmpileSourceBundle";

// src/Bundle.js
if (!globalThis.REMOTEESM_BUNDLES)
  globalThis.REMOTEESM_BUNDLES = { global: {} };
var global = globalThis.REMOTEESM_BUNDLES.global;
var noEncoding = `No buffer or text to bundle for`;
var toWait = 1e4;
var waitedFor = (toWait / 1e3).toFixed(1);
var esSourceString = (bundle) => `
export const ${esSourceKey} = () => globalThis.REMOTEESM_BUNDLES["${bundle.collection}"]["${bundle.name}"];
`;
var re = /[^\n]*(?<![\/\/])(import)\s+([ \t]*(?:(?:\* (?:as .+))|(?:[^ \t\{\}]+[ \t]*,?)|(?:[ \t]*\{(?:[ \t]*[^ \t"'\{\}]+[ \t]*,?)+\}))[ \t]*)from[ \t]*(['"])([^'"\n]+)(?:['"])([ \t]*assert[ \t]*{[ \n\t]*type:[ \n\t]*(['"])([^'"\n]+)(?:['"])[\n\t]*})?;?/gm;
function get9(url2, opts = this.options) {
  const pathId2 = url2 ? pathId(url2, opts) : void 0;
  let ref = globalThis.REMOTEESM_BUNDLES[opts.collection];
  if (!ref)
    ref = globalThis.REMOTEESM_BUNDLES[opts.collection] = {};
  let bundle = ref[pathId2];
  if (!bundle)
    bundle = new Bundle(url2, opts);
  else if (opts)
    bundle.options = opts;
  return bundle;
}
var promiseInfo = {
  resolve: void 0,
  reject: void 0,
  promise: void 0
};
var Bundle = class {
  filename = "bundle.esmpile.js";
  promises = {
    encoded: Object.assign({}, promiseInfo),
    result: Object.assign({}, promiseInfo)
  };
  uri;
  #url;
  get url() {
    return this.#url;
  }
  set url(url2) {
    const ESMPileInternalOpts = this.options._esmpile;
    if (!ESMPileInternalOpts.entrypoint)
      ESMPileInternalOpts.entrypoint = this;
    if (!this.uri)
      this.uri = url2;
    const isAbsolute = absolute(url2, true);
    if (!isAbsolute && !url2.includes(this.#options.relativeTo))
      url2 = get2(url2, this.#options.relativeTo);
    this.#url = url2;
    const pathId2 = pathId(this.url, this.options);
    if (this.name !== pathId2)
      this.name = pathId2;
    this.updateCollection(this.options.collection);
  }
  status = null;
  #options;
  get options() {
    return this.#options;
  }
  set options(opts = {}) {
    if (!opts._esmpile)
      opts._esmpile = this.#options?._esmpile ?? { circular: /* @__PURE__ */ new Set() };
    if (!opts.collection)
      opts.collection = this.#options?.collection;
    this.#options = opts;
    if (!opts.output)
      opts.output = {};
    this.bundler = opts.bundler;
    this.updateCollection(this.options.collection);
    if (typeof opts?.callbacks?.progress?.file === "function")
      this.callbacks.file = opts.callbacks.progress.file;
    if (!opts.fetch)
      opts.fetch = {};
    opts.fetch = Object.assign({}, opts.fetch);
    opts.fetch.signal = this.controller.signal;
  }
  controller = new AbortController();
  #bundler;
  get bundler() {
    return this.#bundler;
  }
  set bundler(bundler) {
    this.setBundleInfo(bundler);
    this.setBundler(bundler, false);
  }
  setBundleInfo = (bundler) => {
    this.#options._esmpile.lastBundler = this.#bundler;
    this.#bundler = this.#options.bundler = bundler;
    const output = this.#options.output;
    if (bundler) {
      output[bundler] = true;
      output.text = true;
    }
    this.derived.compile = !this.#options.forceNativeImport && (output.text || output.datauri || output.objecturl);
  };
  setBundler = async (bundler, setInfo = true) => {
    if (setInfo)
      this.setBundleInfo(bundler);
    const innerInfo = this.#options._esmpile;
    const lastBundleType = innerInfo.lastBundle;
    const isSame = innerInfo.lastBundle === bundler;
    if (!isSame || innerInfo.lastBundle && isSame && !lastBundleType) {
      const entrypoint = innerInfo.entrypoint;
      if (bundler) {
        const entries = Array.from(this.dependencies.entries());
        if (entries.length) {
          await Promise.all(entries.map(async ([_, entry]) => {
            entry.bundler = bundler;
            await entry.result;
          }));
        }
      }
      const isComplete = ["success", "failed"];
      if (isComplete.includes(entrypoint?.status)) {
        if (!bundler)
          this.result = await this.resolve();
        else if (lastBundleType)
          this.encoded = await this.bundle(lastBundleType);
        else
          this.result = await this.resolve();
      }
    }
  };
  #name;
  get name() {
    return this.#name;
  }
  set name(name) {
    if (name !== this.#name) {
      let collection = globalThis.REMOTEESM_BUNDLES[this.collection];
      if (collection) {
        if (global[this.name] === collection[this.name])
          delete global[this.name];
        delete collection[this.name];
      }
      this.#name = name;
      let filename = name.split("/").pop();
      const components = filename.split(".");
      this.filename = [...components.slice(0, -1), "esmpile", "js"].join(".");
      if (!global[this.name])
        global[this.name] = this;
      else if (this.options.collection != "global")
        console.warn(`Duplicating global bundle (${this.name})`, this.name);
    }
  }
  #collection;
  get collection() {
    return this.#collection;
  }
  set collection(collection) {
    this.#collection = collection;
    let ref = globalThis.REMOTEESM_BUNDLES[collection];
    if (!ref)
      ref = globalThis.REMOTEESM_BUNDLES[collection] = {};
    if (this.name) {
      if (!ref[this.name])
        ref[this.name] = this;
      else if (ref[this.name] !== this)
        console.warn(`Trying to duplicate bundle in bundle ${collection} (${this.name})`, this.name);
    }
  }
  #text;
  #buffer;
  get text() {
    return this.#text ?? this.info.text.original;
  }
  set text(text) {
    this.#text = text;
    this.encoded = this.bundle("text").catch((e) => {
      if (!e.message.includes(noEncoding))
        throw e;
    });
  }
  set buffer(buffer) {
    this.#buffer = buffer;
    this.encoded = this.bundle("buffer").catch((e) => {
      if (!e.message.includes(noEncoding))
        throw e;
    });
  }
  dependencies = /* @__PURE__ */ new Map();
  dependents = /* @__PURE__ */ new Map();
  get entries() {
    let entries = [];
    const drill = (target) => {
      target.dependencies.forEach((o) => {
        if (!entries.includes(o) && o !== this) {
          entries.push(o);
          drill(o);
        }
      });
    };
    drill(this);
    return entries;
  }
  encodings = {};
  info = {};
  imports = [];
  link = void 0;
  result = void 0;
  callbacks = {
    file: void 0
  };
  derived = {
    compile: false,
    dependencies: { n: 0, resolved: 0 }
  };
  constructor(entrypoint, options = {}) {
    this.options = options;
    this.url = entrypoint;
  }
  import = async () => {
    this.status = "importing";
    const info = await findModule(this.url, this.options);
    if (info?.result)
      return info.result;
    else
      this.status = "fallback";
  };
  get = get9;
  compile = async () => {
    this.status = "compiling";
    await ready;
    try {
      const info = await findText(this.url, this.options).catch((e) => {
        throw e;
      });
      try {
        if (info) {
          this.info = info;
          this.url = this.info.uri;
          this.buffer = this.info.buffer;
          await this.encoded;
        }
      } catch (e) {
        this.imports = {};
        const imports = [];
        const matches = Array.from(this.info.text.updated.matchAll(re));
        matches.forEach(([original, prefix, command, delimiters, path3]) => {
          if (path3) {
            const wildcard = !!command.match(/\*\s+as/);
            const variables = command.replace(/\*\s+as/, "").trim();
            const absolutePath = absolute(path3);
            let name = absolutePath ? path3 : get2(path3, this.url);
            const absNode = path(this.options);
            name = name.replace(`${absNode}/`, "");
            const info2 = {
              name,
              path: path3,
              prefix,
              variables,
              wildcard,
              current: {
                line: original,
                path: path3
              },
              original,
              counter: 0,
              bundle: null
            };
            if (!this.imports[name])
              this.imports[name] = [];
            this.imports[name].push(info2);
            imports.push(info2);
          }
        });
        this.derived.dependencies.resolved = 0;
        this.derived.dependencies.n = this.imports.length;
        const promises = imports.map(async (info2, i) => {
          await this.setImport(info2, i);
          this.derived.dependencies.resolved++;
        });
        await Promise.all(promises);
        this.text = this.info.text.updated;
      }
    } catch (e) {
      throw e;
    }
    await this.encoded;
    return this.result;
  };
  updateImport = (info, encoded) => {
    if (encoded === info.current.path)
      return;
    const { prefix, variables, wildcard, bundle } = info;
    let newImport = "";
    if (typeof encoded === "string")
      newImport = `${prefix} ${wildcard ? "* as " : ""}${variables} from "${encoded}"; // Imported from ${bundle.name}

`;
    else {
      const replaced = variables.replace("{", "").replace("}", "");
      const exportDefault = replaced === variables ? true : false;
      const splitVars = variables.replace("{", "").replace("}", "").split(",").map((str) => str.trim());
      const insertVariable = (variable) => {
        let end = "";
        if (!wildcard) {
          if (exportDefault)
            end = `.default`;
          else
            end = `.${variable}`;
        }
        newImport += `${prefix === "import" ? "" : "export "}const ${variable} = (await globalThis.REMOTEESM_BUNDLES["${bundle.collection}"]["${bundle.name}"].result)${end};

`;
      };
      splitVars.forEach(insertVariable);
    }
    this.info.text.updated = this.info.text.updated.replace(info.current.line, newImport);
    info.current.line = newImport;
    info.current.path = encoded;
  };
  setImport = async (info) => {
    let path3 = info.path;
    let correctPath = info.name;
    const bundle = this.get(correctPath);
    info.bundle = bundle;
    this.addDependency(bundle);
    if (!bundle.status) {
      const options = { output: {}, ...this.options };
      options.output.text = true;
      const newBundle = await this.get(correctPath, options);
      await newBundle.resolve(path3);
    } else {
      let done = false;
      setTimeout(() => {
        if (done)
          return;
        console.error(`Took too long (${waitedFor}s)...`, bundle.uri);
        bundle.promises.result.reject();
        bundle.promises.encoded.reject();
      }, toWait);
      await bundle.result;
      done = true;
    }
    const encoded = await bundle.encoded;
    this.updateImport(info, encoded);
    return bundle;
  };
  notify = (done, failed) => {
    const isDone = done !== void 0;
    const isFailed = failed !== void 0;
    if (this.callbacks.file)
      this.callbacks.file(this.name, this.derived.dependencies.resolved, this.derived.dependencies.n, isDone ? this : void 0, isFailed ? failed : void 0);
  };
  get buffer() {
    return this.#buffer;
  }
  bundle = (type = "buffer") => {
    const isText = type === "text";
    this.options._esmpile.lastBundle = type;
    this.promises.encoded.promise = new Promise(async (resolve3, reject) => {
      this.promises.encoded.resolve = resolve3;
      this.promises.encoded.reject = reject;
      try {
        let bufferOrText = isText ? this.info.text.updated : this.buffer;
        if (!bufferOrText) {
          if (this.info.fallback)
            this.encoded = this.info.fallback;
          else
            reject(new Error(`${noEncoding} ${this.name}`));
        }
        const pathExt = extension(this.url);
        let mimeType = get(pathExt);
        switch (mimeType) {
          case "text/typescript":
            bufferOrText = typescript(this.info, type);
            mimeType = js;
            break;
        }
        if (mimeType === js) {
          const srcStr = esSourceString(this);
          let text = bufferOrText;
          if (!isText)
            text = new TextDecoder().decode(bufferOrText);
          const update = !text.includes(srcStr);
          if (update) {
            text += srcStr;
            this.info.text.updated = text;
          }
          if (!isText)
            this.#buffer = bufferOrText = new TextEncoder().encode(text);
        }
        const encodings = [];
        const output = this.options.output;
        if (output?.datauri)
          encodings.push("datauri");
        if (output?.objecturl)
          encodings.push("objecturl");
        for (let i in encodings) {
          const encoding = encodings[i];
          const encodedInfo = await encode_exports[encoding](bufferOrText, this.url, mimeType);
          if (encodedInfo) {
            this.result = encodedInfo.module;
            this.encodings[encoding] = await encodedInfo.encoded;
          }
        }
        const encoded = this.bundler === "objecturl" ? this.encodings.objecturl : this.encodings.datauri;
        resolve3(encoded);
      } catch (e) {
        reject(e);
      }
    });
    return this.promises.encoded.promise;
  };
  delete = () => {
    if (this.objecturl)
      window.URL.revokeObjectURL(this.objecturl);
  };
  addDependency = (o) => {
    let foundCircular = false;
    if (this.dependents.has(o.url))
      foundCircular = true;
    this.dependencies.set(o.url, o);
    if (o.dependencies.has(this.url))
      foundCircular = true;
    o.dependents.set(this.url, this);
    if (foundCircular) {
      this.circular(o);
      o.circular(this);
    }
  };
  removeDependency = (o) => {
    this.dependencies.delete(o.name);
    o.dependents.delete(this.name);
  };
  updateDependency = async (o, encoding) => {
    const infoArr = this.imports[o.url];
    infoArr.forEach((info) => this.updateImport(info, encoding));
  };
  updateCollection = (collection) => {
    if (!collection) {
      this.collection = this.options.collection = Object.keys(globalThis.REMOTEESM_BUNDLES).length;
    } else
      this.collection = collection;
  };
  download = async (path3 = this.filename) => {
    if (this.bundler != "datauri")
      await this.setBundler("datauri");
    const mime = this.encodings.datauri.split(",")[0].split(":")[1].split(";")[0];
    const binary = atob(this.encodings.datauri.split(",")[1]);
    const array = [];
    for (var i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    const buffer = new Uint8Array(array);
    const blob = new Blob([buffer], { type: mime });
    const objecturl2 = URL.createObjectURL(blob);
    if (globalThis.REMOTEESM_NODE) {
      await ready;
      globalThis.fs.writeFileSync(path3, buffer);
      console.log(`Wrote bundle contents to ${path3}`);
    } else {
      var a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      a.href = objecturl2;
      a.download = path3;
      a.click();
    }
  };
  circular = async (o) => {
    this.options._esmpile.circular.add(this.url);
    const result = await this.resolve().catch((e) => {
      console.warn(`Circular dependency detected: Fallback to direct import for ${this.url} failed...`, e);
      const message = `Circular dependency cannot be resolved: ${this.uri} <-> ${o.uri}.`;
      throw new Error(message);
    });
    console.warn(`Circular dependency detected: Fallback to direct import for ${this.url} was successful!`, result);
  };
  resolve = async (uri = this.uri) => {
    this.status = "resolving";
    this.result = void 0;
    this.encoded = void 0;
    this.result = this.promises.result.promise = new Promise(async (resolve3, reject) => {
      this.promises.result.reject = reject;
      this.promises.result.resolve = resolve3;
      let result;
      const isCircular = this.options._esmpile.circular.has(this.url);
      let isDirect = isCircular || !this.derived.compile;
      try {
        result = isDirect ? await this.import().catch(async (e) => {
          if (this.#options.fallback === false)
            throw e;
          else
            await this.setBundler("objecturl");
        }) : void 0;
        try {
          if (!result) {
            if (isCircular)
              throw new Error(`Failed to import ${this.url} natively.`);
            else
              result = await this.compile();
          }
        } catch (e) {
          if (e) {
            if (this.options.fetch?.signal?.aborted)
              throw e;
            else {
              const noBase2 = absolute(uri) ? noBase(uri, this.options, true) : noBase(this.url, this.options, true);
              console.warn(`Failed to fetch ${uri}. Checking filesystem references...`);
              const filesystemFallback = this.options.filesystem?._fallbacks?.[noBase2];
              if (filesystemFallback) {
                console.warn(`Got fallback reference (module only) for ${uri}.`);
                result = filesystemFallback;
                throw new Error("Fallbacks are broken...");
              } else {
                const middle2 = "was not resolved locally. You can provide a direct reference to use in";
                if (e.message.includes(middle2))
                  throw e;
                else
                  throw create(uri, noBase2);
              }
            }
          }
        }
        await this.encoded;
        this.status = "success";
        this.notify(this);
        resolve3(result);
      } catch (e) {
        this.status = "failed";
        this.notify(null, e);
        reject(e);
      }
    });
    return this.result;
  };
  sources = async () => await get5(this.#url, this.#options, this.info.text.original);
};

// src/index.js
var resolve2 = get2;
var path2 = path_exports;
var Bundle2 = Bundle;
var compile = async (uri, opts = {}) => {
  opts = Object.assign({}, opts);
  const thisBundle = get9(uri, opts);
  await thisBundle.resolve();
  return thisBundle.result;
};
var src_default = compile;
export {
  Bundle2 as Bundle,
  Bundle_exports as bundle,
  compile,
  src_default as default,
  load_exports as load,
  nodeModules_exports as nodeModules,
  path2 as path,
  resolve2 as resolve,
  sourceMap_exports as sourceMap
};
