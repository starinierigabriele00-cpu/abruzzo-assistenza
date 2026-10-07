import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/app.js", import.meta.url), "utf8");
const context = vm.createContext({
  document: { querySelector: () => null, querySelectorAll: () => [] },
});
vm.runInContext(
  source + "\nthis.api = { buildRequestMessage, whatsappUrl, SERVICE_LABELS };",
  context,
);
const { buildRequestMessage, whatsappUrl, SERVICE_LABELS } = context.api;
const form = (values) => new Map(Object.entries(values));

test("all nine service choices have meaningful request labels", () => {
  assert.equal(Object.keys(SERVICE_LABELS).length, 9);
  for (const [service, label] of Object.entries(SERVICE_LABELS)) {
    assert.ok(buildRequestMessage(form({ service })).includes("Richiesta: " + label));
  }
});
test("international request includes route and Italian date without identity requirements", () => {
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
