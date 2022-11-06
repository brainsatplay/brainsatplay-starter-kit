var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../utils/index.ts
var utils_exports = {};
__export(utils_exports, {
  canvas: () => canvas,
  default: () => utils_default,
  failed: () => failed,
  options: () => options,
  overlay: () => overlay,
  plot: () => plot
});

// ../../../../node_modules/webgl-plot-utils/dist/index.esm.js
var y = class {
  constructor(e, i, s, a) {
    this.r = e, this.g = i, this.b = s, this.a = a;
  }
};
var x = class {
  constructor() {
    this.scaleX = 1, this.scaleY = 1, this.offsetX = 0, this.offsetY = 0, this.loop = false, this._vbuffer = 0, this._coord = 0, this.visible = true, this.intensity = 1, this.xy = new Float32Array([]), this.numPoints = 0, this.color = new y(0, 0, 0, 1), this.webglNumPoints = 0;
  }
};
var b = class extends x {
  constructor(e, i) {
    super(), this.currentIndex = 0, this.webglNumPoints = i, this.numPoints = i, this.color = e, this.xy = new Float32Array(2 * this.webglNumPoints);
  }
  setX(e, i) {
    this.xy[e * 2] = i;
  }
  setY(e, i) {
    this.xy[e * 2 + 1] = i;
  }
  getX(e) {
    return this.xy[e * 2];
  }
  getY(e) {
    return this.xy[e * 2 + 1];
  }
  lineSpaceX(e, i) {
    for (let s = 0; s < this.numPoints; s++)
      this.setX(s, e + i * s);
  }
  arrangeX() {
    this.lineSpaceX(-1, 2 / this.numPoints);
  }
  constY(e) {
    for (let i = 0; i < this.numPoints; i++)
      this.setY(i, e);
  }
  shiftAdd(e) {
    let i = e.length;
    for (let s = 0; s < this.numPoints - i; s++)
      this.setY(s, this.getY(s + i));
    for (let s = 0; s < i; s++)
      this.setY(s + this.numPoints - i, e[s]);
  }
  addArrayY(e) {
    if (this.currentIndex + e.length <= this.numPoints)
      for (let i = 0; i < e.length; i++)
        this.setY(this.currentIndex, e[i]), this.currentIndex++;
  }
  replaceArrayY(e) {
    if (e.length == this.numPoints)
      for (let i = 0; i < this.numPoints; i++)
        this.setY(i, e[i]);
  }
};
var L = (u, e, i) => {
  let s = { x: 0, y: 0 };
  return s.x = u.x + e.x * i, s.y = u.y + e.y * i, s;
};
var w = (u) => A(-u.y, u.x);
var d = (u, e) => {
  let i = R(u, e);
  return i = _(i), i;
};
var Y = (u, e) => {
  let i = { x: 0, y: 0 };
  return i.x = u.x + e.x, i.y = u.y + e.y, i;
};
var M = (u, e) => u.x * e.x + u.y * e.y;
var _ = (u) => {
  let e = { x: 0, y: 0 }, i = u.x * u.x + u.y * u.y;
  return i > 0 && (i = 1 / Math.sqrt(i), e.x = u.x * i, e.y = u.y * i), e;
};
var A = (u, e) => {
  let i = { x: 0, y: 0 };
  return i.x = u, i.y = e, i;
};
var R = (u, e) => {
  let i = { x: 0, y: 0 };
  return i.x = u.x - e.x, i.y = u.y - e.y, i;
};
var S = (u) => {
  let e, i = { x: 0, y: 0 }, s = { x: 0, y: 0 }, a = [], r = (t, h) => {
    a.push({ vec2: t, miterLength: h });
  }, n = (t) => ({ x: u[t * 2], y: u[t * 2 + 1] });
  i = d(n(1), n(0)), e = w(i), r(e, 1);
  let l = u.length / 2;
  for (let t = 1; t < l - 1; t++) {
    let h = n(t - 1), o = n(t), c = n(t + 1);
    i = d(o, h), e = w(i), s = d(c, o);
    let m = T(i, s), g = N(i, m, 1);
    r(m, g);
  }
  return i = d(n(l - 1), n(l - 2)), e = w(i), r(e, 1), a;
};
var T = (u, e) => {
  let i = Y(u, e);
  return i = _(i), A(-i.y, i.x);
};
var N = (u, e, i) => {
  let s = A(-u.y, u.x);
  return i / M(e, s);
};
var p = class extends x {
  constructor(e, i, s) {
    super(), this.currentIndex = 0, this._thicknessRequested = 0, this._actualThickness = 0, this.webglNumPoints = i * 2, this.numPoints = i, this.color = e, this._thicknessRequested = s, this._linePoints = new Float32Array(i * 2), this.xy = new Float32Array(2 * this.webglNumPoints);
  }
  convertToTriPoints() {
    let e = this._actualThickness / 2, i = S(this._linePoints);
    for (let s = 0; s < this.numPoints; s++) {
      let a = this._linePoints[2 * s], r = this._linePoints[2 * s + 1], n = { x: a, y: r }, l = L(n, i[s].vec2, i[s].miterLength * e), t = L(n, i[s].vec2, -i[s].miterLength * e);
      this.xy[s * 4] = l.x, this.xy[s * 4 + 1] = l.y, this.xy[s * 4 + 2] = t.x, this.xy[s * 4 + 3] = t.y;
    }
  }
  setX(e, i) {
    this._linePoints[e * 2] = i;
  }
  setY(e, i) {
    this._linePoints[e * 2 + 1] = i;
  }
  lineSpaceX(e, i) {
    for (let s = 0; s < this.numPoints; s++)
      this.setX(s, e + i * s);
  }
  setThickness(e) {
    this._thicknessRequested = e;
  }
  getThickness() {
    return this._thicknessRequested;
  }
  setActualThickness(e) {
    this._actualThickness = e;
  }
};
var v = class {
  constructor(e, i) {
    this.debug = false, this.addLine = this.addDataLine, i == null ? this.webgl = e.getContext("webgl", { antialias: true, transparent: false }) : (this.webgl = e.getContext("webgl", { antialias: i.antialias, transparent: i.transparent, desynchronized: i.deSync, powerPerformance: i.powerPerformance, preserveDrawing: i.preserveDrawing }), this.debug = i.debug == null ? false : i.debug), this.log("canvas type is: " + e.constructor.name), this.log(`[webgl-plot]:width=${e.width}, height=${e.height}`), this._linesData = [], this._linesAux = [], this._thickLines = [], this._surfaces = [], this.gScaleX = 1, this.gScaleY = 1, this.gXYratio = 1, this.gOffsetX = 0, this.gOffsetY = 0, this.gLog10X = false, this.gLog10Y = false, this.webgl.clear(this.webgl.COLOR_BUFFER_BIT), this.webgl.viewport(0, 0, e.width, e.height), this._progLine = this.webgl.createProgram(), this.initThinLineProgram(), this.webgl.enable(this.webgl.BLEND), this.webgl.blendFunc(this.webgl.SRC_ALPHA, this.webgl.ONE_MINUS_SRC_ALPHA);
  }
  get linesData() {
    return this._linesData;
  }
  get linesAux() {
    return this._linesAux;
  }
  get thickLines() {
    return this._thickLines;
  }
  get surfaces() {
    return this._surfaces;
  }
  _drawLines(e) {
    let i = this.webgl;
    e.forEach((s) => {
      if (s.visible) {
        i.useProgram(this._progLine);
        let a = i.getUniformLocation(this._progLine, "uscale");
        i.uniformMatrix2fv(a, false, new Float32Array([s.scaleX * this.gScaleX * (this.gLog10X ? 1 / Math.log(10) : 1), 0, 0, s.scaleY * this.gScaleY * this.gXYratio * (this.gLog10Y ? 1 / Math.log(10) : 1)]));
        let r = i.getUniformLocation(this._progLine, "uoffset");
        i.uniform2fv(r, new Float32Array([s.offsetX + this.gOffsetX, s.offsetY + this.gOffsetY]));
        let n = i.getUniformLocation(this._progLine, "is_log");
        i.uniform2iv(n, new Int32Array([this.gLog10X ? 1 : 0, this.gLog10Y ? 1 : 0]));
        let l = i.getUniformLocation(this._progLine, "uColor");
        i.uniform4fv(l, [s.color.r, s.color.g, s.color.b, s.color.a]), i.bufferData(i.ARRAY_BUFFER, s.xy, i.STREAM_DRAW), i.drawArrays(s.loop ? i.LINE_LOOP : i.LINE_STRIP, 0, s.webglNumPoints);
      }
    });
  }
  _drawSurfaces(e) {
    let i = this.webgl;
    e.forEach((s) => {
      if (s.visible) {
        i.useProgram(this._progLine);
        let a = i.getUniformLocation(this._progLine, "uscale");
        i.uniformMatrix2fv(a, false, new Float32Array([s.scaleX * this.gScaleX * (this.gLog10X ? 1 / Math.log(10) : 1), 0, 0, s.scaleY * this.gScaleY * this.gXYratio * (this.gLog10Y ? 1 / Math.log(10) : 1)]));
        let r = i.getUniformLocation(this._progLine, "uoffset");
        i.uniform2fv(r, new Float32Array([s.offsetX + this.gOffsetX, s.offsetY + this.gOffsetY]));
        let n = i.getUniformLocation(this._progLine, "is_log");
        i.uniform2iv(n, new Int32Array([this.gLog10X ? 1 : 0, this.gLog10Y ? 1 : 0]));
        let l = i.getUniformLocation(this._progLine, "uColor");
        i.uniform4fv(l, [s.color.r, s.color.g, s.color.b, s.color.a]), i.bufferData(i.ARRAY_BUFFER, s.xy, i.STREAM_DRAW), i.drawArrays(i.TRIANGLE_STRIP, 0, s.webglNumPoints);
      }
    });
  }
  _drawTriangles(e) {
    let i = this.webgl;
    i.bufferData(i.ARRAY_BUFFER, e.xy, i.STREAM_DRAW), i.useProgram(this._progLine);
    let s = i.getUniformLocation(this._progLine, "uscale");
    i.uniformMatrix2fv(s, false, new Float32Array([e.scaleX * this.gScaleX * (this.gLog10X ? 1 / Math.log(10) : 1), 0, 0, e.scaleY * this.gScaleY * this.gXYratio * (this.gLog10Y ? 1 / Math.log(10) : 1)]));
    let a = i.getUniformLocation(this._progLine, "uoffset");
    i.uniform2fv(a, new Float32Array([e.offsetX + this.gOffsetX, e.offsetY + this.gOffsetY]));
    let r = i.getUniformLocation(this._progLine, "is_log");
    i.uniform2iv(r, new Int32Array([0, 0]));
    let n = i.getUniformLocation(this._progLine, "uColor");
    i.uniform4fv(n, [e.color.r, e.color.g, e.color.b, e.color.a]), i.drawArrays(i.TRIANGLE_STRIP, 0, e.xy.length / 2);
  }
  _drawThickLines() {
    this._thickLines.forEach((e) => {
      if (e.visible) {
        let i = Math.min(this.gScaleX, this.gScaleY);
        e.setActualThickness(e.getThickness() / i), e.convertToTriPoints(), this._drawTriangles(e);
      }
    });
  }
  update() {
    this.clear(), this.draw();
  }
  draw() {
    this._drawLines(this.linesData), this._drawLines(this.linesAux), this._drawThickLines(), this._drawSurfaces(this.surfaces);
  }
  clear() {
    this.webgl.clear(this.webgl.COLOR_BUFFER_BIT);
  }
  _addLine(e) {
    e._vbuffer = this.webgl.createBuffer(), this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, e._vbuffer), this.webgl.bufferData(this.webgl.ARRAY_BUFFER, e.xy, this.webgl.STREAM_DRAW), e._coord = this.webgl.getAttribLocation(this._progLine, "coordinates"), this.webgl.vertexAttribPointer(e._coord, 2, this.webgl.FLOAT, false, 0, 0), this.webgl.enableVertexAttribArray(e._coord);
  }
  addDataLine(e) {
    this._addLine(e), this.linesData.push(e);
  }
  addAuxLine(e) {
    this._addLine(e), this.linesAux.push(e);
  }
  addThickLine(e) {
    this._addLine(e), this._thickLines.push(e);
  }
  addSurface(e) {
    this._addLine(e), this.surfaces.push(e);
  }
  initThinLineProgram() {
    let e = `
      attribute vec2 coordinates;
      uniform mat2 uscale;
      uniform vec2 uoffset;
      uniform ivec2 is_log;

      void main(void) {
         float x = (is_log[0]==1) ? log(coordinates.x) : coordinates.x;
         float y = (is_log[1]==1) ? log(coordinates.y) : coordinates.y;
         vec2 line = vec2(x, y);
         gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);
      }`, i = this.webgl.createShader(this.webgl.VERTEX_SHADER);
    this.webgl.shaderSource(i, e), this.webgl.compileShader(i);
    let s = `
         precision mediump float;
         uniform highp vec4 uColor;
         void main(void) {
            gl_FragColor =  uColor;
         }`, a = this.webgl.createShader(this.webgl.FRAGMENT_SHADER);
    this.webgl.shaderSource(a, s), this.webgl.compileShader(a), this._progLine = this.webgl.createProgram(), this.webgl.attachShader(this._progLine, i), this.webgl.attachShader(this._progLine, a), this.webgl.linkProgram(this._progLine);
  }
  popDataLine() {
    this.linesData.pop();
  }
  removeAllLines() {
    this._linesData = [], this._linesAux = [], this._thickLines = [], this._surfaces = [];
  }
  removeDataLines() {
    this._linesData = [];
  }
  removeAuxLines() {
    this._linesAux = [];
  }
  viewport(e, i, s, a) {
    this.webgl.viewport(e, i, s, a);
  }
  log(e) {
    this.debug && console.log("[webgl-plot]:" + e);
  }
};
var f = class {
  constructor() {
    this.plots = {};
  }
  initPlot(e, i) {
    if (i || (i = new v(e.canvas, e.webglOptions)), !e._id)
      e._id = `plot${Math.floor(Math.random() * 1e15)}`;
    else if (this.plots[e._id]) {
      let l = this.plots[e._id].initial;
      if (e.lines) {
        for (let t in e.lines)
          if (l.lines[t] && Array.isArray(e.lines[t])) {
            let h = e.lines[t];
            e.lines[t] = l.lines[t];
          }
      }
      e = Object.assign(l, e);
    }
    e.overlay && (typeof e.overlay != "object" && (e.overlay = document.createElement("canvas"), e.overlay.style.position = "absolute", e.overlay.width = e.canvas.width, e.overlay.height = e.canvas.height, e.canvas.appendChild(e.overlay)), e.overlayCtx || (e.overlayCtx = e.overlay.getContext("2d"))), e.width && (e.canvas.width = e.width, e.canvas.style && (e.canvas.style.width = e.width + "px"), typeof e.overlay == "object" && (e.overlay.width = e.width, e.overlay.style && (e.overlay.style.width = e.width + "px"))), e.height && (e.canvas.height = e.height, e.canvas.style && (e.canvas.style.height = e.height + "px"), typeof e.overlay == "object" && (e.overlay.height = e.height, e.overlay.style && (e.overlay.style.height = e.height + "px"))), e.lines?.timestamp && delete e.lines.timestamp;
    let s = {};
    for (let l in e.lines)
      s[l] = Object.assign({}, s[l]), "viewing" in e.lines[l] || (e.lines[l].viewing = true), s[l].viewing = e.lines[l].viewing, s[l].sps = e.lines[l].sps, s[l].nSec = e.lines[l].nSec, s[l].nPoints = e.lines[l].nPoints, s[l].ymin = e.lines[l].ymin, s[l].ymax = e.lines[l].ymax, s[l].units = e.lines[l].units;
    let a = { plot: i, settings: e, initial: Object.assign(Object.assign({}, e), { lines: s }), anim: () => {
      i.update();
    } };
    this.plots[e._id] = a;
    let r = 0, n = 0;
    Object.keys(e.lines).forEach((l) => {
      e.lines[l]?.viewing !== false && n++;
    }), e.nLines = n;
    for (let l in e.lines) {
      let t = e.lines[l];
      if (Array.isArray(t) && (t = { values: t }, e.lines[l] = t), "viewing" in t || (t.viewing = true), t.color)
        Array.isArray(t.color) && (t.color = new y(...t.color));
      else {
        let o = f.HSLToRGB(360 * (r / n) % 360, 100, 50, 1);
        a.initial.lines[l].color = [...o, 1], t.color = new y(...o, 1);
      }
      let h;
      if (t.nSec && t.sps ? h = Math.ceil(t.nSec * t.sps) : t.nPoints ? h = t.nPoints : t.values ? h = t.values.length : h || (h = 1e3), !h)
        return;
      if (t.points = h, e.lines[l].viewing !== false) {
        if (t.width ? t.line = new p(t.color, h, t.width) : t.line = new b(t.color, h), t.line.arrangeX(), t.values?.length === t.points) {
          if ("ymax" in t)
            "ymin" in t || (t.ymax < 0 ? t.ymin = t.ymax * 2 : t.ymin = 0);
          else {
            let c = Math.max(...t.values), m = Math.min(...t.values);
            t.ymin = m, t.ymax = c;
          }
          let o = Math.abs(t.ymin);
          t.absmax = o > t.ymax ? o : t.ymax, t.values.length !== h && (t.interpolate ? t.values.length > h ? t.values = f.downsample(t.values, h) : t.values.length < h && (t.values = f.upsample(t.values, h)) : t.values.length > t.points ? t.values = t.values.slice(t.values.length - t.points) : t.values = [...new Array(t.points - t.values.length).fill(0), ...t.values]);
        } else
          Array.isArray(t.values) ? t.values = [...new Array(h - t.values.length).fill(0), ...t.values] : t.values = new Array(t.points).fill(0);
        if (isNaN(t.ymax) && (t.ymax = t.values[0] === 0 ? 1 : t.values[0]), isNaN(t.ymin) && (t.ymin = t.ymax < 0 ? t.ymax : 0), "autoscale" in t || (t.autoscale = true), t.points > 5e3 && (t.autoscale = false), t.position || (t.position = e.nLines - r - 1), t.autoscale ? ("clamp" in t || (t.clamp = true), t.scaled = f.autoscale(t.values, t.position ? t.position : r, n, t.centerZero, t.ymin, t.ymax, t.clamp)) : t.scaled = t.values, t.scaled.forEach((o, c) => t.line.setY(c, o)), i.addDataLine(t.line), "xAxis" in t || (t.xAxis = true), t.xAxis) {
          t.xColor ? Array.isArray(t.xColor) && (t.xColor = new y(...t.xColor)) : t.xColor = new y(1, 1, 1, 0.3);
          let o = new b(t.xColor, 2), c = (r + 1) * 2 / n - 1 - 1 / n;
          t.autoscale ? o.constY(c) : o.constY(0.5), o.arrangeX(), o.xy[2] = 1, t.x = o, i.addAuxLine(o);
        }
        if (n > 1 && t.autoscale && r !== n - 1) {
          e.dividerColor ? Array.isArray(e.dividerColor) && (e.dividerColor = new y(...e.dividerColor)) : e.dividerColor = new y(1, 1, 1, 1);
          let o = new b(e.dividerColor, 2);
          o.constY((r + 1) * 2 / n - 1), o.arrangeX(), o.xy[2] = 1, t.divider = o, i.addAuxLine(o);
        }
        r++;
      }
    }
    if (typeof e.overlay == "object") {
      let l = e.overlay, t = e.overlayCtx;
      t.clearRect(0, 0, e.overlay.width, e.overlay.height), t.font = "1em Courier", t.fillStyle = "white";
      for (let h in e.lines) {
        let o = e.lines[h];
        if (o.useOverlay || !("useOverlay" in o)) {
          let c = e.nLines - o.position - 1;
          t.fillText(h, 20, l.height * (c + 0.1) / e.nLines), t.fillText(`${Math.floor(o.ymax) === o.ymax ? o.ymax : o.ymax?.toFixed(5)} ${o.units ? o.units : ""}`, l.width - 70, l.height * (c + 0.1) / e.nLines), t.fillText(`${Math.floor(o.ymin) === o.ymin ? o.ymin : o.ymin?.toFixed(5)} ${o.units ? o.units : ""}`, l.width - 70, l.height * (c + 0.9) / e.nLines);
        }
      }
    }
    return requestAnimationFrame(a.anim), this.plots[e._id];
  }
  deinitPlot(e) {
    return typeof e == "string" && (e = this.plots[e]), e.plot.clear(), e.plot.removeAllLines(), true;
  }
  reinitPlot(e, i) {
    if (typeof e == "string") {
      let s = e;
      e = this.plots[e], i._id || (i._id = s);
    }
    if (!!e.plot)
      return e.plot.clear(), e.plot.removeAllLines(), e.settings.overlayCtx && e.settings.overlayCtx.clearRect(0, 0, e.settings.overlay?.width, e.settings.overlay?.height), this.initPlot(i, e.plot);
  }
  getChartSettings(e, i) {
    let s = this.plots[e];
    if (s) {
      let a = Object.assign({}, s.initial);
      for (let r in s.initial.lines)
        typeof s.initial.lines[r]?.ymax != "number" && (a.lines[r].ymax = s.settings.lines[r]?.ymax), typeof s.initial.lines[r]?.ymin != "number" && (a.lines[r].ymin = s.settings.lines[r]?.ymin), i && (a.lines[r].values = s.settings.lines[r].values);
      return delete a.canvas, delete a.overlay, delete a.overlayCtx, a;
    }
  }
  update(e, i, s = true) {
    if (typeof e == "string" && (e = this.plots[e]), !e)
      return false;
    if (i) {
      let a = false;
      for (let r in i)
        if (e.settings.lines[r] && e.settings.lines[r].line) {
          if (e.settings.lines[r]?.viewing === false)
            continue;
          let n = e.settings.lines[r];
          if (Array.isArray(i[r]) ? f.circularBuffer(n.values, i[r]) : typeof i[r] == "number" ? (n.values.push(i[r]), n.values.shift()) : i[r]?.values && f.circularBuffer(n.values, i[r].values), n.values) {
            if (isNaN(n.ymax) && (n.ymax = n.values[0] === 0 ? 1 : n.values[0]), isNaN(n.ymin) && (n.ymin = n.ymax < 0 ? n.ymax : 0), typeof e.initial.lines[r]?.ymin != "number" && (e.settings.overlay || n.autoscale)) {
              let l = Math.max(...n.values, n.ymax), t = Math.min(...n.values, n.ymin);
              n.ymin = t, n.ymax = l;
              let h = Math.abs(n.ymin);
              n.absmax = h > n.ymax ? h : n.ymax;
            } else if (typeof n.ymax == "number" && (typeof n.ymin != "number" && (n.ymin = 0), n.ymin > n.ymax)) {
              let l = n.ymin;
              n.ymin = n.ymax, n.ymax = l;
            }
            n.autoscale ? n.scaled = f.autoscale(n.values, n.position, e.settings.nLines, n.centerZero, n.ymin, n.ymax, n.clamp) : n.scaled = n.values, n.scaled.length !== n.points && (n.interpolate ? n.values.length > n.points ? n.scaled = f.downsample(n.scaled, n.points) : n.scaled.length < n.points && (n.scaled = f.upsample(n.scaled, n.points)) : n.scaled.length > n.points ? n.scaled.splice(0, n.scaled.length - n.points) : n.scaled = new Array(n.points).fill(0).splice(n.points - n.scaled.length, 0, n.scaled)), n.scaled.forEach((l, t) => {
              !n.autoscale && n.absmax > 1 ? n.line.setY(t, l / n.absmax) : n.line.setY(t, l);
            });
          }
        } else
          e.settings.generateNewLines && !r.includes("timestamp") && (Array.isArray(i[r]) && (i[r] = { values: i[r] }), !i[r].nSec && !i[r].nPoints && (i[r].nPoints = 1e3), a = true);
      if (a)
        return e.settings.cleanGeneration || Object.keys(e.initial.lines).forEach((r) => {
          i[r] ? i[r] = Object.assign(e.initial.lines[r], i[r]) : i[r] = e.initial.lines[r];
        }), this.reinitPlot(e, { _id: e.settings._id, lines: i }), true;
    }
    if (typeof e.settings.overlay == "object") {
      let a = e.settings.overlay, r = e.settings.overlayCtx;
      r.clearRect(0, 0, e.settings.overlay.width, e.settings.overlay.height), r.font = "1em Courier", r.fillStyle = "white";
      for (let n in e.settings.lines) {
        let l = e.settings.lines[n];
        if (l.useOverlay || !("useOverlay" in l)) {
          let t = e.settings.nLines - l.position - 1;
          r.fillText(n, 20, a.height * (t + 0.1) / e.settings.nLines), r.fillText(`${Math.floor(l.ymax) === l.ymax ? l.ymax : l.ymax?.toFixed(5)} ${l.units ? l.units : ""}`, a.width - 70, a.height * (t + 0.1) / e.settings.nLines), r.fillText(`${Math.floor(l.ymin) === l.ymin ? l.ymin : l.ymin?.toFixed(5)} ${l.units ? l.units : ""}`, a.width - 70, a.height * (t + 0.9) / e.settings.nLines);
        }
      }
    }
    return s && requestAnimationFrame(e.anim), true;
  }
  updateLine(e, i, s, a, r, n, l) {
    return e.numPoints !== i.length && (s ? e.numPoints > i.length ? i = f.downsample(i, e.numPoints) : e.numPoints < i.length && (i = f.upsample(i, e.numPoints)) : i.length > e.numPoints ? i = i.slice(i.length - e.numPoints) : i = [...new Array(i.length).fill(0), ...i]), a && (i = f.autoscale(i, r, n, l)), i.forEach((t, h) => e.setY(h, t)), true;
  }
  static autoscale(e, i = 0, s = 1, a = false, r, n, l) {
    if (e?.length === 0)
      return e;
    let t = n || Math.max(...e), h = r || Math.min(...e), o = 1 / s, c = 1;
    if (a) {
      let m = Math.max(Math.abs(h), Math.abs(t));
      return m !== 0 && (c = o / m), e.map((g) => (l && (g < h && (g = h), g > t && (g = t)), g * c + (o * (i + 1) * 2 - 1 - o)));
    } else
      return t === h ? t !== 0 ? c = o / t : h !== 0 && (c = o / Math.abs(h)) : c = o / (t - h), e.map((m) => (l && (m < h && (m = h), m > t && (m = t)), 2 * ((m - h) * c - 1 / (2 * s)) + (o * (i + 1) * 2 - 1 - o)));
  }
  static absmax(e) {
    return Math.max(Math.abs(Math.min(...e)), Math.max(...e));
  }
  static downsample(e, i, s = 1) {
    if (e.length > i) {
      let a = new Array(i), r = e.length / i, n = e.length - 1, l = 0, t = 0;
      for (let h = r; h < e.length; h += r) {
        let o = Math.round(h);
        o > n && (o = n);
        for (let c = l; c < o; c++)
          a[t] += e[c];
        a[t] /= (o - l) * s, t++, l = o;
      }
      return a;
    } else
      return e;
  }
  static upsample(e, i, s = 1) {
    var a = function(m, g, P) {
      return (m + (g - m) * P) * s;
    }, r = new Array(i), n = (e.length - 1) / (i - 1);
    r[0] = e[0];
    for (var l = 1; l < i - 1; l++) {
      var t = l * n, h = Math.floor(t), o = Math.ceil(t), c = t - h;
      r[l] = a(e[h], e[o], c);
    }
    return r[i - 1] = e[e.length - 1], r;
  }
  static interpolate(e, i, s = 1) {
    return e.length > i ? f.downsample(e, i, s) : e.length < i ? f.upsample(e, i, s) : e;
  }
  static HSLToRGB(e, i, s, a = 255) {
    i /= 100, s /= 100;
    let r = (1 - Math.abs(2 * s - 1)) * i, n = r * (1 - Math.abs(e / 60 % 2 - 1)), l = s - r / 2, t = 0, h = 0, o = 0;
    return 0 <= e && e < 60 ? (t = r, h = n, o = 0) : 60 <= e && e < 120 ? (t = n, h = r, o = 0) : 120 <= e && e < 180 ? (t = 0, h = r, o = n) : 180 <= e && e < 240 ? (t = 0, h = n, o = r) : 240 <= e && e < 300 ? (t = n, h = 0, o = r) : 300 <= e && e < 360 && (t = r, h = 0, o = n), t = (t + l) * a, h = (h + l) * a, o = (o + l) * a, [t, h, o];
  }
  static circularBuffer(e, i) {
    if (i.length < e.length) {
      let s = e.slice(i.length), a = e.length;
      e.splice(0, a, ...s, ...i);
    } else if (i.length > e.length) {
      let s = e.length;
      e.splice(0, s, i.slice(s - i.length));
    } else
      e.splice(0, e.length, ...i);
    return e;
  }
  static formatDataForCharts(e, i) {
    if (Array.isArray(e)) {
      if (Array.isArray(e[0])) {
        let s = {};
        if (e.forEach((a, r) => {
          s[r] = a;
        }), e = s, isNaN(e[0][0]))
          return;
      } else if (i) {
        if (e = { [i]: e }, isNaN(e[i][0]))
          return;
      } else if (e = { 0: e }, isNaN(e[0][0]))
        return;
    } else if (typeof e == "object") {
      for (let s in e)
        if (typeof e[s] == "number" ? e[s] = [e[s]] : e[s]?.values && typeof e[s].values == "number" && (e[s].values = [e[s].values]), isNaN(e[s][0]))
          return;
    } else if (typeof e == "string") {
      let s;
      if (e.includes(`\r
`)) {
        let a = e.split(`\r
`);
        e = {}, a.forEach((r, n) => {
          r.includes("	") ? s = r.split("	") : r.includes(",") ? s = r.split(",") : r.includes("|") && (s = r.split("|")), s && s.forEach((l, t) => {
            if (l.includes(":")) {
              let [h, o] = l.split(":"), c = parseFloat(o);
              isNaN(c) || (e[h] = [c]);
            } else {
              let h = parseFloat(l);
              isNaN(h) || (e[t] = [h]);
            }
          });
        });
      } else
        e.includes("	") ? s = e.split("	") : e.includes(",") ? s = e.split(",") : e.includes("|") && (s = e.split("|"));
      e = {}, s && s.forEach((a, r) => {
        if (a.includes(":")) {
          let [n, l] = a.split(":"), t = parseFloat(l);
          isNaN(t) || (e[n] = [t]);
        } else {
          let n = parseFloat(a);
          isNaN(n) || (e[r] = [n]);
        }
      });
    } else
      typeof e == "number" && (i ? e = { [i]: [e] } : e = { 0: [e] });
    return e;
  }
  static padTime(e, i, s, a) {
    let r = (e[0] - i) / s / a;
    return [...new Array(a - e.length).map((l, t) => i + r * (t + 1)), ...e];
  }
  static interpolateForTime(e, i, s) {
    return f.interpolate(e, Math.ceil(s * i));
  }
};

