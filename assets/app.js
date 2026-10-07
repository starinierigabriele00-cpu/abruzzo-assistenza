"use strict";

const SITE_CONFIG = {
  phone: "+393336823324",
  whatsapp: "393336823324",
  email: "abruzzoassistanzaodv@gmail.com",
  pec: "",
  donation: { iban: "", beneficiary: "", paypalUrl: "" },
  fivePerMille: { enabled: true, taxId: "02227430663" },
};

const SERVICE_LABELS = {
  trasporti: "Dimissione / ricovero / visita",
  dialisi: "Dialisi / terapia ricorrente",
  disabili: "Trasporto disabili / servizi sociali",
  nazionali: "Trasferimento nazionale",
  esteri: "Trasferimento estero",
  eventi: "Assistenza a evento",
  volontari: "Volontariato",
  sostegno: "Sostegno / donazione",
  altro: "Altro",
};

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

function whatsappUrl(message) {
  return "https://wa.me/" + SITE_CONFIG.whatsapp + "?text=" + encodeURIComponent(message);
}

function buildRequestMessage(data) {
  const value = (name, fallback = "") => String(data.get(name) || "").trim() || fallback;
  const rawDate = value("date");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate.split("-").reverse().join("/")
    : "da definire";
  return [
    "Ciao Abruzzo Assistenza, vorrei chiedere informazioni.",
    "",
    "Nome: " + value("name"),
    "Telefono: " + value("phone"),
    "Richiesta: " +
      (Object.hasOwn(SERVICE_LABELS, value("service"))
        ? SERVICE_LABELS[value("service")]
        : "Altro"),
    "Partenza: " + value("from", "da definire"),
    "Destinazione: " + value("to", "da definire"),
    "Data: " + date,
    "",
    "Note: " + value("notes", "nessuna"),
  ].join("\n");
}

qsa("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

// Native submenu disclosures and a compact mobile navigation panel.
const navToggle = qs("[data-nav-toggle]");
const nav = qs("[data-nav]");
const header = qs(".site-header");
if (navToggle && nav && header) {
  const navLabel = qs("[data-nav-label]", navToggle);
  const backdrop = qs("[data-nav-backdrop]", header);
  const groups = qsa("[data-nav-group]", nav);
  const mobile = window.matchMedia("(max-width: 900px)");
  const closeGroups = () =>
    groups.forEach((group) => {
      group.open = false;
    });
  const setNavOpen = (open, restoreFocus = false) => {
    navToggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open && mobile.matches);
    if (backdrop) backdrop.hidden = !open || !mobile.matches;
    if (navLabel) navLabel.textContent = open ? "Chiudi" : "Menu";
    if (!open) closeGroups();
    if (restoreFocus) navToggle.focus();
  };
  navToggle.addEventListener("click", () =>
    setNavOpen(navToggle.getAttribute("aria-expanded") !== "true"),
  );
  qsa("a", nav).forEach((link) => link.addEventListener("click", () => setNavOpen(false)));
  groups.forEach((group) => {
    qs("summary", group).addEventListener("click", () => {
      if (!group.open)
        groups.forEach((other) => {
          if (other !== group) other.open = false;
        });
    });
  });
  if (backdrop) backdrop.addEventListener("click", () => setNavOpen(false, true));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (navToggle.getAttribute("aria-expanded") === "true") {
      setNavOpen(false, true);
    } else {
      const openGroup = groups.find((group) => group.open);
      if (openGroup) {
        closeGroups();
        qs("summary", openGroup).focus();
      }
    }
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setNavOpen(false);
  });
  header.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) setNavOpen(false);
  });
  mobile.addEventListener("change", () => {
    const focusWasInsideNav = nav.contains(document.activeElement);
    setNavOpen(false, mobile.matches && focusWasInsideNav);
  });
  document.documentElement.classList.add("js");
}

// Footer sections stay open on desktop and become native disclosures on mobile.
const footerSections = qsa("[data-footer-disclosure]");
if (footerSections.length) {
  const compactFooter = window.matchMedia("(max-width: 700px)");
  const syncFooter = () =>
    footerSections.forEach((section) => {
      section.open = !compactFooter.matches;
      qs("summary", section).tabIndex = compactFooter.matches ? 0 : -1;
    });
  footerSections.forEach((section) => {
    qs("summary", section).addEventListener("click", (event) => {
      if (!compactFooter.matches) event.preventDefault();
    });
  });
  compactFooter.addEventListener("change", syncFooter);
  syncFooter();
}

qsa("[data-whatsapp]").forEach((link) => {
  const message =
    link.dataset.whatsappMessage ||
    "Ciao Abruzzo Assistenza, vorrei chiedere informazioni su un servizio.";
  link.href = whatsappUrl(message);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});

const requestForm = qs("[data-request-form]");

// The mobile home is a service chooser with two real audience paths.
const audienceTabs = qs("[data-audience-tabs]");
if (audienceTabs) {
  const tabs = qsa("[data-audience-tab]", audienceTabs);
  const panels = qsa("[data-audience-panel]");
  const selectAudience = (selected) => {
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.audiencePanel !== selected.dataset.audienceTab;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectAudience(tab));
    tab.addEventListener("keydown", (event) => {
      const next =
        event.key === "ArrowRight"
          ? (index + 1) % tabs.length
          : event.key === "ArrowLeft"
            ? (index - 1 + tabs.length) % tabs.length
            : event.key === "Home"
              ? 0
              : event.key === "End"
                ? tabs.length - 1
                : null;
      if (next === null) return;
      event.preventDefault();
      selectAudience(tabs[next]);
      tabs[next].focus();
    });
  });
  audienceTabs.hidden = false;
  audienceTabs.parentElement.classList.add("is-enhanced");
  selectAudience(tabs[0]);
}

