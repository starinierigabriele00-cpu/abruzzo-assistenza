# AA.V2 — candidato per la pubblicazione

Verifica del 7 ottobre 2026. Questo rapporto registra il candidato iniziale, prima dell’autorizzazione alla pubblicazione: nessun push, merge o deploy era stato eseguito alla consegna. L’anteprima di sviluppo resta disponibile all’interno della stessa rete Tailscale su `http://100.114.161.87:8080/`, con aggiornamento automatico.

## Implementation summary

| Area              | Implementazione effettiva                                                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01. Identità      | CSS consolidato, token grafite/ghiaccio/ciano, proporzioni e superfici sobrie, IBM Plex locale.                                                                                                                            |
| 02. Homepage      | Fotografia autentica full-width, directory dei sei servizi, slot 5×1000 condizionale nella posizione richiesta, mappa locale, progressione, sei FAQ e contatto finale. Sezioni ridondanti rimosse.                         |
| 03. Servizi       | Sei sezioni normalizzate, indice sticky desktop e disclosure mobile. Mobilità assistita descritta con verifiche sulle esigenze, sui mezzi e sulle dotazioni, senza disponibilità universali. Link contestuali al composer. |
| 04. Contatti      | Nove servizi selezionabili, query string, campi pertinenti e facoltativi, due domande sulla carrozzina, anteprima, reset, link WhatsApp codificato e copia con fallback. Nessun backend o salvataggio persistente.         |
| 05. Volontariato  | Pagina editoriale dedicata con disponibilità, competenze, valutazione e primo contatto, senza promesse di ruoli o formazione.                                                                                              |
| 06. Sostegno      | Contributi e collaborazioni; 5×1000 e canali di pagamento generati soltanto da configurazioni documentate e verificate.                                                                                                    |
| 07. Trasparenza   | Identità, contatti, dati legali, documenti e obblighi distinti; nessun documento fittizio o qualifica ODV/ETS dedotta.                                                                                                     |
| 08. Privacy       | Descrizione di hosting/log, composer locale, canali esterni, finalità, basi da verificare, conservazione e diritti. Verifiche del titolare dichiarate esplicitamente. Nessun tracker o banner superfluo.                   |
| 09. Layout comune | Template sincronizzati, quattro voci principali, dropdown nativo, gestione tastiera/touch/Escape, footer ridotto e un solo avviso 112.                                                                                     |
| 10. Responsive    | Breakpoint dedicati, crop smartphone, indice servizi mobile, composer a colonna singola, controlli touch e reflow a 320 CSS px.                                                                                            |
| 11. Accessibilità | Landmark, gerarchia, skip link, focus, label, disclosure semantici, icone decorative e reduced motion; verifiche axe e tastiera.                                                                                           |
| 12. Performance   | WebP responsive, logo ottimizzato, preload LCP, dimensioni intrinseche, caricamento differito e asset/font locali. Nessuna dipendenza runtime.                                                                             |
| 13. SEO e deploy  | Metadati distinti, canonici/OG, favicon, sitemap, robots, Organization prudente, Pescara e 404 aggiornate. Builder completo e CI senza commit/push automatici. Dominio predisposto senza attivazione.                      |
| 14. QA            | Test aggiornati ed estesi, verifiche progressive, artefatto controllato, browser reale, screenshot e misure Lighthouse.                                                                                                    |

L’email pubblica è **abruzzoassistenzaodv@gmail.com**, confermata dal committente. `config/site.json` centralizza i dati e genera recapiti, layout e metadati. I blocchi non verificati sono assenti dall’HTML anche senza JavaScript; i dati privati di verifica non entrano nell’artefatto.

## Changed files

Modificati:

- Pagine: `index.html`, `servizi.html`, `contatti.html`, `volontari.html`, `sostienici.html`, `trasparenza.html`, `privacy.html`, `pescara.html`, `404.html`.
- Layout e asset: `templates/site-header.html`, `templates/site-footer.html`, `assets/styles.css`, `assets/app.js`, `assets/SOURCES.md`.
- Strumenti e CI: `scripts/sync-layout.py`, `scripts/check-site.py`, `scripts/build-site.py`, `.github/workflows/pages.yml`, `robots.txt`.
- Test e documentazione: `tests/request.test.mjs`, `tests/interactions.test.mjs`, `README.md`.

Introdotti:

- `config/site.json`, `sitemap.xml`, `scripts/preview-site.py`, `tests/browser.test.mjs`, `tests/test_publication.py`, questo rapporto.
- `assets/abruzzo-map.svg`, `assets/icons.svg`, `assets/favicon.png`, `assets/logo-associazione-96.webp`, `assets/mezzi-800.webp`, `assets/mezzi-1440.webp`, `assets/social-preview.jpg`.

Nessun file rimosso. Fotografie e logo originali conservati. Dipendenze di test e risultati QA sono esterni al repository; `_site/` è ignorato da Git.

## Verification

Controlli completati senza errori residui:

| Comando                                                                           | Risultato                                                                                         |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `python3 scripts/check-site.py`                                                   | Nove pagine, 336 riferimenti interni/asset, SEO, semantica e visibilità dei contenuti verificati. |
| `python3 scripts/sync-layout.py --check`                                          | Nove layout, configurazione, recapiti e blocchi condizionali sincronizzati.                       |
| `node --check assets/app.js`                                                      | Sintassi valida.                                                                                  |
| `node --test tests/request.test.mjs`                                              | 9 test superati.                                                                                  |
| `ABRUZZO_TEST_DEPS=/tmp/abruzzo-ui-check node --test tests/interactions.test.mjs` | 17 test superati.                                                                                 |
| `python3 -m unittest discover -s tests -p 'test_*.py'`                            | 7 test superati.                                                                                  |
| Prettier 3.6.2, comando completo nel README                                       | Formattazione verificata.                                                                         |
| `python3 scripts/build-site.py`                                                   | Artefatto completo, riferimenti verificati; nessun CNAME predefinito.                             |
| Build con `--base-path /abruzzo-assistenza/`                                      | Compatibilità del percorso di progetto e della 404 verificata; ripristinata la build root.        |
| `git diff --check`                                                                | Nessun errore di whitespace.                                                                      |
| `node tests/browser.test.mjs` con Playwright e Chromium                           | QA responsive, axe, tastiera, composer, reflow e fallback senza JavaScript superati.              |

Totale: **33 test di logica/interazione/pubblicazione**, oltre al QA browser. La nuova pipeline GitHub non è stata eseguita sul servizio remoto, perché il branch non è stato pubblicato.

## Visual QA e performance

Tutte le nove pagine sono state aperte in Chromium sull’artefatto finale a **1440, 1024, 768, 390 e 360 px**: 45 screenshot, immagini caricate e nessun overflow. Sono stati controllati crop fotografico, gerarchie, mappa, indice dei servizi, footer e richiesta con carrozzina. Corrette leggibilità della mappa, ottimizzazione del logo e comportamento della selezione per la copia manuale. Verificati menu/dropdown, accordion, reset, encoding e percorso 404 annidato. Tutte le nove pagine hanno un’esperienza utile senza JavaScript.

Axe con regole WCAG 2.2 AA: **zero violazioni rilevate in 18 viste**, desktop e smartphone. Reflow verificato anche a 320 CSS px. Questo non certifica la conformità: screen reader, zoom reale, Safari/WebKit e interazioni fisiche su iPhone/Android richiedono una verifica manuale aggiuntiva.

Lighthouse 12.8.2, Chromium, home dell’artefatto locale:

| Profilo         | Performance | Accessibility | Best Practices | SEO | LCP   | CLS   | TBT  |
| --------------- | ----------- | ------------- | -------------- | --- | ----- | ----- | ---- |
| Mobile simulato | 94          | 100           | 100            | 100 | 2,9 s | 0,002 | 0 ms |
| Desktop         | 100         | 100           | 100            | 100 | 0,7 s | 0,001 | 0 ms |

Misure di laboratorio su HTTP locale con cache disabilitata, non Core Web Vitals del dominio pubblico. INP e dati sul traffico reale non disponibili. Compressione e caching di produzione dipendono dall’hosting.

Screenshot, `results.json` e report Lighthouse HTML/JSON: `/tmp/abruzzo-qa/`. Non sono inclusi nell’artefatto pubblico.

## Production readiness

Il candidato tecnico è compilato e verificato. Prima del deploy restano questi passaggi esterni:

- **Titolare e dati ufficiali:** confermare denominazione legale, sede, identificativi fiscali, iscrizioni, obblighi/documenti e gestione effettiva dei dati. L’informativa non viene presentata come certificazione legale.
- **Operatività:** confermare servizi effettivi, disponibilità e dotazioni dei mezzi, recapiti e diritti degli asset autentici. I testi pubblici descrivono una valutazione della richiesta, non una prenotazione confermata.
- **Canali opzionali:** 5×1000, donazioni e documenti rimangono esclusi finché manca la verifica; nessun dato inventato. Questi canali possono restare disabilitati alla pubblicazione.
- **Dominio:** il controllo DNS locale del 7 ottobre ha restituito NXDOMAIN per A/AAAA di `abruzzoassistenza.com`; HTTPS non verificabile. DNS, dominio in Settings → Pages e certificato non sono stati configurati. Nessun record inventato o modificato.

## Git state e next action

### Fotografia mobile e cartografia — 8 ottobre 2026

La revisione successiva risponde allo screenshot della sezione territoriale. Su smartphone la fotografia conserva ora l’intera inquadratura originale, senza ingrandire il singolo mezzo e senza sovrapporre le CTA ai veicoli. Il fondo fotografico rimane parte dell’hero; sul desktop il comportamento è conservato. La sezione territoriale dispone introduzione, mappa e dettagli in quest’ordine su mobile, con testo più essenziale e indicazione esplicita che i punti di partenza non sono due sedi legali.

