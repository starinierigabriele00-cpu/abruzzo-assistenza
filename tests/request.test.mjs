import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/app.js", import.meta.url), "utf8");
function load() {
  const context = vm.createContext({
    document: { querySelector: () => null, querySelectorAll: () => [] },
  });
  vm.runInContext(source + "\nthis.api = { buildRequestMessage, whatsappUrl };", context);
  return context.api;
}
const { buildRequestMessage, whatsappUrl } = load();
const form = (values) => new Map(Object.entries(values));

test("a complete request contains the route, service and Italian date", () => {
  const message = buildRequestMessage(
    form({
      name: "  Prova locale  ",
      phone: "0000000000",
      service: "esteri",
      from: "Sulmona",
      to: "Lione",
      date: "2026-10-25",
      notes: "Orario da concordare",
    }),
  );
  assert.match(message, /Nome: Prova locale\n/);
  assert.match(
    message,
    /Richiesta: Trasferimento estero\nPartenza: Sulmona\nDestinazione: Lione\nData: 25\/10\/2026/,
  );
  assert.match(message, /Note: Orario da concordare$/);
});

test("optional details left blank do not produce empty fields", () => {
  const message = buildRequestMessage(
    form({
      name: "Prova",
      phone: "0000000000",
      service: "dialisi",
      from: "  ",
      notes: "  ",
    }),
  );
  assert.match(message, /Richiesta: Dialisi \/ terapia ricorrente/);
  assert.match(message, /Partenza: da definire\nDestinazione: da definire\nData: da definire/);
  assert.match(message, /Note: nessuna$/);
});

test("WhatsApp text preserves accents, ampersands, line breaks and literal markup", () => {
  const message = buildRequestMessage(
    form({
      name: "Prova & città",
      service: "eventi",
      notes: "<img src=x onerror=alert(1)>\nA & B? #test",
    }),
  );
  const url = new URL(whatsappUrl(message));
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/393336823324");
  assert.equal(url.searchParams.get("text"), message);
  assert.equal(url.hash, "");
  assert.match(message, /<img src=x onerror=alert\(1\)>/);
});

test("unexpected service codes cannot inject their label into the request", () => {
  for (const service of ["unknown\nINJECTED", "__proto__", "constructor"]) {
    const message = buildRequestMessage(form({ service, date: "unexpected" }));
    assert.match(message, /Richiesta: Altro\n/);
    assert.match(message, /Data: da definire/);
    assert.equal(message.includes("INJECTED"), false);
  }
});