// Compact mobile service sheets; desktop keeps every service fully readable.
const serviceSections = qsa(".service-detail").filter((section) =>
  qs("[data-service-toggle]", section),
);
if (serviceSections.length) {
  const compactServices = window.matchMedia("(max-width: 700px)");
  const setServiceOpen = (section, open) => {
    qs("[data-service-toggle]", section).setAttribute("aria-expanded", String(open));
    qs("[data-service-body]", section).hidden = !open;
  };
  const hashSection = () =>
    serviceSections.find((section) => "#" + section.id === window.location.hash);
  const revealHashService = () => {
    const target = hashSection();
    if (!compactServices.matches || !target) return;
    serviceSections.forEach((section) => setServiceOpen(section, section === target));
    // The fragment must be aligned after collapsing the preceding sheets.
    requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "instant" }));
  };
  const syncServices = () => {
    const target = hashSection();
    serviceSections.forEach((section) => {
      qs("[data-service-toggle]", section).disabled = !compactServices.matches;
      setServiceOpen(section, !compactServices.matches || section === target);
    });
  };
  serviceSections.forEach((section) => {
    qs("[data-service-toggle]", section).addEventListener("click", () => {
      if (!compactServices.matches) return;
      const open = qs("[data-service-body]", section).hidden;
      serviceSections.forEach((item) => setServiceOpen(item, item === section && open));
    });
  });
  window.addEventListener("hashchange", revealHashService);
  window.addEventListener("load", revealHashService, { once: true });
  qsa(".service-index a").forEach((link) => {
    link.addEventListener("click", () => {
      if (link.getAttribute("href") === window.location.hash) revealHashService();
    });
  });
  compactServices.addEventListener("change", syncServices);
  syncServices();
  revealHashService();
}

if (requestForm) {
  const preview = qs("[data-message-preview]", requestForm);
  const messageText = qs("[data-message-text]", requestForm);
  const messageLink = qs("[data-message-link]", requestForm);
  const previewButton = qs("[data-preview-button]", requestForm);
  const copyStatus = qs("[data-copy-status]", requestForm);
  const service = requestForm.elements.namedItem("service");
  const requestedService = new URLSearchParams(window.location.search).get("servizio");
  if (Object.hasOwn(SERVICE_LABELS, requestedService)) service.value = requestedService;

  const dateInput = requestForm.elements.namedItem("date");
  const now = new Date();
  dateInput.min = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  previewButton.hidden = false;
  previewButton.disabled = false;
  const clearPreview = () => {
    preview.hidden = true;
    messageText.textContent = "";
    messageLink.href = "https://wa.me/" + SITE_CONFIG.whatsapp;
    copyStatus.textContent = "";
    previewButton.textContent = "Prepara l’anteprima →";
  };
  requestForm.addEventListener("input", clearPreview);
  requestForm.addEventListener("change", clearPreview);
  requestForm.addEventListener("reset", clearPreview);
  requestForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    const message = buildRequestMessage(new FormData(requestForm));
    // Never render user input as HTML or navigate to an external service on submit.
    messageText.textContent = message;
    messageLink.href = whatsappUrl(message);
    preview.hidden = false;
    previewButton.textContent = "Aggiorna il messaggio →";
    qs("#preview-heading", requestForm).focus({ preventScroll: true });
    preview.scrollIntoView({ block: "start", behavior: "instant" });
  });
  qs("[data-copy-message]", requestForm).addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(messageText.textContent);
      copyStatus.textContent = "Messaggio copiato.";
    } catch {
      copyStatus.textContent =
        "Copia non disponibile: seleziona il testo dell’anteprima oppure aprilo su WhatsApp.";
    }
  });
}

const donationBlock = qs("[data-donation-block]");
const ibanRow = qs("[data-iban-row]");
const paypalRow = qs("[data-paypal-row]");
const ibanElement = qs("[data-iban]");
const paypalElement = qs("[data-paypal]");
if (SITE_CONFIG.donation.iban || SITE_CONFIG.donation.paypalUrl) {
  if (donationBlock) donationBlock.hidden = false;
  if (SITE_CONFIG.donation.iban && ibanRow && ibanElement) {
    ibanRow.hidden = false;
    ibanElement.textContent = SITE_CONFIG.donation.iban;
    const beneficiary = qs("[data-beneficiary]");
    if (beneficiary) beneficiary.textContent = SITE_CONFIG.donation.beneficiary;
  }
  if (SITE_CONFIG.donation.paypalUrl && paypalRow && paypalElement) {
    paypalRow.hidden = false;
    paypalElement.href = SITE_CONFIG.donation.paypalUrl;
  }
}
const fiveBlock = qs("[data-fivepermille-block]");
if (SITE_CONFIG.fivePerMille.enabled && fiveBlock) fiveBlock.hidden = false;

qsa("[data-copy-target='iban']").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!SITE_CONFIG.donation.iban) return;
    try {
      await navigator.clipboard.writeText(SITE_CONFIG.donation.iban);
      const original = button.textContent;
      button.textContent = "Copiato";
      setTimeout(() => {
        button.textContent = original;
      }, 1600);
    } catch {
      button.textContent = "Seleziona e copia";
    }
  });
});
