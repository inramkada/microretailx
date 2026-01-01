"use strict";

/* =========================================================
   MENU / UI
   ========================================================= */

const menuToggle = document.getElementById("menuToggle");
const menuDropdown = document.getElementById("menuDropdown");
const verticalsLink = document.getElementById("verticalsLink");
const verticalsSubmenu = document.getElementById("verticalsSubmenu");
const contactLink = document.getElementById("contactLink");

function setMenuOpen(open) {
  menuDropdown.classList.toggle("open", open);
  menuDropdown.setAttribute("aria-hidden", String(!open));
  menuToggle.setAttribute("aria-expanded", String(open));
}

menuToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  setMenuOpen(!menuDropdown.classList.contains("open"));
});

document.addEventListener("click", (e) => {
  if (!menuDropdown.contains(e.target) && !menuToggle.contains(e.target)) {
    setMenuOpen(false);
  }
});

/* =========================================================
   CONSENT CORE
   ========================================================= */

const CONSENT_KEY = "mrxx_consent_v1";

const consentBanner = document.getElementById("consentBanner");
const consentModalBackdrop = document.getElementById("consentModalBackdrop");

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

function applyConsent() {
  unlockSite();
  consentBanner?.classList.remove("open");
  consentModalBackdrop?.classList.remove("open");
}

function openConsentUI() {
  lockSite();
  consentBanner?.classList.add("open");
  consentModalBackdrop?.classList.add("open");
}

/* =========================================================
   CONSENT ACTIONS
   ========================================================= */

function acceptAll() {
  saveConsent({ decision: "accepted", analytics: true, marketing: true, ts: Date.now() });
  applyConsent();
}

function rejectAll() {
  saveConsent({ decision: "rejected", analytics: false, marketing: false, ts: Date.now() });
  applyConsent();
}

function saveFromPanel() {
  const analytics = toggleAnalytics?.classList.contains("on");
  const marketing = toggleMarketing?.classList.contains("on");
  saveConsent({
    decision: (analytics || marketing) ? "accepted" : "rejected",
    analytics,
    marketing,
    ts: Date.now()
  });
  applyConsent();
}

/* =========================================================
   LEGAL GATE — BLOQUEA TODO /legal/*
   ========================================================= */

function hasAcceptedConsent() {
  const c = loadConsent();
  return !!(c && c.decision === "accepted");
}

function isLegalHref(href) {
  if (!href) return false;
  href = href.trim();
  return href.startsWith("/legal/") || href.startsWith("legal/");
}

function interceptLegal(e) {
  if (hasAcceptedConsent()) return;

  const a = e.target.closest && e.target.closest("a");
  if (!a) return;
  if (!isLegalHref(a.getAttribute("href"))) return;

  e.preventDefault();
  e.stopPropagation();
  if (e.stopImmediatePropagation) e.stopImmediatePropagation();

  openConsentUI();
  return false;
}

function initLegalGate() {
  document.addEventListener("click", interceptLegal, true);
  document.addEventListener("auxclick", (e) => e.button === 1 && interceptLegal(e), true);
  document.addEventListener("mousedown", (e) => {
    if (e.button === 0 && (e.ctrlKey || e.metaKey)) interceptLegal(e);
  }, true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") interceptLegal(e);
  }, true);
}

/* =========================================================
   BIND EVENTS
   ========================================================= */

consentAccept?.addEventListener("click", acceptAll);
consentAcceptAll?.addEventListener("click", acceptAll);
consentReject?.addEventListener("click", rejectAll);
consentManage?.addEventListener("click", openConsentUI);
consentSave?.addEventListener("click", saveFromPanel);
consentModalClose?.addEventListener("click", applyConsent);

consentModalBackdrop?.addEventListener("click", (e) => {
  if (e.target === consentModalBackdrop) applyConsent();
});

/* =========================================================
   INIT
   ========================================================= */

const existing = loadConsent();
if (existing) {
  applyConsent();
} else {
  openConsentUI();
}

initLegalGate();

/* =========================================================
   CANVAS (mínimo, no interfiere con el gate)
   ========================================================= */

const canvas = document.getElementById("canvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function loop() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(loop);
  }
  loop();
}