// ../utils/canvas.worker.ts
var url = URL.createObjectURL(new Blob([String('(()=>{var mouseEventHandler=makeSendPropertiesHandler(["ctrlKey","metaKey","shiftKey","button","pointerType","clientX","clientY","pageX","pageY"]);var wheelEventHandlerImpl=makeSendPropertiesHandler(["deltaX","deltaY"]);var keydownEventHandler=makeSendPropertiesHandler(["ctrlKey","metaKey","shiftKey","keyCode"]);function wheelEventHandler(event,sendFn){event.preventDefault();wheelEventHandlerImpl(event,sendFn)}function preventDefaultHandler(event){event.preventDefault()}function copyProperties(src,properties,dst){for(const name of properties){dst[name]=src[name]}}function makeSendPropertiesHandler(properties){return function sendProperties(event,sendFn){const data={type:event.type};copyProperties(event,properties,data);sendFn(data)}}function touchEventHandler(event,sendFn){const touches=[];const data={type:event.type,touches};for(let i=0;i<event.touches.length;++i){const touch=event.touches[i];touches.push({pageX:touch.pageX,pageY:touch.pageY})}sendFn(data)}var orbitKeys={"37":true,"38":true,"39":true,"40":true};function filteredKeydownEventHandler(event,sendFn){const{keyCode}=event;if(orbitKeys[keyCode]){event.preventDefault();keydownEventHandler(event,sendFn)}}var eventHandlers={contextmenu:preventDefaultHandler,mousedown:mouseEventHandler,mousemove:mouseEventHandler,mouseup:mouseEventHandler,pointerdown:mouseEventHandler,pointermove:mouseEventHandler,pointerup:mouseEventHandler,touchstart:touchEventHandler,touchmove:touchEventHandler,touchend:touchEventHandler,wheel:wheelEventHandler,keydown:filteredKeydownEventHandler};function initProxyElement(element,worker,id){if(!id)id="proxy"+Math.floor(Math.random()*1e15);const sendEvent=data=>{worker.postMessage({route:"handleProxyEvent",args:[data,id]})};let entries=Object.entries(eventHandlers);for(const[eventName,handler]of entries){element.addEventListener(eventName,function(event){handler(event,sendEvent)})}const sendSize=()=>{const rect=element.getBoundingClientRect();sendEvent({type:"resize",left:rect.left,top:rect.top,width:element.clientWidth,height:element.clientHeight})};sendSize();globalThis.addEventListener("resize",sendSize);return id}var EventDispatcher=class{addEventListener(type,listener){if(this._listeners===void 0)this._listeners={};const listeners=this._listeners;if(listeners[type]===void 0){listeners[type]=[]}if(listeners[type].indexOf(listener)===-1){listeners[type].push(listener)}}hasEventListener(type,listener){if(this._listeners===void 0)return false;const listeners=this._listeners;return listeners[type]!==void 0&&listeners[type].indexOf(listener)!==-1}removeEventListener(type,listener){if(this._listeners===void 0)return;const listeners=this._listeners;const listenerArray=listeners[type];if(listenerArray!==void 0){const index=listenerArray.indexOf(listener);if(index!==-1){listenerArray.splice(index,1)}}}dispatchEvent(event,target){if(this._listeners===void 0)return;const listeners=this._listeners;const listenerArray=listeners[event.type];if(listenerArray!==void 0){if(!target)event.target=this;else event.target=target;const array=listenerArray.slice(0);for(let i=0,l=array.length;i<l;i++){array[i].call(this,event)}event.target=null}}};function noop(){}var ElementProxyReceiver=class extends EventDispatcher{constructor(){super();this._listeners={};this.style={};this.setPointerCapture=()=>{};this.releasePointerCapture=()=>{};this.getBoundingClientRect=()=>{return{left:this.left,top:this.top,width:this.width,height:this.height,right:this.left+this.width,bottom:this.top+this.height}};this.handleEvent=data=>{if(data.type==="resize"){this.left=data.left;this.top=data.top;this.width=data.width;this.height=data.height;if(typeof this.proxied==="object"){this.proxied.width=this.width;this.proxied.height=this.height;this.proxied.clientWidth=this.width;this.proxied.clientHeight=this.height}}data.preventDefault=noop;data.stopPropagation=noop;this.dispatchEvent(data,this.proxied)};this.style={}}get clientWidth(){return this.width}get clientHeight(){return this.height}focus(){}};var ProxyManager=class{constructor(){this.targets={};this.makeProxy=(id,addTo=void 0)=>{if(!id)id=`proxyReceiver${Math.floor(Math.random()*1e15)}`;let proxy;if(this.targets[id])proxy=this.targets[id];else{proxy=new ElementProxyReceiver;this.targets[id]=proxy}if(typeof addTo==="object"){addTo.proxy=proxy;proxy.proxied=addTo;addTo.style=proxy.style;if(proxy.width){addTo.width=proxy.width;addTo.clientWidth=proxy.width}if(proxy.height){addTo.height=proxy.height;addTo.clientHeight=proxy.height}addTo.setPointerCapture=proxy.setPointerCapture.bind(proxy);addTo.releasePointerCapture=proxy.releasePointerCapture.bind(proxy);addTo.getBoundingClientRect=proxy.getBoundingClientRect.bind(proxy);addTo.addEventListener=proxy.addEventListener.bind(proxy);addTo.removeEventListener=proxy.removeEventListener.bind(proxy);addTo.handleEvent=proxy.handleEvent.bind(proxy);addTo.dispatchEvent=proxy.dispatchEvent.bind(proxy);addTo.focus=proxy.focus.bind(proxy)}};this.getProxy=id=>{return this.targets[id]};this.handleEvent=(data,id)=>{if(!this.targets[id])this.makeProxy(id);if(this.targets[id]){this.targets[id].handleEvent(data);return true}return void 0};if(!globalThis.document)globalThis.document={}}};function makeProxy(id,elm){if(this.graph){if(!this.graph.ProxyManager)this.graph.ProxyManager=new ProxyManager;this.graph.ProxyManager.makeProxy(id,elm)}else{if(!globalThis.ProxyManager)globalThis.ProxyManager=new ProxyManager;globalThis.ProxyManager.makeProxy(id,elm)}return id}function handleProxyEvent(data,id){if(this.graph){if(!this.graph.ProxyManager)this.graph.ProxyManager=new ProxyManager;if(this.graph.ProxyManager.handleEvent(data,id))return data}else{if(!globalThis.ProxyManager)globalThis.ProxyManager=new ProxyManager;if(globalThis.ProxyManager.handleEvent(data,id))return data}}var proxyElementWorkerRoutes={initProxyElement,makeProxy,handleProxyEvent};function transferCanvas(worker,options,route){if(!options)return void 0;if(!options._id)options._id=`canvas${Math.floor(Math.random()*1e15)}`;let offscreen=options.canvas.transferControlToOffscreen();let message={route:route?route:"setupCanvas",args:{...options,canvas:offscreen}};if(this.graph)this.graph.run("initProxyElement",options.canvas,worker,options._id);else initProxyElement(options.canvas,worker,options._id);if(options.draw){if(typeof options.draw==="function")message.args.draw=options.draw.toString();else message.args.draw=options.draw}if(options.update){if(typeof options.update==="function")message.args.update=options.update.toString();else message.args.update=options.update}if(options.init){if(typeof options.init==="function")message.args.init=options.init.toString();else message.args.init=options.init}if(options.clear){if(typeof options.clear==="function")message.args.clear=options.clear.toString();else message.args.clear=options.clear}let transfer=[offscreen];if(options.transfer){transfer.push(...options.transfer);delete options.transfer}worker.postMessage(message,transfer);const canvascontrols={_id:options._id,width:options.width,height:options.height,worker,draw:props=>{worker.postMessage({route:"drawFrame",args:[props,options._id]})},update:props=>{worker.postMessage({route:"updateCanvas",args:[props,options._id]})},clear:()=>{worker.postMessage({route:"clearCanvas",args:options._id})},init:()=>{worker.postMessage({route:"initCanvas",args:options._id})},stop:()=>{worker.postMessage({route:"stopAnim",args:options._id})},start:()=>{worker.postMessage({route:"startAnim",args:options._id})},set:newDrawProps=>{worker.postMessage({route:"setDraw",args:[newDrawProps,options._id]})},terminate:()=>{worker.terminate()}};return canvascontrols}function setDraw(settings,_id){let canvasopts;if(this.graph){if(_id)canvasopts=this.graph.CANVASES?.[settings._id];else if(settings._id)canvasopts=this.graph.CANVASES?.[settings._id];else canvasopts=this.graph.CANVASES?.[Object.keys(this.graph.CANVASES)[0]]}else{if(_id)canvasopts=globalThis.CANVASES?.[settings._id];else if(settings._id)canvasopts=globalThis.CANVASES?.[settings._id];else canvasopts=globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]]}if(canvasopts){if(settings.canvas){canvasopts.canvas=settings.canvas;if(this.graph)this.graph.run("makeProxy",canvasopts._id,canvasopts.canvas);else proxyElementWorkerRoutes.makeProxy(canvasopts._id,canvasopts.canvas)}if(typeof settings.context==="string")canvasopts.context=canvasopts.canvas.getContext(settings.context);else if(settings.context)canvasopts.context=settings.context;if(settings.width)canvasopts.canvas.width=settings.width;if(settings.height)canvasopts.canvas.height=settings.height;if(typeof settings.draw==="string")settings.draw=parseFunctionFromText(settings.draw);if(typeof settings.draw==="function"){canvasopts.draw=settings.draw}if(typeof settings.update==="string")settings.update=parseFunctionFromText(settings.update);if(typeof settings.update==="function"){canvasopts.update=settings.update}if(typeof settings.init==="string")settings.init=parseFunctionFromText(settings.init);if(typeof settings.init==="function"){canvasopts.init=settings.init}if(typeof settings.clear==="string")settings.clear=parseFunctionFromText(settings.clear);if(typeof settings.clear==="function"){canvasopts.clear=settings.clear}return settings._id}return void 0}function Renderer(options){if(options.worker){let worker=options.worker;let route=options.route;if(worker instanceof Blob||typeof worker==="string"){worker=new Worker(worker)}delete options.worker;delete options.route;return transferCanvas(worker,options,route)}else return setupCanvas(options)}function setupCanvas(options){if(this.graph){if(!this.graph.CANVASES)this.graph.CANVASES={}}else if(!globalThis.CANVASES)globalThis.CANVASES={};let canvasOptions=options;options._id?canvasOptions._id=options._id:canvasOptions._id=`canvas${Math.floor(Math.random()*1e15)}`;typeof options.context==="string"?canvasOptions.context=options.canvas.getContext(options.context):canvasOptions.context=options.context;"animating"in options?canvasOptions.animating=options.animating:canvasOptions.animating=true;if(this.graph?.CANVASES[canvasOptions._id]){this.graph.run("setDraw",canvasOptions)}else if(globalThis.CANVASES[canvasOptions._id]){setDraw(canvasOptions)}else{canvasOptions.graph=this.graph;if(this.graph)this.graph.CANVASES[canvasOptions._id]=canvasOptions;else globalThis.CANVASES[canvasOptions._id]=canvasOptions;if(this.graph)this.graph.run("makeProxy",canvasOptions._id,canvasOptions.canvas);else proxyElementWorkerRoutes.makeProxy(canvasOptions._id,canvasOptions.canvas);if(options.width)canvasOptions.canvas.width=options.width;if(options.height)canvasOptions.canvas.height=options.height;if(typeof canvasOptions.draw==="string"){canvasOptions.draw=parseFunctionFromText(canvasOptions.draw)}else if(typeof canvasOptions.draw==="function"){canvasOptions.draw=canvasOptions.draw}if(typeof canvasOptions.update==="string"){canvasOptions.update=parseFunctionFromText(canvasOptions.update)}else if(typeof canvasOptions.update==="function"){canvasOptions.update=canvasOptions.update}if(typeof canvasOptions.init==="string"){canvasOptions.init=parseFunctionFromText(canvasOptions.init)}else if(typeof canvasOptions.init==="function"){canvasOptions.init=canvasOptions.init}if(typeof canvasOptions.clear==="string"){canvasOptions.clear=parseFunctionFromText(canvasOptions.clear)}else if(typeof canvasOptions.clear==="function"){canvasOptions.clear=canvasOptions.clear}if(typeof canvasOptions.init==="function")canvasOptions.init(canvasOptions,canvasOptions.canvas,canvasOptions.context);canvasOptions.stop=()=>{stopAnim(canvasOptions._id)};canvasOptions.start=draw=>{startAnim(canvasOptions._id,draw)};canvasOptions.set=settings=>{setDraw(settings,canvasOptions._id)};if(typeof canvasOptions.draw==="function"&&canvasOptions.animating){let draw=(s,canvas,context)=>{if(s.animating){s.draw(s,canvas,context);requestAnimationFrame(()=>{draw(s,canvas,context)})}};draw(canvasOptions,canvasOptions.canvas,canvasOptions.context)}}if(typeof WorkerGlobalScope!=="undefined"&&self instanceof WorkerGlobalScope)return canvasOptions._id;else return canvasOptions}function drawFrame(props,_id){let canvasopts;if(this.graph){if(!_id)canvasopts=this.graph.CANVASES?.[Object.keys(this.graph.CANVASES)[0]];else canvasopts=this.graph.CANVASES?.[_id]}else{if(!_id)canvasopts=globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];else canvasopts=globalThis.CANVASES?.[_id]}if(canvasopts){if(props)Object.assign(canvasopts,props);if(canvasopts.draw){canvasopts.draw(canvasopts,canvasopts.canvas,canvasopts.context);return _id}}return void 0}function clearCanvas(_id){let canvasopts;if(this.graph){if(!_id)canvasopts=this.graph.CANVASES?.[Object.keys(this.graph.CANVASES)[0]];else canvasopts=this.graph.CANVASES?.[_id]}else{if(!_id)canvasopts=globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];else canvasopts=globalThis.CANVASES?.[_id]}if(canvasopts?.clear){canvasopts.clear(canvasopts,canvasopts.canvas,canvasopts.context);return _id}return void 0}function initCanvas(_id){let canvasopts;if(this.graph){if(!_id)canvasopts=this.graph.CANVASES?.[Object.keys(this.graph.CANVASES)[0]];else canvasopts=this.graph.CANVASES?.[_id]}else{if(!_id)canvasopts=globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];else canvasopts=globalThis.CANVASES?.[_id]}if(canvasopts?.init){canvasopts.init(canvasopts,canvasopts.canvas,canvasopts.context);return _id}return void 0}function updateCanvas(input,_id){let canvasopts;if(this.graph){if(!_id)canvasopts=this.graph.CANVASES?.[Object.keys(this.graph.CANVASES)[0]];else canvasopts=this.graph.CANVASES?.[_id]}else{if(!_id)canvasopts=globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];else canvasopts=globalThis.CANVASES?.[_id]}if(canvasopts?.update){canvasopts.update(canvasopts,canvasopts.canvas,canvasopts.context,input);return _id}return void 0}function setProps(props,_id){let canvasopts;if(this.graph){if(!_id)canvasopts=this.graph.CANVASES?.[Object.keys(this.graph.CANVASES)[0]];else canvasopts=this.graph.CANVASES?.[_id]}else{if(!_id)canvasopts=globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];else canvasopts=globalThis.CANVASES?.[_id]}if(canvasopts){Object.assign(canvasopts,props);if(props.width)canvasopts.canvas.width=props.width;if(props.height)canvasopts.canvas.height=props.height;return _id}return void 0}function startAnim(_id,draw){let canvasopts;if(this.graph){if(!_id)canvasopts=this.graph.CANVASES?.[Object.keys(this.graph.CANVASES)[0]];else canvasopts=this.graph.CANVASES?.[_id]}else{if(!_id)canvasopts=globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];else canvasopts=globalThis.CANVASES?.[_id]}canvasopts.animating=true;if(canvasopts&&draw){if(typeof draw==="string")draw=parseFunctionFromText(draw);if(typeof draw==="function"){canvasopts.draw=draw}return _id}if(typeof canvasopts?.draw==="function"){let draw2=(s,canvas,context)=>{if(s.animating){s.draw(s,canvas,context);requestAnimationFrame(()=>{draw2(s,canvas,context)})}};if(typeof canvasopts.clear==="function")canvasopts.clear(canvasopts,canvasopts.canvas,canvasopts.context);if(typeof canvasopts.init==="function")canvasopts.init(canvasopts,canvasopts.canvas,canvasopts.context);draw2(canvasopts,canvasopts.canvas,canvasopts.context);return _id}return void 0}function stopAnim(_id){let canvasopts;if(this.graph){if(!_id)canvasopts=this.graph.CANVASES?.[Object.keys(this.graph.CANVASES)[0]];else canvasopts=this.graph.CANVASES?.[_id]}else{if(!_id)canvasopts=globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];else canvasopts=globalThis.CANVASES?.[_id]}if(canvasopts){canvasopts.animating=false;if(typeof canvasopts.clear==="function")canvasopts.clear(canvasopts,canvasopts.canvas,canvasopts.context);return _id}return void 0}var workerCanvasRoutes={...proxyElementWorkerRoutes,Renderer,transferCanvas,setupCanvas,setDraw,drawFrame,clearCanvas,initCanvas,updateCanvas,setProps,startAnim,stopAnim};function parseFunctionFromText(method=""){let getFunctionBody=methodString=>{return methodString.replace(/^\\W*(function[^{]+\\{([\\s\\S]*)\\}|[^=]+=>[^{]*\\{([\\s\\S]*)\\}|[^=]+=>(.+))/i,"$2$3$4")};let getFunctionHead=methodString=>{let startindex=methodString.indexOf("=>")+1;if(startindex<=0){startindex=methodString.indexOf("){")}if(startindex<=0){startindex=methodString.indexOf(") {")}return methodString.slice(0,methodString.indexOf("{",startindex)+1)};let newFuncHead=getFunctionHead(method);let newFuncBody=getFunctionBody(method);let newFunc;if(newFuncHead.includes("function")){let varName=newFuncHead.split("(")[1].split(")")[0];newFunc=new Function(varName,newFuncBody)}else{if(newFuncHead.substring(0,6)===newFuncBody.substring(0,6)){let varName=newFuncHead.split("(")[1].split(")")[0];newFunc=new Function(varName,newFuncBody.substring(newFuncBody.indexOf("{")+1,newFuncBody.length-1))}else{try{newFunc=(0,eval)(newFuncHead+newFuncBody+"}")}catch{}}}return newFunc}var y=class{constructor(e,i,s,a){this.r=e,this.g=i,this.b=s,this.a=a}};var x=class{constructor(){this.scaleX=1,this.scaleY=1,this.offsetX=0,this.offsetY=0,this.loop=false,this._vbuffer=0,this._coord=0,this.visible=true,this.intensity=1,this.xy=new Float32Array([]),this.numPoints=0,this.color=new y(0,0,0,1),this.webglNumPoints=0}};var b=class extends x{constructor(e,i){super(),this.currentIndex=0,this.webglNumPoints=i,this.numPoints=i,this.color=e,this.xy=new Float32Array(2*this.webglNumPoints)}setX(e,i){this.xy[e*2]=i}setY(e,i){this.xy[e*2+1]=i}getX(e){return this.xy[e*2]}getY(e){return this.xy[e*2+1]}lineSpaceX(e,i){for(let s=0;s<this.numPoints;s++)this.setX(s,e+i*s)}arrangeX(){this.lineSpaceX(-1,2/this.numPoints)}constY(e){for(let i=0;i<this.numPoints;i++)this.setY(i,e)}shiftAdd(e){let i=e.length;for(let s=0;s<this.numPoints-i;s++)this.setY(s,this.getY(s+i));for(let s=0;s<i;s++)this.setY(s+this.numPoints-i,e[s])}addArrayY(e){if(this.currentIndex+e.length<=this.numPoints)for(let i=0;i<e.length;i++)this.setY(this.currentIndex,e[i]),this.currentIndex++}replaceArrayY(e){if(e.length==this.numPoints)for(let i=0;i<this.numPoints;i++)this.setY(i,e[i])}};var L=(u,e,i)=>{let s={x:0,y:0};return s.x=u.x+e.x*i,s.y=u.y+e.y*i,s};var w=u=>A(-u.y,u.x);var d=(u,e)=>{let i=R(u,e);return i=_(i),i};var Y=(u,e)=>{let i={x:0,y:0};return i.x=u.x+e.x,i.y=u.y+e.y,i};var M=(u,e)=>u.x*e.x+u.y*e.y;var _=u=>{let e={x:0,y:0},i=u.x*u.x+u.y*u.y;return i>0&&(i=1/Math.sqrt(i),e.x=u.x*i,e.y=u.y*i),e};var A=(u,e)=>{let i={x:0,y:0};return i.x=u,i.y=e,i};var R=(u,e)=>{let i={x:0,y:0};return i.x=u.x-e.x,i.y=u.y-e.y,i};var S=u=>{let e,i={x:0,y:0},s={x:0,y:0},a=[],r=(t,h)=>{a.push({vec2:t,miterLength:h})},n=t=>({x:u[t*2],y:u[t*2+1]});i=d(n(1),n(0)),e=w(i),r(e,1);let l=u.length/2;for(let t=1;t<l-1;t++){let h=n(t-1),o=n(t),c=n(t+1);i=d(o,h),e=w(i),s=d(c,o);let m=T(i,s),g=N(i,m,1);r(m,g)}return i=d(n(l-1),n(l-2)),e=w(i),r(e,1),a};var T=(u,e)=>{let i=Y(u,e);return i=_(i),A(-i.y,i.x)};var N=(u,e,i)=>{let s=A(-u.y,u.x);return i/M(e,s)};var p=class extends x{constructor(e,i,s){super(),this.currentIndex=0,this._thicknessRequested=0,this._actualThickness=0,this.webglNumPoints=i*2,this.numPoints=i,this.color=e,this._thicknessRequested=s,this._linePoints=new Float32Array(i*2),this.xy=new Float32Array(2*this.webglNumPoints)}convertToTriPoints(){let e=this._actualThickness/2,i=S(this._linePoints);for(let s=0;s<this.numPoints;s++){let a=this._linePoints[2*s],r=this._linePoints[2*s+1],n={x:a,y:r},l=L(n,i[s].vec2,i[s].miterLength*e),t=L(n,i[s].vec2,-i[s].miterLength*e);this.xy[s*4]=l.x,this.xy[s*4+1]=l.y,this.xy[s*4+2]=t.x,this.xy[s*4+3]=t.y}}setX(e,i){this._linePoints[e*2]=i}setY(e,i){this._linePoints[e*2+1]=i}lineSpaceX(e,i){for(let s=0;s<this.numPoints;s++)this.setX(s,e+i*s)}setThickness(e){this._thicknessRequested=e}getThickness(){return this._thicknessRequested}setActualThickness(e){this._actualThickness=e}};var v=class{constructor(e,i){this.debug=false,this.addLine=this.addDataLine,i==null?this.webgl=e.getContext("webgl",{antialias:true,transparent:false}):(this.webgl=e.getContext("webgl",{antialias:i.antialias,transparent:i.transparent,desynchronized:i.deSync,powerPerformance:i.powerPerformance,preserveDrawing:i.preserveDrawing}),this.debug=i.debug==null?false:i.debug),this.log("canvas type is: "+e.constructor.name),this.log(`[webgl-plot]:width=${e.width}, height=${e.height}`),this._linesData=[],this._linesAux=[],this._thickLines=[],this._surfaces=[],this.gScaleX=1,this.gScaleY=1,this.gXYratio=1,this.gOffsetX=0,this.gOffsetY=0,this.gLog10X=false,this.gLog10Y=false,this.webgl.clear(this.webgl.COLOR_BUFFER_BIT),this.webgl.viewport(0,0,e.width,e.height),this._progLine=this.webgl.createProgram(),this.initThinLineProgram(),this.webgl.enable(this.webgl.BLEND),this.webgl.blendFunc(this.webgl.SRC_ALPHA,this.webgl.ONE_MINUS_SRC_ALPHA)}get linesData(){return this._linesData}get linesAux(){return this._linesAux}get thickLines(){return this._thickLines}get surfaces(){return this._surfaces}_drawLines(e){let i=this.webgl;e.forEach(s=>{if(s.visible){i.useProgram(this._progLine);let a=i.getUniformLocation(this._progLine,"uscale");i.uniformMatrix2fv(a,false,new Float32Array([s.scaleX*this.gScaleX*(this.gLog10X?1/Math.log(10):1),0,0,s.scaleY*this.gScaleY*this.gXYratio*(this.gLog10Y?1/Math.log(10):1)]));let r=i.getUniformLocation(this._progLine,"uoffset");i.uniform2fv(r,new Float32Array([s.offsetX+this.gOffsetX,s.offsetY+this.gOffsetY]));let n=i.getUniformLocation(this._progLine,"is_log");i.uniform2iv(n,new Int32Array([this.gLog10X?1:0,this.gLog10Y?1:0]));let l=i.getUniformLocation(this._progLine,"uColor");i.uniform4fv(l,[s.color.r,s.color.g,s.color.b,s.color.a]),i.bufferData(i.ARRAY_BUFFER,s.xy,i.STREAM_DRAW),i.drawArrays(s.loop?i.LINE_LOOP:i.LINE_STRIP,0,s.webglNumPoints)}})}_drawSurfaces(e){let i=this.webgl;e.forEach(s=>{if(s.visible){i.useProgram(this._progLine);let a=i.getUniformLocation(this._progLine,"uscale");i.uniformMatrix2fv(a,false,new Float32Array([s.scaleX*this.gScaleX*(this.gLog10X?1/Math.log(10):1),0,0,s.scaleY*this.gScaleY*this.gXYratio*(this.gLog10Y?1/Math.log(10):1)]));let r=i.getUniformLocation(this._progLine,"uoffset");i.uniform2fv(r,new Float32Array([s.offsetX+this.gOffsetX,s.offsetY+this.gOffsetY]));let n=i.getUniformLocation(this._progLine,"is_log");i.uniform2iv(n,new Int32Array([this.gLog10X?1:0,this.gLog10Y?1:0]));let l=i.getUniformLocation(this._progLine,"uColor");i.uniform4fv(l,[s.color.r,s.color.g,s.color.b,s.color.a]),i.bufferData(i.ARRAY_BUFFER,s.xy,i.STREAM_DRAW),i.drawArrays(i.TRIANGLE_STRIP,0,s.webglNumPoints)}})}_drawTriangles(e){let i=this.webgl;i.bufferData(i.ARRAY_BUFFER,e.xy,i.STREAM_DRAW),i.useProgram(this._progLine);let s=i.getUniformLocation(this._progLine,"uscale");i.uniformMatrix2fv(s,false,new Float32Array([e.scaleX*this.gScaleX*(this.gLog10X?1/Math.log(10):1),0,0,e.scaleY*this.gScaleY*this.gXYratio*(this.gLog10Y?1/Math.log(10):1)]));let a=i.getUniformLocation(this._progLine,"uoffset");i.uniform2fv(a,new Float32Array([e.offsetX+this.gOffsetX,e.offsetY+this.gOffsetY]));let r=i.getUniformLocation(this._progLine,"is_log");i.uniform2iv(r,new Int32Array([0,0]));let n=i.getUniformLocation(this._progLine,"uColor");i.uniform4fv(n,[e.color.r,e.color.g,e.color.b,e.color.a]),i.drawArrays(i.TRIANGLE_STRIP,0,e.xy.length/2)}_drawThickLines(){this._thickLines.forEach(e=>{if(e.visible){let i=Math.min(this.gScaleX,this.gScaleY);e.setActualThickness(e.getThickness()/i),e.convertToTriPoints(),this._drawTriangles(e)}})}update(){this.clear(),this.draw()}draw(){this._drawLines(this.linesData),this._drawLines(this.linesAux),this._drawThickLines(),this._drawSurfaces(this.surfaces)}clear(){this.webgl.clear(this.webgl.COLOR_BUFFER_BIT)}_addLine(e){e._vbuffer=this.webgl.createBuffer(),this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER,e._vbuffer),this.webgl.bufferData(this.webgl.ARRAY_BUFFER,e.xy,this.webgl.STREAM_DRAW),e._coord=this.webgl.getAttribLocation(this._progLine,"coordinates"),this.webgl.vertexAttribPointer(e._coord,2,this.webgl.FLOAT,false,0,0),this.webgl.enableVertexAttribArray(e._coord)}addDataLine(e){this._addLine(e),this.linesData.push(e)}addAuxLine(e){this._addLine(e),this.linesAux.push(e)}addThickLine(e){this._addLine(e),this._thickLines.push(e)}addSurface(e){this._addLine(e),this.surfaces.push(e)}initThinLineProgram(){let e=`\n      attribute vec2 coordinates;\n      uniform mat2 uscale;\n      uniform vec2 uoffset;\n      uniform ivec2 is_log;\n\n      void main(void) {\n         float x = (is_log[0]==1) ? log(coordinates.x) : coordinates.x;\n         float y = (is_log[1]==1) ? log(coordinates.y) : coordinates.y;\n         vec2 line = vec2(x, y);\n         gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);\n      }`,i=this.webgl.createShader(this.webgl.VERTEX_SHADER);this.webgl.shaderSource(i,e),this.webgl.compileShader(i);let s=`\n         precision mediump float;\n         uniform highp vec4 uColor;\n         void main(void) {\n            gl_FragColor =  uColor;\n         }`,a=this.webgl.createShader(this.webgl.FRAGMENT_SHADER);this.webgl.shaderSource(a,s),this.webgl.compileShader(a),this._progLine=this.webgl.createProgram(),this.webgl.attachShader(this._progLine,i),this.webgl.attachShader(this._progLine,a),this.webgl.linkProgram(this._progLine)}popDataLine(){this.linesData.pop()}removeAllLines(){this._linesData=[],this._linesAux=[],this._thickLines=[],this._surfaces=[]}removeDataLines(){this._linesData=[]}removeAuxLines(){this._linesAux=[]}viewport(e,i,s,a){this.webgl.viewport(e,i,s,a)}log(e){this.debug&&console.log("[webgl-plot]:"+e)}};var f=class{constructor(){this.plots={}}initPlot(e,i){if(i||(i=new v(e.canvas,e.webglOptions)),!e._id)e._id=`plot${Math.floor(Math.random()*1e15)}`;else if(this.plots[e._id]){let l=this.plots[e._id].initial;if(e.lines){for(let t in e.lines)if(l.lines[t]&&Array.isArray(e.lines[t])){let h=e.lines[t];e.lines[t]=l.lines[t]}}e=Object.assign(l,e)}e.overlay&&(typeof e.overlay!="object"&&(e.overlay=document.createElement("canvas"),e.overlay.style.position="absolute",e.overlay.width=e.canvas.width,e.overlay.height=e.canvas.height,e.canvas.appendChild(e.overlay)),e.overlayCtx||(e.overlayCtx=e.overlay.getContext("2d"))),e.width&&(e.canvas.width=e.width,e.canvas.style&&(e.canvas.style.width=e.width+"px"),typeof e.overlay=="object"&&(e.overlay.width=e.width,e.overlay.style&&(e.overlay.style.width=e.width+"px"))),e.height&&(e.canvas.height=e.height,e.canvas.style&&(e.canvas.style.height=e.height+"px"),typeof e.overlay=="object"&&(e.overlay.height=e.height,e.overlay.style&&(e.overlay.style.height=e.height+"px"))),e.lines?.timestamp&&delete e.lines.timestamp;let s={};for(let l in e.lines)s[l]=Object.assign({},s[l]),"viewing"in e.lines[l]||(e.lines[l].viewing=true),s[l].viewing=e.lines[l].viewing,s[l].sps=e.lines[l].sps,s[l].nSec=e.lines[l].nSec,s[l].nPoints=e.lines[l].nPoints,s[l].ymin=e.lines[l].ymin,s[l].ymax=e.lines[l].ymax,s[l].units=e.lines[l].units;let a={plot:i,settings:e,initial:Object.assign(Object.assign({},e),{lines:s}),anim:()=>{i.update()}};this.plots[e._id]=a;let r=0,n=0;Object.keys(e.lines).forEach(l=>{e.lines[l]?.viewing!==false&&n++}),e.nLines=n;for(let l in e.lines){let t=e.lines[l];if(Array.isArray(t)&&(t={values:t},e.lines[l]=t),"viewing"in t||(t.viewing=true),t.color)Array.isArray(t.color)&&(t.color=new y(...t.color));else{let o=f.HSLToRGB(360*(r/n)%360,100,50,1);a.initial.lines[l].color=[...o,1],t.color=new y(...o,1)}let h;if(t.nSec&&t.sps?h=Math.ceil(t.nSec*t.sps):t.nPoints?h=t.nPoints:t.values?h=t.values.length:h||(h=1e3),!h)return;if(t.points=h,e.lines[l].viewing!==false){if(t.width?t.line=new p(t.color,h,t.width):t.line=new b(t.color,h),t.line.arrangeX(),t.values?.length===t.points){if("ymax"in t)"ymin"in t||(t.ymax<0?t.ymin=t.ymax*2:t.ymin=0);else{let c=Math.max(...t.values),m=Math.min(...t.values);t.ymin=m,t.ymax=c}let o=Math.abs(t.ymin);t.absmax=o>t.ymax?o:t.ymax,t.values.length!==h&&(t.interpolate?t.values.length>h?t.values=f.downsample(t.values,h):t.values.length<h&&(t.values=f.upsample(t.values,h)):t.values.length>t.points?t.values=t.values.slice(t.values.length-t.points):t.values=[...new Array(t.points-t.values.length).fill(0),...t.values])}else Array.isArray(t.values)?t.values=[...new Array(h-t.values.length).fill(0),...t.values]:t.values=new Array(t.points).fill(0);if(isNaN(t.ymax)&&(t.ymax=t.values[0]===0?1:t.values[0]),isNaN(t.ymin)&&(t.ymin=t.ymax<0?t.ymax:0),"autoscale"in t||(t.autoscale=true),t.points>5e3&&(t.autoscale=false),t.position||(t.position=e.nLines-r-1),t.autoscale?("clamp"in t||(t.clamp=true),t.scaled=f.autoscale(t.values,t.position?t.position:r,n,t.centerZero,t.ymin,t.ymax,t.clamp)):t.scaled=t.values,t.scaled.forEach((o,c)=>t.line.setY(c,o)),i.addDataLine(t.line),"xAxis"in t||(t.xAxis=true),t.xAxis){t.xColor?Array.isArray(t.xColor)&&(t.xColor=new y(...t.xColor)):t.xColor=new y(1,1,1,.3);let o=new b(t.xColor,2),c=(r+1)*2/n-1-1/n;t.autoscale?o.constY(c):o.constY(.5),o.arrangeX(),o.xy[2]=1,t.x=o,i.addAuxLine(o)}if(n>1&&t.autoscale&&r!==n-1){e.dividerColor?Array.isArray(e.dividerColor)&&(e.dividerColor=new y(...e.dividerColor)):e.dividerColor=new y(1,1,1,1);let o=new b(e.dividerColor,2);o.constY((r+1)*2/n-1),o.arrangeX(),o.xy[2]=1,t.divider=o,i.addAuxLine(o)}r++}}if(typeof e.overlay=="object"){let l=e.overlay,t=e.overlayCtx;t.clearRect(0,0,e.overlay.width,e.overlay.height),t.font="1em Courier",t.fillStyle="white";for(let h in e.lines){let o=e.lines[h];if(o.useOverlay||!("useOverlay"in o)){let c=e.nLines-o.position-1;t.fillText(h,20,l.height*(c+.1)/e.nLines),t.fillText(`${Math.floor(o.ymax)===o.ymax?o.ymax:o.ymax?.toFixed(5)} ${o.units?o.units:""}`,l.width-70,l.height*(c+.1)/e.nLines),t.fillText(`${Math.floor(o.ymin)===o.ymin?o.ymin:o.ymin?.toFixed(5)} ${o.units?o.units:""}`,l.width-70,l.height*(c+.9)/e.nLines)}}}return requestAnimationFrame(a.anim),this.plots[e._id]}deinitPlot(e){return typeof e=="string"&&(e=this.plots[e]),e.plot.clear(),e.plot.removeAllLines(),true}reinitPlot(e,i){if(typeof e=="string"){let s=e;e=this.plots[e],i._id||(i._id=s)}if(!!e.plot)return e.plot.clear(),e.plot.removeAllLines(),e.settings.overlayCtx&&e.settings.overlayCtx.clearRect(0,0,e.settings.overlay?.width,e.settings.overlay?.height),this.initPlot(i,e.plot)}getChartSettings(e,i){let s=this.plots[e];if(s){let a=Object.assign({},s.initial);for(let r in s.initial.lines)typeof s.initial.lines[r]?.ymax!="number"&&(a.lines[r].ymax=s.settings.lines[r]?.ymax),typeof s.initial.lines[r]?.ymin!="number"&&(a.lines[r].ymin=s.settings.lines[r]?.ymin),i&&(a.lines[r].values=s.settings.lines[r].values);return delete a.canvas,delete a.overlay,delete a.overlayCtx,a}}update(e,i,s=true){if(typeof e=="string"&&(e=this.plots[e]),!e)return false;if(i){let a=false;for(let r in i)if(e.settings.lines[r]&&e.settings.lines[r].line){if(e.settings.lines[r]?.viewing===false)continue;let n=e.settings.lines[r];if(Array.isArray(i[r])?f.circularBuffer(n.values,i[r]):typeof i[r]=="number"?(n.values.push(i[r]),n.values.shift()):i[r]?.values&&f.circularBuffer(n.values,i[r].values),n.values){if(isNaN(n.ymax)&&(n.ymax=n.values[0]===0?1:n.values[0]),isNaN(n.ymin)&&(n.ymin=n.ymax<0?n.ymax:0),typeof e.initial.lines[r]?.ymin!="number"&&(e.settings.overlay||n.autoscale)){let l=Math.max(...n.values,n.ymax),t=Math.min(...n.values,n.ymin);n.ymin=t,n.ymax=l;let h=Math.abs(n.ymin);n.absmax=h>n.ymax?h:n.ymax}else if(typeof n.ymax=="number"&&(typeof n.ymin!="number"&&(n.ymin=0),n.ymin>n.ymax)){let l=n.ymin;n.ymin=n.ymax,n.ymax=l}n.autoscale?n.scaled=f.autoscale(n.values,n.position,e.settings.nLines,n.centerZero,n.ymin,n.ymax,n.clamp):n.scaled=n.values,n.scaled.length!==n.points&&(n.interpolate?n.values.length>n.points?n.scaled=f.downsample(n.scaled,n.points):n.scaled.length<n.points&&(n.scaled=f.upsample(n.scaled,n.points)):n.scaled.length>n.points?n.scaled.splice(0,n.scaled.length-n.points):n.scaled=new Array(n.points).fill(0).splice(n.points-n.scaled.length,0,n.scaled)),n.scaled.forEach((l,t)=>{!n.autoscale&&n.absmax>1?n.line.setY(t,l/n.absmax):n.line.setY(t,l)})}}else e.settings.generateNewLines&&!r.includes("timestamp")&&(Array.isArray(i[r])&&(i[r]={values:i[r]}),!i[r].nSec&&!i[r].nPoints&&(i[r].nPoints=1e3),a=true);if(a)return e.settings.cleanGeneration||Object.keys(e.initial.lines).forEach(r=>{i[r]?i[r]=Object.assign(e.initial.lines[r],i[r]):i[r]=e.initial.lines[r]}),this.reinitPlot(e,{_id:e.settings._id,lines:i}),true}if(typeof e.settings.overlay=="object"){let a=e.settings.overlay,r=e.settings.overlayCtx;r.clearRect(0,0,e.settings.overlay.width,e.settings.overlay.height),r.font="1em Courier",r.fillStyle="white";for(let n in e.settings.lines){let l=e.settings.lines[n];if(l.useOverlay||!("useOverlay"in l)){let t=e.settings.nLines-l.position-1;r.fillText(n,20,a.height*(t+.1)/e.settings.nLines),r.fillText(`${Math.floor(l.ymax)===l.ymax?l.ymax:l.ymax?.toFixed(5)} ${l.units?l.units:""}`,a.width-70,a.height*(t+.1)/e.settings.nLines),r.fillText(`${Math.floor(l.ymin)===l.ymin?l.ymin:l.ymin?.toFixed(5)} ${l.units?l.units:""}`,a.width-70,a.height*(t+.9)/e.settings.nLines)}}}return s&&requestAnimationFrame(e.anim),true}updateLine(e,i,s,a,r,n,l){return e.numPoints!==i.length&&(s?e.numPoints>i.length?i=f.downsample(i,e.numPoints):e.numPoints<i.length&&(i=f.upsample(i,e.numPoints)):i.length>e.numPoints?i=i.slice(i.length-e.numPoints):i=[...new Array(i.length).fill(0),...i]),a&&(i=f.autoscale(i,r,n,l)),i.forEach((t,h)=>e.setY(h,t)),true}static autoscale(e,i=0,s=1,a=false,r,n,l){if(e?.length===0)return e;let t=n||Math.max(...e),h=r||Math.min(...e),o=1/s,c=1;if(a){let m=Math.max(Math.abs(h),Math.abs(t));return m!==0&&(c=o/m),e.map(g=>(l&&(g<h&&(g=h),g>t&&(g=t)),g*c+(o*(i+1)*2-1-o)))}else return t===h?t!==0?c=o/t:h!==0&&(c=o/Math.abs(h)):c=o/(t-h),e.map(m=>(l&&(m<h&&(m=h),m>t&&(m=t)),2*((m-h)*c-1/(2*s))+(o*(i+1)*2-1-o)))}static absmax(e){return Math.max(Math.abs(Math.min(...e)),Math.max(...e))}static downsample(e,i,s=1){if(e.length>i){let a=new Array(i),r=e.length/i,n=e.length-1,l=0,t=0;for(let h=r;h<e.length;h+=r){let o=Math.round(h);o>n&&(o=n);for(let c=l;c<o;c++)a[t]+=e[c];a[t]/=(o-l)*s,t++,l=o}return a}else return e}static upsample(e,i,s=1){var a=function(m,g,P){return(m+(g-m)*P)*s},r=new Array(i),n=(e.length-1)/(i-1);r[0]=e[0];for(var l=1;l<i-1;l++){var t=l*n,h=Math.floor(t),o=Math.ceil(t),c=t-h;r[l]=a(e[h],e[o],c)}return r[i-1]=e[e.length-1],r}static interpolate(e,i,s=1){return e.length>i?f.downsample(e,i,s):e.length<i?f.upsample(e,i,s):e}static HSLToRGB(e,i,s,a=255){i/=100,s/=100;let r=(1-Math.abs(2*s-1))*i,n=r*(1-Math.abs(e/60%2-1)),l=s-r/2,t=0,h=0,o=0;return 0<=e&&e<60?(t=r,h=n,o=0):60<=e&&e<120?(t=n,h=r,o=0):120<=e&&e<180?(t=0,h=r,o=n):180<=e&&e<240?(t=0,h=n,o=r):240<=e&&e<300?(t=n,h=0,o=r):300<=e&&e<360&&(t=r,h=0,o=n),t=(t+l)*a,h=(h+l)*a,o=(o+l)*a,[t,h,o]}static circularBuffer(e,i){if(i.length<e.length){let s=e.slice(i.length),a=e.length;e.splice(0,a,...s,...i)}else if(i.length>e.length){let s=e.length;e.splice(0,s,i.slice(s-i.length))}else e.splice(0,e.length,...i);return e}static formatDataForCharts(e,i){if(Array.isArray(e)){if(Array.isArray(e[0])){let s={};if(e.forEach((a,r)=>{s[r]=a}),e=s,isNaN(e[0][0]))return}else if(i){if(e={[i]:e},isNaN(e[i][0]))return}else if(e={0:e},isNaN(e[0][0]))return}else if(typeof e=="object"){for(let s in e)if(typeof e[s]=="number"?e[s]=[e[s]]:e[s]?.values&&typeof e[s].values=="number"&&(e[s].values=[e[s].values]),isNaN(e[s][0]))return}else if(typeof e=="string"){let s;if(e.includes(`\\r\n`)){let a=e.split(`\\r\n`);e={},a.forEach((r,n)=>{r.includes("	")?s=r.split("	"):r.includes(",")?s=r.split(","):r.includes("|")&&(s=r.split("|")),s&&s.forEach((l,t)=>{if(l.includes(":")){let[h,o]=l.split(":"),c=parseFloat(o);isNaN(c)||(e[h]=[c])}else{let h=parseFloat(l);isNaN(h)||(e[t]=[h])}})})}else e.includes("	")?s=e.split("	"):e.includes(",")?s=e.split(","):e.includes("|")&&(s=e.split("|"));e={},s&&s.forEach((a,r)=>{if(a.includes(":")){let[n,l]=a.split(":"),t=parseFloat(l);isNaN(t)||(e[n]=[t])}else{let n=parseFloat(a);isNaN(n)||(e[r]=[n])}})}else typeof e=="number"&&(i?e={[i]:[e]}:e={0:[e]});return e}static padTime(e,i,s,a){let r=(e[0]-i)/s/a;return[...new Array(a-e.length).map((l,t)=>i+r*(t+1)),...e]}static interpolateForTime(e,i,s){return f.interpolate(e,Math.ceil(s*i))}};globalThis.plotter=new f;var routes={...workerCanvasRoutes};self.onmessage=ev=>{if(ev.data.route){if(Array.isArray(ev.data.args)){routes[ev.data.route](...ev.data.args)}else routes[ev.data.route](ev.data.args)}};var canvas_worker_default=self;})();\n')], { type: "text/javascript" }));
var canvas_worker_default = url;

