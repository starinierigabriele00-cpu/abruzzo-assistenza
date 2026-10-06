import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

// Optional DOM integration checks; no development dependency is shipped to the site.
const dependencies = createRequire(resolve(process.env.ABRUZZO_TEST_DEPS || ".", "package.json"));
const { JSDOM } = dependencies("jsdom");
const root = new URL("../", import.meta.url);
const code = readFileSync(new URL("assets/app.js", root), "utf8");
function page(t, file, query = "", width = 390, run = true) {
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
  const scrolls = [];
  window.HTMLElement.prototype.scrollIntoView = function () {
    scrolls.push(this.id);
  };
  window.fetch = () => {
    throw new Error("UI submitted a network request");
  };
  if (run) window.eval(code);
  return {
    window,
    document: window.document,
    scrolls,
    resize(next) {
      currentWidth = next;
      for (const [query, mq] of media) {
        const nextMatches = next <= Number(query.match(/max-width:\s*(\d+)/)[1]);
        if (nextMatches !== mq.matches) {
          mq.matches = nextMatches;
          mq.dispatchEvent(new window.Event("change"));
        }
      }
    },
    frame: () => new Promise((resolve) => window.requestAnimationFrame(resolve)),
  };
}

test("mobile audience paths change their services and support arrow keys", (t) => {
  const p = page(t, "index.html");
  const tabs = [...p.document.querySelectorAll("[data-audience-tab]")];
  const privatePanel = p.document.querySelector("#panel-private");
  const organizationPanel = p.document.querySelector("#panel-organizations");
  assert.equal(organizationPanel.hidden, true);
  tabs[1].click();
  assert.equal(privatePanel.hidden, true);
  assert.equal(organizationPanel.hidden, false);
  assert.match(organizationPanel.textContent, /Assistenza a eventi/);
  tabs[1].dispatchEvent(new p.window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  assert.equal(privatePanel.hidden, false);
  assert.equal(p.document.activeElement, tabs[0]);
});

test("mobile upper menu complements the bottom bar without duplicating its destinations", (t) => {
  const p = page(t, "index.html");
  const primary = new Set(
    [...p.document.querySelectorAll(".mobile-navigation a")].map((link) =>
      link.getAttribute("href"),
    ),
  );
  const secondary = [...p.document.querySelectorAll(".nav-mobile-secondary a")];
  assert.equal(secondary.length, 4);
  assert.ok(secondary.every((link) => !primary.has(link.getAttribute("href"))));
  assert.deepEqual(
    secondary.map((link) => link.getAttribute("href")),
    ["pescara.html", "volontari.html", "sostienici.html", "trasparenza.html"],
  );
});

test("a linked mobile service opens and realigns after other services collapse", async (t) => {
  const p = page(t, "servizi.html", "#esteri");
  const body = p.document.querySelector("#detail-esteri");
  assert.equal(body.hidden, false);
  assert.equal(p.document.querySelector("#detail-trasporti").hidden, true);
  await p.frame();
  assert.ok(p.scrolls.includes("esteri"));
  p.document.querySelector("#esteri button").click();
  assert.equal(body.hidden, true);
  p.document.querySelector('.service-index a[href="#esteri"]').click();
  assert.equal(body.hidden, false);
});

test("desktop reads every service and mobile resets to its linked service on resize", (t) => {
  const p = page(t, "servizi.html", "#dialisi", 1440);
  assert.ok([...p.document.querySelectorAll("[data-service-body]")].every((body) => !body.hidden));
  p.resize(390);
  assert.equal(p.document.querySelector("#detail-dialisi").hidden, false);
  assert.equal(p.document.querySelector("#detail-nazionali").hidden, true);
  p.resize(1440);
  assert.ok([...p.document.querySelectorAll("[data-service-body]")].every((body) => !body.hidden));
});

test("contact preparation stays local and editing clears an outdated preview", (t) => {
  const p = page(t, "contatti.html", "?servizio=esteri#richiesta");
  const form = p.document.querySelector("form");
  assert.equal(form.elements.service.value, "esteri");
  form.elements.name.value = "Prova locale";
  form.elements.phone.value = "0000000000";
  form.elements.consent.checked = true;
  const originalUrl = p.window.location.href;
  form.dispatchEvent(new p.window.Event("submit", { bubbles: true, cancelable: true }));
  const preview = p.document.querySelector("[data-message-preview]");
  assert.equal(preview.hidden, false);
  assert.equal(p.document.activeElement.id, "preview-heading");
  assert.ok(p.scrolls.includes("request-preview"));
  assert.match(p.document.querySelector("[data-message-text]").textContent, /Trasferimento estero/);
  assert.equal(p.window.location.href, originalUrl);
  assert.match(
    p.document.querySelector("[data-message-link]").href,
    /^https:\/\/wa\.me\/393336823324\?text=/,
  );
  form.elements.to.value = "Milano";
  form.elements.to.dispatchEvent(new p.window.Event("input", { bubbles: true }));
  assert.equal(preview.hidden, true);
  assert.equal(p.document.querySelector("[data-message-text]").textContent, "");
});

test("Escape closes the mobile menu and restores its button focus", (t) => {
  const p = page(t, "index.html");
  const toggle = p.document.querySelector("[data-nav-toggle]");
  toggle.click();
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.equal(p.document.body.classList.contains("nav-open"), true);
  assert.equal(p.document.querySelector("[data-nav-backdrop]").hidden, false);
  p.document.dispatchEvent(new p.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(p.document.activeElement, toggle);
  assert.equal(p.document.body.classList.contains("nav-open"), false);
  assert.equal(p.document.querySelector("[data-nav-backdrop]").hidden, true);
});

test("desktop submenus are exclusive and Escape restores their summary focus", (t) => {
  const p = page(t, "index.html", "", 1440);
  const groups = [...p.document.querySelectorAll("[data-nav-group]")];
  groups[0].querySelector("summary").click();
  assert.equal(groups[0].open, true);
  groups[1].querySelector("summary").click();
  assert.equal(groups[0].open, false);
  assert.equal(groups[1].open, true);
  p.document.dispatchEvent(new p.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(groups[1].open, false);
  assert.equal(p.document.activeElement, groups[1].querySelector("summary"));
  groups[0].querySelector("summary").click();
  p.document.querySelector("main").click();
  assert.equal(groups[0].open, false);
});

test("mobile backdrop and desktop resizing dismiss the menu without retaining a scroll lock", (t) => {
  const p = page(t, "index.html");
  const toggle = p.document.querySelector("[data-nav-toggle]");
  toggle.click();
  p.document.querySelector("[data-nav-backdrop]").click();
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(p.document.activeElement, toggle);
  toggle.click();
  p.document.querySelector("[data-nav-group] summary").click();
  p.resize(1440);
  assert.equal(p.document.body.classList.contains("nav-open"), false);
  assert.equal(p.document.querySelector("[data-nav-backdrop]").hidden, true);
  assert.equal(p.document.querySelector("[data-nav-group]").open, false);
});

test("footer disclosures are compact on mobile and fully readable on desktop", (t) => {
  const p = page(t, "index.html");
  const sections = [...p.document.querySelectorAll("[data-footer-disclosure]")];
  assert.ok(sections.every((section) => !section.open));
  sections[0].querySelector("summary").click();
  assert.equal(sections[0].open, true);
  p.resize(1440);
  assert.ok(sections.every((section) => section.open));
  sections[0].querySelector("summary").click();
  assert.equal(sections[0].open, true);
  p.resize(390);
  assert.ok(sections.every((section) => !section.open));
});

test("copying the request requires an explicit click and reports unavailable clipboard access", async (t) => {
  const p = page(t, "contatti.html");
  const form = p.document.querySelector("form");
  form.elements.name.value = "Prova locale";
  form.elements.phone.value = "0000000000";
  form.elements.service.value = "trasporti";
  form.elements.consent.checked = true;
  const copied = [];
  p.window.navigator.clipboard = { writeText: async (value) => copied.push(value) };
  form.dispatchEvent(new p.window.Event("submit", { bubbles: true, cancelable: true }));
  assert.equal(copied.length, 0);
  p.document.querySelector("[data-copy-message]").click();
  await p.frame();
  assert.match(copied[0], /Prova locale/);
  assert.equal(p.document.querySelector("[data-copy-status]").textContent, "Messaggio copiato.");
  p.window.navigator.clipboard.writeText = async () => {
    throw new Error("Clipboard unavailable");
  };
  p.document.querySelector("[data-copy-message]").click();
  await p.frame();
  assert.match(p.document.querySelector("[data-copy-status]").textContent, /Copia non disponibile/);
});

test("without JavaScript the audience links, service information and direct contacts remain present", (t) => {
  const home = page(t, "index.html", "", 390, false);
  assert.ok(
    [...home.document.querySelectorAll("[data-audience-panel]")].every((panel) => !panel.hidden),
  );
  const services = page(t, "servizi.html", "", 390, false);
  assert.ok(
    [...services.document.querySelectorAll("[data-service-body]")].every((body) => !body.hidden),
  );
  const contacts = page(t, "contatti.html", "", 390, false);
  assert.equal(contacts.document.querySelector("[data-preview-button]").disabled, true);
  assert.ok(contacts.document.querySelector('a[href="tel:+393336823324"]'));
  assert.ok(contacts.document.querySelector('a[href="https://wa.me/393336823324"]'));
  assert.ok(
    [...home.document.querySelectorAll("[data-footer-disclosure]")].every(
      (section) => section.open,
    ),
  );
  assert.equal(
    home.document
      .querySelector("[data-nav-group] summary")
      .textContent.trim()
      .startsWith("Servizi"),
    true,
  );
});
