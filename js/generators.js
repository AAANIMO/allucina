/* ===== Aureola — generatori di pattern parametrici =====
 * Ogni generatore è: { label, params:[...], build(params, S) -> {d, stroke, fill, strokeWidth} }
 * `S` è la dimensione target in unità scena (≈ riempie lo schermo corrente).
 * Aggiungerne di nuovi = aggiungere una voce a AUR.Generators.
 */
window.AUR = window.AUR || {};

(function (AUR) {
  'use strict';

  function ptsToPath(pts) {
    if (!pts.length) return '';
    let d = 'M ' + r(pts[0].x) + ' ' + r(pts[0].y);
    for (let i = 1; i < pts.length; i++) d += ' L ' + r(pts[i].x) + ' ' + r(pts[i].y);
    return d;
  }
  function r(n) { return Math.round(n * 100) / 100; }

  // Subdivisione con spostamento del punto medio (per i fulmini).
  function jagged(x1, y1, x2, y2, disp, detail) {
    if (detail <= 0) return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * disp;
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * disp * 0.3;
    return jagged(x1, y1, mx, my, disp / 1.9, detail - 1)
      .slice(0, -1)
      .concat(jagged(mx, my, x2, y2, disp / 1.9, detail - 1));
  }

  AUR.Generators = {

    spiral: {
      label: 'Spirale',
      params: [
        { key: 'turns', label: 'Giri', min: 1, max: 14, step: 0.5, default: 5 },
        { key: 'thickness', label: 'Spessore', min: 0.05, max: 1, step: 0.05, default: 0.45 },
        { key: 'arms', label: 'Bracci', min: 1, max: 8, step: 1, default: 1 },
        { key: 'rotation', label: 'Rotazione', min: 0, max: 360, step: 5, default: 0 }
      ],
      // Spirale PIENA: banda solida di larghezza regolabile ottenuta scostando
      // il bordo di ±w/2 lungo la normale alla curva. Più bracci = più
      // rotazioni equidistanti (effetto girandola).
      build: function (p, S) {
        const R = S / 2;
        const maxTheta = Math.PI * 2 * p.turns;
        const b = R / maxTheta;
        const pitch = Math.PI * 2 * b;                 // passo radiale per giro
        const w = Math.max(2, p.thickness * pitch);    // spessore della banda
        const arms = Math.max(1, Math.round(p.arms));
        const rot0 = (p.rotation || 0) * Math.PI / 180;
        const steps = Math.max(140, Math.floor(p.turns * 90));
        let d = '';
        for (let a = 0; a < arms; a++) {
          const off = rot0 + a * (Math.PI * 2 / arms);
          const outer = [], inner = [];
          for (let i = 0; i <= steps; i++) {
            const th = maxTheta * (i / steps);
            const rr = b * th;
            const ang = th + off;
            const ca = Math.cos(ang), sa = Math.sin(ang);
            // tangente d/dθ → normale (perpendicolare) per lo scostamento
            let tx = ca - th * sa, ty = sa + th * ca;
            const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
            const nx = -ty, ny = tx;
            const px = rr * ca, py = rr * sa;
            outer.push({ x: px + nx * w / 2, y: py + ny * w / 2 });
            inner.push({ x: px - nx * w / 2, y: py - ny * w / 2 });
          }
          let sd = 'M ' + r(outer[0].x) + ' ' + r(outer[0].y);
          for (let i = 1; i < outer.length; i++) sd += ' L ' + r(outer[i].x) + ' ' + r(outer[i].y);
          for (let i = inner.length - 1; i >= 0; i--) sd += ' L ' + r(inner[i].x) + ' ' + r(inner[i].y);
          d += ' ' + sd + ' Z';
        }
        return { d: d.trim(), stroke: '', fill: '#fff', strokeWidth: 0 };
      }
    },

    lightning: {
      label: 'Fulmini',
      params: [
        { key: 'bolts', label: 'Numero', min: 1, max: 10, step: 1, default: 3 },
        { key: 'jaggedness', label: 'Caoticità', min: 0.05, max: 1, step: 0.05, default: 0.5 },
        { key: 'branches', label: 'Ramificazioni', min: 0, max: 8, step: 1, default: 2 },
        { key: 'thickness', label: 'Spessore', min: 1, max: 20, step: 1, default: 3 }
      ],
      build: function (p, S) {
        const top = -S / 2, bottom = S / 2, span = S;
        const disp = p.jaggedness * S * 0.45;
        let d = '';
        for (let b = 0; b < p.bolts; b++) {
          const x0 = p.bolts > 1 ? -span / 2 + span * (b / (p.bolts - 1)) : 0;
          const x1 = x0 + (Math.random() - 0.5) * S * 0.15;
          const main = jagged(x0, top, x1, bottom, disp, 6);
          d += ' ' + ptsToPath(main);
          // Ramificazioni da punti casuali del fulmine principale.
          for (let k = 0; k < p.branches; k++) {
            const idx = 1 + Math.floor(Math.random() * (main.length - 2));
            const a = main[idx];
            const len = S * (0.12 + Math.random() * 0.2);
            const dir = Math.random() < 0.5 ? -1 : 1;
            const bx = a.x + dir * len * (0.4 + Math.random() * 0.6);
            const by = a.y + len;
            d += ' ' + ptsToPath(jagged(a.x, a.y, bx, by, disp * 0.5, 4));
          }
        }
        return { d: d.trim(), stroke: '#fff', fill: '', strokeWidth: p.thickness };
      }
    },

    rays: {
      label: 'Raggi',
      params: [
        { key: 'count', label: 'Numero', min: 4, max: 120, step: 1, default: 24 },
        { key: 'thickness', label: 'Spessore', min: 1, max: 20, step: 1, default: 3 }
      ],
      build: function (p, S) {
        const R = S / 2;
        let d = '';
        for (let i = 0; i < p.count; i++) {
          const a = (Math.PI * 2 * i) / p.count;
          d += ' M 0 0 L ' + r(Math.cos(a) * R) + ' ' + r(Math.sin(a) * R);
        }
        return { d: d.trim(), stroke: '#fff', fill: '', strokeWidth: p.thickness };
      }
    },

    rings: {
      label: 'Anelli',
      params: [
        { key: 'count', label: 'Numero', min: 2, max: 40, step: 1, default: 8 },
        { key: 'thickness', label: 'Spessore', min: 1, max: 20, step: 1, default: 3 }
      ],
      build: function (p, S) {
        const R = S / 2;
        let d = '';
        for (let i = 1; i <= p.count; i++) {
          const rr = R * (i / p.count);
          d += ' M ' + r(-rr) + ' 0 A ' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + r(rr) + ' 0'
            + ' A ' + r(rr) + ' ' + r(rr) + ' 0 1 0 ' + r(-rr) + ' 0 Z';
        }
        return { d: d.trim(), stroke: '#fff', fill: '', strokeWidth: p.thickness };
      }
    },

    stripes: {
      label: 'Righe',
      params: [
        { key: 'count', label: 'Numero', min: 2, max: 60, step: 1, default: 12 },
        { key: 'thickness', label: 'Spessore', min: 0.05, max: 0.95, step: 0.05, default: 0.5 },
        { key: 'rotation', label: 'Rotazione', min: 0, max: 180, step: 5, default: 0 }
      ],
      // Righe piene (barre) che riempiono lo schermo, con rotazione.
      build: function (p, S) {
        const n = Math.max(2, Math.round(p.count));
        const gap = S / n;
        const w = Math.max(1, gap * p.thickness);
        const rot = (p.rotation || 0) * Math.PI / 180;
        const ca = Math.cos(rot), sa = Math.sin(rot);
        const P = function (x, y) { return r(x * ca - y * sa) + ' ' + r(x * sa + y * ca); };
        let d = '';
        for (let i = 0; i < n; i++) {
          const cy = -S / 2 + gap * (i + 0.5);
          const y0 = cy - w / 2, y1 = cy + w / 2, x0 = -S / 2, x1 = S / 2;
          d += ' M ' + P(x0, y0) + ' L ' + P(x1, y0) + ' L ' + P(x1, y1) + ' L ' + P(x0, y1) + ' Z';
        }
        return { d: d.trim(), stroke: '', fill: '#fff', strokeWidth: 0 };
      }
    }
  };

  AUR.genDefaults = function (type) {
    const g = AUR.Generators[type];
    const o = {};
    if (g) g.params.forEach(function (pr) { o[pr.key] = pr.default; });
    return o;
  };

  function buildPath(type, params, keep) {
    const gen = AUR.Generators[type];
    const vis = AUR.getVisibleSceneRect();
    const S = Math.min(vis.width, vis.height) * 0.9;
    const res = gen.build(params, S);
    const path = new fabric.Path(res.d, Object.assign({
      fill: res.fill !== undefined ? res.fill : '',
      stroke: res.stroke !== undefined ? res.stroke : '#fff',
      strokeWidth: res.strokeWidth !== undefined ? res.strokeWidth : 3,
      strokeLineCap: 'round', strokeLineJoin: 'round',
      fillRule: 'nonzero',
      originX: 'center', originY: 'center'
    }, keep || {}));
    path.aureolaType = 'generated';
    path.genType = type;
    path.genParams = params;
    return path;
  }

  AUR.addGenerated = function (type, params) {
    if (!AUR.Generators[type]) return;
    params = params || AUR.genDefaults(type);
    const path = buildPath(type, params);
    path.uid = AUR.nextUid();
    path.lum = 1; path.blurAmt = 0;
    const ctr = AUR.sceneCenter();
    path.set({ left: ctr.x, top: ctr.y });
    AUR.canvas.add(path);
    AUR.canvas.setActiveObject(path);
    AUR.canvas.requestRenderAll();
    AUR.emitChange();
    return path;
  };

  // Rigenera l'oggetto selezionato mantenendo posizione/scala/rotazione.
  AUR.regenerate = function (obj, params) {
    if (!obj || !obj.genType) return;
    const keep = {
      left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY,
      angle: obj.angle, flipX: obj.flipX, flipY: obj.flipY, opacity: obj.opacity
    };
    const np = buildPath(obj.genType, params, keep);
    np.uid = obj.uid; np.lum = obj.lum; np.blurAmt = obj.blurAmt;
    const wasActive = AUR.canvas.getActiveObject() === obj;
    if (obj.tileMode) { np.tileMode = true; np.tileGap = obj.tileGap; AUR.removeTile(obj); }
    AUR.canvas.remove(obj);
    AUR.canvas.add(np);
    if (wasActive) AUR.canvas.setActiveObject(np);
    if (np.tileMode) AUR.updateTile(np);
    AUR.canvas.requestRenderAll();
    AUR.emitChange();
    return np;
  };

})(window.AUR);
