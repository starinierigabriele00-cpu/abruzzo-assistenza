# Abruzzo Assistenza — decisioni e procedura da approvare

Preparato l’8 ottobre 2026 per il presidente e il responsabile dell’associazione. Questo documento contiene **proposte, non procedure già adottate**. Non è una certificazione GDPR e non entra nell’artefatto Cloudflare. Il repository è pubblico: non aggiungere credenziali, nomi degli incaricati, richieste reali o informazioni sanitarie.

## Dati e comportamenti confermati

Il committente conferma denominazione statutaria, ODV/ETS, iscrizione RUNTS, codice fiscale 02227430663 e sede trasferita in Via Fonte d’Amore SNC, Sulmona (AQ), Italia. Sono centralizzati in `config/site.json`. Non è stata eseguita una nuova ricerca sulla sede o sull’iscrizione. Il 5×1000 è accreditato in generale: nessuna ammissione a un riparto annuale specifico è documentata. `year: null` e `yearSource: ""` impediscono di trasformare la conferma generale in una dichiarazione sul 2026.

Il titolare è l’associazione. WhatsApp viene gestito da una persona incaricata alla volta, che può cambiare. Email: presidente, vicepresidente e soci autorizzati. Le richieste vengono condivise internamente tra queste persone e i soci coinvolti, per valutare e organizzare le attività. Ulteriori informazioni sanitarie possono arrivare nella conversazione WhatsApp o durante una telefonata successiva dell’associazione. Le comunicazioni possono restare archiviate senza un termine prestabilito o essere eliminate manualmente: **manca una politica formale di conservazione**.

Il sito prepara il messaggio nel browser. Non invia richieste durante la compilazione, non conserva gli input sul server o nello storage del browser e non chiede diagnosi o referti. Il collegamento WhatsApp include il testo e lo comunica al servizio quando viene aperto; l’invio in chat richiede un’ulteriore azione. Domande sulla carrozzina facoltative, pertinenti all’organizzazione del viaggio. Una richiesta non equivale a una prenotazione confermata.

## Decisioni necessarie prima dell’approvazione finale della privacy

La pagina `privacy.html` descrive i fatti confermati e rende esplicite le informazioni ancora mancanti. È un candidato da revisionare: non rappresenta un’informativa definitivamente completa finché le decisioni sotto non sono state adottate e riportate nella pagina.

| Ambito                            | Decisione richiesta al titolare                                                                                                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Richieste informative e trasporti | Precisare la base dell’art. 6 per ogni finalità. Le misure precontrattuali possono essere pertinenti a una richiesta di servizio, ma non si estendono automaticamente a tutte le comunicazioni.                       |
| Salute e mobilità                 | Individuare e documentare una condizione dell’art. 9, oltre all’art. 6, e le modalità di informazione e raccolta. Un messaggio spontaneo o una checkbox generica non costituiscono da soli una verifica sufficiente.  |
| Volontariato e collaborazioni     | Definire dati necessari, presupposti, persone autorizzate e chiusura della richiesta.                                                                                                                                 |
| Familiari e accompagnatori        | Definire come informare la persona interessata quando i dati vengono forniti da altri, senza presumere una delega.                                                                                                    |
| Conservazione                     | Approvare criteri, termini massimi, decorrenze e controlli differenziati; includere dispositivi, email, inoltri e backup.                                                                                             |
| Fornitori                         | Verificare servizi e contratti effettivi, ruoli, eventuali nomine, destinatari, trasferimenti e garanzie applicabili.                                                                                                 |
| Diritti e sicurezza               | Identificare un referente operativo, una modalità di risposta e misure proporzionate ai dati trattati. Valutare gli ulteriori adempimenti applicabili, senza attribuire all’ente obblighi o esenzioni non verificati. |

Non presumere che la qualifica ODV/ETS autorizzi qualsiasi trattamento sanitario o che la sola natura del trasporto dimostri la presenza di tutte le condizioni richieste. Se si valuta il consenso esplicito, vanno definiti raccolta, prova, revoca e conseguenze concrete con un consulente competente. Non è stata aggiunta una checkbox al composer.

Riferimento normativo: [Regolamento UE 2016/679](https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32016R0679), in particolare artt. 5, 6, 9, 12–22, 28 e 32. Il testo vigente deve guidare l’approvazione; le proposte operative seguenti non sostituiscono questa valutazione.

## Fornitori: verifica contrattuale separata

