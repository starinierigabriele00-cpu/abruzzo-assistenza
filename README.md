# Abruzzo Assistenza

Sito istituzionale di **Abruzzo Assistenza**, associazione di assistenza e trasporto sanitario con trasferimenti in tutta Italia e all’estero.

## Stack

Sito statico in HTML/CSS/JavaScript, senza framework e senza dipendenze runtime.

- responsive e mobile-first;
- accessibile da tastiera;
- nessun tracker o cookie di profilazione;
- contatto/preventivo tramite WhatsApp;
- SEO di base e dati strutturati;
- deploy pronto per GitHub Pages.

## Dati già configurati

- Telefono: **333 682 3324**
- Sede legale: **Via Fonte d'Amore SNC, Sulmona (AQ)**
- Codice fiscale / P.IVA: **02227430663**
- Instagram: **@abruzzo.assistenza**
- Facebook: pagina condivisa dall'associazione
- Operatività: trasporti locali, **nazionali e internazionali**. I mezzi sono disponibili in partenza da **Sulmona** e **Pescara**; il punto di partenza viene scelto in base al trasporto richiesto, alla zona e alla destinazione.

## Canali ancora da configurare

In \`assets/app.js\` sono presenti campi opzionali per:

- email / PEC;
- IBAN e intestatario;
- link PayPal o altro provider di donazione;
- 5×1000, da attivare solo dopo verifica dell'accreditamento.

I blocchi relativi a dati non configurati rimangono nascosti automaticamente.

## Avvio locale

Non serve una build. È sufficiente servire la cartella con un web server statico.

Esempio con Python:

\`\`\`bash
python3 -m http.server 8080
\`\`\`

Poi aprire \`http://localhost:8080\`.

## Deploy su GitHub Pages

È incluso il workflow \`.github/workflows/pages.yml\`.

1. In GitHub aprire **Settings → Pages**.
2. In **Build and deployment** scegliere **GitHub Actions**.
3. Fare push su \`main\` oppure lanciare manualmente il workflow.

## Prima della pubblicazione definitiva

Verificare con il responsabile dell'associazione:

- elenco esatto dei servizi autorizzati/erogati;
- eventuale email e PEC pubbliche;
- coordinate per donazioni;
- posizione 5×1000 e relativa comunicazione;
- documenti da pubblicare in Trasparenza;
- fotografie autorizzate dei mezzi/volontari.

Il sito distingue sempre i servizi programmati dall'emergenza pubblica: in caso di emergenza invita a contattare **112 / 118**.
