/* ===== Aureola — persistenza: autosave + export/import ===== */
window.AUR = window.AUR || {};

(function (AUR) {
  'use strict';

  const KEY = 'aureola:autosave:v1';
  let saveTimer = null;

  AUR.serialize = function () {
    return {
      version: 1,
      viewport: AUR.canvas.viewportTransform.slice(),
      invert: !!(AUR.state && AUR.state.inverted),
      canvas: AUR.canvas.toJSON(AUR.CUSTOM_PROPS)
    };
  };

  // Punto unico di notifica cambiamento → autosave con debounce.
  AUR.emitChange = function () {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(AUR.serialize())); }
      catch (e) { /* quota / privato: ignora */ }
    }, 400);
  };

  AUR.loadFromData = function (data, done) {
    if (!data || !data.canvas) { done && done(); return; }
    AUR.canvas.loadFromJSON(data.canvas, function () {
      if (data.viewport && data.viewport.length === 6) {
        AUR.canvas.setViewportTransform(data.viewport);
      }
      if (AUR.setInvert) AUR.setInvert(!!data.invert);
      // Riapplica i filtri delle immagini e ricostruisci le piastrelle.
      AUR.canvas.getObjects().forEach(function (o) {
        if (o.type === 'image' && o.filters && o.filters.length) o.applyFilters();
        // I path generati restano vettoriali (nitidi a ogni zoom).
        if (o.genType) o.set({ objectCaching: false });
      });
      AUR.rebuildAllTiles();
      AUR.canvas.requestRenderAll();
      // Le scritte: ricalcola le dimensioni quando i font gotici sono pronti.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          AUR.canvas.getObjects().forEach(function (o) {
            if (o.type === 'textbox' && o.initDimensions) { o.initDimensions(); o.setCoords(); if (o.tileMode) AUR.updateTile(o); }
          });
          AUR.canvas.requestRenderAll();
        });
      }
      done && done();
    });
  };

  AUR.loadAutosave = function (done) {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    if (!raw) { done && done(false); return; }
    try { AUR.loadFromData(JSON.parse(raw), function () { done && done(true); }); }
    catch (e) { done && done(false); }
  };

  AUR.newProject = function () {
    AUR.canvas.clear();
    AUR.resetView();
    AUR.canvas.requestRenderAll();
    AUR.emitChange();
  };

  AUR.exportProject = function () {
    const data = AUR.serialize();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    a.href = url;
    a.download = 'aureola-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate())
      + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  };

  AUR.importProject = function (file, done) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(reader.result);
        AUR.canvas.clear();
        AUR.loadFromData(data, function () { AUR.emitChange(); done && done(true); });
      } catch (e) { done && done(false); }
    };
    reader.readAsText(file);
  };

})(window.AUR);
