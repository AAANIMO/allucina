/* ===== Aureola — oggetti: aggiunta, trasformazione, flip, luminosità, blur ===== */
window.AUR = window.AUR || {};

(function (AUR) {
  'use strict';

  const WHITE = '#ffffff';

  // Proprietà custom da serializzare col progetto.
  AUR.CUSTOM_PROPS = ['aureolaType', 'lum', 'blurAmt', 'tileMode', 'tileGap',
    'genType', 'genParams', 'isTileLayer', 'tileSourceId', 'uid'];

  let _uid = 1;
  AUR.nextUid = function () { return 'o' + (_uid++) + '_' + Date.now().toString(36); };

  // Stile dei controlli di trasformazione (maniglie) su tema scuro.
  AUR.applyControlTheme = function () {
    const p = fabric.Object.prototype;
    p.transparentCorners = false;
    p.cornerColor = '#6ea8ff';
    p.cornerStrokeColor = '#0b1830';
    p.borderColor = '#6ea8ff';
    p.cornerStyle = 'circle';
    p.cornerSize = 11;
    p.padding = 4;
    p.borderScaleFactor = 1.5;
    // lockUniScaling=false è già il default: le maniglie laterali "stringono".
    fabric.Object.prototype.objectCaching = true;
  };

  function place(obj) {
    const ctr = AUR.sceneCenter();
    obj.set({ left: ctr.x, top: ctr.y, originX: 'center', originY: 'center' });
    obj.uid = AUR.nextUid();
    obj.lum = obj.lum != null ? obj.lum : 1;
    obj.blurAmt = obj.blurAmt || 0;
    AUR.canvas.add(obj);
    AUR.canvas.setActiveObject(obj);
    AUR.canvas.requestRenderAll();
    return obj;
  }

  // ---- Forme predefinite ----
  AUR.addShape = function (kind) {
    let obj;
    switch (kind) {
      case 'rect':
        obj = new fabric.Rect({ width: 220, height: 140, fill: WHITE }); break;
      case 'circle':
        obj = new fabric.Circle({ radius: 90, fill: WHITE }); break;
      case 'ellipse':
        obj = new fabric.Ellipse({ rx: 120, ry: 80, fill: WHITE }); break;
      case 'triangle':
        obj = new fabric.Triangle({ width: 200, height: 180, fill: WHITE }); break;
      case 'bar':
        obj = new fabric.Rect({ width: 320, height: 14, fill: WHITE }); break;
      case 'cross':
        obj = new fabric.Polygon(crossPoints(160, 24), { fill: WHITE }); break;
      case 'star':
        obj = new fabric.Polygon(starPoints(5, 110, 46), { fill: WHITE }); break;
      default:
        obj = new fabric.Rect({ width: 160, height: 160, fill: WHITE });
    }
    obj.aureolaType = kind;
    return place(obj);
  };

  function crossPoints(S, w) {
    const h = S / 2;
    return [
      { x: -w, y: -h }, { x: w, y: -h }, { x: w, y: -w }, { x: h, y: -w },
      { x: h, y: w }, { x: w, y: w }, { x: w, y: h }, { x: -w, y: h },
      { x: -w, y: w }, { x: -h, y: w }, { x: -h, y: -w }, { x: -w, y: -w }
    ];
  }

  function starPoints(n, R, r) {
    const pts = [];
    const step = Math.PI / n;
    for (let i = 0; i < 2 * n; i++) {
      const rad = i % 2 === 0 ? R : r;
      const a = i * step - Math.PI / 2;
      pts.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad });
    }
    return pts;
  }

  // ---- Import immagine ----
  AUR.addImageFromDataURL = function (dataURL) {
    fabric.Image.fromURL(dataURL, function (img) {
      // Scala per stare comodamente nel viewport corrente.
      const vis = AUR.getVisibleSceneRect();
      const maxW = vis.width * 0.6, maxH = vis.height * 0.6;
      const s = Math.min(1, maxW / img.width, maxH / img.height);
      img.scale(s);
      img.aureolaType = 'image';
      place(img);
    }, { crossOrigin: 'anonymous' });
  };

  // ---- Import SVG (forzato bianco di default per proiezione) ----
  AUR.addSVGFromString = function (svgText) {
    fabric.loadSVGFromString(svgText, function (objects, options) {
      const obj = fabric.util.groupSVGElements(objects, options);
      AUR.makeWhite(obj);
      obj.aureolaType = 'svg';
      const vis = AUR.getVisibleSceneRect();
      const w = obj.width || 100, hh = obj.height || 100;
      const s = Math.min(1, (vis.width * 0.6) / w, (vis.height * 0.6) / hh);
      obj.scale(s);
      place(obj);
    });
  };

  // ---- Testo con font gotici (blackletter) ----
  AUR.GOTHIC_FONTS = [
    { css: 'UnifrakturMaguntia', label: 'Unifraktur Maguntia' },
    { css: 'UnifrakturCook', label: 'Unifraktur Cook' },
    { css: 'Pirata One', label: 'Pirata One' },
    { css: 'Grenze Gotisch', label: 'Grenze Gotisch' }
  ];

  AUR.ensureFont = function (font, cb) {
    try {
      if (document.fonts && document.fonts.load) {
        Promise.all([
          document.fonts.load('120px "' + font + '"'),
          document.fonts.load('700 120px "' + font + '"')
        ]).then(function () { cb && cb(); }, function () { cb && cb(); });
      } else { cb && cb(); }
    } catch (e) { cb && cb(); }
  };

  AUR.preloadFonts = function () {
    AUR.GOTHIC_FONTS.forEach(function (f) { AUR.ensureFont(f.css); });
  };

  AUR.addText = function (str, font) {
    font = font || AUR.GOTHIC_FONTS[0].css;
    const t = new fabric.Textbox(str || 'Aureola', {
      fontFamily: font, fill: WHITE, fontSize: 130,
      textAlign: 'center', width: 640, lineHeight: 1.05,
      originX: 'center', originY: 'center', editable: true
    });
    t.aureolaType = 'text';
    t.uid = AUR.nextUid();
    t.lum = 1; t.blurAmt = 0;
    const ctr = AUR.sceneCenter();
    t.set({ left: ctr.x, top: ctr.y });
    AUR.canvas.add(t);
    AUR.canvas.setActiveObject(t);
    AUR.ensureFont(font, function () {
      if (t.initDimensions) t.initDimensions();
      t.setCoords();
      AUR.canvas.requestRenderAll();
      if (t.tileMode) AUR.updateTile(t);
    });
    AUR.canvas.requestRenderAll();
    AUR.emitChange();
    return t;
  };

  AUR.setText = function (o, str) {
    if (!o) return;
    o.set('text', str);
    AUR.canvas.requestRenderAll();
    if (o.tileMode) AUR.updateTile(o);
  };

  AUR.setFont = function (o, font) {
    if (!o) return;
    AUR.ensureFont(font, function () {
      o.set('fontFamily', font);
      if (o.initDimensions) o.initDimensions();
      o.setCoords();
      AUR.canvas.requestRenderAll();
      if (o.tileMode) AUR.updateTile(o);
    });
  };

  AUR.makeWhite = function (obj) {
    const paint = function (o) {
      if (o.fill && o.fill !== 'transparent') o.set('fill', WHITE);
      if (o.stroke) o.set('stroke', WHITE);
    };
    if (obj._objects && obj._objects.length) obj._objects.forEach(paint);
    else paint(obj);
    AUR.canvas.requestRenderAll();
  };

  // ---- Flip / specchia ----
  AUR.flip = function (axis) {
    const o = AUR.canvas.getActiveObject();
    if (!o) return;
    if (axis === 'x') o.set('flipX', !o.flipX);
    else o.set('flipY', !o.flipY);
    o.setCoords();
    AUR.canvas.requestRenderAll();
    if (o.tileMode) AUR.updateTile(o);
    AUR.emitChange();
  };

  // ---- Opacità ----
  AUR.setOpacity = function (o, v) {
    if (!o) return;
    o.set('opacity', v);
    AUR.canvas.requestRenderAll();
    if (o.tileMode) AUR.updateTile(o);
  };

  // ---- Luminosità (immagini: filtro Brightness; vettori: livello di grigio) ----
  AUR.setLuminosity = function (o, v) {
    if (!o) return;
    o.lum = v;
    if (o.type === 'image') {
      const filters = o.filters || [];
      let bf = filters.find(function (f) { return f instanceof fabric.Image.filters.Brightness; });
      if (!bf) { bf = new fabric.Image.filters.Brightness({ brightness: 0 }); filters.push(bf); }
      bf.brightness = v - 1; // v=1 → normale, v=0 → nero
      o.filters = filters;
      o.applyFilters();
    } else {
      const g = Math.round(v * 255);
      const col = 'rgb(' + g + ',' + g + ',' + g + ')';
      if (o._objects && o._objects.length) o._objects.forEach(function (s) { if (s.fill && s.fill !== 'transparent') s.set('fill', col); if (s.stroke) s.set('stroke', col); });
      else { if (o.fill) o.set('fill', col); if (o.stroke) o.set('stroke', col); }
    }
    AUR.canvas.requestRenderAll();
    if (o.tileMode) AUR.updateTile(o);
  };

  // ---- Sfocatura bordi (immagini: filtro Blur; vettori: glow morbido) ----
  AUR.setBlur = function (o, v) {
    if (!o) return;
    o.blurAmt = v;
    if (o.type === 'image') {
      const filters = (o.filters || []).filter(function (f) { return !(f instanceof fabric.Image.filters.Blur); });
      if (v > 0) filters.push(new fabric.Image.filters.Blur({ blur: v }));
      o.filters = filters;
      o.applyFilters();
      o.set('shadow', null);
    } else {
      if (v > 0) {
        const px = v * 60;
        o.set('shadow', new fabric.Shadow({ color: '#ffffff', blur: px, offsetX: 0, offsetY: 0 }));
      } else {
        o.set('shadow', null);
      }
    }
    AUR.canvas.requestRenderAll();
    if (o.tileMode) AUR.updateTile(o);
  };

  // ---- Duplica / elimina / z-order ----
  AUR.duplicateSelected = function () {
    const o = AUR.canvas.getActiveObject();
    if (!o) return;
    o.clone(function (clone) {
      clone.set({ left: o.left + 30, top: o.top + 30 });
      clone.uid = AUR.nextUid();
      clone.tileMode = false; // il clone parte senza piastrella
      clone.isTileLayer = false;
      AUR.canvas.add(clone);
      AUR.canvas.setActiveObject(clone);
      AUR.canvas.requestRenderAll();
      AUR.emitChange();
    }, AUR.CUSTOM_PROPS);
  };

  AUR.deleteSelected = function () {
    const objs = AUR.canvas.getActiveObjects();
    objs.forEach(function (o) {
      if (o.tileMode) AUR.removeTile(o);
      AUR.canvas.remove(o);
    });
    AUR.canvas.discardActiveObject();
    AUR.canvas.requestRenderAll();
    AUR.emitChange();
  };

  AUR.zOrder = function (dir) {
    const o = AUR.canvas.getActiveObject();
    if (!o) return;
    if (dir === 'front') o.bringToFront();
    else o.sendBackwards();
    AUR.keepTilesAtBack();
    AUR.canvas.requestRenderAll();
    AUR.emitChange();
  };

})(window.AUR);
