# Development

A self-contained static app: vanilla HTML + CSS + JS, with Fabric.js vendored.
No backend, no web build. Global namespace: `window.ALL`.

## Structure

```
index.html            shell + UI + splash
css/styles.css        dark theme, hidden chrome, splash
js/viewport.js        infinite pan/zoom + trackpad gestures
js/objects.js         shapes, import, flip, brightness, opacity, blur, color
js/tiling.js          per-object tiling
js/polygon.js         shape from vertices + point editing
js/generators.js      spiral, stripes, star, lightning, rays, rings
js/persistence.js     autosave + export/import (+ data migration)
js/app.js             modes, inspector, keyboard, fullscreen, splash
vendor/fabric.min.js  library (vendored, offline)
assets/fonts/         gothic fonts (woff2, offline)
assets/crest.svg      animosity seal (splash)
assets/icon-*.png     app icons
main.js               Electron main process
package.json          Electron + electron-builder config
manifest.webmanifest  PWA manifest
sw.js                 service worker (PWA offline cache)
build/icon.icns       macOS icon
.github/workflows/    CI: build & release the .dmg
```

## Adding a generator

Add an entry to `ALL.Generators` in `js/generators.js`:

```js
myPattern: {
  label: 'My pattern',
  params: [{ key: 'x', label: 'X', min: 1, max: 10, step: 1, default: 3 }],
  build: function (p, S) {
    // S ≈ size that fills the current screen
    return { d: '...SVG path...', stroke: '#fff', fill: '', strokeWidth: 3 };
  }
}
```

and a `<button data-gen="myPattern">` in the toolbar. The panel auto-generates
the parameter sliders and the **Regenerate** button.

## Persistence & migration

Autosave lives in `localStorage` (`allucina:autosave:v1`). On first launch it
automatically migrates any save from the old *aureola* version and normalizes
imported `.json` files.
