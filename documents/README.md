# Documenti istituzionali

Questa cartella contiene `statuto.pdf`, copia per consultazione dello statuto registrato fornito dal committente il 9 ottobre 2026 per la pubblicazione sul sito. Il download è disponibile nella sezione istituzionale dei Contatti e funziona anche senza JavaScript.

La copia pubblica conserva le dieci pagine e il testo degli articoli. Sono stati oscurati l’autografo nel margine della prima pagina e i nominativi/firme nell’ultima. Il PDF è stato ricostruito dalle immagini già oscurate, con testo OCR ricavato dalle stesse immagini: le immagini originali e le informazioni oscurate non sono incorporate nel documento pubblico. L’OCR facilita ricerca e selezione del testo; per la lettura fa fede il contenuto visibile delle scansioni. Non si dichiara una certificazione PDF/A o di accessibilità della copia derivata.

L’originale è rimasto invariato e fuori dal repository. La copia per il sito è identificata da una nota su ogni pagina e pesa 6.99 MB. SHA-256: `4d7b2b90780b3c66fd8b7f18f3ce3ae6a5168309db1a300099943cd2bd5ccf4f`.

Lo statuto riporta l’indirizzo alla data della registrazione. Il documento storico non è stato riscritto: la sede attuale confermata è **Via Fonte d’Amore SNC, Sulmona (AQ), Italia**, centralizzata in `config/site.json`. Il collegamento pubblico chiarisce questa distinzione.

Prima di aggiungere un PDF, il responsabile deve approvarne contenuto e pubblicazione, verificando che siano rimossi firme autografe, recapiti personali e altri dati non necessari. Non caricare qui la copia integrale riservata: il repository è pubblico.

Per ulteriori documenti, aggiungere il file solo dopo quella revisione e una voce in `config/site.json` con `title`, `path`, `source` dell’approvazione e `verified: true`. `note` permette di chiarire la natura della copia. L’assenza del file o della fonte blocca la build. Non abilitare una voce vuota o non approvata. Il builder pubblica soltanto i documenti verificati; questo README è escluso dall’artefatto.
