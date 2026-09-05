# Install

## Desktop app (Electron) — recommended

A native app with its own window, dock icon and fullscreen/kiosk control.

### From source
```bash
npm install        # install Electron (once)
npm start          # launch Allucina in a native window
```

### Build the package
```bash
npm run dist:mac   # .dmg in release/ (Apple Silicon + Intel)
npm run dist:win   # .exe installer in release/ (on Windows)
```

Install the `.dmg` by dragging **Allucina** into Applications. It's **unsigned**
(no Apple certificate): if downloaded from another Mac, on first launch
**right-click → Open** to bypass Gatekeeper.

## Automated releases (GitHub Actions)

The `.github/workflows/release.yml` workflow builds the `.dmg` on GitHub and
attaches it to **Releases** — no local build:

```bash
git tag v1.0.0
git push origin v1.0.0     # starts the cloud build
```

When the build finishes, the `.dmg` is on the
[Releases](https://github.com/AAANIMO/allucina/releases) page. The workflow can
also be started manually from **Actions → Run workflow**.

## PWA (from the browser)

Serving the folder over http lets you install it as a PWA:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in Chrome/Edge → menu → **Install Allucina**.
Works offline thanks to the service worker (`sw.js` + `manifest.webmanifest`).
