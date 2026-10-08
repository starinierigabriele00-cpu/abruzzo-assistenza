# Abruzzo Assistenza — AA.V2

Sito istituzionale statico: sette pagine principali (Home, Servizi, Volontariato, Associazione, Contatti, Pescara e Privacy), una 404 e due vecchi indirizzi di rimando. CSS moderno e JavaScript vanilla, senza dipendenze runtime, backend applicativo, tracker o librerie grafiche. La versione AA.V2 conserva l’architettura esistente, la fotografia autentica, il logo e IBM Plex Sans locale.

## Interfaccia e contenuti

Grafite, superfici ghiaccio, accenti ciano e fotografia full-width con crop distinto per smartphone. La home presenta servizi, card compatta 5×1000, organizzazione del servizio, operatività territoriale, FAQ e contatto finale. Il catalogo mantiene l’indice sticky desktop; su mobile l’indice è un disclosure nativo e tutti i servizi restano leggibili. Descrizioni e informazioni iniziali sono essenziali, senza riquadri ripetuti: “Prenota…” apre il composer sul servizio scelto, senza confermare una prenotazione. Volontariato ha una pagina editoriale dedicata e una voce nel menu, tra Servizi e Associazione, con lo stesso stile degli altri collegamenti. Associazione presenta identità ODV/ETS, un rimando al volontariato, un approfondimento 5×1000 distinto dalle donazioni, sostegno e collaborazioni; i dati istituzionali e i documenti verificati si trovano nei Contatti.

Il composer nei Contatti consente di scegliere nove richieste. Mostra solo i campi pertinenti, tutti facoltativi, e aggiorna il testo e il link WhatsApp durante la compilazione. Le due domande sulla carrozzina sono distinte. Cambiare servizio esclude i dati non pertinenti dal messaggio; il reset li cancella. Nessuna navigazione o trasmissione avviene durante la compilazione. Il clic su “Continua su WhatsApp” apre `wa.me` con il testo; l’invio della conversazione richiede un’ulteriore azione dell’utente. La copia utilizza gli appunti solo dopo un clic e, in caso di indisponibilità, seleziona il testo per la copia manuale. Nessun salvataggio persistente.

Su smartphone il catalogo della home usa righe a tutta larghezza, l’indice dei servizi rimane disponibile durante lo scorrimento e il menu aperto scorre verticalmente anche in landscape. Il footer raggruppa telefono, WhatsApp ed email, con icone e controlli di almeno 44 px; collegamenti in due colonne, social e un solo avviso 112. Nel composer le note facoltative sono richiudibili; “Controlla il messaggio” e “Modifica i dettagli” consentono di passare tra i due punti senza perdere dati. Sul desktop le note rimangono visibili. L’header usa collegamenti diretti Home, Servizi, Volontariato e Associazione, senza dropdown; sul desktop una sola azione “Contattaci”, nel menu mobile “Contatti”.

I rimandi sono configurati in `config/site.json` e generati da `scripts/sync-layout.py`: `sostienici.html` → `associazione#sostegno`, `trasparenza.html` → `contatti#associazione`. Il file `_redirects`, incluso nella build, applica redirect HTTP 301 su Cloudflare sia per i vecchi URL `.html` sia per quelli senza estensione. I documenti HTML con refresh immediato, canonical, `noindex,follow` e link di riserva restano disponibili per l’anteprima locale e gli hosting statici precedenti. Sono esclusi dalla sitemap. La configurazione rifiuta destinazioni esterne e catene di rimandi; il checker richiede link diretti alle pagine attive.

La fotografia dell’hero mobile conserva le proporzioni originali: i mezzi rimangono visibili e le azioni sono sopra la zona fotografica. La mappa territoriale precede i dettagli dei punti di partenza su smartphone. Usa veri confini regionali e provinciali ISTAT, costa, contesto delle regioni confinanti e coordinate GeoNames, con grafica cartografica chiara. È un SVG locale senza librerie o richieste esterne; la provenienza e la rigenerazione tramite `scripts/build-map.py` sono documentate in [assets/SOURCES.md](assets/SOURCES.md).

Senza JavaScript restano disponibili navigazione, servizi, FAQ e contatti diretti; il composer è assente. Lo script di sincronizzazione protegge gli anchor email pubblici con i commenti `email_off` documentati da Cloudflare: i link `mailto:` restano utilizzabili anche senza lo script di decodifica del provider. La sola informazione sulle emergenze è nel footer e rimanda al 112. Nessuna promessa H24 o disponibilità garantita.

## Configurazione: un’unica fonte

Modificare `config/site.json`, poi eseguire:

```bash
python3 scripts/sync-layout.py
npx --yes prettier@3.6.2 --write '*.html' 'templates/*.html' assets/app.js config/site.json
python3 scripts/sync-layout.py --check
```

Lo script sincronizza header/footer, recapiti nelle pagine, configurazione pubblica in `assets/app.js` e JSON-LD. I template sono `templates/site-header.html` e `templates/site-footer.html`; non modificare le copie delle pagine. I blocchi `verified:*` vengono generati dallo script: non aggiungere manualmente dati riservati alla verifica.

