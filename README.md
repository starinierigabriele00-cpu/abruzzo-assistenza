# Abruzzo Assistenza

Sito istituzionale di **Abruzzo Assistenza**, associazione di assistenza e trasporto sanitario con trasferimenti in tutta Italia e all’estero.

## Stack

Sito statico in HTML/CSS/JavaScript, senza framework e senza dipendenze runtime.

- responsive e mobile-first;
- accessibile da tastiera;
- nessun tracker o cookie di profilazione;
- richiesta con anteprima locale e apertura volontaria su WhatsApp;
- SEO di base e dati strutturati;
- deploy pronto per GitHub Pages.

## Interfaccia

Identità istituzionale: IBM Plex Sans ospitato localmente, verde profondo, bianco e grigio, logo autentico e fotografia dei mezzi recuperati dal canale ufficiale. Provenienza e licenze in [assets/SOURCES.md](assets/SOURCES.md).

La homepage desktop presenta servizi, operatività e organizzazione. La home mobile usa una struttura propria: percorsi Privati/Strutture, selezione del servizio, richiesta diretta e navigazione fissa Home/Servizi/Contatti/Chiama. Il catalogo mobile apre una scheda alla volta e rispetta i collegamenti alle ancore; desktop mostra tutte le sezioni. Senza JavaScript i servizi restano leggibili e i due percorsi mobile sono entrambi disponibili.

Nei Contatti, telefono, WhatsApp ed email precedono il modulo; sede e social seguono il modulo su mobile. I dettagli facoltativi della tratta si aprono su richiesta. L’anteprima rimane locale e non conferma una prenotazione; nessun dato viene salvato dal sito. Modificando un campo viene rimossa l’anteprima precedente.

Il menu desktop raggruppa Servizi e Associazione in sottomenu nativi. Su mobile il pannello superiore contiene solo Partenze, Volontariato, Sostegno e Trasparenza; la barra inferiore contiene Home, Servizi, Contatti e Chiama. Escape, tocco esterno e cambio di viewport chiudono il pannello. Il footer mobile conserva i contatti in vista e raccoglie associazione e sede in sezioni apribili; sul desktop entrambe restano estese. Senza JavaScript le informazioni restano accessibili.

Colori, font, spaziature e offset delle ancore sono definiti nelle variabili iniziali di `assets/styles.css`. Le regole tablet e mobile sono raccolte in un blocco per breakpoint. La formattazione HTML/CSS/JavaScript è definita in `.prettierrc.json`.

Menu e footer sono mantenuti in `templates/site-header.html` e `templates/site-footer.html`. Dopo averli modificati, aggiornare le nove pagine statiche con `python3 scripts/sync-layout.py`, poi formattare con Prettier. `--check` verifica struttura e contenuti indipendentemente dalle interruzioni di riga.

Il vecchio `assets/logo-officiale.png` è incompleto ed è conservato come sorgente storica. Le pagine usano il logo JPEG integro dal canale ufficiale.

## Dati già configurati

- Telefono: **333 682 3324**
- Email: **abruzzoassistenza@libero.it**
- Sede legale: **Via Fonte d'Amore SNC, Sulmona (AQ)**
- Codice fiscale / P.IVA: **02227430663**
- Instagram: **@abruzzo.assistenza**
- Facebook: pagina condivisa dall'associazione
- Operatività: trasporti locali, **nazionali e internazionali**. I mezzi sono disponibili in partenza da **Sulmona** e **Pescara**; il punto di partenza viene scelto in base al trasporto richiesto, alla zona e alla destinazione.

## Canali ancora da configurare

In `assets/app.js` sono presenti campi opzionali per:

- PEC;
- IBAN e intestatario;
- link PayPal o altro provider di donazione;
- 5×1000, da attivare solo dopo verifica dell'accreditamento.

I blocchi relativi a dati non configurati rimangono nascosti automaticamente.

## Avvio locale

Non serve una build. È sufficiente servire la cartella con un web server statico.

Esempio con Python:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Poi aprire `http://localhost:8080`.

## Verifiche

Controlli senza dipendenze aggiuntive (Python 3 e Node.js 20 o successivo):

```bash
python3 scripts/check-site.py
python3 scripts/sync-layout.py --check
node --check assets/app.js
node --test tests/request.test.mjs
git diff --check
```

Il controllo statico verifica file collegati, ancore, identificatori, titoli principali e attributi essenziali di accessibilità. I test JavaScript verificano il testo delle richieste e la codifica del link WhatsApp. Per le modifiche grafiche controllare anche il sito nel browser, su desktop e mobile, e provare menu, percorsi Privati/Strutture, schede dei servizi, FAQ e modulo senza inviare richieste di prova.

## Test delle interazioni

I test DOM in `tests/interactions.test.mjs` verificano percorsi mobile, schede dei servizi, menu, footer, modulo e copia del messaggio. JSDOM è una dipendenza di verifica opzionale, non del sito. Per eseguirli senza aggiungere dipendenze runtime al progetto:

```bash
npm install --prefix /tmp/abruzzo-ui-check jsdom@30.1.2 --no-audit --no-fund --ignore-scripts
ABRUZZO_TEST_DEPS=/tmp/abruzzo-ui-check node --test tests/interactions.test.mjs
```

I test DOM non sostituiscono la verifica visiva nel browser.

## Deploy su GitHub Pages

È incluso il workflow `.github/workflows/pages.yml`.

Il workflow esegue controlli statici, test delle interazioni e controllo della formattazione prima del deploy. `python3 scripts/build-site.py` prepara `_site/` con le nove pagine e i soli asset usati, poi controlla i collegamenti dell’artefatto. Sorgenti dei template, test e script di sviluppo non vengono pubblicati.

1. In GitHub aprire **Settings → Pages**.
2. In **Build and deployment** scegliere **GitHub Actions**.
3. Fare push su `main` oppure lanciare manualmente il workflow.

## Prima della pubblicazione definitiva

Verificare con il responsabile dell'associazione:

- elenco esatto dei servizi autorizzati/erogati;
- eventuale email e PEC pubbliche;
- coordinate per donazioni;
- posizione 5×1000 e relativa comunicazione;
- documenti da pubblicare in Trasparenza;
- fotografie autorizzate dei mezzi/volontari.

Il sito distingue sempre i servizi programmati dall'emergenza pubblica: in caso di emergenza invita a contattare **112 / 118**.
