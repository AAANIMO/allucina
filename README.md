# Allucina

**Canvas nero a tutto schermo per usare un proiettore come luce da studio.**
Un progetto [animosity](https://animosity.it).

Componi forme, testo gotico, SVG, immagini e pattern generativi in tempo reale.
Quando esci dalla modalità modifica resta **solo nero con le forme bianche** —
esattamente ciò che proietti sul soggetto.

## Come funziona

- **Proiezione** (default): schermo nero. Muovi il mouse → compare **Edit**
  (o premi `E`). È la vista che proietti: niente UI, solo la composizione.
- **Modifica**: toolbar, pannello proprietà e barra file. Aggiungi e trasformi
  gli oggetti, poi **Fatto ✓** (o `E`) per tornare a proiettare.
- **Inverti** (`I`): scambia bianco/nero su tutto lo schermo — anche automatico
  a intervallo, come strobo (`Shift+I`).
- **Zoom/pan infiniti** con pinch e scroll (trackpad) o barra spaziatrice+trascina.

Gli oggetti — forme, **testo blackletter**, SVG/immagini importate e i
**generatori** parametrici (spirale, righe, stella, fulmini, raggi, anelli) —
sono tutti spostabili, scalabili, colorabili e piastrellabili. Tutto è
**vettoriale e nitido a qualsiasi zoom**, funziona **offline** e si **autosalva**.

## Installazione

**App desktop (macOS):** scarica il `.dmg` dalla pagina
[Releases](https://github.com/AAANIMO/allucina/releases) e trascina Allucina in
Applicazioni. In alternativa dai sorgenti:

```bash
npm install && npm start      # avvia in una finestra nativa (Electron)
npm run dist:mac              # crea il .dmg in release/
```

**PWA (browser):** servi la cartella (`python3 -m http.server 8000`), apri
`http://localhost:8000` in Chrome/Edge e scegli *Installa*.

📖 **Guida completa nella [Wiki](../../wiki)** — uso dettagliato, generatori,
pannello proprietà, scorciatoie, sviluppo e release.

## Licenza

MIT — vedi [LICENSE](LICENSE).