Email approvata dal committente il 7 ottobre 2026: **abruzzoassistenzaodv@gmail.com**. Telefono: **333 682 3324**; WhatsApp usa lo stesso numero. La fonte storica dei recapiti e degli asset è in [assets/SOURCES.md](assets/SOURCES.md). La qualifica giuridica non viene dedotta dall’email.

`legal` è attivo con denominazione statutaria, ODV/ETS, iscrizione RUNTS, codice fiscale **02227430663** e sede **Via Fonte d'Amore SNC, Sulmona (AQ), Italia**, tutti confermati direttamente dal committente. La sede e l’iscrizione non sono state nuovamente ricercate. `donation` rimane disattivato: nessun IBAN o canale di pagamento è stato fornito. `fivePerMille` è attivo in seguito alla conferma esplicita dell’associazione (8 ottobre 2026) dell’accreditamento al 5×1000, con codice fiscale verificato. La comunicazione è senza riferimento all’ammissione al riparto di una particolare annualità: il campo `year` resta `null` e `yearSource` vuoto. Un’annualità richiede un anno valido e una fonte specifica distinta dalla conferma generale. Il codice fiscale del 5×1000 deve coincidere con quello legale verificato. Una sezione può essere pubblicata solo con `verified: true`, dati completi e `source` documentata. L’IBAN viene controllato anche con checksum. I documenti devono avere `verified`, `title`, `path` sotto `documents/` e `source`; devono esistere realmente. I dati non verificati sono esclusi dall’HTML, anche senza JavaScript, e dalla configurazione runtime pubblica. Il builder include solo documenti verificati. La posizione per una futura copia approvata e priva di dati personali non necessari dello statuto è descritta in [documents/README.md](documents/README.md): nessun download è pubblicato finché manca il PDF approvato.

## Anteprima locale e iPhone

```bash
python3 scripts/preview-site.py --watch
```

Aprire `http://127.0.0.1:8080`. Il server di sviluppo disabilita la cache, ricarica la pagina quando cambiano gli asset e simula la 404 di Pages. Il polling viene inserito soltanto dal server con `--watch`: non modifica i file e non viene incluso nella build.

Per una macchina già connessa a Tailscale, usare il suo indirizzo VPN:

```bash
python3 scripts/preview-site.py --bind INDIRIZZO_TAILSCALE --port 8080 --watch
```

Aprire quell’URL dall’iPhone nella stessa rete Tailscale. La modifica dei campi del composer non provoca reload: la versione cambia soltanto quando vengono modificati file sul disco.

## Verifiche

Python 3 e Node.js 20 o successivo; in CI viene usato Node 24.

```bash
python3 scripts/check-site.py
python3 scripts/sync-layout.py --check
node --check assets/app.js
node --test tests/request.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/build-site.py
git diff --check
```

Dipendenze di verifica isolate, non distribuite con il sito:

```bash
npm install --prefix /tmp/abruzzo-ui-check jsdom@30.1.2 prettier@3.6.2 playwright@1.58.2 @axe-core/playwright@4.11.1 --no-audit --no-fund --ignore-scripts
ABRUZZO_TEST_DEPS=/tmp/abruzzo-ui-check node --test tests/interactions.test.mjs
/tmp/abruzzo-ui-check/node_modules/.bin/prettier --check '*.html' 'templates/*.html' assets/styles.css assets/app.js 'tests/*.mjs' '*.md' assets/SOURCES.md documents/README.md config/site.json .prettierrc.json .github/workflows/pages.yml
```

Per la verifica nel browser, avviare il server senza `--watch`, poi:

```bash
ABRUZZO_TEST_DEPS=/tmp/abruzzo-ui-check ABRUZZO_BROWSER=/usr/bin/chromium node tests/browser.test.mjs
```

`ABRUZZO_BASE_URL` e `ABRUZZO_QA_OUTPUT` consentono di cambiare endpoint e cartella dei risultati. Impostare anche `ABRUZZO_CLEAN_URLS=1` quando si verifica una preview o il dominio Cloudflare: il test richiede gli URL `.html` e controlla la destinazione senza estensione dopo il redirect. Sono controllati anche il 5×1000 senza annualità, il codice fiscale statico, copia con Clipboard API simulata e selezione manuale nel browser. Sono controllate le otto pagine effettive, inclusa la 404, a 1440, 1024, 768, 390 e 360 px; axe su desktop/smartphone, reflow a 320 CSS px, navigazione da tastiera, tutti i sei pulsanti di prenotazione, composer e assenza di JavaScript. I due vecchi indirizzi vengono verificati anche senza JavaScript. Screenshot e JSON sono in `/tmp/abruzzo-qa`. Le prove automatiche non attestano conformità WCAG e non sostituiscono screen reader o dispositivi reali. In ambienti che limitano l’isolamento dei processi Node, il medesimo test runner può essere eseguito con `--test-isolation=none`.

## Build e deploy

