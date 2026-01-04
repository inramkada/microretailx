export const CONSENT_KEY = "mrx_consent_v1";

export function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function setConsent(consentObj) {
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(consentObj)); } catch (_) {}
  document.documentElement.classList.remove("consent-locked");
  document.documentElement.classList.add("consent-decided");
  window.dispatchEvent(new CustomEvent("mrx:consent-decided", { detail: consentObj }));
}

export function isDecided() {
  return !!getConsent();
}

export function applyInitialLock() {
  if (isDecided()) {
    document.documentElement.classList.add("consent-decided");
    document.documentElement.classList.remove("consent-locked");
  } else {
    document.documentElement.classList.add("consent-locked");
    document.documentElement.classList.remove("consent-decided");
  }
}

export function onDecided(cb) {
  if (isDecided()) cb(getConsent());
  window.addEventListener("mrx:consent-decided", (e) => cb(e.detail), { once: true });
}
