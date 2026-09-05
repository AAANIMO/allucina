/* ===== Allucina — piastrella per-oggetto =====
 * Ogni oggetto "master" con tileMode=true genera un rettangolo enorme in
 * coordinate SCENA riempito con un fabric.Pattern ricavato dal master.
 * Essendo un oggetto della scena, pan e zoom lo trasformano automaticamente,
 * quindi la piastrella resta ancorata al mondo e allineata durante pan/zoom.
 *
 * Il layer di piastrella vive SUBITO SOTTO il suo master nello stack: così lo
 * z-order del master (frecce nell'elenco oggetti) sposta anche le sue copie.
 */
window.ALL = window.ALL || {};

(function (ALL) {
  'use strict';

  const HUGE = 60000;        // semi-estensione della piastrella in unità scena
  const MAX_DIM = 4096;      // lato massimo del canvas sorgente del pattern
  const MAX_AREA = 4096 * 4096; // area massima (~16.7M px): sicura anche su Safari

  function findTileLayer(master) {
    return ALL.canvas.getObjects().find(function (o) {
      return o.isTileLayer && o.tileSourceId === master.uid;
    });
  }

  ALL.enableTile = function (master, gap) {
    if (!master || master.isTileLayer) return;
    master.tileMode = true;
    if (gap != null) master.tileGap = gap;
    ALL.updateTile(master);
  };

  ALL.removeTile = function (master) {
    const layer = findTileLayer(master);
    if (layer) ALL.canvas.remove(layer);
    master.tileMode = false;
    ALL.canvas.requestRenderAll();
  };

  // Fattore di riduzione perché la cella sorgente resti entro i limiti del
  // canvas del browser. Il pattern viene poi riscalato (patternTransform) così
  // le tessere mantengono la loro dimensione in scena: cala solo la risoluzione.
  function fitFactor(w, h) {
    let f = Math.min(1, MAX_DIM / w, MAX_DIM / h);
    f = Math.min(f, Math.sqrt(MAX_AREA / (w * h)));
    return Math.max(0.02, Math.min(1, f));
  }

  // Costruisce la cella ripetibile a risoluzione limitata.
  // Ritorna { canvas, unitW, unitH, factor }: unitW/unitH sono la dimensione
  // della tessera in unità scena (il canvas è più piccolo del fattore `factor`).
  // Senza offset/flip la cella è la bitmap del master con la spaziatura.
  // Con offset riga/colonna e/o flip alternato diventa un blocco 2×2, così che
  // il repeat nativo del pattern riproduca l'alternanza a scacchiera.
  function buildRepeatCell(bmp, cw, ch, half, offXFrac, offYFrac, altFlipH, altFlipV) {
    const simple = (offXFrac === 0 && offYFrac === 0 && !altFlipH && !altFlipV);
    const unitW = simple ? cw : cw * 2;
    const unitH = simple ? ch : ch * 2;
    const factor = fitFactor(unitW, unitH);

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(unitW * factor));
    canvas.height = Math.max(1, Math.round(unitH * factor));
    const ctx = canvas.getContext('2d');
    ctx.scale(factor, factor); // disegniamo in unità scena; il canvas è ridotto
    const bw = bmp.width, bh = bmp.height;

    function drawAt(x, y, flipH, flipV, wrap) {
      wrap.forEach(function (wp) {
        ctx.save();
        ctx.translate(x + wp[0] + bw / 2, y + wp[1] + bh / 2);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(bmp, -bw / 2, -bh / 2);
        ctx.restore();
      });
    }

    if (simple) {
      drawAt(half, half, false, false, [[0, 0]]);
    } else {
      // Copie di wraparound: con l'offset una tessera può sconfinare oltre il
      // bordo della cella e deve ricomparire dal lato opposto (seamless).
      const wrap = [];
      [-unitW, 0, unitW].forEach(function (wx) {
        [-unitH, 0, unitH].forEach(function (wy) { wrap.push([wx, wy]); });
      });
      const offX = offXFrac * cw, offY = offYFrac * ch;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const odd = (r + c) % 2 === 1;
          const dx = (r % 2 === 1) ? offX : 0; // righe dispari: sfalsate in X
          const dy = (c % 2 === 1) ? offY : 0; // colonne dispari: sfalsate in Y
          drawAt(c * cw + half + dx, r * ch + half + dy, altFlipH && odd, altFlipV && odd, wrap);
        }
      }
    }
    return { canvas: canvas, unitW: unitW, unitH: unitH, factor: factor };
  }

  // Sposta il layer di piastrella subito sotto il suo master nello stack.
  function placeLayerBelowMaster(master, layer) {
    const c = ALL.canvas;
    const mi = c.getObjects().indexOf(master);
    const li = c.getObjects().indexOf(layer);
    if (mi < 0 || li < 0) return;
    const target = li > mi ? mi : Math.max(0, mi - 1);
    if (li !== target) c.moveTo(layer, target);
  }

  // Costruisce/aggiorna la piastrella per un master.
  ALL.updateTile = function (master) {
    if (!master || master.isTileLayer || !master.tileMode) return;

    const gap = Math.max(0, master.tileGap || 0);
    const offXFrac = Math.max(0, Math.min(1, master.tileOffX || 0));
    const offYFrac = Math.max(0, Math.min(1, master.tileOffY || 0));
    const altFlipH = !!master.tileFlipAltH;
    const altFlipV = !!master.tileFlipAltV;

    // Bitmap del master alla sua resa attuale (con scala/rotazione/filtri).
    let bmp;
    try {
      bmp = master.toCanvasElement({ enableRetinaScaling: false });
    } catch (e) {
      return; // oggetto non renderizzabile: tieni la piastrella esistente
    }
    if (!bmp || bmp.width < 1 || bmp.height < 1) return;

    const cw = Math.max(1, Math.round(bmp.width + gap));
    const ch = Math.max(1, Math.round(bmp.height + gap));
    const built = buildRepeatCell(bmp, cw, ch, Math.round(gap / 2), offXFrac, offYFrac, altFlipH, altFlipV);
    if (!built || built.canvas.width < 1 || built.canvas.height < 1) return;

    const inv = 1 / built.factor;
    const pattern = new fabric.Pattern({
      source: built.canvas,
      repeat: 'repeat',
      patternTransform: [inv, 0, 0, inv, 0, 0] // riscala la sorgente a piena scena
    });

    // Ancora al mondo: angolo alto-sx del bounding box del master (coord scena).
    const bb = master.getBoundingRect(true, true);
    const anchorX = bb.left - gap / 2;
    const anchorY = bb.top - gap / 2;

    // Rettangolo enorme con bordo a distanza multipla della tessera dall'ancora
    // → una tessera cade esattamente sul master (offset 0).
    const cellW = built.unitW, cellH = built.unitH;
    const K = Math.max(1, Math.ceil(HUGE / cellW));
    const Kv = Math.max(1, Math.ceil(HUGE / cellH));

    const layer = new fabric.Rect({
      left: anchorX - K * cellW, top: anchorY - Kv * cellH,
      width: 2 * K * cellW, height: 2 * Kv * cellH,
      fill: pattern,
      selectable: false, evented: false,
      hasControls: false, hasBorders: false,
      objectCaching: false, hoverCursor: 'default',
      isTileLayer: true, tileSourceId: master.uid,
      excludeFromExport: true
    });

    // Costruisci-poi-rimuovi: solo ora che la nuova piastrella è pronta
    // togliamo la vecchia, così un rebuild fallito non fa sparire le copie.
    const old = findTileLayer(master);
    if (old) ALL.canvas.remove(old);
    ALL.canvas.add(layer);
    placeLayerBelowMaster(master, layer);
    ALL.canvas.requestRenderAll();
  };

  // Rimette ogni layer di piastrella subito sotto il proprio master, e rimuove
  // i layer orfani. (Nome storico mantenuto: chiamato da object:added ecc.)
  ALL.syncTileLayers = function () {
    const c = ALL.canvas;
    c.getObjects().filter(function (o) { return o.isTileLayer; }).forEach(function (layer) {
      const master = c.getObjects().find(function (o) {
        return !o.isTileLayer && o.uid === layer.tileSourceId;
      });
      if (!master) { c.remove(layer); return; }
      placeLayerBelowMaster(master, layer);
    });
  };
  ALL.keepTilesAtBack = ALL.syncTileLayers;

  // Riordina l'intero stack da una lista di oggetti reali (dal basso in alto),
  // tenendo ogni layer di piastrella incollato sotto il proprio master.
  ALL.restack = function (realBottomToTop) {
    const c = ALL.canvas;
    // Rimuovi layer orfani.
    c.getObjects().filter(function (o) {
      return o.isTileLayer && !realBottomToTop.some(function (m) { return m.uid === o.tileSourceId; });
    }).forEach(function (o) { c.remove(o); });

    let idx = 0;
    realBottomToTop.forEach(function (master) {
      const layer = c.getObjects().find(function (o) {
        return o.isTileLayer && o.tileSourceId === master.uid;
      });
      if (layer) c.moveTo(layer, idx++);
      c.moveTo(master, idx++);
    });
  };

  // Ricostruisce tutte le piastrelle (usato dopo il caricamento del progetto).
  ALL.rebuildAllTiles = function () {
    ALL.canvas.getObjects().slice().forEach(function (o) {
      if (o.isTileLayer) ALL.canvas.remove(o); // pulizia difensiva
    });
    ALL.canvas.getObjects().forEach(function (o) {
      if (o.tileMode && !o.isTileLayer) ALL.updateTile(o);
    });
    ALL.syncTileLayers();
    ALL.canvas.requestRenderAll();
  };

})(window.ALL);
