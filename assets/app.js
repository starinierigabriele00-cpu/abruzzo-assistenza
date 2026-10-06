const SITE_CONFIG = {
  phone: "+393336823324",
  whatsapp: "393336823324",
  email: "",
  pec: "",
  donation: {
    iban: "",
    beneficiary: "",
    paypalUrl: ""
  },
  fivePerMille: {
    enabled: false,
    taxId: "02227430663"
  }
};

const qs = (s, root = document) => root.querySelector(s);
const qsa = (s, root = document) => [...root.querySelectorAll(s)];

qsa("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

const navToggle = qs("[data-nav-toggle]");
const nav = qs("[data-nav]");
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("is-open", !open);
    document.body.classList.toggle("menu-open", !open);
  });
  qsa("a", nav).forEach(a => a.addEventListener("click", () => {
    navToggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }));
}

qsa("[data-whatsapp]").forEach(link => {
  const custom = link.dataset.whatsappMessage;
  const message = custom || "Ciao Abruzzo Assistenza, vorrei chiedere informazioni su un servizio.";
  link.href = "https://wa.me/" + SITE_CONFIG.whatsapp + "?text=" + encodeURIComponent(message);
  link.target = "_blank";
  link.rel = "noopener";
});

const requestForm = qs("[data-request-form]");
if (requestForm) {
  requestForm.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(requestForm);
    const lines = [
      "Ciao Abruzzo Assistenza, vorrei chiedere informazioni.",
      "",
      "Nome: " + (data.get("name") || ""),
      "Telefono: " + (data.get("phone") || ""),
      "Richiesta: " + (data.get("service") || ""),
      "Partenza: " + (data.get("from") || "da definire"),
      "Destinazione: " + (data.get("to") || "da definire"),
      "Data: " + (data.get("date") || "da definire"),
      "",
      "Note: " + (data.get("notes") || "nessuna")
    ];
    window.open("https://wa.me/" + SITE_CONFIG.whatsapp + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
  });
}

const donationBlock = qs("[data-donation-block]");
const ibanRow = qs("[data-iban-row]");
const paypalRow = qs("[data-paypal-row]");
const ibanEl = qs("[data-iban]");
const paypalEl = qs("[data-paypal]");

if (SITE_CONFIG.donation.iban || SITE_CONFIG.donation.paypalUrl) {
  if (donationBlock) donationBlock.hidden = false;
  if (SITE_CONFIG.donation.iban && ibanRow && ibanEl) {
    ibanRow.hidden = false;
    ibanEl.textContent = SITE_CONFIG.donation.iban;
  }
  if (SITE_CONFIG.donation.paypalUrl && paypalRow && paypalEl) {
    paypalRow.hidden = false;
    paypalEl.href = SITE_CONFIG.donation.paypalUrl;
  }
}

const fiveBlock = qs("[data-fivepermille-block]");
if (SITE_CONFIG.fivePerMille.enabled && fiveBlock) fiveBlock.hidden = false;

qsa("[data-copy-target='iban']").forEach(button => {
  button.addEventListener("click", async () => {
    if (!SITE_CONFIG.donation.iban) return;
    try {
      await navigator.clipboard.writeText(SITE_CONFIG.donation.iban);
      const old = button.textContent;
      button.textContent = "Copiato";
      setTimeout(() => button.textContent = old, 1600);
    } catch {
      button.textContent = "Seleziona e copia";
    }
  });
});
