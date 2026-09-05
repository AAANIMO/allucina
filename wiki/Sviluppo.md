# Sviluppo

App statica autosufficiente: HTML + CSS + JS vanilla, con Fabric.js vendorizzato.
Nessun backend, nessuna build per il web. Namespace globale: `window.ALL`.

## Struttura

```
index.html            shell + UI + splash
css/styles.css        tema dark, chrome nascosto, splash
js/viewport.js        pan/zoom infinito + gesture trackpad
js/objects.js         forme, import, flip, luminosità, opacità, blur, colore
js/tiling.js          piastrella per-oggetto
js/polygon.js         forma dai vertici + editing punti
js/generators.js      spirale, righe, stella, fulmini, raggi, anelli
js/persistence.js     autosave + export/import (+ migrazione dati)
js/app.js             modalità, inspector, tastiera, fullscreen, splash
vendor/fabric.min.js  libreria (vendorizzata, offline)
assets/fonts/         font gotici (woff2, offline)
assets/crest.svg      sigillo animosity (splash)
assets/icon-*.png     icone app
main.js               processo principale Electron
package.json          config Electron + electron-builder
manifest.webmanifest  PWA manifest
sw.js                 service worker (cache offline PWA)
build/icon.icns       icona macOS
.github/workflows/    CI: build & release del .dmg
```

## Aggiungere un generatore

Aggiungi una voce a `ALL.Generators` in `js/generators.js`:

```js
mioPattern: {
  label: 'Mio pattern',
  params: [{ key: 'x', label: 'X', min: 1, max: 10, step: 1, default: 3 }],
  build: function (p, S) {
    // S ≈ dimensione che riempie lo schermo corrente
    return { d: '...path SVG...', stroke: '#fff', fill: '', strokeWidth: 3 };
  }
}
```

e un bottone `<button data-gen="mioPattern">` nella toolbar. Il pannello genera
automaticamente gli slider dei parametri e il pulsante **Rigenera**.

## Persistenza e migrazione

L'autosave vive in `localStorage` (`allucina:autosave:v1`). Al primo avvio migra
automaticamente un eventuale salvataggio della vecchia versione *aureola* e
normalizza i `.json` importati.
