import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/app.js", import.meta.url), "utf8");
const context = vm.createContext({
  document: { querySelector: () => null, querySelectorAll: () => [] },
});
vm.runInContext(
  source +
    "\nthis.api = { buildRequestMessage, whatsappUrl, SERVICE_LABELS, requestContactErrors };",
  context,
);
const { buildRequestMessage, whatsappUrl, SERVICE_LABELS, requestContactErrors } = context.api;
const form = (values) => new Map(Object.entries(values));

test("all nine service choices have meaningful request labels", () => {
  assert.equal(Object.keys(SERVICE_LABELS).length, 9);
  for (const [service, label] of Object.entries(SERVICE_LABELS)) {
    assert.ok(buildRequestMessage(form({ service })).includes("Richiesta: " + label));
  }
});
test("booking intent stays an explicit request awaiting confirmation", () => {
  for (const service of ["trasporti", "dialisi", "disabili", "nazionali", "esteri"]) {
    const message = buildRequestMessage(form({ service }));
    assert.match(message, /vorrei prenotare un trasporto/);
    assert.match(message, /in attesa di una valutazione e della conferma/);
  }
  assert.match(buildRequestMessage(form({ service: "volontari" })), /propormi per il volontariato/);
  assert.match(buildRequestMessage(form({ service: "sostegno" })), /proporre un sostegno/);
});
test("an international draft still previews the route and date before identification is complete", () => {
  const message = buildRequestMessage(
    form({ service: "esteri", from: " Sulmona ", to: "Lione", date: "2026-10-25" }),
  );
  assert.match(
    message,
    /Trasferimento internazionale\nPartenza: Sulmona\nDestinazione: Lione\nData indicativa: 25\/10\/2026/,
  );
  assert.doesNotMatch(message, /Nome:|Telefono:/);
  assert.match(message, /in attesa di una valutazione/);
});
test("requester identity precedes the service and organizational details in the message", () => {
  const values = {
    service: "trasporti",
    firstName: " Mario ",
    lastName: "Rossi",
    phone: "+39 333 123 4567",
    from: "Sulmona",
    to: "Pescara",
    date: "2026-10-15",
  };
  const message = buildRequestMessage(form(values));
  assert.equal(
    message,
    "Buongiorno Abruzzo Assistenza, vorrei prenotare un trasporto.\n\nNome: Mario\nCognome: Rossi\nTelefono: +39 333 123 4567\n\nRichiesta: Trasporto sanitario\nPartenza: Sulmona\nDestinazione: Pescara\nData indicativa: 15/10/2026\n\nResto in attesa di una valutazione e della conferma dei dettagli.",
  );
});
test("only the three requester fields are necessary for transport completion", () => {
  for (const service of ["trasporti", "dialisi", "disabili", "nazionali", "esteri"]) {
    assert.deepEqual(Object.keys(requestContactErrors(form({ service }))), [
      "firstName",
      "lastName",
      "phone",
    ]);
    assert.deepEqual(
      Object.keys(
        requestContactErrors(
          form({ service, firstName: "Élodie", lastName: "D’Amico", phone: "+33 6 12 34 56 78" }),
        ),
      ),
      [],
    );
    assert.ok(
      requestContactErrors(form({ service, firstName: "  ", lastName: "\t", phone: " " }))
        .firstName,
    );
  }
  for (const service of ["eventi", "volontari", "sostegno", "altro"]) {
    assert.deepEqual(Object.keys(requestContactErrors(form({ service }))), []);
  }
});
test("phone validation accepts Italian and international numbers with common separators", () => {
  for (const phone of [
    "3331234567",
    "+39 333 123 4567",
    "0864 123456",
    "+44 (20) 7946-0958",
    "0044 20 7946 0958",
    "+1 (202) 555-0123",
    "+33 6.12.34.56.78",
    "333/1234567",
    "+39\u00a0333\u00a0123\u00a04567",
    "+91 98765 43210",
  ]) {
    assert.equal(requestContactErrors(form({ service: "altro", phone })).phone, undefined, phone);
  }
  for (const phone of [
    "123",
    "1234567890123456",
    "call me",
    "+",
    "++39 333 1234567",
    "+39 333 1234567 abc",
  ]) {
    assert.ok(requestContactErrors(form({ service: "altro", phone })).phone, phone);
  }
});
test("requester names and phone survive WhatsApp encoding without changing their meaning", () => {
  const message = buildRequestMessage(
    form({
      service: "esteri",
      firstName: "Chloé",
      lastName: "O’Connor & Rossi",
      phone: "+44 (20) 7946-0958",
    }),
  );
  assert.equal(new URL(whatsappUrl(message)).searchParams.get("text"), message);
  assert.match(message, /Nome: Chloé\nCognome: O’Connor & Rossi\nTelefono: \+44 \(20\) 7946-0958/);
});
test("optional contact details remain relevant while transport-only values are excluded", () => {
  const message = buildRequestMessage(
    form({
      service: "volontari",
      firstName: "Mario",
      lastName: "Rossi",
      phone: "333 1234567",
      from: "Hidden origin",
      wheelchair: "si",
      zone: "Pescara",
    }),
  );
  assert.match(message, /Nome: Mario\nCognome: Rossi\nTelefono: 333 1234567/);
  assert.match(message, /Richiesta: Volontariato\nZona: Pescara/);
  assert.doesNotMatch(message, /Hidden origin|carrozzina/);
});
test("empty optional details produce a useful short message without fabricated values", () => {
  const message = buildRequestMessage(form({ service: "dialisi", from: " ", notes: " " }));
  assert.match(message, /Dialisi o terapia ricorrente/);
  assert.doesNotMatch(message, /Partenza:|Destinazione:|Note:|Data indicativa:/);
});
test("wheelchair requests include both relevant questions even when undecided", () => {
  const undecided = buildRequestMessage(form({ service: "disabili" }));
  assert.match(undecided, /Utilizzo di carrozzina: Da valutare/);
  assert.match(undecided, /restare sulla carrozzina durante il viaggio: Da valutare/);
  const specified = buildRequestMessage(
    form({ service: "disabili", wheelchair: "si", stayWheelchair: "no" }),
  );
  assert.match(specified, /Utilizzo di carrozzina: Sì/);
  assert.match(specified, /restare sulla carrozzina durante il viaggio: No/);
});
test("irrelevant route and wheelchair answers never leak into a volunteer request", () => {
  const message = buildRequestMessage(
    form({
      service: "volontari",
      from: "Hidden origin",
      wheelchair: "si",
      date: "2026-10-25",
      zone: "Pescara",
      availability: "Sabato",
      skills: "Organizzazione",
    }),
  );
  assert.match(
    message,
    /Zona: Pescara\nDisponibilità indicativa: Sabato\nEventuali competenze: Organizzazione/,
  );
  assert.doesNotMatch(message, /Hidden origin|carrozzina|Data indicativa:/);
});
test("event and recurring therapy requests contain their own organizational details", () => {
  assert.match(
    buildRequestMessage(
      form({ service: "eventi", place: "Sulmona", duration: "3 ore", eventType: "Corsa" }),
    ),
    /Luogo: Sulmona\nDurata indicativa: 3 ore\nTipo di manifestazione: Corsa/,
  );
  assert.match(
    buildRequestMessage(form({ service: "dialisi", frequency: "Martedì" })),
    /Giorni o frequenza: Martedì/,
  );
  assert.match(
    buildRequestMessage(form({ service: "sostegno", organization: "Associazione locale" })),
    /Organizzazione: Associazione locale/,
  );
});
test("WhatsApp encoding preserves accents, ampersands, newlines and literal markup", () => {
  const message = buildRequestMessage(
    form({ service: "altro", notes: "<img src=x onerror=alert(1)>\nCittà & B? #test 😀" }),
  );
  const url = new URL(whatsappUrl(message));
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/393336823324");
  assert.equal(url.searchParams.get("text"), message);
  assert.equal(url.hash, "");
});
test("unexpected service codes and prototype keys cannot inject a label", () => {
  for (const service of ["unknown\nINJECTED", "__proto__", "constructor"]) {
    const message = buildRequestMessage(form({ service, date: "unexpected" }));
    assert.match(message, /Richiesta: Altro\n/);
    assert.doesNotMatch(message, /INJECTED|Data indicativa:/);
  }
});
test("invalid UTF-16 input does not break the WhatsApp link", () => {
  assert.doesNotThrow(() => whatsappUrl("test\uD800"));
  assert.equal(new URL(whatsappUrl("test\uD800")).searchParams.get("text"), "test\uFFFD");
});
