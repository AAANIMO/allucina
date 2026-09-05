/* ===== Aureola — piastrella per-oggetto =====
 * Ogni oggetto "master" con tileMode=true genera un rettangolo enorme in
 * coordinate SCENA riempito con un fabric.Pattern ricavato dal master.
 * Essendo un oggetto della scena, pan e zoom lo trasformano automaticamente,
 * quindi la piastrella resta ancorata al mondo e allineata durante pan/zoom.
 */
window.AUR = window.AUR || {};

(function (AUR) {
  'use strict';

  const HUGE = 60000; // semi-estensione della piastrella in unità scena

  function findTileLayer(master) {
    return AUR.canvas.getObjects().find(function (o) {
      return o.isTileLayer && o.tileSourceId === master.uid;
    });
  }

  AUR.enableTile = function (master, gap) {
    if (!master || master.isTileLayer) return;
    master.tileMode = true;
    if (gap != null) master.tileGap = gap;
    AUR.updateTile(master);
  };

  AUR.removeTile = function (master) {
    const layer = findTileLayer(master);
    if (layer) AUR.canvas.remove(layer);
    master.tileMode = false;
    AUR.canvas.requestRenderAll();
  };

  // Costruisce/aggiorna la piastrella per un master.
  AUR.updateTile = function (master) {
    if (!master || master.isTileLayer || !master.tileMode) return;

    // Rimuovi eventuale layer precedente (rebuild pulito).
    const old = findTileLayer(master);
    if (old) AUR.canvas.remove(old);

    const gap = Math.max(0, master.tileGap || 0);

    // Bitmap del master alla sua resa attuale (con scala/rotazione/filtri).
    let bmp;
    try {
      bmp = master.toCanvasElement({ enableRetinaScaling: false });
    } catch (e) {
      return; // oggetto non ancora renderizzabile
    }
    if (!bmp || bmp.width < 1 || bmp.height < 1) return;

    // Cella con spaziatura (gap) intorno.
    const cw = Math.max(1, Math.round(bmp.width + gap));
    const ch = Math.max(1, Math.round(bmp.height + gap));
    const cell = document.createElement('canvas');
    cell.width = cw; cell.height = ch;
    cell.getContext('2d').drawImage(bmp, Math.round(gap / 2), Math.round(gap / 2));

    const pattern = new fabric.Pattern({ source: cell, repeat: 'repeat' });

    // Ancora al mondo: angolo alto-sx del bounding box del master (coord scena).
    const bb = master.getBoundingRect(true, true);
    const anchorX = bb.left - gap / 2;
    const anchorY = bb.top - gap / 2;

    // Rettangolo enorme con bordo sinistro a distanza multipla di cw
    // dall'ancora → una cella cade esattamente sul master (offset 0).
    const K = Math.max(1, Math.ceil(HUGE / cw));
    const Kv = Math.max(1, Math.ceil(HUGE / ch));
    const left = anchorX - K * cw;
    const top = anchorY - Kv * ch;

    const layer = new fabric.Rect({
      left: left, top: top, width: 2 * K * cw, height: 2 * Kv * ch,
      fill: pattern,
      selectable: false, evented: false,
      hasControls: false, hasBorders: false,
      objectCaching: false, hoverCursor: 'default',
      isTileLayer: true, tileSourceId: master.uid,
      excludeFromExport: true
    });

    AUR.canvas.add(layer);
    layer.sendToBack();
    AUR.canvas.requestRenderAll();
  };

  // Tiene tutti i layer di piastrella dietro agli altri oggetti.
  AUR.keepTilesAtBack = function () {
    AUR.canvas.getObjects().forEach(function (o) {
      if (o.isTileLayer) o.sendToBack();
    });
  };

  // Ricostruisce tutte le piastrelle (usato dopo il caricamento del progetto).
  AUR.rebuildAllTiles = function () {
    // I layer non vengono serializzati: qui li ricreiamo dai master.
    AUR.canvas.getObjects().slice().forEach(function (o) {
      if (o.isTileLayer) AUR.canvas.remove(o); // pulizia difensiva
    });
    AUR.canvas.getObjects().forEach(function (o) {
      if (o.tileMode && !o.isTileLayer) AUR.updateTile(o);
    });
    AUR.keepTilesAtBack();
    AUR.canvas.requestRenderAll();
  };

})(window.AUR);