Sostituita la rappresentazione isolata scura con cartografia chiara: veri confini regionali e provinciali ISTAT, contesto delle regioni confinanti, costa adriatica, coordinate GeoNames e scala geografica. L’SVG locale è 37.372 byte; non ci sono tile, iframe o richieste di rete. Il nuovo `scripts/build-map.py` consente la riproduzione e rifiuta sorgenti con hash diversi da quelli documentati. Aggiornati `index.html`, `pescara.html`, `assets/styles.css`, `assets/abruzzo-map.svg`, `assets/SOURCES.md`, `README.md`, `tests/browser.test.mjs` e questo rapporto; nessun file rimosso.

Verifiche completate: controlli sito e template, sintassi JavaScript, 9 test messaggi, 18 interazioni, 7 pubblicazione, build root e con percorso Pages, Prettier e whitespace Git. QA completo: 45 screenshot delle nove pagine a 1440, 1024, 768, 390 e 360 px; zero overflow e zero violazioni axe nelle 18 viste analizzate; tastiera, composer, reflow a 320 px e fallback senza JavaScript superati. I test browser controllano anche che le CTA non coprano la fotografia e che l’ordine mobile mostri la mappa prima dei dettagli. Controllati inoltre hero e sezione geografica a 430 e 600 px, dimensioni SVG e assenza di risorse esterne nella mappa. Screenshot: `/tmp/abruzzo-territory-final/`; QA completo: `/tmp/abruzzo-cartography-qa/`. Nessuna nuova misura Lighthouse attribuita a questa revisione. Safari fisico resta da verificare sul dispositivo dell’utente.

I primi due screenshot allegati dal committente non erano disponibili nei percorsi indicati; la correzione si basa sul terzo screenshot leggibile e sulla riproduzione diretta delle pagine nel browser. Le verifiche legali/operative e la configurazione del dominio personalizzato mantengono lo stato descritto sopra. La pubblicazione su Pages è autorizzata; l’esito del relativo workflow e il commit sono riportati nella consegna.

### Revisione smartphone — 8 ottobre 2026

Acquisiti e rivisti screenshot di tutte le nove pagine a 390 × 700 e 360 × 640 px, più menu espanso, indice, campi e anteprima del composer e landscape a 844 × 390. Corretto il menu che si disponeva su più colonne nei viewport bassi; ora scorre verticalmente. I servizi della home hanno testi a tutta larghezza, l’indice dei servizi rimane disponibile durante lo scorrimento e le ancore non sono coperte dagli elementi sticky. Nel composer: note facoltative richiudibili, collegamenti tra dettagli e anteprima, valori conservati durante la modifica. Eliminato il collegamento di contatto duplicato nella topbar desktop; mantenuto nel menu mobile.

| Misura osservata a 390 px                   | Prima   | Dopo    |
| ------------------------------------------- | ------- | ------- |
| Altezza footer                              | 753 px  | 530 px  |
| Altezza hero                                | 728 px  | 648 px  |
| Altezza pagina Contatti, richiesta iniziale | 3652 px | 3296 px |

Verifica aggiornata: 9 test messaggi, 18 interazioni e 7 pubblicazione, **34 test superati**; 45 viste responsive, zero violazioni axe nelle 18 viste analizzate, reflow a 320 px e nove pagine senza JavaScript. Verificati anche menu landscape, passaggio dettagli/anteprima e indice sticky. Screenshot e misure del confronto: `/tmp/abruzzo-mobile-before/`, `/tmp/abruzzo-mobile-after/`; QA completo: `/tmp/abruzzo-mobile-final/`. I valori Lighthouse sopra rimangono le misure di laboratorio del candidato iniziale; non sono attribuiti a questa revisione. Le barre native di Safari richiedono il dispositivo reale.

La versione con correzione safe area è già stata pubblicata con successo da GitHub Actions sul commit `7e4e991`, [run 37693225991](https://github.com/starinierigabriele00-cpu/abruzzo-assistenza/actions/runs/37693225991). L’esito della successiva revisione smartphone è riportato nel messaggio di consegna.

Successivamente il committente ha autorizzato il deploy GitHub, chiedendo prima la correzione della fascia chiara sotto il footer su Safari iPhone. Applicati fondo grafite della pagina, `viewport-fit=cover` e inset di sicurezza, con controllo browser della continuità del fondo e del limite inferiore del documento. La CI ora rileva il percorso effettivo di Pages e verifica il medesimo artefatto sul relativo path. Destinazione esistente verificata: `https://starinierigabriele00-cpu.github.io/abruzzo-assistenza/`, senza dominio personalizzato. L’esito effettivo del deploy è riportato nel messaggio di consegna; la fotografia di stato sotto si riferisce al candidato iniziale.

Branch locale: `feat/abruzzo-assistenza-v2`, derivato da `main` a `fd22e37`. Le modifiche sono raccolte in un commit locale di consegna; hash e stato finale sono riportati nel messaggio di consegna. Nessun push, PR, merge o deploy.

**Prossima azione:** far validare all’associazione questo candidato e i dati obbligatori sopra elencati, per ottenere l’autorizzazione alla successiva pubblicazione sul dominio.
