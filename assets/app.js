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
  const lines = ["Buongiorno Abruzzo Assistenza, " + intention, ""];
  const add = (key, label) => {
    if (value(key)) lines.push(label + ": " + value(key));
  };
  for (const [key, label] of [
    ["firstName", "Nome"],
    ["lastName", "Cognome"],
  ])
    add(key, label);
  if (lines.length > 2) lines.push("");
  lines.push("Richiesta: " + SERVICE_LABELS[service]);
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

function requestContactErrors(data) {
  const value = (name) => String(data.get(name) || "").trim();
  const required = TRANSPORT_SERVICES.includes(value("service"));
  const errors = {};
  if (required && !value("firstName"))
    errors.firstName = "Inserisci il nome di chi richiede il servizio.";
  if (required && !value("lastName"))
    errors.lastName = "Inserisci il cognome di chi richiede il servizio.";
  return errors;
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
  const validation = qs("[data-request-validation]", requestForm);
  const contactControls = qsa("[data-required-for]", requestForm);
  const touched = new Set();
  let completionAttempted = false;
  let contactErrors = {};
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
        if (control.dataset.requiredFor)
          control.required = relevant && control.dataset.requiredFor.split(" ").includes(selected);
      });
    });
    const data = new FormData(requestForm);
    contactErrors = requestContactErrors(data);
    const required = TRANSPORT_SERVICES.includes(selected);
    qs("[data-contact-hint]", requestForm).textContent = required
      ? "Per i trasporti sono necessari nome e cognome di chi ci contatta. Gli altri dettagli sono facoltativi."
      : "Nome, cognome e gli altri dettagli sono facoltativi per questa richiesta.";
    qsa("[data-contact-optional]", requestForm).forEach((label) => {
      label.hidden = required;
    });
    contactControls.forEach((control) => {
      const error = qs(`#request-${control.name}-error`, requestForm);
      const visible = Boolean(
        contactErrors[control.name] && (completionAttempted || touched.has(control.name)),
      );
      error.textContent = visible ? contactErrors[control.name] : "";
      error.hidden = !visible;
      if (visible) control.setAttribute("aria-invalid", "true");
      else control.removeAttribute("aria-invalid");
    });
    const invalid = Object.keys(contactErrors).length > 0;
    validation.hidden = !completionAttempted || !invalid;
    validation.textContent = validation.hidden
      ? ""
      : "Controlla i dati del richiedente indicati sotto i campi prima di continuare su WhatsApp.";
    const message = buildRequestMessage(data);
    messageText.textContent = message;
    if (invalid) {
      messageLink.removeAttribute("href");
      messageLink.setAttribute("aria-disabled", "true");
    } else {
      messageLink.href = whatsappUrl(message);
      messageLink.removeAttribute("aria-disabled");
    }
    copyStatus.textContent = "";
  };
  requestForm.hidden = false;
  update();
  requestForm.addEventListener("input", update);
  requestForm.addEventListener("change", update);
  requestForm.addEventListener("submit", (event) => event.preventDefault());
  contactControls.forEach((control) =>
    control.addEventListener("blur", () => {
      touched.add(control.name);
      update();
    }),
  );
  messageLink.addEventListener("click", (event) => {
    completionAttempted = true;
    update();
    const firstInvalid = contactControls.find((control) => contactErrors[control.name]);
    if (firstInvalid) {
      event.preventDefault();
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ block: "center", behavior: "auto" });
    }
  });
  messageLink.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !messageLink.hasAttribute("href")) {
      event.preventDefault();
      messageLink.click();
    }
  });
  requestForm.addEventListener("reset", () => {
    completionAttempted = false;
    touched.clear();
    // Clear personal data immediately; browsers apply native reset defaults after this event.
    messageText.textContent = "";
    messageLink.removeAttribute("href");
    messageLink.setAttribute("aria-disabled", "true");
    validation.hidden = true;
    validation.textContent = "";
    copyStatus.textContent = "";
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
// The 5×1000 tax ID stays readable even without JavaScript.
qsa("[data-copy-tax-id]").forEach((button) => {
  const card = button.closest(".five-card");
  const code = card && qs("[data-tax-id]", card);
  const status = card && qs("[data-tax-copy-status]", card);
  if (!code || !status) return;
  button.hidden = false;
  button.addEventListener("click", async () => {
    const value = code.textContent.trim();
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      status.textContent = "Codice fiscale copiato.";
    } catch {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(code);
        code.focus({ preventScroll: true });
        selection.removeAllRanges();
        selection.addRange(range);
      }
      status.textContent = selection
        ? "Copia automatica non disponibile. Il codice è selezionato: usa Copia sul dispositivo."
        : "Copia automatica non disponibile. Seleziona il codice fiscale e usa Copia sul dispositivo.";
    }
  });
});
