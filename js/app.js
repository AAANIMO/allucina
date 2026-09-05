/* ===== Allucina — bootstrap, modalità edit/proiezione, UI, tastiera ===== */
window.ALL = window.ALL || {};

(function (ALL) {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function $(id) { return document.getElementById(id); }

  function init() {
    ALL.state = { editMode: false, spaceHeld: false, inverted: false, autoInvert: false };
    ALL.applyControlTheme();

    ALL.canvas = new fabric.Canvas('stage', {
      backgroundColor: 'transparent',   // lo sfondo nero è la pagina
      preserveObjectStacking: true,
      selection: false,
      fireRightClick: true,
      stopContextMenu: true,
      enableRetinaScaling: true
    });

    ALL.initViewport();
    ALL.resetView();
    ALL.onViewportChanged = ALL.emitChange; // pan/zoom → autosave (vista ripristinata al reload)
    ALL.preloadFonts(); // font gotici pronti prima di scrivere

    wireModes();
    wireInvert();
    wireAutoInvert();
    wireToolbar();
    wireInspector();
    wireObjectList();
    wireFiles();
    wireCanvasEvents();
    wireKeyboard();
    wireActivity();

    ALL.loadAutosave(function () { setMode(false); });
  }

  // ---------- Modalità ----------
  function setMode(edit) {
    ALL.state.editMode = edit;
    document.body.classList.toggle('mode-edit', edit);
    document.body.classList.toggle('mode-projection', !edit);
    ALL.canvas.selection = edit;
    ALL.canvas.skipTargetFind = !edit;
    ALL.canvas.getObjects().forEach(function (o) {
      if (o.isTileLayer) return;
      o.selectable = edit;
      o.evented = edit;
    });
    if (!edit) ALL.canvas.discardActiveObject();
    ALL.canvas.requestRenderAll();
    updateInspector();
  }
  ALL.setMode = setMode;

  function wireModes() {
    $('editToggle').addEventListener('click', function () { setMode(true); });
    $('btnDone').addEventListener('click', function () { setMode(false); });
  }

  // ---------- Inversione colori (tutto lo schermo) ----------
  function setInvert(on) {
    ALL.state.inverted = on;
    document.body.classList.toggle('inverted', on);
    $('btnInvert').classList.toggle('active', on);
    ALL.emitChange();
  }
  ALL.setInvert = setInvert;

  function wireInvert() {
    $('btnInvert').addEventListener('click', function () { setInvert(!ALL.state.inverted); });
    $('invertToggleFloat').addEventListener('click', function () { setInvert(!ALL.state.inverted); });
  }

  // ---------- Inverti automaticamente (strobo a intervallo regolabile) ----------
  let autoInvertTimer = null;

  function setAutoInvert(on) {
    clearInterval(autoInvertTimer);
    ALL.state.autoInvert = on;
    $('btnAutoInvert').classList.toggle('active', on);
    $('autoInvertToggleFloat').classList.toggle('active', on);
    if (on) {
      const sec = Math.max(0.1, Math.min(10, parseFloat($('invertRate').value) || 1));
      autoInvertTimer = setInterval(function () { setInvert(!ALL.state.inverted); }, sec * 1000);
    }
  }
  ALL.setAutoInvert = setAutoInvert;

  function wireAutoInvert() {
    $('btnAutoInvert').addEventListener('click', function () { setAutoInvert(!ALL.state.autoInvert); });
    $('autoInvertToggleFloat').addEventListener('click', function () { setAutoInvert(!ALL.state.autoInvert); });
    // Cambiare l'intervallo mentre è attivo lo riavvia con il nuovo valore.
    $('invertRate').addEventListener('change', function () {
      if (ALL.state.autoInvert) setAutoInvert(true);
    });
  }

  // ---------- Attività mouse (chrome nascosto / cursore) ----------
  function wireActivity() {
    let idle;
    function activity() {
      document.body.classList.add('active');
      clearTimeout(idle);
      idle = setTimeout(function () { document.body.classList.remove('active'); }, 2500);
    }
    window.addEventListener('mousemove', activity);
    window.addEventListener('mousedown', activity);
    activity();
  }

  // ---------- Toolbar ----------
  function wireToolbar() {
    document.querySelectorAll('#toolbar [data-add]').forEach(function (b) {
      b.addEventListener('click', function () { ALL.addShape(b.dataset.add); });
    });
    document.querySelectorAll('#toolbar [data-gen]').forEach(function (b) {
      b.addEventListener('click', function () { ALL.addGenerated(b.dataset.gen); updateInspector(); });
    });
    $('btnText').addEventListener('click', function () { ALL.addText(); updateInspector(); });
    $('btnVertex').addEventListener('click', function () { ALL.startVertexTool(); });
    $('btnSvg').addEventListener('click', function () { $('fileSvg').click(); });
    $('btnImg').addEventListener('click', function () { $('fileImg').click(); });
    $('btnFullscreen').addEventListener('click', toggleFullscreen);
  }

  // ---------- Inspector ----------
  function activeObj() { return ALL.canvas.getActiveObject(); }

  function wireInspector() {
    on('pOpacity', 'input', function (v) { ALL.setOpacity(activeObj(), v); });
    on('pLum', 'input', function (v) { ALL.setLuminosity(activeObj(), v); });
    on('pBlur', 'input', function (v) { ALL.setBlur(activeObj(), v); });
    ['pOpacity', 'pLum', 'pBlur'].forEach(function (id) {
      $(id).addEventListener('change', ALL.emitChange);
    });

    $('pColor').addEventListener('input', function () {
      const o = activeObj(); if (!o) return;
      ALL.setColor(o, $('pColor').value);
    });
    $('pColor').addEventListener('change', ALL.emitChange);
    $('pColorReset').addEventListener('click', function () {
      const o = activeObj(); if (!o) return;
      $('pColor').value = '#ffffff';
      ALL.setColor(o, '#ffffff');
      ALL.emitChange();
    });

    $('pFlipX').addEventListener('click', function () { ALL.flip('x'); });
    $('pFlipY').addEventListener('click', function () { ALL.flip('y'); });

    $('pObjInvert').addEventListener('change', function () {
      const o = activeObj(); if (!o) return;
      ALL.setObjectInvert(o, $('pObjInvert').checked);
      ALL.emitChange();
    });

    $('pObjBW').addEventListener('change', function () {
      const o = activeObj(); if (!o) return;
      ALL.setObjectBW(o, $('pObjBW').checked);
      ALL.emitChange();
    });

    $('pTile').addEventListener('change', function () {
      const o = activeObj(); if (!o) return;
      if ($('pTile').checked) ALL.enableTile(o, parseFloat($('pGap').value) || 0);
      else ALL.removeTile(o);
      $('pTileParams').hidden = !$('pTile').checked;
      ALL.emitChange();
    });
    $('pGap').addEventListener('input', function () {
      const o = activeObj(); if (!o) return;
      o.tileGap = parseFloat($('pGap').value) || 0;
      if (o.tileMode) ALL.updateTile(o);
    });
    $('pGap').addEventListener('change', ALL.emitChange);

    ['pTileOffX', 'pTileOffY'].forEach(function (id) {
      $(id).addEventListener('input', function () {
        const o = activeObj(); if (!o) return;
        const frac = parseFloat($(id).value) / 100;
        if (id === 'pTileOffX') o.tileOffX = frac; else o.tileOffY = frac;
        if (o.tileMode) ALL.updateTile(o);
      });
      $(id).addEventListener('change', ALL.emitChange);
    });
    $('pTileFlipH').addEventListener('change', function () {
      const o = activeObj(); if (!o) return;
      o.tileFlipAltH = $('pTileFlipH').checked;
      if (o.tileMode) ALL.updateTile(o);
      ALL.emitChange();
    });
    $('pTileFlipV').addEventListener('change', function () {
      const o = activeObj(); if (!o) return;
      o.tileFlipAltV = $('pTileFlipV').checked;
      if (o.tileMode) ALL.updateTile(o);
      ALL.emitChange();
    });

    $('pDup').addEventListener('click', function () { ALL.duplicateSelected(); });
    $('pDel').addEventListener('click', function () { ALL.deleteSelected(); });

    $('genApply').addEventListener('click', applyGen);

    // Testo gotico
    const sel = $('pFont');
    ALL.GOTHIC_FONTS.forEach(function (f) {
      const opt = document.createElement('option');
      opt.value = f.css; opt.textContent = f.label;
      opt.style.fontFamily = "'" + f.css + "'";
      sel.appendChild(opt);
    });
    $('pText').addEventListener('input', function () {
      ALL.setText(activeObj(), $('pText').value);
    });
    $('pText').addEventListener('change', ALL.emitChange);
    $('pFont').addEventListener('change', function () {
      ALL.setFont(activeObj(), $('pFont').value); ALL.emitChange();
    });
    $('pFontSize').addEventListener('input', function () {
      const o = activeObj(); if (!o) return;
      o.set('fontSize', parseFloat($('pFontSize').value));
      if (o.initDimensions) o.initDimensions();
      o.setCoords();
      ALL.canvas.requestRenderAll();
      if (o.tileMode) ALL.updateTile(o);
    });
    $('pFontSize').addEventListener('change', ALL.emitChange);
  }

  function on(id, evt, fn) {
    $(id).addEventListener(evt, function () { fn(parseFloat($(id).value)); });
  }

  function updateInspector() {
    renderObjectList();
    const o = activeObj();
    const empty = $('inspEmpty'), body = $('inspBody'), gen = $('genParams'), txt = $('textParams');
    if (!o || o.isTileLayer) { empty.hidden = false; body.hidden = true; gen.hidden = true; txt.hidden = true; return; }
    empty.hidden = true; body.hidden = false;
    $('objName').textContent = niceName(o);
    $('pOpacity').value = o.opacity != null ? o.opacity : 1;
    $('pLum').value = o.lum != null ? o.lum : 1;
    $('pBlur').value = o.blurAmt || 0;
    $('pColor').value = o.color || '#ffffff';
    $('pObjInvert').checked = !!o.objInvert;
    $('pBWRow').hidden = (o.type !== 'image');
    $('pObjBW').checked = !!o.objBW;
    $('pTile').checked = !!o.tileMode;
    $('pTileParams').hidden = !o.tileMode;
    $('pGap').value = o.tileGap || 0;
    $('pTileOffX').value = (o.tileOffX || 0) * 100;
    $('pTileOffY').value = (o.tileOffY || 0) * 100;
    $('pTileFlipH').checked = !!o.tileFlipAltH;
    $('pTileFlipV').checked = !!o.tileFlipAltV;

    if (o.genType && ALL.Generators[o.genType]) { gen.hidden = false; buildGenControls(o); }
    else gen.hidden = true;

    if (o.type === 'textbox') {
      txt.hidden = false;
      $('pText').value = o.text || '';
      $('pFont').value = o.fontFamily || ALL.GOTHIC_FONTS[0].css;
      $('pFontSize').value = o.fontSize || 130;
    } else { txt.hidden = true; }
  }

  function buildGenControls(o) {
    const g = ALL.Generators[o.genType];
    $('genTitle').textContent = 'Generatore · ' + g.label;
    const box = $('genControls');
    box.innerHTML = '';
    const params = o.genParams || ALL.genDefaults(o.genType);
    g.params.forEach(function (pr) {
      const val = params[pr.key] != null ? params[pr.key] : pr.default;
      const row = document.createElement('label');
      row.className = 'row';
      row.innerHTML = pr.label +
        ' <input type="range" data-k="' + pr.key + '" min="' + pr.min +
        '" max="' + pr.max + '" step="' + pr.step + '" value="' + val + '">';
      box.appendChild(row);
    });
  }

  function applyGen() {
    const o = activeObj();
    if (!o || !o.genType) return;
    const params = {};
    document.querySelectorAll('#genControls input[data-k]').forEach(function (inp) {
      params[inp.dataset.k] = parseFloat(inp.value);
    });
    ALL.regenerate(o, params);
    updateInspector();
  }

  // ---------- Elenco oggetti (selezione rapida, richiudibile) ----------
  function wireObjectList() {
    $('objListToggle').addEventListener('click', function () {
      const collapsed = $('objList').classList.toggle('collapsed');
      $('objListArrow').textContent = collapsed ? '▸' : '▾';
    });
  }

  function renderObjectList() {
    const listEl = $('objList');
    const active = {};
    ALL.canvas.getActiveObjects().forEach(function (o) { active[o.uid] = true; });

    const objs = ALL.canvas.getObjects().filter(function (o) { return !o.isTileLayer; });
    $('objListCount').textContent = objs.length ? '(' + objs.length + ')' : '';
    listEl.innerHTML = '';

    if (!objs.length) {
      const empty = document.createElement('div');
      empty.className = 'obj-list-empty';
      empty.textContent = 'Nessun oggetto in scena.';
      listEl.appendChild(empty);
      return;
    }

    // Più in alto nello z-order per primo, come un pannello livelli.
    // ▲ = porta sopra (verso il primo piano), ▼ = manda sotto.
    const top = objs.slice().reverse();
    top.forEach(function (o, i) {
      const row = document.createElement('div');
      row.className = 'obj-list-item' + (active[o.uid] ? ' selected' : '');
      row.innerHTML =
        '<span class="oli-name"></span>' +
        '<span class="oli-idx"></span>' +
        '<span class="oli-z">' +
          '<button class="oli-up" title="Porta sopra">▲</button>' +
          '<button class="oli-down" title="Manda sotto">▼</button>' +
        '</span>';
      row.querySelector('.oli-name').textContent = niceName(o);
      row.querySelector('.oli-idx').textContent = String(objs.length - i);

      const up = row.querySelector('.oli-up');
      const down = row.querySelector('.oli-down');
      up.disabled = (i === 0);
      down.disabled = (i === top.length - 1);
      up.addEventListener('click', function (e) { e.stopPropagation(); moveObjectZ(o, 'up'); });
      down.addEventListener('click', function (e) { e.stopPropagation(); moveObjectZ(o, 'down'); });

      row.addEventListener('click', function () {
        ALL.canvas.discardActiveObject();
        ALL.canvas.setActiveObject(o);
        ALL.canvas.requestRenderAll();
        updateInspector();
      });
      listEl.appendChild(row);
    });
  }

  // Sposta un oggetto di un livello nello z-order, aggiornando canvas + lista live.
  function moveObjectZ(o, dir) {
    ALL.canvas.setActiveObject(o);
    ALL.zOrder(dir === 'up' ? 'front' : 'back');
    updateInspector(); // ridisegna la lista con il nuovo ordine e la selezione
  }

  function niceName(o) {
    if (o.genType && ALL.Generators[o.genType]) return ALL.Generators[o.genType].label;
    const map = {
      rect: 'Rettangolo', circle: 'Cerchio', ellipse: 'Ellisse', triangle: 'Triangolo',
      bar: 'Barra', cross: 'Croce', star: 'Stella', polygon: 'Poligono',
      svg: 'SVG', image: 'Immagine', text: 'Testo'
    };
    return map[o.allucinaType] || 'Oggetto';
  }

  // ---------- File ----------
  function wireFiles() {
    $('fileSvg').addEventListener('change', function (e) {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = function () { ALL.addSVGFromString(r.result); };
      r.readAsText(f);
      e.target.value = '';
    });
    $('fileImg').addEventListener('change', function (e) {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = function () { ALL.addImageFromDataURL(r.result); };
      r.readAsDataURL(f);
      e.target.value = '';
    });
    $('btnNew').addEventListener('click', function () { ALL.newProject(); updateInspector(); });
    $('btnExport').addEventListener('click', function () { ALL.exportProject(); });
    $('btnImport').addEventListener('click', function () { $('fileProject').click(); });
    $('fileProject').addEventListener('change', function (e) {
      const f = e.target.files[0]; if (!f) return;
      ALL.importProject(f, function () { setMode(ALL.state.editMode); updateInspector(); });
      e.target.value = '';
    });
  }

  // ---------- Eventi canvas ----------
  function wireCanvasEvents() {
    const c = ALL.canvas;
    c.on('selection:created', updateInspector);
    c.on('selection:updated', updateInspector);
    c.on('selection:cleared', updateInspector);
    c.on('object:modified', function (e) {
      const o = e.target;
      if (o && o.tileMode) ALL.updateTile(o);
      ALL.emitChange();
    });
    c.on('object:added', function () { ALL.keepTilesAtBack(); renderObjectList(); ALL.emitChange(); });
    c.on('object:removed', function () { renderObjectList(); ALL.emitChange(); });
    c.on('mouse:dblclick', function (opt) {
      if (!ALL.state.editMode || ALL.isVertexMode()) return;
      const o = opt.target;
      if (o && (o.type === 'polygon' || o.type === 'polyline')) {
        ALL.togglePointEditing(o);
      }
    });
  }

  // ---------- Tastiera ----------
  function wireKeyboard() {
    window.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (ALL.isVertexMode()) return; // Esc/Enter gestiti dal tool vertici

      const k = e.key;
      if (k === 'e' || k === 'E') { e.preventDefault(); setMode(!ALL.state.editMode); return; }
      if (k === 'f' || k === 'F') { e.preventDefault(); toggleFullscreen(); return; }
      if (k === 'i' || k === 'I') {
        e.preventDefault();
        if (e.shiftKey) setAutoInvert(!ALL.state.autoInvert);
        else setInvert(!ALL.state.inverted);
        return;
      }
      if (k === ' ') { ALL.state.spaceHeld = true; e.preventDefault(); return; }

      if (!ALL.state.editMode) return;

      const o = activeObj();
      if ((k === 'Delete' || k === 'Backspace') && o) { e.preventDefault(); ALL.deleteSelected(); return; }
      if ((e.metaKey || e.ctrlKey) && (k === 'd' || k === 'D')) { e.preventDefault(); ALL.duplicateSelected(); return; }
      if (k === '[') { e.preventDefault(); ALL.zOrder(e.shiftKey ? 'toBack' : 'back'); renderObjectList(); return; }
      if (k === ']') { e.preventDefault(); ALL.zOrder(e.shiftKey ? 'toFront' : 'front'); renderObjectList(); return; }
      if (k === 'Escape') { ALL.canvas.discardActiveObject(); ALL.canvas.requestRenderAll(); updateInspector(); return; }

      // Frecce → sposta l'oggetto selezionato.
      if (o && k.indexOf('Arrow') === 0) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (k === 'ArrowLeft') o.left -= step;
        if (k === 'ArrowRight') o.left += step;
        if (k === 'ArrowUp') o.top -= step;
        if (k === 'ArrowDown') o.top += step;
        o.setCoords();
        if (o.tileMode) ALL.updateTile(o);
        ALL.canvas.requestRenderAll();
        ALL.emitChange();
      }
    });
    window.addEventListener('keyup', function (e) {
      if (e.key === ' ') ALL.state.spaceHeld = false;
    });
  }

  // ---------- Fullscreen ----------
  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  }

})(window.ALL);
