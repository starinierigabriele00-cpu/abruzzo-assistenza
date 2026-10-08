import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const dependencies = createRequire(resolve(process.env.ABRUZZO_TEST_DEPS || ".", "package.json"));
const { JSDOM } = dependencies("jsdom");
const root = new URL("../", import.meta.url);
const code = readFileSync(new URL("assets/app.js", root), "utf8");
function page(t, file = "contatti.html", query = "", width = 390, run = true) {
  const dom = new JSDOM(readFileSync(new URL(file, root), "utf8"), {
    url: `https://example.test/${file}${query}`,
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  t.after(() => dom.window.close());
  const { window } = dom;
  const media = new Map();
  let currentWidth = width;
  window.matchMedia = (query) => {
    if (!media.has(query)) {
      const mq = new window.EventTarget();
      mq.matches = currentWidth <= Number(query.match(/max-width:\s*(\d+)/)[1]);
      media.set(query, mq);
    }
    return media.get(query);
  };
  window.fetch = () => {
    throw new Error("UI submitted a network request");
  };
  Object.defineProperty(window, "localStorage", {
    get() {
      throw new Error("UI persisted a request");
    },
  });
  window.HTMLElement.prototype.scrollIntoView = function () {};
  if (run) window.eval(code);
  return {
    window,
    document: window.document,
    resize(next) {
      currentWidth = next;
      for (const [query, mq] of media) {
        const matches = next <= Number(query.match(/max-width:\s*(\d+)/)[1]);
        if (matches !== mq.matches) {
          mq.matches = matches;
          mq.dispatchEvent(new window.Event("change"));
        }
      }
    },
    tick: () => new Promise((resolve) => window.setTimeout(resolve, 10)),
  };
}
function select(p, value) {
  p.document.querySelector(`input[name="service"][value="${value}"]`).click();
}
function input(p, name, value) {
  const control = p.document.querySelector("form").elements.namedItem(name);
  control.value = value;
  control.dispatchEvent(new p.window.Event("input", { bubbles: true }));
}
const message = (p) => p.document.querySelector("[data-message-text]").textContent;

test("service query preselects all valid services and unknown queries safely fall back", (t) => {
  for (const service of [
    "trasporti",
    "dialisi",
    "disabili",
    "nazionali",
    "esteri",
    "eventi",
    "volontari",
    "sostegno",
    "altro",
  ]) {
    const p = page(t, "contatti.html", `?servizio=${service}#richiesta`);
    assert.equal(p.document.querySelector('input[name="service"]:checked').value, service);
    assert.equal(p.document.querySelector("form").hidden, false);
  }
  assert.equal(
    page(t, "contatti.html", "?servizio=__proto__").document.querySelector(
      'input[name="service"]:checked',
    ).value,
    "trasporti",
  );
});
test("each service shows only relevant fields and does not require name or telephone", (t) => {
  const p = page(t);
  const form = p.document.querySelector("form");
  assert.equal(form.querySelectorAll("[required]").length, 0);
  assert.equal(form.elements.namedItem("name"), null);
  assert.equal(form.elements.namedItem("phone"), null);
  select(p, "volontari");
  assert.equal(form.elements.from.disabled, true);
  assert.equal(form.elements.zone.disabled, false);
  assert.equal(form.elements.zone.closest("[data-for]").hidden, false);
  select(p, "eventi");
  assert.equal(form.elements.zone.disabled, true);
  assert.equal(form.elements.place.disabled, false);
  assert.equal(form.elements.date.disabled, false);
  select(p, "altro");
  assert.equal(form.elements.date.disabled, true);
  assert.equal(form.elements.notes.disabled, false);
});
test("wheelchair service shows both specific questions and serializes the answers", (t) => {
  const p = page(t, "contatti.html", "?servizio=disabili");
  const form = p.document.querySelector("form");
  assert.equal(form.elements.wheelchair.disabled, false);
  assert.equal(form.elements.stayWheelchair.disabled, false);
  input(p, "wheelchair", "si");
  input(p, "stayWheelchair", "si");
  assert.match(message(p), /Utilizzo di carrozzina: Sì/);
  assert.match(message(p), /restare sulla carrozzina durante il viaggio: Sì/);
});
test("live preview and encoded destination update locally without navigation", (t) => {
  const p = page(t);
  const originalUrl = p.window.location.href;
  input(p, "from", "Sulmona");
  input(p, "to", "Città & centro");
  input(p, "date", "2026-11-20");
  assert.match(
    message(p),
    /Partenza: Sulmona\nDestinazione: Città & centro\nData indicativa: 20\/11\/2026/,
  );
  const link = new URL(p.document.querySelector("[data-message-link]").href);
  assert.equal(link.searchParams.get("text"), message(p));
  assert.equal(p.window.location.href, originalUrl);
  input(p, "to", "Roma");
  assert.match(message(p), /Destinazione: Roma/);
  assert.doesNotMatch(message(p), /Città/);
});
test("switching services omits hidden values and returning preserves editable details", (t) => {
  const p = page(t);
  input(p, "from", "Sulmona");
  select(p, "volontari");
  assert.doesNotMatch(message(p), /Sulmona/);
  select(p, "trasporti");
  assert.match(message(p), /Sulmona/);
});
test("reset clears all values and returns to the initial transport choice", async (t) => {
  const p = page(t, "contatti.html", "?servizio=eventi");
  input(p, "place", "Pescara");
  select(p, "disabili");
  input(p, "wheelchair", "si");
  p.document.querySelector("form").reset();
  await p.tick();
  assert.equal(p.document.querySelector('input[name="service"]:checked').value, "trasporti");
  assert.equal(p.document.querySelector("form").elements.place.value, "");
  assert.equal(p.document.querySelector("form").elements.wheelchair.value, "");
  assert.doesNotMatch(message(p), /Pescara|carrozzina/);
});

test("optional notes collapse on phones without losing editable request details", async (t) => {
  const p = page(t);
  const notes = p.document.querySelector("[data-request-notes]");
  assert.equal(notes.open, false);
  notes.querySelector("summary").click();
  assert.equal(notes.open, true);
  input(p, "notes", "Ingresso dal cortile");
  assert.match(message(p), /Ingresso dal cortile/);
  p.resize(1440);
  assert.equal(notes.open, true);
  p.resize(390);
  assert.equal(notes.open, false);
  assert.match(message(p), /Ingresso dal cortile/);
  p.document.querySelector('button[type="reset"]').click();
  await p.tick();
  assert.doesNotMatch(message(p), /Ingresso dal cortile/);
});
test("user text is never rendered as markup", (t) => {
  const p = page(t);
  input(p, "notes", '<img src=x onerror="alert(1)">');
  assert.match(message(p), /<img/);
  assert.equal(p.document.querySelector("[data-message-text] img"), null);
});
test("copy requires an explicit click and clipboard failure selects the visible message", async (t) => {
  const p = page(t);
  const copied = [];
  p.window.navigator.clipboard = { writeText: async (value) => copied.push(value) };
  input(p, "from", "Prova locale");
  assert.equal(copied.length, 0);
  p.document.querySelector("[data-copy-message]").click();
  await p.tick();
  assert.equal(copied[0], message(p));
  assert.match(p.document.querySelector("[data-copy-status]").textContent, /Messaggio copiato/);
  p.window.navigator.clipboard.writeText = async () => {
    throw new Error("Denied");
  };
  p.document.querySelector("[data-copy-message]").click();
  await p.tick();
  assert.equal(p.window.getSelection().toString(), message(p));
  assert.match(p.document.querySelector("[data-copy-status]").textContent, /testo è selezionato/);
});
test("missing clipboard API uses the same accessible manual copy fallback", async (t) => {
  const p = page(t);
  p.document.querySelector("[data-copy-message]").click();
  await p.tick();
  assert.equal(p.window.getSelection().toString(), message(p));
});
test("mobile menu opens, Escape closes it and restores button focus", (t) => {
  const p = page(t, "index.html");
  const toggle = p.document.querySelector("[data-nav-toggle]");
  toggle.click();
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.ok(p.document.querySelector("[data-nav]").classList.contains("is-open"));
  p.document.dispatchEvent(new p.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(p.document.activeElement, toggle);
});
test("association is a direct active page link without a dropdown", (t) => {
  for (const width of [390, 1440]) {
    const p = page(t, "associazione.html", "", width);
    const link = p.document.querySelector('[data-nav] a[href="associazione.html"]');
    assert.equal(link.getAttribute("aria-current"), "page");
    assert.equal(p.document.querySelector("[data-nav] details"), null);
    assert.equal(p.document.querySelector("[data-nav-group]"), null);
    assert.ok(p.document.querySelector("#volontariato"));
    assert.ok(p.document.querySelector("#sostegno"));
  }
});
test("volunteering is a highlighted active page between services and association", (t) => {
  const p = page(t, "volontari.html");
  const navigation = p.document.querySelector("[data-nav]");
  assert.deepEqual(
    [...navigation.querySelectorAll("a")].map((link) => link.getAttribute("href")),
    ["index.html", "servizi.html", "volontari.html", "associazione.html", "contatti.html"],
  );
  assert.equal(navigation.querySelector(".nav-volunteer").getAttribute("aria-current"), "page");
  assert.equal(p.document.querySelector('meta[http-equiv="refresh"]'), null);
  assert.ok(p.document.querySelector('main a[href="associazione.html#volontariato"]'));
  const url = new URL(p.document.querySelector('main a[href*="servizio=volontari"]').href);
  assert.equal(url.searchParams.get("servizio"), "volontari");
  assert.equal(url.hash, "#richiesta");
});
test("links, outside focus and viewport changes close navigation", (t) => {
  const p = page(t, "index.html");
  const toggle = p.document.querySelector("[data-nav-toggle]");
  toggle.click();
  p.document.querySelector("main").click();
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  toggle.click();
  p.resize(1440);
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(p.document.querySelector("[data-nav]").classList.contains("is-open"), false);
  toggle.click();
  p.document.querySelector("[data-nav] a").click();
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
});
test("service index collapses on mobile without hiding any service sections", (t) => {
  const p = page(t, "servizi.html", "#esteri");
  const index = p.document.querySelector("[data-service-index]");
  assert.equal(index.open, false);
  index.querySelector("summary").click();
  assert.equal(index.open, true);
  index.querySelector('a[href="#esteri"]').click();
  assert.equal(index.open, false);
  assert.equal(p.document.querySelectorAll(".service-detail[hidden]").length, 0);
  p.resize(1440);
  assert.equal(index.open, true);
  index.querySelector("summary").click();
  assert.equal(index.open, true);
});
test("FAQ accordion uses native details and answers useful questions", (t) => {
  const p = page(t, "index.html");
  const faqs = [...p.document.querySelectorAll(".faq details")];
  assert.equal(faqs.length, 6);
  faqs[0].querySelector("summary").click();
  assert.equal(faqs[0].open, true);
  faqs[0].querySelector("summary").click();
  assert.equal(faqs[0].open, false);
  assert.match(faqs[5].textContent, /confermato solo dopo/);
});
test("unverified tax, donation and legal data are absent with and without JavaScript", (t) => {
  for (const run of [true, false])
    for (const file of ["index.html", "volontari.html", "associazione.html", "contatti.html"]) {
      const p = page(t, file, "", 390, run);
      assert.equal(p.document.querySelector("[data-verified]"), null);
      assert.doesNotMatch(p.document.body.textContent, /02227430663|Via Fonte|IBAN|PayPal/);
    }
});
test("no-JavaScript pages retain navigation, all services, FAQs and direct channels", (t) => {
  const home = page(t, "index.html", "", 390, false);
  assert.equal(home.document.querySelectorAll(".directory-item").length, 6);
  assert.equal(home.document.querySelector("[data-nav]").hidden, false);
  const services = page(t, "servizi.html", "", 390, false);
  assert.equal(services.document.querySelectorAll(".service-detail[hidden]").length, 0);
  const p = page(t, "contatti.html", "", 390, false);
  assert.equal(p.document.querySelector("form").hidden, true);
  assert.ok(p.document.querySelector('a[href="tel:+393336823324"]'));
  assert.ok(p.document.querySelector('a[href="https://wa.me/393336823324"]'));
  assert.ok(p.document.querySelector('a[href="mailto:abruzzoassistenzaodv@gmail.com"]'));
});
test("footer keeps institutional links and exactly one programmed-service emergency notice", (t) => {
  const p = page(t, "index.html");
  assert.equal(p.document.querySelectorAll('a[href="tel:112"]').length, 1);
  assert.ok(p.document.querySelector('footer a[href="privacy.html"]'));
  assert.ok(p.document.querySelector('footer a[href="pescara.html"]'));
  assert.ok(p.document.querySelector('footer a[href="associazione.html"]'));
  assert.equal(p.document.querySelectorAll("footer .footer-channel").length, 3);
  assert.equal(p.document.querySelector('footer a[href="trasparenza.html"]'), null);
  assert.equal(p.document.querySelectorAll(".mobile-navigation").length, 0);
});
test("legacy pages redirect to the consolidated sections with a no-JavaScript link", (t) => {
  for (const [file, destination] of [
    ["sostienici.html", "associazione.html#sostegno"],
    ["trasparenza.html", "contatti.html#associazione"],
  ]) {
    const p = page(t, file, "", 390, false);
    assert.equal(
      p.document.querySelector('meta[http-equiv="refresh"]').content,
      "0;url=" + destination,
    );
    assert.equal(p.document.querySelector('meta[name="robots"]').content, "noindex,follow");
    assert.ok(p.document.querySelector(`main a[href="${destination}"]`));
  }
});
