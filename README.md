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
  destra, la barra file in basso e il titolo **animosity - aureola** (font
  gotico) in alto a destra. Premi **Fatto ✓** (o `E`) per tornare a proiettare:
  sparisce tutto, resta solo la composizione.

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

### Inverti colori
Pulsante **◑ Inverti** in toolbar (o pulsante flottante accanto a Edit in
proiezione, o tasto `I`): inverte i colori di **tutto lo schermo** — sfondo
nero e forme bianche diventano sfondo bianco e forme nere. I pannelli
dell'editor restano leggibili normalmente. Lo stato si salva con
autosave/export come il resto del progetto.

**Inverti automatico**: pulsante **⏱ Auto** in toolbar (o pulsante flottante
in proiezione, o `Shift+I`) inverte i colori da solo a intervallo regolare —
imposta i secondi (0.1–10) nel campo accanto. Utile come effetto strobo.
Cambiare l'intervallo mentre è attivo lo riavvia subito col nuovo valore.

### Pannello proprietà
- **Elenco oggetti**: sezione richiudibile in cima al pannello con tutti gli
  oggetti in scena (dal più in alto nello z-order). Clicca una voce per
  selezionarla, comodo con molti oggetti sovrapposti. Le frecce **▲ / ▼** su
  ogni riga spostano l'oggetto **sopra / sotto** agli altri: l'ordine si
  aggiorna dal vivo sia nell'elenco che sul canvas.
- **Luminosità**, **Opacità**, **Sfocatura bordi** (luce morbida).
- **Flip H / Flip V** (specchia).
- **Inverti colori (oggetto)**: inverte i colori del **singolo** oggetto
  (bianco↔nero), indipendente dall'inversione globale. Serve per comporre, es.
  un cerchio nero su un quadrato bianco. Sulle immagini applica un filtro di
  inversione.
- **Bianco e nero (immagine)**: converte l'immagine selezionata in scala di
  grigi (appare solo per le immagini).
- **Piastrella**: ripete l'oggetto su tutto lo schermo, resta allineato
  durante pan/zoom. Oltre a **Spaziatura**:
  - **Offset righe (X)** / **Offset colonne (Y)**: sfalsa le righe/colonne
    dispari (0–100%) — con offset 50% su X ottieni il classico pattern a
    mattoncino.
  - **Alterna Flip H / V**: specchia le tessere a scacchiera (una sì, una no)
    per pattern che si incastrano.
- Duplica, Elimina.
- **Ordine (Z)**: si gestisce dall'elenco oggetti con le frecce ▲ / ▼ (vedi
  sopra). Da tastiera: `[` / `]` un livello, `Shift+[` / `Shift+]` in
  fondo / in primo piano.

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
| `I` | Inverti colori (tutto lo schermo) |
| `Shift+I` | Inverti automatico on/off |
| `F` | Schermo intero |
| `⌫` / `Canc` | Elimina selezione |
| `⌘/Ctrl + D` | Duplica |
| Frecce | Sposta (con `Shift` = passo 10) |
| `[` / `]` | Indietro / avanti di un livello |
| `Shift+[` / `Shift+]` | Manda in fondo / porta in primo piano |
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
