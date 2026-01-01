"use strict";

/* =========================================================
   DEBUG (para verificar que es ESTE archivo el que carga)
   ========================================================= */
console.log("MRX APP LOADED v=20260101-3");

/* =========================================================
   MENU / UI
   ========================================================= */
const menuToggle = document.getElementById("menuToggle");
const menuDropdown = document.getElementById("menuDropdown");
const verticalsLink = document.getElementById("verticalsLink");
const verticalsSubmenu = document.getElementById("verticalsSubmenu");
const contactLink = document.getElementById("contactLink");

function setMenuOpen(open) {
  if (!menuDropdown || !menuToggle) return;
  menuDropdown.classList.toggle("open", open);
  menuDropdown.setAttribute("aria-hidden", String(!open));
  menuToggle.setAttribute("aria-expanded", String(open));
}

menuToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  setMenuOpen(!menuDropdown.classList.contains("open"));
});

document.addEventListener("click", (e) => {
  if (menuDropdown && menuToggle) {
    if (!menuDropdown.contains(e.target) && !menuToggle.contains(e.target)) {
      setMenuOpen(false);
    }
  }
});

/* =========================================================
   CONSENT CORE
   ========================================================= */
const CONSENT_KEY = "mrxx_consent_v1";

const consentBanner = document.getElementById("consentBanner");
const consentModalBackdrop = document.getElementById("consentModalBackdrop");

const cookiePreferencesLink = document.getElementById("cookiePreferencesLink");
const cookiePreferencesInline = document.getElementById("cookiePreferencesInline");

const consentAccept = document.getElementById("consentAccept");
const consentReject = document.getElementById("consentReject");
const consentManage = document.getElementById("consentManage");
const consentSave = document.getElementById("consentSave");
const consentAcceptAll = document.getElementById("consentAcceptAll");
const consentModalClose = document.getElementById("consentModalClose");

const toggleAnalytics = document.getElementById("toggleAnalytics");
const toggleMarketing = document.getElementById("toggleMarketing");

function lockSite() {
  document.documentElement.style.overflow = "hidden";
}
function unlockSite() {
  document.documentElement.style.overflow = "";
}

function loadConsent() {
  const raw = localStorage.getItem(CONSENT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function saveConsent(obj) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(obj));
}

function setToggle(el, on) {
  if (!el) return;
  el.classList.toggle("on", !!on);
  el.setAttribute("aria-checked", String(!!on));
}

function openConsentUI() {
  lockSite();
  consentBanner?.classList.add("open");
  consentModalBackdrop?.classList.add("open");
  consentModalBackdrop?.setAttribute("aria-hidden", "false");
}

function closeConsentUI() {
  unlockSite();
  consentBanner?.classList.remove("open");
  consentModalBackdrop?.classList.remove("open");
  consentModalBackdrop?.setAttribute("aria-hidden", "true");
}

function acceptAll() {
  saveConsent({ decision: "accepted", necessary: true, analytics: true, marketing: true, ts: Date.now() });
  closeConsentUI();
}

function rejectAll() {
  saveConsent({ decision: "rejected", necessary: true, analytics: false, marketing: false, ts: Date.now() });
  closeConsentUI();
}

function saveFromPanel() {
  const analytics = !!toggleAnalytics?.classList.contains("on");
  const marketing = !!toggleMarketing?.classList.contains("on");
  const accepted = analytics || marketing; // “accepted” solo si activas algo opcional

  saveConsent({
    decision: accepted ? "accepted" : "rejected",
    necessary: true,
    analytics,
    marketing,
    ts: Date.now()
  });

  closeConsentUI();
}

/* =========================================================
   LEGAL GATE — BLOQUEA TODO /legal/* HASTA ACEPTAR
   (usa pathname real resuelto)
   ========================================================= */
function hasAcceptedConsent() {
  const c = loadConsent();
  return !!(c && c.decision === "accepted");
}

function isLegalAnchor(a) {
  if (!a) return false;

  let url;
  try {
    url = new URL(a.href, window.location.href);
  } catch {
    return false;
  }

  // ✅ a prueba de rutas relativas y subcarpetas
  return url.pathname.includes("/legal/");
}

function interceptLegalNavigation(e) {
  if (hasAcceptedConsent()) return;

  const a = e.target && e.target.closest ? e.target.closest("a") : null;
  if (!isLegalAnchor(a)) return;

  e.preventDefault();
  e.stopPropagation();
  if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

  openConsentUI();
  return false;
}

function initLegalGate() {
  document.addEventListener("click", interceptLegalNavigation, true);

  document.addEventListener("auxclick", (e) => {
    if (e.button === 1) interceptLegalNavigation(e);
  }, true);

  document.addEventListener("mousedown", (e) => {
    if (e.button === 0 && (e.ctrlKey || e.metaKey)) interceptLegalNavigation(e);
  }, true);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") interceptLegalNavigation(e);
  }, true);
}

/* =========================================================
   BIND EVENTS
   ========================================================= */
cookiePreferencesLink?.addEventListener("click", (e) => { e.preventDefault(); openConsentUI(); });
cookiePreferencesInline?.addEventListener("click", (e) => { e.preventDefault(); openConsentUI(); });

consentManage?.addEventListener("click", () => openConsentUI());
consentReject?.addEventListener("click", () => rejectAll());
consentAccept?.addEventListener("click", () => acceptAll());
consentAcceptAll?.addEventListener("click", () => acceptAll());
consentSave?.addEventListener("click", () => saveFromPanel());
consentModalClose?.addEventListener("click", () => closeConsentUI());

consentModalBackdrop?.addEventListener("click", (e) => {
  if (e.target === consentModalBackdrop) closeConsentUI();
});

toggleAnalytics?.addEventListener("click", () => setToggle(toggleAnalytics, !toggleAnalytics.classList.contains("on")));
toggleMarketing?.addEventListener("click", () => setToggle(toggleMarketing, !toggleMarketing.classList.contains("on")));

/* =========================================================
   INIT
   ========================================================= */
const existing = loadConsent();
if (existing) {
  // Si ya había decisión, no bloquees la UI
  closeConsentUI();
} else {
  // Primera visita: muestra UI
  openConsentUI();
}

initLegalGate();

/* =========================================================
   CANVAS (mínimo, no interfiere con gate)
   ========================================================= */
const canvas = document.getElementById("canvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  addEventListener("resize", resize);
  resize();

  function loop() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
