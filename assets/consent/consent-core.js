export const CONSENT_KEY = "mrx_consent_v1";

export function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function isDecided() {
  return !!getConsent();
}

function setHtmlLock(locked) {
  const html = document.documentElement;
  const body = document.body || document.documentElement;

  if (locked) {
    html.classList.add("consent-locked");
    body.classList.add("consent-locked");
    html.classList.remove("consent-decided");
  } else {
    html.classList.remove("consent-locked");
    body.classList.remove("consent-locked");
    html.classList.add("consent-decided");
  }
}

export function applyInitialLock() {
  setHtmlLock(!isDecided());
}

export function setConsent(consentObj) {
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(consentObj)); } catch (_) {}
  setHtmlLock(false);
  window.dispatchEvent(new CustomEvent("mrx:consent-decided", { detail: consentObj }));
}

export function acceptAll() {
  setConsent({
    status: "accepted",
    ts: Date.now(),
    v: 1,
    choices: { necessary: true, analytics: true, marketing: true }
  });
}

export function rejectAll() {
  setConsent({
    status: "rejected",
    ts: Date.now(),
    v: 1,
    choices: { necessary: true, analytics: false, marketing: false }
  });
}

export function savePreferences({ analytics, marketing }) {
  setConsent({
    status: "custom",
    ts: Date.now(),
    v: 1,
    choices: { necessary: true, analytics: !!analytics, marketing: !!marketing }
  });
}

export function onDecided(cb) {
  const existing = getConsent();
  if (existing) cb(existing);
  window.addEventListener("mrx:consent-decided", (e) => cb(e.detail), { once: true });
}

export function clearConsent() {
  try { localStorage.removeItem(CONSENT_KEY); } catch (_) {}
  setHtmlLock(true);
  window.dispatchEvent(new CustomEvent("mrx:consent-reset"));
}
