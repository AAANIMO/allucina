# Generatori parametrici

Riempiono lo schermo e restano oggetti normali (spostabili, scalabili,
piastrellabili). Regola i parametri nel pannello e premi **Rigenera**.

Sono path **vettoriali** con `objectCaching:false`: restano **nitidi a
qualsiasi zoom** (niente sfocatura da rasterizzazione).

## Spirale
Spirale **logaritmica** (parte da un punto e cresce in modo esponenziale,
auto-simile), nastro **pieno**.
Parametri: **giri**, **crescita** (ingrandimento per giro), **spessore**,
**bracci** (rotazioni equidistanti), **rotazione**.

## Righe
Barre piene che riempiono lo schermo.
Parametri: **numero**, **spessore**, **rotazione**.

## Stella
Stella piena a *n* punte.
Parametri: **punte** (3–24), **punte interne** (distanza dal centro delle punte
interne = profondità degli incavi, 0.1–0.9), **rotazione**.

## Fulmini
Parametri: **numero**, **caoticità**, **ramificazioni**, **spessore**.

## Raggi
Raggi dal centro. Parametri: **numero**, **spessore**.

## Anelli
Cerchi concentrici. Parametri: **numero**, **spessore**.

---

Vedi **[Sviluppo](Sviluppo)** per aggiungere nuovi generatori.
