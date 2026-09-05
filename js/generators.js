/* ===== Allucina — generatori di pattern parametrici =====
 * Ogni generatore è: { label, params:[...], build(params, S) -> {d, stroke, fill, strokeWidth} }
 * `S` è la dimensione target in unità scena (≈ riempie lo schermo corrente).
 * Aggiungerne di nuovi = aggiungere una voce a ALL.Generators.
 */
window.ALL = window.ALL || {};

(function (ALL) {
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

  ALL.Generators = {

    spiral: {
      label: 'Spirale',
      params: [
        { key: 'turns', label: 'Giri', min: 1, max: 14, step: 0.5, default: 5 },
        { key: 'growth', label: 'Crescita', min: 1.1, max: 4, step: 0.05, default: 1.6 },
        { key: 'thickness', label: 'Spessore', min: 0.05, max: 1, step: 0.05, default: 0.45 },
        { key: 'arms', label: 'Bracci', min: 1, max: 8, step: 1, default: 1 },
        { key: 'rotation', label: 'Rotazione', min: 0, max: 360, step: 5, default: 0 }
      ],
      // Spirale LOGARITMICA (non archimedea): r = r0 · e^(k·θ), il raggio cresce
      // in modo esponenziale, quindi la spirale è auto-simile e il passo tra i
      // giri aumenta col raggio. "Crescita" = fattore di ingrandimento per giro.
      // Banda PIENA: il bordo è scostato di ±w/2 lungo la normale, con w che
      // scala col raggio locale così il riempimento resta costante.
      build: function (p, S) {
        const R = S / 2;
        const turns = Math.max(0.5, p.turns);
        const growth = Math.max(1.05, p.growth || 1.6); // ingrandimento per giro
        const k = Math.log(growth) / (Math.PI * 2);     // tasso di crescita
        const maxTheta = Math.PI * 2 * turns;
        const r0 = R / Math.pow(growth, turns);         // raggio al centro
        const arms = Math.max(1, Math.round(p.arms));
        const rot0 = (p.rotation || 0) * Math.PI / 180;
        const steps = Math.max(180, Math.floor(turns * 110));
        let d = '';
        for (let a = 0; a < arms; a++) {
          const off = rot0 + a * (Math.PI * 2 / arms);
          const outer = [], inner = [];
          for (let i = 0; i <= steps; i++) {
            const th = maxTheta * (i / steps);
            const rr = r0 * Math.exp(k * th);
            const ang = th + off;
            const ca = Math.cos(ang), sa = Math.sin(ang);
            // tangente della spirale log: dP/dθ = r·(k·cos−sin, k·sin+cos)
            let tx = k * ca - sa, ty = k * sa + ca;
            const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
            const nx = -ty, ny = tx;
            // passo radiale verso il giro interno (il più stretto): usarlo per
            // lo spessore evita l'overlap, così i giri restano distinti anche
            // con crescita alta. thickness=1 → i giri si toccano appena.
            const localPitch = rr * (1 - 1 / growth);
            const w = Math.max(2, p.thickness * localPitch);
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
    },

    star: {
      label: 'Stella',
      params: [
        { key: 'points', label: 'Punte', min: 3, max: 24, step: 1, default: 5 },
        // distanza delle punte INTERNE dal centro, come frazione del raggio esterno
        { key: 'inner', label: 'Punte interne', min: 0.1, max: 0.9, step: 0.02, default: 0.42 },
        { key: 'rotation', label: 'Rotazione', min: 0, max: 360, step: 5, default: 0 }
      ],
      // Stella piena a n punte: alterna raggio esterno R e interno R·inner.
      build: function (p, S) {
        const R = S * 0.46;
        const n = Math.max(3, Math.round(p.points));
        const ri = R * Math.min(0.95, Math.max(0.05, p.inner));
        const rot = (p.rotation || 0) * Math.PI / 180;
        const step = Math.PI / n;
        let d = '';
        for (let i = 0; i < 2 * n; i++) {
          const rad = i % 2 === 0 ? R : ri;
          const a = i * step - Math.PI / 2 + rot;
          const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
          d += (i === 0 ? 'M ' : ' L ') + r(x) + ' ' + r(y);
        }
        return { d: d + ' Z', stroke: '', fill: '#fff', strokeWidth: 0 };
      }
    }
  };

  ALL.genDefaults = function (type) {
    const g = ALL.Generators[type];
    const o = {};
    if (g) g.params.forEach(function (pr) { o[pr.key] = pr.default; });
    return o;
  };

  function buildPath(type, params, keep) {
    const gen = ALL.Generators[type];
    const vis = ALL.getVisibleSceneRect();
    const S = Math.min(vis.width, vis.height) * 0.9;
    const res = gen.build(params, S);
    const path = new fabric.Path(res.d, Object.assign({
      fill: res.fill !== undefined ? res.fill : '',
      stroke: res.stroke !== undefined ? res.stroke : '#fff',
      strokeWidth: res.strokeWidth !== undefined ? res.strokeWidth : 3,
      strokeLineCap: 'round', strokeLineJoin: 'round',
      fillRule: 'nonzero',
      originX: 'center', originY: 'center',
      // niente cache bitmap: il path resta vettoriale e nitido a qualsiasi zoom
      objectCaching: false
    }, keep || {}));
    path.allucinaType = 'generated';
    path.genType = type;
    path.genParams = params;
    return path;
  }

  ALL.addGenerated = function (type, params) {
    if (!ALL.Generators[type]) return;
    params = params || ALL.genDefaults(type);
    const path = buildPath(type, params);
    path.uid = ALL.nextUid();
    path.lum = 1; path.blurAmt = 0;
    const ctr = ALL.sceneCenter();
    path.set({ left: ctr.x, top: ctr.y });
    ALL.canvas.add(path);
    ALL.canvas.setActiveObject(path);
    ALL.canvas.requestRenderAll();
    ALL.emitChange();
    return path;
  };

  // Rigenera l'oggetto selezionato mantenendo posizione/scala/rotazione.
  ALL.regenerate = function (obj, params) {
    if (!obj || !obj.genType) return;
    const keep = {
      left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY,
      angle: obj.angle, flipX: obj.flipX, flipY: obj.flipY, opacity: obj.opacity
    };
    const np = buildPath(obj.genType, params, keep);
    np.uid = obj.uid; np.lum = obj.lum; np.blurAmt = obj.blurAmt;
    const wasActive = ALL.canvas.getActiveObject() === obj;
    if (obj.tileMode) { np.tileMode = true; np.tileGap = obj.tileGap; ALL.removeTile(obj); }
    ALL.canvas.remove(obj);
    ALL.canvas.add(np);
    if (wasActive) ALL.canvas.setActiveObject(np);
    if (np.tileMode) ALL.updateTile(np);
    ALL.canvas.requestRenderAll();
    ALL.emitChange();
    return np;
  };

})(window.ALL);