- **Cloudflare Pages:** hosting e protezione del sito, con dati tecnici di accesso. Il [DPA Cloudflare](https://www.cloudflare.com/cloudflare-customer-dpa/) distingue il trattamento per conto del cliente da altri trattamenti propri. Verificare account intestatario, rapporto con l’associazione, contratto applicabile, impostazioni di log e trasferimenti. L’accesso tecnico dell’account di Gabriele non dimostra da solo la formalizzazione di questi rapporti.
- **Gmail:** l’indirizzo confermato è `abruzzoassistenzaodv@gmail.com`. Verificare l’edizione e i termini effettivamente utilizzati. Google dichiara che Gmail consumer non offre un DPA e non opera come responsabile in quella versione: non classificare automaticamente Google come responsabile dell’associazione. L’indirizzo, da solo, non documenta eventuali servizi professionali aggiuntivi. [Fonte Google](https://support.google.com/policies/answer/9581826?hl=it).
- **WhatsApp:** verificare app utilizzata, account, dispositivi collegati e backup. Non risultano API di messaggistica nel sito; non attribuire al servizio i contratti delle API Business. Esaminare le [condizioni privacy per lo Spazio economico europeo](https://www.whatsapp.com/legal/privacy-policy-eea) e i ruoli effettivi. La sicurezza delle conversazioni non sostituisce le condizioni giuridiche per i dati sanitari.
- **Telefonia e altri soggetti:** individuare gli eventuali fornitori o soggetti realmente coinvolti. Non affermare che tutte le informazioni rimangano esclusivamente nei dispositivi dell’associazione.

## Procedura proposta per le richieste

1. **Ricezione:** acquisire solo recapito, percorso, data indicativa e necessità organizzative pertinenti. Il primo contatto non deve richiedere diagnosi o documenti clinici. Non chiedere altri dati sanitari prima di aver definito le condizioni e l’informativa per quella raccolta.
2. **Valutazione:** distinguere domanda informativa, possibile servizio, volontariato e collaborazione. Se occorrono informazioni aggiuntive, spiegarne lo scopo e individuare il canale e l’incaricato autorizzato.
3. **Condivisione:** comunicare ai soci coinvolti solo quanto necessario. Evitare l’inoltro integrale della conversazione quando bastano percorso e indicazioni operative. Non inserire dati in gruppi senza averne valutato accessi e necessità.
4. **Conferma:** comunicare esplicitamente disponibilità e dettagli concordati. Il messaggio iniziale non costituisce conferma.
5. **Chiusura:** classificare l’esito e applicare il criterio di conservazione approvato. Separare i dati necessari alla pratica dai dettagli diventati inutili; gestire anche copie e inoltri.
6. **Richieste di diritti:** indirizzare le richieste all’email pubblica del titolare; verificare l’identità in modo proporzionato, assegnare un referente e documentare la gestione secondo i termini applicabili. Non chiedere documenti di identità per routine senza necessità.

## Proposta di conservazione e cancellazione

Nessuno dei criteri sotto è attualmente approvato. **Non sono stati inventati termini numerici né configurate cancellazioni automatiche.** Il presidente deve stabilire termini massimi e frequenza di revisione, con verifica delle esigenze legali effettive, prima di comunicare una politica definitiva.

| Categoria                     | Evento da cui valutare la chiusura                       | Criterio proposto da approvare                                                                                                                    |
| ----------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Semplice informazione         | Risposta completata o assenza di seguito                 | Eliminare quanto non serve più; fissare un limite massimo e una decorrenza per le richieste senza seguito.                                        |
| Servizio non confermato       | Rinuncia o indisponibilità comunicata                    | Chiudere la richiesta e rimuovere i dettagli sanitari non più necessari, salvo esigenze documentate.                                              |
| Servizio effettuato           | Conclusione del servizio e delle attività amministrative | Separare documentazione necessaria a obblighi o tutela dei diritti dai contenuti della chat; verificare termini e accessi per ciascuna categoria. |
| Volontariato o collaborazione | Esito del confronto con il referente                     | Distinguere proposta chiusa da rapporto effettivamente avviato; non archiviare indefinitamente candidature inattive.                              |
| Backup e inoltri              | Cancellazione della comunicazione principale             | Individuare copie, soggetti autorizzati, ciclo di sostituzione e limiti tecnici; non promettere una cancellazione già applicata a tutti i backup. |
| Log tecnici                   | Raccolta da parte del fornitore                          | Accertare dati disponibili, impostazioni e conservazione contrattuale; non usare il termine delle chat per descrivere i log.                      |

Per rendere applicabile la procedura, preparare **in un sistema interno autorizzato**, senza dati sanitari in questo repository, una scheda minima: categoria, apertura, chiusura, criterio approvato, data di revisione/cancellazione, incaricato e copie da gestire. Non serve aggiungere un database al sito. Riesaminare periodicamente richieste aperte e archivi; registrare solo l’esito necessario del controllo.

## Checklist di sicurezza per il presidente

Tutte le voci indicano misure da valutare e approvare, non garanzie su configurazioni già attive.

- [ ] Elencare persone autorizzate e attività consentite; consegnare istruzioni di riservatezza e minimizzazione.
- [ ] Verificare autenticazione a due fattori, recupero account, dispositivi protetti e aggiornati; evitare credenziali condivise quando esistono accessi delegati appropriati.
- [ ] Per Gmail verificare chi può leggere, inoltrare o scaricare i messaggi; controllare deleghe, filtri e accessi effettivi.
- [ ] Per WhatsApp assegnare un incaricato attuale, verificare dispositivi collegati e predisporre il passaggio di consegne quando cambia la persona.
- [ ] Revocare tempestivamente accessi non più autorizzati e riesaminare le copie precedentemente inoltrate.
- [ ] Limitare gli inoltri ai soci coinvolti e separare comunicazioni operative da informazioni sanitarie non pertinenti.
- [ ] Verificare esistenza, protezione, destinatari e conservazione dei backup; evitare esportazioni indiscriminate delle conversazioni.
- [ ] Definire cosa fare per smarrimento del telefono, accesso abusivo o invio al destinatario errato: contenimento, referente, documentazione e valutazione degli obblighi applicabili.
- [ ] Approvare la procedura di conservazione e aggiornare l’informativa quando viene adottata.

Nessuna password, autorizzazione, account o impostazione esterna è stata modificata durante questa wave.

## Statuto e trasparenza

Non è presente una copia approvata pubblicabile dello statuto. [documents/README.md](documents/README.md) indica la posizione e il gate per una futura copia realmente disponibile, autorizzata e priva di firme o dati personali non necessari. Nessun PDF fittizio, download mancante o rendiconto inventato. Identità e informazioni confermate sono raggiungibili dai Contatti e dal footer.

## Cookie e possibili analytics futuri

Il codice non introduce cookie, tracker, salvataggi persistenti o embed. Cloudflare Web Analytics resta disattivato; non è stato aggiunto un banner. I cookie tecnici eventualmente legati a protezioni attivate dal provider vanno distinti dalla profilazione. [Cookie Cloudflare](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/), [linee guida del Garante](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876).

Se in futuro si desiderano statistiche, definire prima lo scopo e valutare concretamente lo strumento, i dati, i destinatari e gli obblighi informativi o di consenso. Nessuna integrazione è implementata o autorizzata ora.

## Google Search Console: procedura per il titolare

Non c’è evidenza nel repository di una proprietà già verificata. Sitemap pronta: `https://abruzzoassistenzaodv.com/sitemap.xml`, sette pagine principali; 404 e vecchi indirizzi di rimando sono esclusi.

1. Accedere con un account Google autorizzato e aggiungere la proprietà **Dominio** `abruzzoassistenzaodv.com`, oppure il prefisso URL esatto `https://abruzzoassistenzaodv.com/`.
2. Per la proprietà Dominio usare esclusivamente il TXT fornito da Search Console. Chiedere l’autorizzazione prima di aggiungerlo nella zona Cloudflare. In alternativa scegliere un metodo supportato per il prefisso URL: qualsiasi file o meta tag richiede il valore reale fornito da Google e una modifica separata approvata. Non sono stati inventati codici di verifica.
3. Dopo la verifica inviare `sitemap.xml`, controllare l’URL canonico della home e delle pagine Servizi, Contatti e Pescara con Ispezione URL e, dove disponibile, richiedere l’indicizzazione.
4. Controllare successivamente pagine indicizzate, esclusioni e redirect. L’invio della sitemap non garantisce tempi o risultato dell’indicizzazione.

[Verifica proprietà Google](https://support.google.com/webmasters/answer/9008080?hl=it), [gestione sitemap](https://support.google.com/webmasters/answer/7451001?hl=it). Nessuna operazione è stata eseguita sull’account Google, sui DNS o sulla configurazione Cloudflare.

## Approvazioni di pubblicazione

Il committente ha autorizzato contenuti istituzionali, accreditamento generale 5×1000 e, l’8 ottobre 2026, il merge su `main` e il conseguente deploy Cloudflare dopo i controlli verdi. Restano l’approvazione organizzativa/giuridica dei punti privacy sopra e l’adozione delle procedure proposte: l’autorizzazione tecnica alla pubblicazione non equivale a queste decisioni. Push sul branch della PR significa solo candidato/preview; l’esito effettivo è documentato nella PR e nei check dei commit. Non attivare tracker o statistiche. Le operazioni Google richiedono un account autorizzato e il codice di verifica reale; nessun codice è stato inventato.
