/* ===== Aureola — bootstrap, modalità edit/proiezione, UI, tastiera ===== */
window.AUR = window.AUR || {};

(function (AUR) {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function $(id) { return document.getElementById(id); }

  function init() {
    AUR.state = { editMode: false, spaceHeld: false };
    AUR.applyControlTheme();

    AUR.canvas = new fabric.Canvas('stage', {
      backgroundColor: 'transparent',   // lo sfondo nero è la pagina
      preserveObjectStacking: true,
      selection: false,
      fireRightClick: true,
      stopContextMenu: true,
      enableRetinaScaling: true
    });

    AUR.initViewport();
    AUR.resetView();
    AUR.onViewportChanged = AUR.emitChange; // pan/zoom → autosave (vista ripristinata al reload)
    AUR.preloadFonts(); // font gotici pronti prima di scrivere

    wireModes();
    wireToolbar();
    wireInspector();
    wireFiles();
    wireCanvasEvents();
    wireKeyboard();
    wireActivity();

    AUR.loadAutosave(function () { setMode(false); });
  }

  // ---------- Modalità ----------
  function setMode(edit) {
    AUR.state.editMode = edit;
    document.body.classList.toggle('mode-edit', edit);
    document.body.classList.toggle('mode-projection', !edit);
    AUR.canvas.selection = edit;
    AUR.canvas.skipTargetFind = !edit;
    AUR.canvas.getObjects().forEach(function (o) {
      if (o.isTileLayer) return;
      o.selectable = edit;
      o.evented = edit;
    });
    if (!edit) AUR.canvas.discardActiveObject();
    AUR.canvas.requestRenderAll();
    updateInspector();
  }
  AUR.setMode = setMode;

  function wireModes() {
    $('editToggle').addEventListener('click', function () { setMode(true); });
    $('btnDone').addEventListener('click', function () { setMode(false); });
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
      b.addEventListener('click', function () { AUR.addShape(b.dataset.add); });
    });
    document.querySelectorAll('#toolbar [data-gen]').forEach(function (b) {
      b.addEventListener('click', function () { AUR.addGenerated(b.dataset.gen); updateInspector(); });
    });
    $('btnText').addEventListener('click', function () { AUR.addText(); updateInspector(); });
    $('btnVertex').addEventListener('click', function () { AUR.startVertexTool(); });
    $('btnSvg').addEventListener('click', function () { $('fileSvg').click(); });
    $('btnImg').addEventListener('click', function () { $('fileImg').click(); });
    $('btnFullscreen').addEventListener('click', toggleFullscreen);
  }

  // ---------- Inspector ----------
  function activeObj() { return AUR.canvas.getActiveObject(); }

  function wireInspector() {
    on('pOpacity', 'input', function (v) { AUR.setOpacity(activeObj(), v); });
    on('pLum', 'input', function (v) { AUR.setLuminosity(activeObj(), v); });
    on('pBlur', 'input', function (v) { AUR.setBlur(activeObj(), v); });
    ['pOpacity', 'pLum', 'pBlur'].forEach(function (id) {
      $(id).addEventListener('change', AUR.emitChange);
    });

    $('pFlipX').addEventListener('click', function () { AUR.flip('x'); });
    $('pFlipY').addEventListener('click', function () { AUR.flip('y'); });

    $('pTile').addEventListener('change', function () {
      const o = activeObj(); if (!o) return;
      if ($('pTile').checked) AUR.enableTile(o, parseFloat($('pGap').value) || 0);
      else AUR.removeTile(o);
      $('pGapRow').hidden = !$('pTile').checked;
      AUR.emitChange();
    });
    $('pGap').addEventListener('input', function () {
      const o = activeObj(); if (!o) return;
      o.tileGap = parseFloat($('pGap').value) || 0;
      if (o.tileMode) AUR.updateTile(o);
    });
    $('pGap').addEventListener('change', AUR.emitChange);

    $('pDup').addEventListener('click', function () { AUR.duplicateSelected(); });
    $('pDel').addEventListener('click', function () { AUR.deleteSelected(); });
    $('pBack').addEventListener('click', function () { AUR.zOrder('back'); });
    $('pFront').addEventListener('click', function () { AUR.zOrder('front'); });

    $('genApply').addEventListener('click', applyGen);

    // Testo gotico
    const sel = $('pFont');
    AUR.GOTHIC_FONTS.forEach(function (f) {
      const opt = document.createElement('option');
      opt.value = f.css; opt.textContent = f.label;
      opt.style.fontFamily = "'" + f.css + "'";
      sel.appendChild(opt);
    });
    $('pText').addEventListener('input', function () {
      AUR.setText(activeObj(), $('pText').value);
    });
    $('pText').addEventListener('change', AUR.emitChange);
    $('pFont').addEventListener('change', function () {
      AUR.setFont(activeObj(), $('pFont').value); AUR.emitChange();
    });
    $('pFontSize').addEventListener('input', function () {
      const o = activeObj(); if (!o) return;
      o.set('fontSize', parseFloat($('pFontSize').value));
      if (o.initDimensions) o.initDimensions();
      o.setCoords();
      AUR.canvas.requestRenderAll();
      if (o.tileMode) AUR.updateTile(o);
    });
    $('pFontSize').addEventListener('change', AUR.emitChange);
  }

  function on(id, evt, fn) {
    $(id).addEventListener(evt, function () { fn(parseFloat($(id).value)); });
  }

  function updateInspector() {
    const o = activeObj();
    const empty = $('inspEmpty'), body = $('inspBody'), gen = $('genParams'), txt = $('textParams');
    if (!o || o.isTileLayer) { empty.hidden = false; body.hidden = true; gen.hidden = true; txt.hidden = true; return; }
    empty.hidden = true; body.hidden = false;
    $('objName').textContent = niceName(o);
    $('pOpacity').value = o.opacity != null ? o.opacity : 1;
    $('pLum').value = o.lum != null ? o.lum : 1;
    $('pBlur').value = o.blurAmt || 0;
    $('pTile').checked = !!o.tileMode;
    $('pGapRow').hidden = !o.tileMode;
    $('pGap').value = o.tileGap || 0;

    if (o.genType && AUR.Generators[o.genType]) { gen.hidden = false; buildGenControls(o); }
    else gen.hidden = true;

    if (o.type === 'textbox') {
      txt.hidden = false;
      $('pText').value = o.text || '';
      $('pFont').value = o.fontFamily || AUR.GOTHIC_FONTS[0].css;
      $('pFontSize').value = o.fontSize || 130;
    } else { txt.hidden = true; }
  }

  function buildGenControls(o) {
    const g = AUR.Generators[o.genType];
    $('genTitle').textContent = 'Generatore · ' + g.label;
    const box = $('genControls');
    box.innerHTML = '';
    const params = o.genParams || AUR.genDefaults(o.genType);
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
    AUR.regenerate(o, params);
    updateInspector();
  }

  function niceName(o) {
    if (o.genType && AUR.Generators[o.genType]) return AUR.Generators[o.genType].label;
    const map = {
      rect: 'Rettangolo', circle: 'Cerchio', ellipse: 'Ellisse', triangle: 'Triangolo',
      bar: 'Barra', cross: 'Croce', star: 'Stella', polygon: 'Poligono',
      svg: 'SVG', image: 'Immagine', text: 'Testo'
    };
    return map[o.aureolaType] || 'Oggetto';
  }

  // ---------- File ----------
  function wireFiles() {
    $('fileSvg').addEventListener('change', function (e) {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = function () { AUR.addSVGFromString(r.result); };
      r.readAsText(f);
      e.target.value = '';
    });
    $('fileImg').addEventListener('change', function (e) {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = function () { AUR.addImageFromDataURL(r.result); };
      r.readAsDataURL(f);
      e.target.value = '';
    });
    $('btnNew').addEventListener('click', function () { AUR.newProject(); updateInspector(); });
    $('btnExport').addEventListener('click', function () { AUR.exportProject(); });
    $('btnImport').addEventListener('click', function () { $('fileProject').click(); });
    $('fileProject').addEventListener('change', function (e) {
      const f = e.target.files[0]; if (!f) return;
      AUR.importProject(f, function () { setMode(AUR.state.editMode); updateInspector(); });
      e.target.value = '';
    });
  }

  // ---------- Eventi canvas ----------
  function wireCanvasEvents() {
    const c = AUR.canvas;
    c.on('selection:created', updateInspector);
    c.on('selection:updated', updateInspector);
    c.on('selection:cleared', updateInspector);
    c.on('object:modified', function (e) {
      const o = e.target;
      if (o && o.tileMode) AUR.updateTile(o);
      AUR.emitChange();
    });
    c.on('object:added', function () { AUR.keepTilesAtBack(); AUR.emitChange(); });
    c.on('object:removed', function () { AUR.emitChange(); });
    c.on('mouse:dblclick', function (opt) {
      if (!AUR.state.editMode || AUR.isVertexMode()) return;
      const o = opt.target;
      if (o && (o.type === 'polygon' || o.type === 'polyline')) {
        AUR.togglePointEditing(o);
      }
    });
  }

  // ---------- Tastiera ----------
  function wireKeyboard() {
    window.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (AUR.isVertexMode()) return; // Esc/Enter gestiti dal tool vertici

      const k = e.key;
      if (k === 'e' || k === 'E') { e.preventDefault(); setMode(!AUR.state.editMode); return; }
      if (k === 'f' || k === 'F') { e.preventDefault(); toggleFullscreen(); return; }
      if (k === ' ') { AUR.state.spaceHeld = true; e.preventDefault(); return; }

      if (!AUR.state.editMode) return;

      const o = activeObj();
      if ((k === 'Delete' || k === 'Backspace') && o) { e.preventDefault(); AUR.deleteSelected(); return; }
      if ((e.metaKey || e.ctrlKey) && (k === 'd' || k === 'D')) { e.preventDefault(); AUR.duplicateSelected(); return; }
      if (k === '[') { e.preventDefault(); AUR.zOrder('back'); return; }
      if (k === ']') { e.preventDefault(); AUR.zOrder('front'); return; }
      if (k === 'Escape') { AUR.canvas.discardActiveObject(); AUR.canvas.requestRenderAll(); updateInspector(); return; }

      // Frecce → sposta l'oggetto selezionato.
      if (o && k.indexOf('Arrow') === 0) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (k === 'ArrowLeft') o.left -= step;
        if (k === 'ArrowRight') o.left += step;
        if (k === 'ArrowUp') o.top -= step;
        if (k === 'ArrowDown') o.top += step;
        o.setCoords();
        if (o.tileMode) AUR.updateTile(o);
        AUR.canvas.requestRenderAll();
        AUR.emitChange();
      }
    });
    window.addEventListener('keyup', function (e) {
      if (e.key === ' ') AUR.state.spaceHeld = false;
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

})(window.AUR);
