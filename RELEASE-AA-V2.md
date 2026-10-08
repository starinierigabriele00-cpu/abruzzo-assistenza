# AA.V2 — implementazione e verifiche

Rapporto iniziale del 7 ottobre 2026, aggiornato con le revisioni dell’8 ottobre. Le sezioni successive conservano le misure e la fotografia di stato del candidato iniziale; la revisione corrente è descritta qui sotto. Il committente ha successivamente autorizzato la pubblicazione su GitHub Pages. L’anteprima di sviluppo resta disponibile all’interno della stessa rete Tailscale su `http://100.114.161.87:8080/`, con aggiornamento automatico.

## Revisione corrente — homepage e Volontariato

La homepage segue la sequenza hero, servizi, “Dalla richiesta alla conferma”, “Operativi dall’Abruzzo”, FAQ e contatto finale. La cartografia autentica è preservata. Il committente ha successivamente richiesto di non pubblicare il 5×1000 per l’anno corrente: il flag rimane disattivato, senza fascia o codice fiscale nel sito. La proposta grafica elaborata durante la prova locale non fa parte di questa revisione.

`volontari.html` torna una pagina effettiva, indicizzabile, con metadata distinti, partecipazione territoriale e temporale, competenze facoltative, valutazione del referente, CTA al composer precompilato e link a `associazione.html#volontariato`. L’header condiviso aggiunge la voce Volontariato tra Servizi e Associazione. Dopo la correzione richiesta dal committente, usa lo stesso stile degli altri collegamenti: nessun riquadro, riempimento o padding dedicato. Le prove nel browser confrontano gli stili effettivi delle tre voci a tutte le larghezze di QA. Associazione conserva un rimando breve per evitare duplicazioni. Sitemap, checker e test includono la pagina; solo Sostienici e Trasparenza restano rimandi statici. Nessun nuovo asset o dipendenza runtime.

Verifiche: **39 test** (10 messaggi, 20 interazioni, 9 pubblicazione), sintassi JS, checker e sincronizzazione, build root e sul path di progetto, formattazione e whitespace. Chromium: **40 screenshot**, otto pagine a 1440, 1024, 768, 390 e 360 px; zero violazioni axe nelle **16 viste** analizzate, nessun overflow, reflow a 320 px, tastiera, menu landscape, prenotazione servizi e volontariato, otto pagine senza JavaScript, due rimandi legacy e 404 annidata.

Screenshot e risultati: `/tmp/abruzzo-volunteer-qa/`. Revisione visuale effettiva di Volontariato e homepage desktop/mobile. Le prove non attestano conformità WCAG o legale. Dati legali, pagamenti e documenti non verificati restano esclusi. Questa revisione mantiene GitHub Pages; migrazione Cloudflare, dominio ufficiale e aggiornamento dei riferimenti privacy al nuovo hosting appartengono alla fase successiva richiesta dal committente, quando sarà disponibile l’account corretto.

File modificati: homepage e pagine con layout comune, `volontari.html`, `associazione.html`, `templates/site-header.html`, `assets/styles.css`, `config/site.json`, `sitemap.xml`, `scripts/check-site.py`, test di interazioni/pubblicazione/browser, README e questo rapporto. Il lavoro prosegue su `main`, come richiesto dopo l’eliminazione del precedente branch dedicato; commit e deploy effettivi sono riportati nella consegna.

## Revisione precedente — navigazione, Servizi e footer

La navigazione è Home, Servizi e Associazione, più una sola azione di contatto: nessun dropdown. `associazione.html` riunisce volontariato, sostegno e collaborazioni. I dati istituzionali, gli eventuali documenti e le informazioni verificate confluiscono nella sezione `contatti.html#associazione`; la sede verificata viene mostrata una sola volta in quella pagina. `volontari.html`, `sostienici.html` e `trasparenza.html` sono esclusivamente rimandi statici immediati alle nuove sezioni, con canonical di destinazione, noindex e link di riserva. Non sono redirect HTTP 301. La sitemap contiene soltanto le sei pagine principali, esclusa anche la 404.

Servizi conserva sei sezioni e l’indice sticky/disclosure, ma elimina sei coppie di sottotitoli ripetuti e sei riquadri. Descrizioni brevi, dettagli iniziali e pulsanti “Prenota…” collegati al composer sul servizio scelto. Il messaggio esprime l’intenzione di prenotare; disponibilità e dettagli richiedono ancora una conferma dell’associazione. Le informazioni sui mezzi e sulle dotazioni per la carrozzina restano condizionate alla disponibilità reale. Sullo smartphone a 390 px la pagina Servizi passa da 5.833 a 3.948 px di altezza; il footer passa da circa 530 a 480 px, raggruppando telefono, WhatsApp ed email con icone, collegamenti in due colonne e un solo avviso sulle emergenze.