// ../utils/worker/ProxyListener.ts
var mouseEventHandler = makeSendPropertiesHandler([
  "ctrlKey",
  "metaKey",
  "shiftKey",
  "button",
  "pointerType",
  "clientX",
  "clientY",
  "pageX",
  "pageY"
]);
var wheelEventHandlerImpl = makeSendPropertiesHandler([
  "deltaX",
  "deltaY"
]);
var keydownEventHandler = makeSendPropertiesHandler([
  "ctrlKey",
  "metaKey",
  "shiftKey",
  "keyCode"
]);
function wheelEventHandler(event, sendFn) {
  event.preventDefault();
  wheelEventHandlerImpl(event, sendFn);
}
function preventDefaultHandler(event) {
  event.preventDefault();
}
function copyProperties(src, properties, dst) {
  for (const name of properties) {
    dst[name] = src[name];
  }
}
function makeSendPropertiesHandler(properties) {
  return function sendProperties(event, sendFn) {
    const data = { type: event.type };
    copyProperties(event, properties, data);
    sendFn(data);
  };
}
function touchEventHandler(event, sendFn) {
  const touches = [];
  const data = { type: event.type, touches };
  for (let i = 0; i < event.touches.length; ++i) {
    const touch = event.touches[i];
    touches.push({
      pageX: touch.pageX,
      pageY: touch.pageY
    });
  }
  sendFn(data);
}
var orbitKeys = {
  "37": true,
  "38": true,
  "39": true,
  "40": true
};
function filteredKeydownEventHandler(event, sendFn) {
  const { keyCode } = event;
  if (orbitKeys[keyCode]) {
    event.preventDefault();
    keydownEventHandler(event, sendFn);
  }
}
var eventHandlers = {
  contextmenu: preventDefaultHandler,
  mousedown: mouseEventHandler,
  mousemove: mouseEventHandler,
  mouseup: mouseEventHandler,
  pointerdown: mouseEventHandler,
  pointermove: mouseEventHandler,
  pointerup: mouseEventHandler,
  touchstart: touchEventHandler,
  touchmove: touchEventHandler,
  touchend: touchEventHandler,
  wheel: wheelEventHandler,
  keydown: filteredKeydownEventHandler
};
function initProxyElement(element, worker, id) {
  if (!id)
    id = "proxy" + Math.floor(Math.random() * 1e15);
  const sendEvent = (data) => {
    worker.postMessage({ route: "handleProxyEvent", args: [data, id] });
  };
  let entries = Object.entries(eventHandlers);
  for (const [eventName, handler] of entries) {
    element.addEventListener(eventName, function(event) {
      handler(event, sendEvent);
    });
  }
  const sendSize = () => {
    const rect = element.getBoundingClientRect();
    sendEvent({
      type: "resize",
      left: rect.left,
      top: rect.top,
      width: element.clientWidth,
      height: element.clientHeight
    });
  };
  sendSize();
  globalThis.addEventListener("resize", sendSize);
  return id;
}
var EventDispatcher = class {
  addEventListener(type, listener) {
    if (this._listeners === void 0)
      this._listeners = {};
    const listeners = this._listeners;
    if (listeners[type] === void 0) {
      listeners[type] = [];
    }
    if (listeners[type].indexOf(listener) === -1) {
      listeners[type].push(listener);
    }
  }
  hasEventListener(type, listener) {
    if (this._listeners === void 0)
      return false;
    const listeners = this._listeners;
    return listeners[type] !== void 0 && listeners[type].indexOf(listener) !== -1;
  }
  removeEventListener(type, listener) {
    if (this._listeners === void 0)
      return;
    const listeners = this._listeners;
    const listenerArray = listeners[type];
    if (listenerArray !== void 0) {
      const index = listenerArray.indexOf(listener);
      if (index !== -1) {
        listenerArray.splice(index, 1);
      }
    }
  }
  dispatchEvent(event, target) {
    if (this._listeners === void 0)
      return;
    const listeners = this._listeners;
    const listenerArray = listeners[event.type];
    if (listenerArray !== void 0) {
      if (!target)
        event.target = this;
      else
        event.target = target;
      const array = listenerArray.slice(0);
      for (let i = 0, l = array.length; i < l; i++) {
        array[i].call(this, event);
      }
      event.target = null;
    }
  }
};
function noop() {
}
var ElementProxyReceiver = class extends EventDispatcher {
  constructor() {
    super();
    this._listeners = {};
    this.style = {};
    this.setPointerCapture = () => {
    };
    this.releasePointerCapture = () => {
    };
    this.getBoundingClientRect = () => {
      return {
        left: this.left,
        top: this.top,
        width: this.width,
        height: this.height,
        right: this.left + this.width,
        bottom: this.top + this.height
      };
    };
    this.handleEvent = (data) => {
      if (data.type === "resize") {
        this.left = data.left;
        this.top = data.top;
        this.width = data.width;
        this.height = data.height;
        if (typeof this.proxied === "object") {
          this.proxied.style.width = this.width + "px";
          this.proxied.style.height = this.height + "px";
          this.proxied.clientWidth = this.width;
          this.proxied.clientHeight = this.height;
        }
      }
      data.preventDefault = noop;
      data.stopPropagation = noop;
      this.dispatchEvent(data, this.proxied);
    };
    this.style = {};
  }
  get clientWidth() {
    return this.width;
  }
  get clientHeight() {
    return this.height;
  }
  focus() {
  }
};
var ProxyManager = class {
  constructor() {
    this.targets = {};
    this.makeProxy = (id, addTo = void 0) => {
      if (!id)
        id = `proxyReceiver${Math.floor(Math.random() * 1e15)}`;
      let proxy;
      if (this.targets[id])
        proxy = this.targets[id];
      else {
        proxy = new ElementProxyReceiver();
        this.targets[id] = proxy;
      }
      if (typeof addTo === "object") {
        addTo.proxy = proxy;
        proxy.proxied = addTo;
        if (typeof WorkerGlobalScope !== "undefined")
          addTo.style = proxy.style;
        if (proxy.width) {
          addTo.style.width = proxy.width + "px";
          addTo.clientWidth = proxy.width;
        }
        if (proxy.height) {
          addTo.style.height = proxy.height + "px";
          addTo.clientHeight = proxy.height;
        }
        addTo.setPointerCapture = proxy.setPointerCapture.bind(proxy);
        addTo.releasePointerCapture = proxy.releasePointerCapture.bind(proxy);
        addTo.getBoundingClientRect = proxy.getBoundingClientRect.bind(proxy);
        addTo.addEventListener = proxy.addEventListener.bind(proxy);
        addTo.removeEventListener = proxy.removeEventListener.bind(proxy);
        addTo.handleEvent = proxy.handleEvent.bind(proxy);
        addTo.dispatchEvent = proxy.dispatchEvent.bind(proxy);
        addTo.focus = proxy.focus.bind(proxy);
      }
    };
    this.getProxy = (id) => {
      return this.targets[id];
    };
    this.handleEvent = (data, id) => {
      if (!this.targets[id])
        this.makeProxy(id);
      if (this.targets[id]) {
        this.targets[id].handleEvent(data);
        return true;
      }
      return void 0;
    };
    if (!globalThis.document)
      globalThis.document = {};
  }
};
function makeProxy(id, elm) {
  if (this?._node?.graph) {
    if (!this._node.graph.ProxyManager)
      this._node.graph.ProxyManager = new ProxyManager();
    this._node.graph.ProxyManager.makeProxy(id, elm);
  } else {
    if (!globalThis.ProxyManager)
      globalThis.ProxyManager = new ProxyManager();
    globalThis.ProxyManager.makeProxy(id, elm);
  }
  return id;
}
function handleProxyEvent(data, id) {
  if (this?._node?.graph) {
    if (!this._node.graph.ProxyManager)
      this._node.graph.ProxyManager = new ProxyManager();
    if (this._node.graph.ProxyManager.handleEvent(data, id))
      return data;
  } else {
    if (!globalThis.ProxyManager)
      globalThis.ProxyManager = new ProxyManager();
    if (globalThis.ProxyManager.handleEvent(data, id))
      return data;
  }
}
var proxyElementWorkerRoutes = {
  initProxyElement,
  makeProxy,
  handleProxyEvent
};

