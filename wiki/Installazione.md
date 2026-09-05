# Installazione

## App desktop (Electron) — consigliata

App nativa con finestra propria, icona nel dock e controllo fullscreen/kiosk.

### Dai sorgenti
```bash
npm install        # installa Electron (una volta)
npm start          # avvia Allucina in una finestra nativa
```

### Creare il pacchetto
```bash
npm run dist:mac   # .dmg in release/ (Apple Silicon + Intel)
npm run dist:win   # installer .exe in release/ (da Windows)
```

Il `.dmg` si installa trascinando **Allucina** in Applicazioni. È **unsigned**
(nessun certificato Apple): se scaricato da un altro Mac, al primo avvio fai
**click destro → Apri** per bypassare Gatekeeper.

## Release automatiche (GitHub Actions)

Il workflow `.github/workflows/release.yml` compila il `.dmg` su GitHub e lo
allega alle **Releases** — nessuna build in locale:

```bash
git tag v1.0.0
git push origin v1.0.0     # avvia il build in cloud
```

A fine build, il `.dmg` è nella pagina
[Releases](https://github.com/AAANIMO/allucina/releases). Il workflow è
avviabile anche a mano da **Actions → Run workflow**.

## PWA (dal browser)

Servendo la cartella via http la si installa come PWA:

```bash
python3 -m http.server 8000
```

Apri `http://localhost:8000` in Chrome/Edge → menu → **Installa Allucina**.
Funziona offline grazie al service worker (`sw.js` + `manifest.webmanifest`).
