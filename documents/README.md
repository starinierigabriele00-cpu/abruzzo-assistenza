# Documenti istituzionali

Questa cartella è la posizione prevista per una copia dello statuto e altri PDF approvati per la consultazione pubblica. Al momento non contiene una copia approvata dello statuto; il sito offre il contatto del referente, senza link fittizi.

Prima di aggiungere un PDF, il responsabile deve approvarne contenuto e pubblicazione, verificando che siano rimossi firme autografe, recapiti personali e altri dati non necessari. Non caricare qui la copia integrale riservata: il repository è pubblico.

Solo dopo quella revisione aggiungere il file, per esempio `documents/statuto.pdf`, e una voce in `config/site.json` con `title`, `path`, `source` dell’approvazione e `verified: true`. L’assenza del file o della fonte blocca la build. Non abilitare una voce vuota o non approvata. Il builder pubblica soltanto i documenti verificati; questo README è escluso dall’artefatto.