// ../utils/worker/WorkerCanvas.ts
function Renderer(options2) {
  if (options2.worker) {
    let worker = options2.worker;
    let route = options2.route;
    if (worker instanceof Blob || typeof worker === "string") {
      worker = new Worker(worker);
    }
    delete options2.worker;
    delete options2.route;
    return transferCanvas(worker, options2, route);
  } else
    return setupCanvas(options2);
}
function transferCanvas(worker, options2, route) {
  if (!options2)
    return void 0;
  if (!options2._id)
    options2._id = `canvas${Math.floor(Math.random() * 1e15)}`;
  let offscreen = options2.canvas.transferControlToOffscreen();
  if (!options2.width)
    options2.width = options2.canvas.clientWidth;
  if (!options2.height)
    options2.height = options2.canvas.clientHeight;
  let message = { route: route ? route : "setupCanvas", args: {
    ...options2,
    canvas: offscreen
  } };
  if (this?._node?.graph)
    this._node.graph.run("initProxyElement", options2.canvas, worker, options2._id);
  else
    initProxyElement(options2.canvas, worker, options2._id);
  if (options2.draw) {
    if (typeof options2.draw === "function")
      message.args.draw = options2.draw.toString();
    else
      message.args.draw = options2.draw;
  }
  if (options2.update) {
    if (typeof options2.update === "function")
      message.args.update = options2.update.toString();
    else
      message.args.update = options2.update;
  }
  if (options2.init) {
    if (typeof options2.init === "function")
      message.args.init = options2.init.toString();
    else
      message.args.init = options2.init;
  }
  if (options2.clear) {
    if (typeof options2.clear === "function")
      message.args.clear = options2.clear.toString();
    else
      message.args.clear = options2.clear;
  }
  let transfer = [offscreen];
  if (options2.transfer) {
    transfer.push(...options2.transfer);
    delete options2.transfer;
  }
  worker.postMessage(message, transfer);
  const canvascontrols = {
    _id: options2._id,
    width: options2.width,
    height: options2.height,
    worker,
    draw: (props) => {
      worker.postMessage({ route: "drawFrame", args: [props, options2._id] });
    },
    update: (props) => {
      worker.postMessage({ route: "updateCanvas", args: [props, options2._id] });
    },
    clear: () => {
      worker.postMessage({ route: "clearCanvas", args: options2._id });
    },
    init: () => {
      worker.postMessage({ route: "initCanvas", args: options2._id });
    },
    stop: () => {
      worker.postMessage({ route: "stopAnim", args: options2._id });
    },
    start: () => {
      worker.postMessage({ route: "startAnim", args: options2._id });
    },
    set: (newDrawProps) => {
      worker.postMessage({ route: "setDraw", args: [newDrawProps, options2._id] });
    },
    terminate: () => {
      worker.terminate();
    }
  };
  return canvascontrols;
}
function setDraw(settings, _id) {
  let canvasopts;
  if (this?._node?.graph) {
    if (_id)
      canvasopts = this._node.graph.CANVASES?.[settings._id];
    else if (settings._id)
      canvasopts = this._node.graph.CANVASES?.[settings._id];
    else
      canvasopts = this._node.graph.CANVASES?.[Object.keys(this._node.graph.CANVASES)[0]];
  } else {
    if (_id)
      canvasopts = globalThis.CANVASES?.[settings._id];
    else if (settings._id)
      canvasopts = globalThis.CANVASES?.[settings._id];
    else
      canvasopts = globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];
  }
  if (canvasopts) {
    if (settings.canvas) {
      canvasopts.canvas = settings.canvas;
      if (this?._node?.graph)
        this._node.graph.run("makeProxy", canvasopts._id, canvasopts.canvas);
      else
        proxyElementWorkerRoutes.makeProxy(canvasopts._id, canvasopts.canvas);
    }
    if (typeof settings.context === "string")
      canvasopts.context = canvasopts.canvas.getContext(settings.context);
    else if (settings.context)
      canvasopts.context = settings.context;
    if (settings.width)
      canvasopts.canvas.width = settings.width;
    if (settings.height)
      canvasopts.canvas.height = settings.height;
    if (typeof settings.draw === "string")
      settings.draw = parseFunctionFromText(settings.draw);
    if (typeof settings.draw === "function") {
      canvasopts.draw = settings.draw;
    }
    if (typeof settings.update === "string")
      settings.update = parseFunctionFromText(settings.update);
    if (typeof settings.update === "function") {
      canvasopts.update = settings.update;
    }
    if (typeof settings.init === "string")
      settings.init = parseFunctionFromText(settings.init);
    if (typeof settings.init === "function") {
      canvasopts.init = settings.init;
    }
    if (typeof settings.clear === "string")
      settings.clear = parseFunctionFromText(settings.clear);
    if (typeof settings.clear === "function") {
      canvasopts.clear = settings.clear;
    }
    return settings._id;
  }
  return void 0;
}
function setupCanvas(options2) {
  if (this?._node?.graph) {
    if (!this._node.graph.CANVASES)
      this._node.graph.CANVASES = {};
  } else if (!globalThis.CANVASES)
    globalThis.CANVASES = {};
  let canvasOptions = options2;
  options2._id ? canvasOptions._id = options2._id : canvasOptions._id = `canvas${Math.floor(Math.random() * 1e15)}`;
  typeof options2.context === "string" ? canvasOptions.context = options2.canvas.getContext(options2.context) : canvasOptions.context = options2.context;
  "animating" in options2 ? canvasOptions.animating = options2.animating : canvasOptions.animating = true;
  if (this?._node?.graph?.CANVASES[canvasOptions._id]) {
    this._node.graph.run("setDraw", canvasOptions);
  } else if (globalThis.CANVASES?.[canvasOptions._id]) {
    setDraw(canvasOptions);
  } else {
    if (this?._node?.graph)
      canvasOptions.graph = this._node.graph;
    if (this?._node?.graph)
      this._node.graph.CANVASES[canvasOptions._id] = canvasOptions;
    else
      globalThis.CANVASES[canvasOptions._id] = canvasOptions;
    if (this?._node?.graph)
      this._node.graph.run("makeProxy", canvasOptions._id, canvasOptions.canvas);
    else
      proxyElementWorkerRoutes.makeProxy(canvasOptions._id, canvasOptions.canvas);
    if (options2.width)
      canvasOptions.canvas.width = options2.width;
    if (options2.height)
      canvasOptions.canvas.height = options2.height;
    if (typeof canvasOptions.draw === "string") {
      canvasOptions.draw = parseFunctionFromText(canvasOptions.draw);
    } else if (typeof canvasOptions.draw === "function") {
      canvasOptions.draw = canvasOptions.draw;
    }
    if (typeof canvasOptions.update === "string") {
      canvasOptions.update = parseFunctionFromText(canvasOptions.update);
    } else if (typeof canvasOptions.update === "function") {
      canvasOptions.update = canvasOptions.update;
    }
    if (typeof canvasOptions.init === "string") {
      canvasOptions.init = parseFunctionFromText(canvasOptions.init);
    } else if (typeof canvasOptions.init === "function") {
      canvasOptions.init = canvasOptions.init;
    }
    if (typeof canvasOptions.clear === "string") {
      canvasOptions.clear = parseFunctionFromText(canvasOptions.clear);
    } else if (typeof canvasOptions.clear === "function") {
      canvasOptions.clear = canvasOptions.clear;
    }
    if (typeof canvasOptions.init === "function")
      canvasOptions.init(canvasOptions, canvasOptions.canvas, canvasOptions.context);
    canvasOptions.stop = () => {
      stopAnim(canvasOptions._id);
    };
    canvasOptions.start = (draw) => {
      startAnim(canvasOptions._id, draw);
    };
    canvasOptions.set = (settings) => {
      setDraw(settings, canvasOptions._id);
    };
    if (typeof canvasOptions.draw === "function" && canvasOptions.animating) {
      let draw = (s, canvas2, context) => {
        if (s.animating) {
          s.draw(s, canvas2, context);
          requestAnimationFrame(() => {
            draw(s, canvas2, context);
          });
        }
      };
      draw(canvasOptions, canvasOptions.canvas, canvasOptions.context);
    }
  }
  if (typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope)
    return canvasOptions._id;
  else {
    const canvascontrols = {
      _id: options2._id,
      width: options2.width,
      height: options2.height,
      draw: (props) => {
        drawFrame(props, options2._id);
      },
      update: (props) => {
        updateCanvas(props, options2._id);
      },
      clear: () => {
        clearCanvas(options2._id);
      },
      init: () => {
        initCanvas(options2._id);
      },
      stop: () => {
        stopAnim(options2._id);
      },
      start: () => {
        startAnim(options2._id);
      },
      set: (newDrawProps) => {
        setDraw(newDrawProps, options2._id);
      },
      terminate: () => {
        stopAnim(options2._id);
      }
    };
    return canvascontrols;
  }
}
function drawFrame(props, _id) {
  let canvasopts;
  if (this?._node?.graph) {
    if (!_id)
      canvasopts = this._node.graph.CANVASES?.[Object.keys(this._node.graph.CANVASES)[0]];
    else
      canvasopts = this._node.graph.CANVASES?.[_id];
  } else {
    if (!_id)
      canvasopts = globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];
    else
      canvasopts = globalThis.CANVASES?.[_id];
  }
  if (canvasopts) {
    if (props)
      Object.assign(canvasopts, props);
    if (canvasopts.draw) {
      canvasopts.draw(canvasopts, canvasopts.canvas, canvasopts.context);
      return _id;
    }
  }
  return void 0;
}
function clearCanvas(_id) {
  let canvasopts;
  if (this?._node?.graph) {
    if (!_id)
      canvasopts = this._node.graph.CANVASES?.[Object.keys(this._node.graph.CANVASES)[0]];
    else
      canvasopts = this._node.graph.CANVASES?.[_id];
  } else {
    if (!_id)
      canvasopts = globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];
    else
      canvasopts = globalThis.CANVASES?.[_id];
  }
  if (canvasopts?.clear) {
    canvasopts.clear(canvasopts, canvasopts.canvas, canvasopts.context);
    return _id;
  }
  return void 0;
}
function initCanvas(_id) {
  let canvasopts;
  if (this?._node?.graph) {
    if (!_id)
      canvasopts = this._node.graph.CANVASES?.[Object.keys(this._node.graph.CANVASES)[0]];
    else
      canvasopts = this._node.graph.CANVASES?.[_id];
  } else {
    if (!_id)
      canvasopts = globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];
    else
      canvasopts = globalThis.CANVASES?.[_id];
  }
  if (canvasopts?.init) {
    canvasopts.init(canvasopts, canvasopts.canvas, canvasopts.context);
    return _id;
  }
  return void 0;
}
function updateCanvas(input, _id) {
  let canvasopts;
  if (this?._node?.graph) {
    if (!_id)
      canvasopts = this._node.graph.CANVASES?.[Object.keys(this._node.graph.CANVASES)[0]];
    else
      canvasopts = this._node.graph.CANVASES?.[_id];
  } else {
    if (!_id)
      canvasopts = globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];
    else
      canvasopts = globalThis.CANVASES?.[_id];
  }
  if (canvasopts?.update) {
    canvasopts.update(canvasopts, canvasopts.canvas, canvasopts.context, input);
    return _id;
  }
  return void 0;
}
function setProps(props, _id) {
  let canvasopts;
  if (this?._node?.graph) {
    if (!_id)
      canvasopts = this._node.graph.CANVASES?.[Object.keys(this._node.graph.CANVASES)[0]];
    else
      canvasopts = this._node.graph.CANVASES?.[_id];
  } else {
    if (!_id)
      canvasopts = globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];
    else
      canvasopts = globalThis.CANVASES?.[_id];
  }
  if (canvasopts) {
    Object.assign(canvasopts, props);
    if (props.width)
      canvasopts.canvas.width = props.width;
    if (props.height)
      canvasopts.canvas.height = props.height;
    return _id;
  }
  return void 0;
}
function startAnim(_id, draw) {
  let canvasopts;
  if (this?._node?.graph) {
    if (!_id)
      canvasopts = this._node.graph.CANVASES?.[Object.keys(this._node.graph.CANVASES)[0]];
    else
      canvasopts = this._node.graph.CANVASES?.[_id];
  } else {
    if (!_id)
      canvasopts = globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];
    else
      canvasopts = globalThis.CANVASES?.[_id];
  }
  canvasopts.animating = true;
  if (canvasopts && draw) {
    if (typeof draw === "string")
      draw = parseFunctionFromText(draw);
    if (typeof draw === "function") {
      canvasopts.draw = draw;
    }
    return _id;
  }
  if (typeof canvasopts?.draw === "function") {
    let draw2 = (s, canvas2, context) => {
      if (s.animating) {
        s.draw(s, canvas2, context);
        requestAnimationFrame(() => {
          draw2(s, canvas2, context);
        });
      }
    };
    if (typeof canvasopts.clear === "function")
      canvasopts.clear(canvasopts, canvasopts.canvas, canvasopts.context);
    if (typeof canvasopts.init === "function")
      canvasopts.init(canvasopts, canvasopts.canvas, canvasopts.context);
    draw2(canvasopts, canvasopts.canvas, canvasopts.context);
    return _id;
  }
  return void 0;
}
function stopAnim(_id) {
  let canvasopts;
  if (this?._node?.graph) {
    if (!_id)
      canvasopts = this._node.graph.CANVASES?.[Object.keys(this._node.graph.CANVASES)[0]];
    else
      canvasopts = this._node.graph.CANVASES?.[_id];
  } else {
    if (!_id)
      canvasopts = globalThis.CANVASES?.[Object.keys(globalThis.CANVASES)[0]];
    else
      canvasopts = globalThis.CANVASES?.[_id];
  }
  if (canvasopts) {
    canvasopts.animating = false;
    if (typeof canvasopts.clear === "function")
      canvasopts.clear(canvasopts, canvasopts.canvas, canvasopts.context);
    return _id;
  }
  return void 0;
}
var workerCanvasRoutes = {
  ...proxyElementWorkerRoutes,
  Renderer,
  transferCanvas,
  setupCanvas,
  setDraw,
  drawFrame,
  clearCanvas,
  initCanvas,
  updateCanvas,
  setProps,
  startAnim,
  stopAnim
};
function parseFunctionFromText(method = "") {
  let getFunctionBody = (methodString) => {
    return methodString.replace(/^\W*(function[^{]+\{([\s\S]*)\}|[^=]+=>[^{]*\{([\s\S]*)\}|[^=]+=>(.+))/i, "$2$3$4");
  };
  let getFunctionHead = (methodString) => {
    let startindex = methodString.indexOf("=>") + 1;
    if (startindex <= 0) {
      startindex = methodString.indexOf("){");
    }
    if (startindex <= 0) {
      startindex = methodString.indexOf(") {");
    }
    return methodString.slice(0, methodString.indexOf("{", startindex) + 1);
  };
  let newFuncHead = getFunctionHead(method);
  let newFuncBody = getFunctionBody(method);
  let newFunc;
  if (newFuncHead.includes("function")) {
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

// ../utils/index.ts
var plotter = new f();
var init = (options2, canvas2, context) => {
  plotter.initPlot(options2);
  let onresize = (o) => {
    canvas2.width = canvas2.clientWidth;
    canvas2.height = canvas2.clientHeight;
    options2.overlay.width = canvas2.clientWidth;
    options2.overlay.height = canvas2.clientHeight;
    plotter.plots[options2._id].plot.webgl.viewport(0, 0, canvas2.width, canvas2.height);
  };
  if (typeof window !== "undefined")
    window.addEventListener("resize", onresize);
  else
    canvas2.addEventListener("resize", onresize);
  setTimeout(() => {
    onresize(canvas2);
  }, 10);
};
var update = (options2, canvas2, context, input) => {
  plotter.update(options2._id, input);
};
var clear = (options2, canvas2, context) => {
  plotter.deinitPlot(options2._id);
};
var plot;
var options;
var canvas;
var overlay;
var failed = false;
function create(context) {
  const options2 = context.options;
  options2.init = init;
  options2.update = update;
  options2.clear = clear;
  if (typeof context.overlay === "string")
    context.overlay = document.querySelector(context.overlay);
  if (typeof context.canvas === "string")
    context.canvas = document.querySelector(context.canvas);
  options2.canvas = context.canvas;
  options2.overlay = context.overlay;
  const originalOptions = { ...options2 };
  try {
    if (options2.worker) {
      try {
        if (typeof canvas_worker_default === "object")
          options2.worker = false;
        if (options2.worker === true) {
          options2.worker = new Worker(canvas_worker_default);
        } else if (typeof options2.worker === "string" || options2.worker instanceof Blob)
          options2.worker = new Worker(options2.worker);
        if (options2.overlay) {
          let offscreen = options2.overlay.transferControlToOffscreen();
          options2.overlay = offscreen;
          options2.transfer = [options2.overlay];
        }
        context.plot = workerCanvasRoutes.Renderer(options2);
      } catch (e) {
        originalOptions.worker = false;
        console.warn("Could not create canvas with worker. Will try to use a standard canvas instead.", originalOptions, e);
      }
    }
    if (!context.plot)
      context.plot = workerCanvasRoutes.Renderer(originalOptions);
  } catch (e) {
    console.error("Could not create a plot using the current options", e);
    context.failed = true;
  }
  return context.plot;
}
function utils_default(args) {
  if (!this.failed) {
    if (!this.plot)
      create(this);
    if (this.plot)
      this.plot.update(args);
  }
}

// ../../canvas.js
var canvas_exports = {};
__export(canvas_exports, {
  esAttributes: () => esAttributes,
  esElement: () => esElement
});
var esElement = "canvas";
var esAttributes = {
  style: {
    width: "100%",
    height: "100%"
  }
};

// index.esc.ts
var esAttributes2 = {
  style: {
    width: "100%",
    height: "100%",
    position: "relative"
  }
};
var esDOM = {
  signalCanvas: {
    esCompose: canvas_exports,
    esAttributes: {
      style: {
        backgroundColor: "black"
      }
    }
  },
  overlayCanvas: {
    esCompose: canvas_exports,
    esAttributes: {
      style: {
        position: "absolute",
        top: "0px",
        left: "0px"
      }
    }
  },
  plot: {
    options: {
      worker: true,
      overlayFont: "10px Verdana",
      overlayColor: "orange",
      generateNewLines: true,
      cleanGeneration: false,
      lines: {},
      lineWidth: 0.01
    },
    esCompose: utils_exports
  }
};
var esListeners = {
  "plot.canvas": {
    "signalCanvas": {
      esTrigger: true
    }
  },
  "plot.overlay": {
    "overlayCanvas": {
      esTrigger: true
    }
  }
};
export {
  esAttributes2 as esAttributes,
  esDOM,
  esListeners
};
//# sourceMappingURL=index.esm.js.map
