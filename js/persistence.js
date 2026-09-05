/* ===== Allucina — persistenza: autosave + export/import ===== */
window.ALL = window.ALL || {};

(function (ALL) {
  'use strict';

  const KEY = 'allucina:autosave:v1';
  const OLD_KEY = 'aureola:autosave:v1'; // progetto rinominato: migrazione dati
  let saveTimer = null;

  // Normalizza un salvataggio prodotto dalla vecchia versione "aureola":
  // rinomina la proprietà interna aureolaType -> allucinaType.
  function migrateRaw(raw) {
    return (raw || '').replace(/"aureolaType"/g, '"allucinaType"');
  }

  ALL.serialize = function () {
    return {
      version: 1,
      viewport: ALL.canvas.viewportTransform.slice(),
      invert: !!(ALL.state && ALL.state.inverted),
      canvas: ALL.canvas.toJSON(ALL.CUSTOM_PROPS)
    };
  };

  // Punto unico di notifica cambiamento → autosave con debounce.
  ALL.emitChange = function () {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(ALL.serialize())); }
      catch (e) { /* quota / privato: ignora */ }
    }, 400);
  };

  ALL.loadFromData = function (data, done) {
    if (!data || !data.canvas) { done && done(); return; }
    ALL.canvas.loadFromJSON(data.canvas, function () {
      if (data.viewport && data.viewport.length === 6) {
        ALL.canvas.setViewportTransform(data.viewport);
      }
      if (ALL.setInvert) ALL.setInvert(!!data.invert);
      // Riapplica i filtri delle immagini e ricostruisci le piastrelle.
      ALL.canvas.getObjects().forEach(function (o) {
        if (o.type === 'image' && o.filters && o.filters.length) o.applyFilters();
        // I path generati restano vettoriali (nitidi a ogni zoom).
        if (o.genType) o.set({ objectCaching: false });
      });
      ALL.rebuildAllTiles();
      ALL.canvas.requestRenderAll();
      // Le scritte: ricalcola le dimensioni quando i font gotici sono pronti.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          ALL.canvas.getObjects().forEach(function (o) {
            if (o.type === 'textbox' && o.initDimensions) { o.initDimensions(); o.setCoords(); if (o.tileMode) ALL.updateTile(o); }
          });
          ALL.canvas.requestRenderAll();
        });
      }
      done && done();
    });
  };

  ALL.loadAutosave = function (done) {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    // Nessun salvataggio nuovo: prova a migrare quello della vecchia "aureola".
    if (!raw) {
      try {
        const old = localStorage.getItem(OLD_KEY);
        if (old) {
          raw = migrateRaw(old);
          localStorage.setItem(KEY, raw); // migra una volta sola
        }
      } catch (e) { /* ignore */ }
    }
    if (!raw) { done && done(false); return; }
    try { ALL.loadFromData(JSON.parse(raw), function () { done && done(true); }); }
    catch (e) { done && done(false); }
  };

  ALL.newProject = function () {
    ALL.canvas.clear();
    ALL.resetView();
    ALL.canvas.requestRenderAll();
    ALL.emitChange();
  };

  ALL.exportProject = function () {
    const data = ALL.serialize();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    a.href = url;
    a.download = 'allucina-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate())
      + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  };

  ALL.importProject = function (file, done) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(migrateRaw(reader.result));
        ALL.canvas.clear();
        ALL.loadFromData(data, function () { ALL.emitChange(); done && done(true); });
      } catch (e) { done && done(false); }
    };
    reader.readAsText(file);
  };

})(window.ALL);