`python3 scripts/build-site.py` genera `_site/`, con elenco esplicito degli asset e verifica finale dei collegamenti, inclusi SVG, `srcset`, font, sitemap e dati soggetti a verifica. Ogni nuovo asset deve essere aggiunto a `ASSETS` nello script. Sorgenti, configurazione di verifica, template, test, README dei documenti e procedura organizzativa non sono pubblicati.

Il workflow `.github/workflows/pages.yml` controlla formattazione, layout, JavaScript, interazioni, dati verificati e artefatto, poi esegue il QA nel browser sull’artefatto stesso. Esegue soltanto verifiche e carica artefatto/screenshot; non pubblica su GitHub Pages, non formatta, non crea commit e non fa push. La pubblicazione è gestita dall’integrazione Git di Cloudflare Pages, progetto `abruzzo-assistenza`, branch di produzione `main`, comando `python3 scripts/build-site.py`, cartella di output `_site`. Prima di ogni merge autorizzato devono essere verdi i controlli GitHub e Cloudflare della PR. L’integrazione Cloudflare avvia autonomamente il deploy quando cambia `main`: GitHub Actions non ne blocca il deploy in attesa dei propri test.

La CI esegue build e QA dalla root, come il dominio Cloudflare. Il supporto al vecchio path `/abruzzo-assistenza/` rimane disponibile solo per prove di compatibilità: `python3 scripts/build-site.py --base-path /abruzzo-assistenza/`, poi `python3 scripts/preview-site.py --directory _site --base-path /abruzzo-assistenza/`, con `ABRUZZO_BASE_URL=http://127.0.0.1:8080/abruzzo-assistenza` nei test browser. Ricostruire con il comando predefinito prima di pubblicare su Cloudflare.

Su iPhone, `viewport-fit=cover`, gli inset di sicurezza e lo sfondo grafite di `html`/`body` mantengono continuità sotto il footer. Il contenuto principale conserva il fondo chiaro. Il rendering delle barre native di Safari deve essere verificato sul dispositivo reale; le emulazioni controllano lo sfondo, i limiti del documento e i collegamenti.

## Dominio e approvazioni richieste

Canonici, sitemap, robots, Open Graph e dati strutturati usano `https://abruzzoassistenzaodv.com`. Canonici e sitemap delle pagine usano URL senza `.html`, coerenti con i redirect automatici di Cloudflare Pages; la homepage usa `/`. I link HTML relativi restano compatibili con l’anteprima statica: Cloudflare conserva query e ancore durante la normalizzazione. La build predefinita non crea CNAME e non modifica DNS o impostazioni Pages. La 404 usa percorsi root, adatti anche a URL inesistenti annidati. Per verificare il vecchio path di progetto:

```bash
python3 scripts/build-site.py --base-path /abruzzo-assistenza/
```

Il dominio è configurato in **Cloudflare → Workers & Pages → abruzzo-assistenza → Custom domains**; DNS e HTTPS sono gestiti nell’account titolare della zona. Nessun record DNS è scritto dal progetto. Il flag legacy `--custom-domain` genera un CNAME per un eventuale export GitHub Pages e non serve su Cloudflare. Caching e normalizzazione degli URL seguono i [comportamenti di Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/).

Il redirect dell’hostname `www` verso l’apex è stato osservato attivo il giorno 8 ottobre 2026, con conservazione del percorso e della query. È gestito da una regola della zona Cloudflare, separata dai redirect di pagina del repository: **Rules → Redirect Rules**, corrispondenza esatta `http.host eq "www.abruzzoassistenzaodv.com"`, destinazione dinamica `concat("https://abruzzoassistenzaodv.com", http.request.uri.path)`, stato 301 e conservazione della query string attiva. Vedere la [documentazione Cloudflare](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/). Verificare HTTPS, percorso, query e assenza di loop dopo l’attivazione. L’accesso al progetto GitHub non concede automaticamente accesso alla zona Cloudflare. Il vecchio URL GitHub Pages può continuare a servire l’ultima release: rimuovere il job di deploy non disabilita il sito già pubblicato nelle impostazioni del repository.

Identità, sede, codice fiscale, ODV/ETS, RUNTS e accreditamento generale 5×1000 sono già confermati dal committente. Non estendere la conferma a riparti annuali, documenti, dotazioni o procedure non documentate. La privacy descrive composer locale, IP/log Cloudflare Pages, accessi interni dichiarati e informazioni sanitarie eventualmente ricevute nei contatti successivi. Non esiste ancora una politica formale di conservazione: nessun termine o cancellazione automatica è stato inventato. Basi dell’art. 6, condizioni dell’art. 9, contratti dei provider, trasferimenti e criteri di conservazione richiedono approvazione. La proposta di gestione, conservazione, sicurezza e la procedura Search Console sono in [OPERATIONS-PRIVACY.md](OPERATIONS-PRIVACY.md). La revisione tecnica non certifica conformità legale. Nessun nuovo tracker, Cloudflare Web Analytics o banner viene introdotto. Il candidato resta sulla PR #2: merge su `main`, deploy produttivo e modifiche Cloudflare richiedono autorizzazione esplicita.

Il risultato e i controlli della sessione sono documentati in [RELEASE-AA-V2.md](RELEASE-AA-V2.md).
