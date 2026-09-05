/* ===== Allucina — forma dai vertici + editing dei punti ===== */
window.ALL = window.ALL || {};

(function (ALL) {
  'use strict';

  const WHITE = '#ffffff';
  let active = false;
  let points = [];       // punti in coordinate scena
  let markers = [];      // cerchietti temporanei
  let preview = null;    // polyline di anteprima
  let handlers = null;

  ALL.isVertexMode = function () { return active; };

  ALL.startVertexTool = function () {
    if (active) return;
    active = true;
    points = []; markers = [];
    const c = ALL.canvas;
    c.discardActiveObject();
    c.selection = false;
    c.skipTargetFind = true;
    c.defaultCursor = 'crosshair';
    document.getElementById('vertexHint').hidden = false;

    handlers = {
      down: function (opt) {
        const p = c.getPointer(opt.e);
        // Chiudi cliccando vicino al primo punto.
        if (points.length >= 3) {
          const first = points[0];
          const dx = p.x - first.x, dy = p.y - first.y;
          if (Math.hypot(dx, dy) < 12 / c.getZoom()) { finalize(); return; }
        }
        points.push({ x: p.x, y: p.y });
        const m = new fabric.Circle({
          left: p.x, top: p.y, radius: 5 / c.getZoom(), fill: '#6ea8ff',
          originX: 'center', originY: 'center',
          selectable: false, evented: false, excludeFromExport: true
        });
        markers.push(m); c.add(m);
        redraw(p);
      },
      move: function (opt) { if (points.length) redraw(c.getPointer(opt.e)); },
      dbl: function () { finalize(); }
    };
    c.on('mouse:down', handlers.down);
    c.on('mouse:move', handlers.move);
    c.on('mouse:dblclick', handlers.dbl);
    window.addEventListener('keydown', keydown, true);
  };

  function redraw(cursor) {
    const c = ALL.canvas;
    if (preview) c.remove(preview);
    const pts = points.slice();
    if (cursor) pts.push(cursor);
    if (pts.length < 2) { preview = null; return; }
    preview = new fabric.Polyline(pts, {
      stroke: '#6ea8ff', strokeWidth: 1.5 / c.getZoom(), fill: 'rgba(110,168,255,0.10)',
      selectable: false, evented: false, excludeFromExport: true, objectCaching: false
    });
    c.add(preview);
    preview.sendToBack();
    ALL.keepTilesAtBack && ALL.keepTilesAtBack();
    c.requestRenderAll();
  }

  function keydown(e) {
    if (!active) return;
    if (e.key === 'Enter') { e.preventDefault(); finalize(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  }

  function cleanup() {
    const c = ALL.canvas;
    markers.forEach(function (m) { c.remove(m); });
    if (preview) c.remove(preview);
    markers = []; preview = null;
    c.selection = ALL.state ? ALL.state.editMode : true;
    c.skipTargetFind = false;
    c.defaultCursor = 'default';
    document.getElementById('vertexHint').hidden = true;
    window.removeEventListener('keydown', keydown, true);
    if (handlers) {
      c.off('mouse:down', handlers.down);
      c.off('mouse:move', handlers.move);
      c.off('mouse:dblclick', handlers.dbl);
      handlers = null;
    }
    active = false;
  }

  function cancel() { cleanup(); ALL.canvas.requestRenderAll(); }

  function finalize() {
    const pts = points.slice();
    cleanup();
    if (pts.length < 3) { ALL.canvas.requestRenderAll(); return; }
    const poly = new fabric.Polygon(pts, { fill: WHITE });
    poly.allucinaType = 'polygon';
    poly.uid = ALL.nextUid();
    poly.lum = 1; poly.blurAmt = 0;
    ALL.canvas.add(poly);
    ALL.canvas.setActiveObject(poly);
    ALL.canvas.requestRenderAll();
    ALL.emitChange();
  }

  // ---- Editing dei vertici (doppio click su un poligono) ----
  ALL.togglePointEditing = function (poly) {
    if (!poly || (poly.type !== 'polygon' && poly.type !== 'polyline')) return;
    try {
      if (poly._editingPoints) { exitPointEditing(poly); }
      else { enterPointEditing(poly); }
      ALL.canvas.requestRenderAll();
    } catch (e) { /* editing punti non disponibile: ignora */ }
  };

  function enterPointEditing(poly) {
    poly._editingPoints = true;
    poly.cornerStyle = 'circle';
    poly.cornerColor = '#ffcf6e';
    poly.hasBorders = false;
    poly.objectCaching = false;

    const lastIndex = poly.points.length - 1;
    poly.controls = poly.points.reduce(function (acc, point, index) {
      acc['p' + index] = new fabric.Control({
        positionHandler: polygonPositionHandler,
        actionHandler: anchorWrapper(index > 0 ? index - 1 : lastIndex, actionHandler),
        actionName: 'modifyPolygon',
        pointIndex: index
      });
      return acc;
    }, {});
  }

  function exitPointEditing(poly) {
    poly._editingPoints = false;
    poly.hasBorders = true;
    poly.controls = fabric.Object.prototype.controls;
    poly.objectCaching = true;
    ALL.emitChange();
  }

  function polygonPositionHandler(dim, finalMatrix, fabricObject) {
    const x = fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x;
    const y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y;
    return fabric.util.transformPoint(
      { x: x, y: y },
      fabric.util.multiplyTransformMatrices(
        fabricObject.canvas.viewportTransform,
        fabricObject.calcTransformMatrix()
      )
    );
  }

  function actionHandler(eventData, transform, x, y) {
    const polygon = transform.target;
    const currentControl = polygon.controls[polygon.__corner];
    const local = polygon.toLocalPoint(new fabric.Point(x, y), 'center', 'center');
    const baseSize = polygon._getNonTransformedDimensions();
    const size = polygon._getTransformedDimensions(0, 0);
    polygon.points[currentControl.pointIndex] = {
      x: local.x * baseSize.x / size.x + polygon.pathOffset.x,
      y: local.y * baseSize.y / size.y + polygon.pathOffset.y
    };
    return true;
  }

  function anchorWrapper(anchorIndex, fn) {
    return function (eventData, transform, x, y) {
      const fo = transform.target;
      const absolutePoint = fabric.util.transformPoint({
        x: fo.points[anchorIndex].x - fo.pathOffset.x,
        y: fo.points[anchorIndex].y - fo.pathOffset.y
      }, fo.calcTransformMatrix());
      const performed = fn(eventData, transform, x, y);
      fo._setPositionDimensions({});
      const baseSize = fo._getNonTransformedDimensions();
      const newX = (fo.points[anchorIndex].x - fo.pathOffset.x) / baseSize.x;
      const newY = (fo.points[anchorIndex].y - fo.pathOffset.y) / baseSize.y;
      fo.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
      return performed;
    };
  }

})(window.ALL);
