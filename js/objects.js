/* ===== Allucina — oggetti: aggiunta, trasformazione, flip, luminosità, blur ===== */
window.ALL = window.ALL || {};

(function (ALL) {
  'use strict';

  const WHITE = '#ffffff';

  // Proprietà custom da serializzare col progetto.
  ALL.CUSTOM_PROPS = ['allucinaType', 'lum', 'blurAmt', 'objInvert', 'objBW', 'color',
    'tileMode', 'tileGap', 'tileOffX', 'tileOffY', 'tileFlipAltH', 'tileFlipAltV',
    'genType', 'genParams', 'isTileLayer', 'tileSourceId', 'uid'];

  function hexToRgb(hex) {
    hex = (hex || '#ffffff').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    const n = parseInt(hex, 16) || 0;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  let _uid = 1;
  ALL.nextUid = function () { return 'o' + (_uid++) + '_' + Date.now().toString(36); };

  // Stile dei controlli di trasformazione (maniglie) su tema scuro.
  ALL.applyControlTheme = function () {
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
    const ctr = ALL.sceneCenter();
    obj.set({ left: ctr.x, top: ctr.y, originX: 'center', originY: 'center' });
    obj.uid = ALL.nextUid();
    obj.lum = obj.lum != null ? obj.lum : 1;
    obj.blurAmt = obj.blurAmt || 0;
    ALL.canvas.add(obj);
    ALL.canvas.setActiveObject(obj);
    ALL.canvas.requestRenderAll();
    return obj;
  }

  // ---- Forme predefinite ----
  ALL.addShape = function (kind) {
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
      default:
        obj = new fabric.Rect({ width: 160, height: 160, fill: WHITE });
    }
    obj.allucinaType = kind;
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

  // ---- Import immagine ----
  ALL.addImageFromDataURL = function (dataURL) {
    fabric.Image.fromURL(dataURL, function (img) {
      // Scala per stare comodamente nel viewport corrente.
      const vis = ALL.getVisibleSceneRect();
      const maxW = vis.width * 0.6, maxH = vis.height * 0.6;
      const s = Math.min(1, maxW / img.width, maxH / img.height);
      img.scale(s);
      img.allucinaType = 'image';
      place(img);
    }, { crossOrigin: 'anonymous' });
  };

  // ---- Import SVG (forzato bianco di default per proiezione) ----
  ALL.addSVGFromString = function (svgText) {
    fabric.loadSVGFromString(svgText, function (objects, options) {
      const obj = fabric.util.groupSVGElements(objects, options);
      ALL.makeWhite(obj);
      obj.allucinaType = 'svg';
      const vis = ALL.getVisibleSceneRect();
      const w = obj.width || 100, hh = obj.height || 100;
      const s = Math.min(1, (vis.width * 0.6) / w, (vis.height * 0.6) / hh);
      obj.scale(s);
      place(obj);
    });
  };

  // ---- Testo con font gotici (blackletter) ----
  ALL.GOTHIC_FONTS = [
    { css: 'UnifrakturMaguntia', label: 'Unifraktur Maguntia' },
    { css: 'UnifrakturCook', label: 'Unifraktur Cook' },
    { css: 'Pirata One', label: 'Pirata One' },
    { css: 'Grenze Gotisch', label: 'Grenze Gotisch' }
  ];

  ALL.ensureFont = function (font, cb) {
    try {
      if (document.fonts && document.fonts.load) {
        Promise.all([
          document.fonts.load('120px "' + font + '"'),
          document.fonts.load('700 120px "' + font + '"')
        ]).then(function () { cb && cb(); }, function () { cb && cb(); });
      } else { cb && cb(); }
    } catch (e) { cb && cb(); }
  };

  ALL.preloadFonts = function () {
    ALL.GOTHIC_FONTS.forEach(function (f) { ALL.ensureFont(f.css); });
  };

  ALL.addText = function (str, font) {
    font = font || ALL.GOTHIC_FONTS[0].css;
    const t = new fabric.Textbox(str || 'Allucina', {
      fontFamily: font, fill: WHITE, fontSize: 130,
      textAlign: 'center', width: 640, lineHeight: 1.05,
      originX: 'center', originY: 'center', editable: true
    });
    t.allucinaType = 'text';
    t.uid = ALL.nextUid();
    t.lum = 1; t.blurAmt = 0;
    const ctr = ALL.sceneCenter();
    t.set({ left: ctr.x, top: ctr.y });
    ALL.canvas.add(t);
    ALL.canvas.setActiveObject(t);
    ALL.ensureFont(font, function () {
      if (t.initDimensions) t.initDimensions();
      t.setCoords();
      ALL.canvas.requestRenderAll();
      if (t.tileMode) ALL.updateTile(t);
    });
    ALL.canvas.requestRenderAll();
    ALL.emitChange();
    return t;
  };

  ALL.setText = function (o, str) {
    if (!o) return;
    o.set('text', str);
    ALL.canvas.requestRenderAll();
    if (o.tileMode) ALL.updateTile(o);
  };

  ALL.setFont = function (o, font) {
    if (!o) return;
    ALL.ensureFont(font, function () {
      o.set('fontFamily', font);
      if (o.initDimensions) o.initDimensions();
      o.setCoords();
      ALL.canvas.requestRenderAll();
      if (o.tileMode) ALL.updateTile(o);
    });
  };

  ALL.makeWhite = function (obj) {
    const paint = function (o) {
      if (o.fill && o.fill !== 'transparent') o.set('fill', WHITE);
      if (o.stroke) o.set('stroke', WHITE);
    };
    if (obj._objects && obj._objects.length) obj._objects.forEach(paint);
    else paint(obj);
    ALL.canvas.requestRenderAll();
  };

  // ---- Inversione colori del singolo oggetto (es. cerchio nero su bianco) ----
  ALL.setObjectInvert = function (o, on) {
    if (!o) return;
    o.objInvert = !!on;
    if (o.type === 'image') {
      const filters = (o.filters || []).filter(function (f) {
        return !(f instanceof fabric.Image.filters.Invert);
      });
      if (on) filters.push(new fabric.Image.filters.Invert());
      o.filters = filters;
      o.applyFilters();
      ALL.canvas.requestRenderAll();
      if (o.tileMode) ALL.updateTile(o);
    } else {
      // Ri-applica il livello di grigio tenendo conto dell'inversione.
      ALL.setLuminosity(o, o.lum != null ? o.lum : 1);
    }
  };

  // ---- Colore dell'oggetto ----
  // Vettori: colore di riempimento/tratto (scurito dalla luminosità).
  // Immagini: tinta via filtro BlendColor (multiply); bianco = nessuna tinta.
  ALL.setColor = function (o, hex) {
    if (!o) return;
    o.color = hex || '#ffffff';
    if (o.type === 'image') {
      const filters = (o.filters || []).filter(function (f) {
        return !(f instanceof fabric.Image.filters.BlendColor);
      });
      if (o.color.toLowerCase() !== '#ffffff') {
        filters.push(new fabric.Image.filters.BlendColor({ color: o.color, mode: 'multiply' }));
      }
      o.filters = filters;
      o.applyFilters();
      ALL.canvas.requestRenderAll();
      if (o.tileMode) ALL.updateTile(o);
    } else {
      ALL.setLuminosity(o, o.lum != null ? o.lum : 1);
    }
  };

  // ---- Bianco e nero (immagini): filtro Grayscale ----
  ALL.setObjectBW = function (o, on) {
    if (!o || o.type !== 'image') return;
    o.objBW = !!on;
    const filters = (o.filters || []).filter(function (f) {
      return !(f instanceof fabric.Image.filters.Grayscale);
    });
    if (on) filters.push(new fabric.Image.filters.Grayscale());
    o.filters = filters;
    o.applyFilters();
    ALL.canvas.requestRenderAll();
    if (o.tileMode) ALL.updateTile(o);
  };

  // ---- Flip / specchia ----
  ALL.flip = function (axis) {
    const o = ALL.canvas.getActiveObject();
    if (!o) return;
    if (axis === 'x') o.set('flipX', !o.flipX);
    else o.set('flipY', !o.flipY);
    o.setCoords();
    ALL.canvas.requestRenderAll();
    if (o.tileMode) ALL.updateTile(o);
    ALL.emitChange();
  };

  // ---- Opacità ----
  ALL.setOpacity = function (o, v) {
    if (!o) return;
    o.set('opacity', v);
    ALL.canvas.requestRenderAll();
    if (o.tileMode) ALL.updateTile(o);
  };

  // ---- Luminosità (immagini: filtro Brightness; vettori: livello di grigio) ----
  ALL.setLuminosity = function (o, v) {
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
      // Colore base × luminosità, poi eventuale inversione. Bianco = grigio.
      const base = hexToRgb(o.color || '#ffffff');
      let rr = Math.round(base.r * v), gg = Math.round(base.g * v), bb = Math.round(base.b * v);
      if (o.objInvert) { rr = 255 - rr; gg = 255 - gg; bb = 255 - bb; }
      const col = 'rgb(' + rr + ',' + gg + ',' + bb + ')';
      if (o._objects && o._objects.length) o._objects.forEach(function (s) { if (s.fill && s.fill !== 'transparent') s.set('fill', col); if (s.stroke) s.set('stroke', col); });
      else { if (o.fill) o.set('fill', col); if (o.stroke) o.set('stroke', col); }
    }
    ALL.canvas.requestRenderAll();
    if (o.tileMode) ALL.updateTile(o);
  };

  // ---- Sfocatura bordi (immagini: filtro Blur; vettori: glow morbido) ----
  ALL.setBlur = function (o, v) {
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
    ALL.canvas.requestRenderAll();
    if (o.tileMode) ALL.updateTile(o);
  };

  // ---- Duplica / elimina / z-order ----
  ALL.duplicateSelected = function () {
    const o = ALL.canvas.getActiveObject();
    if (!o) return;
    o.clone(function (clone) {
      clone.set({ left: o.left + 30, top: o.top + 30 });
      clone.uid = ALL.nextUid();
      clone.tileMode = false; // il clone parte senza piastrella
      clone.isTileLayer = false;
      ALL.canvas.add(clone);
      ALL.canvas.setActiveObject(clone);
      ALL.canvas.requestRenderAll();
      ALL.emitChange();
    }, ALL.CUSTOM_PROPS);
  };

  ALL.deleteSelected = function () {
    const objs = ALL.canvas.getActiveObjects();
    objs.forEach(function (o) {
      if (o.tileMode) ALL.removeTile(o);
      ALL.canvas.remove(o);
    });
    ALL.canvas.discardActiveObject();
    ALL.canvas.requestRenderAll();
    ALL.emitChange();
  };

  // dir: 'toFront' | 'toBack' (in cima/fondo a tutti) — 'front' | 'back' (un livello).
  // Lavora sulla lista degli oggetti REALI (piastrelle escluse) e poi ricostruisce
  // lo stack con restack: così lo z-order funziona anche per gli oggetti
  // piastrellati (il layer di copie segue il master).
  ALL.zOrder = function (dir) {
    const o = ALL.canvas.getActiveObject();
    if (!o || o.isTileLayer) return;
    const reals = ALL.canvas.getObjects().filter(function (x) { return !x.isTileLayer; });
    const i = reals.indexOf(o);
    if (i < 0) return;
    let j;
    if (dir === 'front') j = Math.min(reals.length - 1, i + 1);
    else if (dir === 'back') j = Math.max(0, i - 1);
    else if (dir === 'toFront') j = reals.length - 1;
    else j = 0;
    if (j === i) return;
    reals.splice(i, 1);
    reals.splice(j, 0, o);
    ALL.restack(reals);
    ALL.canvas.requestRenderAll();
    ALL.emitChange();
  };

})(window.ALL);
