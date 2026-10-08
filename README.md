# Abruzzo Assistenza — AA.V2

Sito istituzionale statico, con nove pagine HTML, CSS moderno e JavaScript vanilla. Nessuna dipendenza runtime, backend applicativo, tracker o libreria grafica. La versione AA.V2 conserva l’architettura esistente, la fotografia autentica, il logo e IBM Plex Sans locale.

## Interfaccia e contenuti

Grafite, superfici ghiaccio, accenti ciano e fotografia full-width con crop distinto per smartphone. La home presenta servizi, eventuale 5×1000 verificato, operatività, organizzazione del servizio, FAQ e contatto finale. Il catalogo mantiene l’indice sticky desktop; su mobile l’indice è un disclosure nativo e tutti i servizi restano leggibili. Le pagine associative hanno composizioni editoriali proprie.

Il composer nei Contatti consente di scegliere nove richieste. Mostra solo i campi pertinenti, tutti facoltativi, e aggiorna il testo e il link WhatsApp durante la compilazione. Le due domande sulla carrozzina sono distinte. Cambiare servizio esclude i dati non pertinenti dal messaggio; il reset li cancella. Nessuna navigazione o trasmissione avviene durante la compilazione. Il clic su “Continua su WhatsApp” apre `wa.me` con il testo; l’invio della conversazione richiede un’ulteriore azione dell’utente. La copia utilizza gli appunti solo dopo un clic e, in caso di indisponibilità, seleziona il testo per la copia manuale. Nessun salvataggio persistente.

Su smartphone il catalogo della home usa righe a tutta larghezza, l’indice dei servizi rimane disponibile durante lo scorrimento e il menu aperto scorre verticalmente anche in landscape. Il footer conserva contatti, social e collegamenti con una composizione più compatta. Nel composer le note facoltative sono richiudibili; “Controlla il messaggio” e “Modifica i dettagli” consentono di passare tra i due punti senza perdere dati. Sul desktop le note rimangono visibili e la composizione delle pagine è conservata. Nell’header desktop resta una sola azione di contatto, “Contattaci”; il menu mobile mantiene “Contatti”.

Senza JavaScript restano disponibili navigazione, servizi, FAQ e contatti diretti; il composer è assente. La sola informazione sulle emergenze è nel footer e rimanda al 112. Nessuna promessa H24 o disponibilità garantita.

## Configurazione: un’unica fonte

Modificare `config/site.json`, poi eseguire:

```bash
python3 scripts/sync-layout.py
npx --yes prettier@3.6.2 --write '*.html' 'templates/*.html' assets/app.js config/site.json
python3 scripts/sync-layout.py --check
```

Lo script sincronizza header/footer, recapiti nelle pagine, configurazione pubblica in `assets/app.js` e JSON-LD. I template sono `templates/site-header.html` e `templates/site-footer.html`; non modificare le copie delle pagine. I blocchi `verified:*` vengono generati dallo script: non aggiungere manualmente dati riservati alla verifica.

Email approvata dal committente il 7 ottobre 2026: **abruzzoassistenzaodv@gmail.com**. Telefono: **333 682 3324**; WhatsApp usa lo stesso numero. La fonte storica dei recapiti e degli asset è in [assets/SOURCES.md](assets/SOURCES.md). La qualifica giuridica non viene dedotta dall’email.

