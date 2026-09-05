/* ===== Allucina — viewport: pan/zoom infinito + gesture trackpad Apple ===== */
window.ALL = window.ALL || {};

(function (ALL) {
  'use strict';

  const MIN_ZOOM = 0.02;
  const MAX_ZOOM = 40;

  // Coordinate scena del centro del viewport corrente.
  ALL.sceneCenter = function () {
    const c = ALL.canvas;
    const zoom = c.getZoom();
    const vpt = c.viewportTransform;
    return {
      x: (c.getWidth() / 2 - vpt[4]) / zoom,
      y: (c.getHeight() / 2 - vpt[5]) / zoom
    };
  };

  // Rettangolo (in coordinate scena) attualmente visibile sullo schermo.
  ALL.getVisibleSceneRect = function () {
    const c = ALL.canvas;
    const zoom = c.getZoom();
    const vpt = c.viewportTransform;
    return {
      left: -vpt[4] / zoom,
      top: -vpt[5] / zoom,
      width: c.getWidth() / zoom,
      height: c.getHeight() / zoom
    };
  };

  ALL.zoomAt = function (px, py, newZoom) {
    const c = ALL.canvas;
    newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    c.zoomToPoint(new fabric.Point(px, py), newZoom);
  };

  // Collega le gesture del trackpad al canvas.
  ALL.initViewport = function () {
    const c = ALL.canvas;

    c.on('mouse:wheel', function (opt) {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey) {
        // ---- PINCH → zoom centrato sul cursore ----
        // (su macOS il pinch del trackpad emette un evento wheel con ctrlKey=true)
        // Delta limitato per evento → nessuno scatto brusco da un singolo evento.
        const d = Math.max(-40, Math.min(40, e.deltaY));
        let zoom = c.getZoom();
        zoom *= Math.pow(0.99, d);
        ALL.zoomAt(e.offsetX, e.offsetY, zoom);
      } else {
        // ---- SCROLL a due dita → pan orizzontale + verticale ----
        const vpt = c.viewportTransform;
        vpt[4] -= e.deltaX;
        vpt[5] -= e.deltaY;
        c.setViewportTransform(vpt);
        c.requestRenderAll();
      }
      ALL.onViewportChanged && ALL.onViewportChanged();
    });

    // Pan alternativo: spazio + trascina, oppure trascino su area vuota col
    // tasto centrale. Utile con un mouse normale.
    let panning = false;
    let last = null;

    c.on('mouse:down', function (opt) {
      const e = opt.e;
      const spaceHeld = ALL.state && ALL.state.spaceHeld;
      if (e.button === 1 || spaceHeld) {
        panning = true;
        last = { x: e.clientX, y: e.clientY };
        c.selection = false;
        c.setCursor('grabbing');
      }
    });

    c.on('mouse:move', function (opt) {
      if (!panning) return;
      const e = opt.e;
      const vpt = c.viewportTransform;
      vpt[4] += e.clientX - last.x;
      vpt[5] += e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      c.setViewportTransform(vpt);
      c.requestRenderAll();
      ALL.onViewportChanged && ALL.onViewportChanged();
    });

    c.on('mouse:up', function () {
      if (!panning) return;
      panning = false;
      c.selection = ALL.state ? ALL.state.editMode : true;
    });

    // Ridimensionamento finestra → canvas a tutto schermo.
    function fit() {
      c.setDimensions({ width: window.innerWidth, height: window.innerHeight });
      c.requestRenderAll();
      ALL.onViewportChanged && ALL.onViewportChanged();
    }
    window.addEventListener('resize', fit);
    fit();
  };

  // Reset vista (zoom 100%, origine al centro schermo).
  ALL.resetView = function () {
    const c = ALL.canvas;
    c.setViewportTransform([1, 0, 0, 1, c.getWidth() / 2, c.getHeight() / 2]);
    c.requestRenderAll();
    ALL.onViewportChanged && ALL.onViewportChanged();
  };

})(window.ALL);
