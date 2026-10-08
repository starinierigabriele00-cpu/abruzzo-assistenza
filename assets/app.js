"use strict";

// Generated from config/site.json by scripts/sync-layout.py; do not edit this block.
const SITE_CONFIG = /* config:start */ {
  phone: "+393336823324",
  whatsapp: "393336823324",
  email: "abruzzoassistenzaodv@gmail.com",
}; /* config:end */

const SERVICE_LABELS = {
  trasporti: "Trasporto sanitario",
  dialisi: "Dialisi o terapia ricorrente",
  disabili: "Trasporto con carrozzina",
  nazionali: "Trasferimento nazionale",
  esteri: "Trasferimento internazionale",
  eventi: "Assistenza a evento",
  volontari: "Volontariato",
  sostegno: "Sostegno o collaborazione",
  altro: "Altro",
};
const TRANSPORT_SERVICES = ["trasporti", "dialisi", "disabili", "nazionali", "esteri"];
const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

function whatsappUrl(message) {
  // A lone surrogate pasted by a user must not prevent the link from updating.
  const text = String(message).replace(
    /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g,
    (character) => (character.length === 2 ? character : "\uFFFD"),
  );
  return "https://wa.me/" + SITE_CONFIG.whatsapp + "?text=" + encodeURIComponent(text);
}

function buildRequestMessage(data) {
  const value = (name) => String(data.get(name) || "").trim();
  const rawService = value("service");
  const service = Object.hasOwn(SERVICE_LABELS, rawService) ? rawService : "altro";
  const intention = TRANSPORT_SERVICES.includes(service)
    ? "vorrei prenotare un trasporto."
    : {
        eventi: "vorrei richiedere assistenza per un evento.",
        volontari: "vorrei propormi per il volontariato.",
        sostegno: "vorrei proporre un sostegno o una collaborazione.",
        altro: "vorrei mettermi in contatto con un referente.",
      }[service];
  const lines = [
    "Buongiorno Abruzzo Assistenza, " + intention,
    "",
    "Richiesta: " + SERVICE_LABELS[service],
  ];
  const add = (key, label) => {
    if (value(key)) lines.push(label + ": " + value(key));
  };
  if (TRANSPORT_SERVICES.includes(service)) {
    add("from", "Partenza");
    add("to", "Destinazione");
  }
  if (TRANSPORT_SERVICES.includes(service) || service === "eventi") {
    const date = value("date");
    if (/^\d{4}-\d{2}-\d{2}$/.test(date))
      lines.push("Data indicativa: " + date.split("-").reverse().join("/"));
  }
  if (service === "dialisi") add("frequency", "Giorni o frequenza");
  if (service === "disabili") {
    for (const [key, label] of [
      ["wheelchair", "Utilizzo di carrozzina"],
      ["stayWheelchair", "Necessità di restare sulla carrozzina durante il viaggio"],
    ]) {
      const answer = { si: "Sì", no: "No" }[value(key)] || "Da valutare";
      lines.push(label + ": " + answer);
    }
  }
  if (service === "eventi") {
    add("place", "Luogo");
    add("duration", "Durata indicativa");
    add("eventType", "Tipo di manifestazione");
  }
  if (service === "volontari") {
    add("zone", "Zona");
    add("availability", "Disponibilità indicativa");
    add("skills", "Eventuali competenze");
  }
  if (service === "sostegno") add("organization", "Organizzazione");
  add("notes", "Altre informazioni");
  lines.push("", "Resto in attesa di una valutazione e della conferma dei dettagli.");
  return lines.join("\n");
}

qsa("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

// Simple page links stay available without JavaScript; mobile uses one menu toggle.
const navToggle = qs("[data-nav-toggle]");
const nav = qs("[data-nav]");
const header = qs(".site-header");
if (navToggle && nav && header) {
  const mobile = window.matchMedia("(max-width: 900px)");
  const setOpen = (open, focus = false) => {
    navToggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    qs("[data-nav-label]", navToggle).textContent = open ? "Chiudi" : "Menu";
    if (focus) navToggle.focus();
  };
  document.documentElement.classList.add("js");
  navToggle.addEventListener("click", () =>
    setOpen(navToggle.getAttribute("aria-expanded") !== "true"),
  );
  qsa("a", nav).forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (navToggle.getAttribute("aria-expanded") === "true") setOpen(false, true);
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });
  header.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false);
  });
  mobile.addEventListener("change", () =>
    setOpen(false, mobile.matches && nav.contains(document.activeElement)),
  );
}

// A compact service index never hides the actual service content.
const serviceIndex = qs("[data-service-index]");
if (serviceIndex) {
  const compact = window.matchMedia("(max-width: 900px)");
  const summary = qs("summary", serviceIndex);
  const syncIndex = () => {
    serviceIndex.open = !compact.matches;
    summary.tabIndex = compact.matches ? 0 : -1;
  };
  summary.addEventListener("click", (event) => {
    if (!compact.matches) event.preventDefault();
  });
  qsa("a", serviceIndex).forEach((link) =>
    link.addEventListener("click", () => {
      if (compact.matches) serviceIndex.open = false;
    }),
  );
  compact.addEventListener("change", syncIndex);
  syncIndex();
}

const requestForm = qs("[data-request-form]");
if (requestForm) {
  const notesDisclosure = qs("[data-request-notes]", requestForm);
  const smallScreen = window.matchMedia("(max-width: 700px)");
  const syncNotes = () => {
    notesDisclosure.open = !smallScreen.matches;
  };
  smallScreen.addEventListener("change", syncNotes);
  syncNotes();
  const messageText = qs("[data-message-text]", requestForm);
  const messageLink = qs("[data-message-link]", requestForm);
  const copyStatus = qs("[data-copy-status]", requestForm);
  const radios = qsa('input[name="service"]', requestForm);
  const requested = new URLSearchParams(window.location.search).get("servizio");
  if (Object.hasOwn(SERVICE_LABELS, requested))
    radios.find((radio) => radio.value === requested).checked = true;
  const update = () => {
    const selected = radios.find((radio) => radio.checked)?.value || "trasporti";
    qsa("[data-for]", requestForm).forEach((field) => {
      const relevant =
        field.dataset.for === "all" || field.dataset.for.split(" ").includes(selected);
      field.hidden = !relevant;
      qsa("input, select, textarea", field).forEach((control) => {
        control.disabled = !relevant;
      });
    });
    const message = buildRequestMessage(new FormData(requestForm));
    messageText.textContent = message;
    messageLink.href = whatsappUrl(message);
    copyStatus.textContent = "";
  };
  requestForm.hidden = false;
  update();
  requestForm.addEventListener("input", update);
  requestForm.addEventListener("change", update);
  requestForm.addEventListener("submit", (event) => event.preventDefault());
  requestForm.addEventListener("reset", () => {
    // Reset defaults are applied after the reset event has completed.
    setTimeout(update, 0);
  });
  qs("[data-copy-message]", requestForm).addEventListener("click", async () => {
    const message = messageText.textContent;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(message);
      copyStatus.textContent = "Messaggio copiato.";
    } catch {
      // Select the real, visible text so a manual copy is possible without permission.
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(messageText);
      messageText.focus({ preventScroll: true });
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent =
        "Copia automatica non disponibile. Il testo è selezionato: usa Copia sul dispositivo oppure continua su WhatsApp.";
    }
  });
}
