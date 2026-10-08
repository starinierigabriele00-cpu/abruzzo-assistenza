# Provenienza di font, fotografie, icone e geografia

## Identità e fotografia autentica

Materiali presenti nel repository, recuperati il 6 ottobre 2026:

- `logo-associazione.jpg`: logo dalla [pagina ufficiale Facebook](https://www.facebook.com/photo/?fbid=518426256741264&set=a.518426206741269), JPEG 1080 × 1080. La variante `logo-associazione-small.jpg` è 192 × 192; `logo-associazione-96.webp` (4.864 byte) è la versione a 96 × 96 usata nei template per ridurre il trasferimento mantenendo nitidezza su schermi ad alta densità; `favicon.png` è una riduzione a 48 × 48. Il vecchio PNG incompleto è conservato come sorgente storica, escluso dalla build.
- `mezzi-associazione.jpg`: [copertina della stessa pagina](https://www.facebook.com/photo/?fbid=518426253407931&set=a.518426210074602), 1440 × 808. AA.V2 produce WebP 1440 px (qualità 82, 181.208 byte) e 800 px (qualità 84, 87.622 byte). Il JPEG resta fallback e sorgente. `social-preview.jpg` è un crop 1200 × 630 della stessa fotografia con overlay grafite. Non sono state generate fotografie o ricostruzioni di mezzi. La foto non prova dotazioni o disponibilità attuale della flotta. L’associazione deve confermare i diritti di utilizzo per la pubblicazione.
- `fonts/IBMPlexSans-{Regular,Medium,SemiBold}.woff2`: [repository ufficiale IBM Plex](https://github.com/IBM/plex/tree/master/packages/plex-sans/fonts/complete/woff2), pesi 400/500/600; licenza OFL in `fonts/LICENSE.txt`.

## Recapiti

La raccolta originaria da [Facebook ufficiale](https://www.facebook.com/profile.php?id=100057216829022) documentava il telefono `333 682 3324` e un indirizzo Libero. Il 7 ottobre 2026 il committente ha corretto esplicitamente l’email in **abruzzoassistenzaodv@gmail.com**: questa conferma è la fonte corrente e sostituisce i recapiti divergenti precedenti. I dati sono centralizzati in `config/site.json`. Il canale Facebook non è stato nuovamente verificabile dal browser di ricerca durante questa sessione.

Indirizzo e codice fiscale presenti nel vecchio codice non avevano un documento di verifica associato: sono conservati nella configurazione non pubblica con `legal.verified: false`, esclusi da HTML e JS pubblico. L’email non viene usata per attribuire qualifiche ODV/ETS. Nessuna disponibilità H24, abilitazione, accreditamento 5×1000 o dotazione dei mezzi viene inferita.

## Mappa locale

`abruzzo-map.svg` deriva dal confine regionale ISTAT redistribuito nel progetto [guglielmo/geojson-italy](https://github.com/guglielmo/geojson-italy), con licenza [CC BY 4.0](https://github.com/guglielmo/geojson-italy/blob/main/LICENSE). La fonte dichiara confini ISTAT, vintage 1 gennaio 2026. Fonte scaricata il 7 ottobre 2026: `https://raw.githubusercontent.com/guglielmo/geojson-italy/main/geojson/limits_IT_regions.geojson`; SHA-256 `97e9dc4c8ddb83e1d32c9f75f2007f7410f233e465cb529c6f8cf6f5ac488b0f`.

La revisione dell’8 ottobre 2026 mantiene il poligono `reg_istat_code: 13` e aggiunge il contesto delle regioni confinanti e i confini delle quattro province abruzzesi. Questi ultimi derivano da `https://raw.githubusercontent.com/guglielmo/geojson-italy/main/geojson/limits_IT_provinces.geojson`, stessa provenienza ISTAT e licenza CC BY 4.0; SHA-256 `08db9b436f1cee666a8c789084d2857e1444543b89b2129d3c1d9f1c2efdee66`, scaricato l’8 ottobre 2026.

La trasformazione delle coordinate WGS84 usa Web Mercator, scala uniforme e traslazione. La semplificazione Ramer–Douglas–Peucker mantiene un errore massimo di **0,18 px** nello spazio SVG (prima 0,8 px); la scala dei 40 km tiene conto della latitudine centrale di 42,3°. I confini e la costa derivano dai dati geografici, non sono disegnati a mano. Le etichette delle regioni vicine sono posizionate rispetto al baricentro dei rispettivi poligoni visibili. La mappa non rappresenta strade, itinerari o la posizione corrente dei mezzi. Attribuzione visibile nella legenda e nei metadati SVG. Non sono usati confini GISCO con restrizioni di uso commerciale.

`scripts/build-map.py` riproduce l’SVG con la sola libreria standard Python e controlla gli hash delle due sorgenti prima di scrivere. Non scarica dati e non viene eseguito durante il deploy: la mappa finale, 37.372 byte, è self-hosted e già inclusa nell’elenco degli asset della build. Dopo avere scaricato i due file originali nei percorsi indicati:

```bash
python3 scripts/build-map.py --regions /tmp/abruzzo-regions.geojson --provinces /tmp/abruzzo-provinces.geojson
```

I punti rappresentano i centri urbani, non le sedi o la posizione dei mezzi. Fonte: [GeoNames cities15000](https://download.geonames.org/export/dump/cities15000.zip), recuperata il 7 ottobre 2026, [CC BY 4.0](https://www.geonames.org/about.html):

| Città   | ID GeoNames | Latitudine | Longitudine |
| ------- | ----------- | ---------- | ----------- |
| Sulmona | 3166034     | 42.04945   | 13.92578    |
| Pescara | 3171168     | 42.45840   | 14.20283    |

## Icone locali

I tracciati di WhatsApp, Instagram e Facebook in `icons.svg` provengono da [Simple Icons](https://github.com/simple-icons/simple-icons), licenza CC0, recuperati il 7 ottobre 2026 dai file `icons/{whatsapp,instagram,facebook}.svg`. I marchi identificano i rispettivi canali; la licenza dei tracciati non sostituisce le condizioni d’uso dei marchi. Telefono, email, menu, posizione e chevron sono pittogrammi UI locali.

SHA-256 dei tre SVG sorgente:

- WhatsApp: `8fb209a53a61618c3483594b3e070481a35575d6aaecbe00a6fe386670c8fb1c`
- Instagram: `f53af2d1fc5292ba1433b5c1faf50005ce6a997fa302d1816989929f379a59dc`
- Facebook: `b06d18d844ed621b89faffb1a33440cc0ec4f1ffea9f36191f50db19a47c59a6`

Font, icone, fotografie e mappa sono serviti localmente. Nessun iframe, social embed, CDN o tracker è aggiunto.