`legal`, `fivePerMille` e `donation` sono disattivati. Una sezione può essere pubblicata solo con `verified: true`, dati completi e `source` documentata. Il 5×1000 richiede anche l’anno di accreditamento; un codice fiscale o un vecchio flag non sono una prova. L’IBAN viene controllato anche con checksum. I documenti devono avere `verified`, `title`, `path` sotto `documents/` e `source`; devono esistere realmente. I dati non verificati sono esclusi dall’HTML, anche senza JavaScript, e dalla configurazione runtime pubblica. Il builder include solo documenti verificati.

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
/tmp/abruzzo-ui-check/node_modules/.bin/prettier --check '*.html' 'templates/*.html' assets/styles.css assets/app.js 'tests/*.mjs' '*.md' assets/SOURCES.md config/site.json .prettierrc.json .github/workflows/pages.yml
```

Per la verifica nel browser, avviare il server senza `--watch`, poi:

```bash
ABRUZZO_TEST_DEPS=/tmp/abruzzo-ui-check ABRUZZO_BROWSER=/usr/bin/chromium node tests/browser.test.mjs
```

`ABRUZZO_BASE_URL` e `ABRUZZO_QA_OUTPUT` consentono di cambiare endpoint e cartella dei risultati. Sono controllate nove pagine a 1440, 1024, 768, 390 e 360 px; axe su desktop/smartphone, reflow a 320 CSS px, navigazione da tastiera, composer e assenza di JavaScript. Screenshot e JSON sono in `/tmp/abruzzo-qa`. Le prove automatiche non attestano conformità WCAG e non sostituiscono screen reader o dispositivi reali. In ambienti che limitano l’isolamento dei processi Node, il medesimo test runner può essere eseguito con `--test-isolation=none`.

## Build e deploy

`python3 scripts/build-site.py` genera `_site/`, con elenco esplicito degli asset e verifica finale dei collegamenti, inclusi SVG, `srcset`, font, sitemap e dati soggetti a verifica. Ogni nuovo asset deve essere aggiunto a `ASSETS` nello script. Sorgenti, configurazione di verifica, template e test non sono pubblicati.

Il workflow `.github/workflows/pages.yml` controlla formattazione, layout, JavaScript, interazioni, dati verificati e artefatto, poi esegue il QA nel browser sull’artefatto stesso. Non formatta, non crea commit e non fa push. I branch di lavoro e le PR eseguono soltanto la verifica; il deploy è consentito solo da `main`, dopo i controlli. Non eseguire merge o pubblicazione senza autorizzazione.

La CI legge l’URL effettivo dalle impostazioni Pages con permessi di sola lettura e passa il relativo percorso alla build e al server di QA. La 404 funziona quindi anche sul path `/abruzzo-assistenza/`; un futuro dominio root viene riconosciuto dalle impostazioni senza attivarlo dal codice. Per riprodurre quel QA locale: `python3 scripts/preview-site.py --directory _site --base-path /abruzzo-assistenza/`, con `ABRUZZO_BASE_URL=http://127.0.0.1:8080/abruzzo-assistenza` nei test browser.

Su iPhone, `viewport-fit=cover`, gli inset di sicurezza e lo sfondo grafite di `html`/`body` mantengono continuità sotto il footer. Il contenuto principale conserva il fondo chiaro. Il rendering delle barre native di Safari deve essere verificato sul dispositivo reale; le emulazioni controllano lo sfondo, i limiti del documento e i collegamenti.

## Dominio e approvazioni richieste

Canonici, sitemap, robots e Open Graph sono predisposti per `https://abruzzoassistenza.com`. La build predefinita non crea CNAME e non modifica DNS o impostazioni Pages. La 404 usa percorsi root, adatti anche a URL inesistenti annidati. Se si vuole verificare la versione sul path di progetto prima del dominio:

```bash
python3 scripts/build-site.py --base-path /abruzzo-assistenza/
```

Dopo approvazione e configurazione del dominio, il flag `--custom-domain` include un CNAME nell’artefatto. Con GitHub Actions, l’impostazione effettiva del dominio rimane in **Settings → Pages**: il file non sostituisce quell’operazione. Nessun record DNS è scritto dal progetto. Consultare la [documentazione GitHub sui domini](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages) e verificare HTTPS/redirect dopo la configurazione. Le politiche di caching sono gestite da GitHub Pages, non dal CSS o da intestazioni inventate nel repository.

Prima della pubblicazione il responsabile deve validare identità formale del titolare, sede e identificativi fiscali, natura giuridica e iscrizioni, elenco dei servizi effettivi, disponibilità e dotazioni dei mezzi, documenti e obblighi applicabili. Per privacy: basi giuridiche effettive, destinatari, ruoli dei provider, trasferimenti e criteri di conservazione dei messaggi/log. La pagina descrive il funzionamento reale, inclusi IP/log di GitHub Pages; la revisione tecnica non è una certificazione legale. L’assenza di 5×1000 o pagamenti verificati non impedisce tecnicamente il funzionamento del sito: quei canali restano assenti.

Il risultato e i controlli della sessione sono documentati in [RELEASE-AA-V2.md](RELEASE-AA-V2.md).