File coinvolti: nuova `associazione.html`; pagine attive e tre vecchi indirizzi; template comuni; `assets/styles.css`, `assets/app.js`, `config/site.json`, `sitemap.xml`, `scripts/sync-layout.py`, `scripts/check-site.py`; test di messaggi, interazioni, pubblicazione e browser; README e questo rapporto. Eliminati CSS e JavaScript del dropdown e dei layout delle pagine ritirate. Nessuna dipendenza runtime o nuovo servizio esterno.

Verifica: 10 test messaggi, 19 interazioni e 9 pubblicazione, **38 test**; checker delle sette pagine effettive e tre rimandi, 262 riferimenti interni/asset; sincronizzazione, sintassi JS, Prettier, build root e sul percorso di progetto, whitespace Git. Chromium: **35 screenshot** a 1440, 1024, 768, 390 e 360 px; nessun overflow, zero violazioni axe nelle **14 viste** analizzate, reflow a 320 px, tutti i sei pulsanti di prenotazione e navigazione da tastiera. Le sette pagine sono utilizzabili senza JavaScript; i tre vecchi indirizzi raggiungono le nuove sezioni anche con JavaScript disabilitato. Screenshot dettagliati in `/tmp/abruzzo-consolidation-review/`; QA completo in `/tmp/abruzzo-consolidation-qa/`. Nessuna nuova misura Lighthouse o certificazione WCAG/legale.

5×1000, dati legali, pagamenti e documenti non verificati restano esclusi dall’HTML e dalla build pubblica. Le verifiche del titolare e del dominio personalizzato mantengono lo stato documentato sotto. Il deploy autorizzato usa la destinazione Pages esistente; commit ed esito effettivo del workflow sono riportati nella consegna.

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
- **Dominio, audit storico del 7 ottobre:** NXDOMAIN per A/AAAA di `abruzzoassistenza.com`, il dominio inizialmente previsto. Questo risultato non riguarda il nuovo dominio ufficiale `abruzzoassistenzaodv.com`; vedere l’aggiornamento Cloudflare sotto.

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

## Cloudflare migration (2026-10-08)

La PR #1 migra i metadati e l’informativa al dominio ufficiale `https://abruzzoassistenzaodv.com` e a Cloudflare Pages. Il progetto indicato dal controllo GitHub è `abruzzo-assistenza`; l’artefatto resta prodotto da `python3 scripts/build-site.py` in `_site`. La grafica e i dati legali non verificati sono preservati; 5×1000 e donazioni rimangono disabilitati.

La revisione corregge Prettier in `privacy.html`, usa canonici/Open Graph/sitemap senza estensione come gli URL serviti da Cloudflare, include redirect HTTP 301 per entrambe le forme dei due indirizzi legacy e mantiene gli anchor email disponibili senza JavaScript nonostante l’obfuscation del provider. La CI GitHub esegue verifiche e browser QA, senza job di deploy, permessi Pages di scrittura, commit o push. Cloudflare pubblica autonomamente quando cambia `main`; il merge della PR deve seguire la CI verde.

DNS e TLS del dominio ufficiale sono stati verificati con richieste reali l’8 ottobre: HTTP rimanda a HTTPS e le pagine/asset sono disponibili. `www` serve lo stesso sito con HTTPS, ma durante l’audit iniziale non rimanda all’apex. Il redirect richiede una regola della zona: le impostazioni esatte sono nel README. Il plugin di questa sessione autentica l’account Mothx e rifiuta l’account del progetto, quindi non consente di applicare quella regola. Nessuna modifica alla zona è stata effettuata.

La privacy descrive Cloudflare Pages, i possibili cookie tecnici di sicurezza, il composer locale e i servizi esterni. Non sono aggiunti analytics, tracker o banner di consenso per strumenti assenti. Identità formale del titolare, basi giuridiche operative, ruoli dei provider e conservazione restano soggetti alla verifica dell’associazione; la revisione tecnica non è una certificazione legale.

Verifica del candidato: checker statico e sincronizzazione, sintassi JavaScript, 10 test richieste, 20 interazioni, 12 test pubblicazione, Prettier, build e `git diff --check` superati. QA locale sull’artefatto: 40 catture a 1440/1024/768/390/360 px, axe su 16 viste senza violazioni, reflow a 320 px, composer, navigazione, otto pagine senza JavaScript, fallback legacy e 404 annidata. L’audit HTTP della preview Cloudflare del commit `5a8fe07` conferma metadati delle otto pagine, sitemap/robots, nove asset identici alla build, quattro redirect legacy HTTP 301 e query del composer preservata. La prova browser su rete reale ha evidenziato un’attesa mancante nel test del composer: il test ora attende che il JavaScript renda visibile il form prima di verificarlo. Il merge deve attendere la CI dell’ultimo commit e la verifica della preview.
