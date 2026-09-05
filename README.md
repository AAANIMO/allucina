# Aureola

Canvas nero a tutto schermo per usare un **proiettore come luce da studio**.
Aggiungi forme, SVG e immagini, le manipoli in tempo reale e — uscendo dalla
modalità modifica — resta **solo nero con le forme bianche**, esattamente come
le hai messe: è quello che proietti sul soggetto.

## Come si usa

Apri `index.html` in un browser (doppio click). Funziona **offline**, nessun
server o installazione: Fabric.js è già incluso in `vendor/`.

- All'avvio sei in **modalità proiezione**: schermo nero. Muovi il mouse →
  compare il pulsante **Edit** in basso a destra (o premi `E`).
- In **modalità modifica** appaiono la toolbar in alto, il pannello proprietà a
  destra e la barra file in basso. Premi **Fatto ✓** (o `E`) per tornare a
  proiettare: sparisce tutto, resta solo la composizione.

### Gesture trackpad (Apple)
- **Pinch** → zoom (centrato sul cursore) — infinito.
- **Scroll a due dita** → pan orizzontale e verticale — infinito.
- Con un mouse: **barra spaziatrice + trascina** per il pan.

### Forme e oggetti
- Toolbar → Rettangolo, Cerchio, Ellisse, Triangolo, Barra, **Croce**, Stella.
- **Vertici**: clicca per posare i punti, `Invio`/doppio-click chiude, `Esc`
  annulla. Doppio-click su un poligono per modificarne i vertici.
- **Testo** gotico: aggiunge una scritta (multiriga) con font blackletter
  (Unifraktur Maguntia/Cook, Pirata One, Grenze Gotisch). Doppio-click per
  editare il testo inline; dal pannello scegli font e dimensione.
- **Importa SVG** / **Importa immagine** (gli SVG diventano bianchi per la
  proiezione).
- Selezionato un oggetto: trascina per spostarlo, maniglie **angolari** per
  scalare, maniglie **laterali** per stringere, maniglia in alto per **ruotare**.

### Pannello proprietà
- **Luminosità**, **Opacità**, **Sfocatura bordi** (luce morbida).
- **Flip H / Flip V** (specchia).
- **Piastrella**: ripete l'oggetto su tutto lo schermo (con spaziatura
  regolabile) e resta allineato durante pan/zoom.
- Duplica, Elimina, porta Avanti / Dietro.

### Generatori parametrici
Riempiono lo schermo e restano oggetti normali (spostabili, scalabili,
piastrellabili). Regola i parametri nel pannello e premi **Rigenera**.
- **Spirale** — forma **piena** (nastro solido), con giri, spessore, numero di
  **bracci** (rotazioni equidistanti) e rotazione.
- **Righe** — barre piene che riempiono lo schermo, con numero, spessore e
  rotazione.
- **Fulmini**, **Raggi**, **Anelli**.

### File
- **Autosave** automatico: riaprendo la pagina ritrovi tutto com'era.
- **Esporta / Importa** un progetto `.json` per salvare setup di proiezione.
- **Nuovo** svuota il canvas.

## Scorciatoie
| Tasto | Azione |
|---|---|
| `E` | Modifica ↔ Proiezione |
| `F` | Schermo intero |
| `⌫` / `Canc` | Elimina selezione |
| `⌘/Ctrl + D` | Duplica |
| Frecce | Sposta (con `Shift` = passo 10) |
| `[` / `]` | Manda dietro / porta avanti |
| `Spazio` + trascina | Pan |
| `Esc` | Deseleziona / annulla vertici |

## Struttura
```
index.html            shell + UI
css/styles.css        tema dark, chrome nascosto-fino-all'hover
js/viewport.js        pan/zoom infinito + gesture trackpad
js/objects.js         forme, import, flip, luminosità, opacità, blur
js/tiling.js          piastrella per-oggetto
js/polygon.js         forma dai vertici + editing punti
js/generators.js      spirale piena, righe, fulmini, raggi, anelli
js/persistence.js     autosave + export/import
js/app.js             modalità, inspector, tastiera, fullscreen
vendor/fabric.min.js  libreria (vendorizzata, offline)
assets/fonts/         font gotici (woff2, offline)
```

## Estendere i generatori
Aggiungi una voce a `AUR.Generators` in `js/generators.js`:
```js
mioPattern: {
  label: 'Mio pattern',
  params: [{ key: 'x', label: 'X', min: 1, max: 10, step: 1, default: 3 }],
  build: function (p, S) {
    return { d: '...path SVG...', stroke: '#fff', fill: '', strokeWidth: 3 };
  }
}
```
e un bottone `<button data-gen="mioPattern">` nella toolbar.
