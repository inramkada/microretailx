import { acceptAll, rejectAll, savePreferences, isDecided } from "./consent-core.js";

let lastFocus = null;

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const c of children) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return n;
}

function trapKeys(e) {
  if (!document.documentElement.classList.contains("consent-locked")) return;

  const modal = document.getElementById("mrxConsentModal");
  const focusables = modal
    ? Array.from(modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'))
        .filter(x => !x.hasAttribute("disabled"))
    : [];

  if (e.key === "Tab" && focusables.length) {
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    return;
  }

  const allowed = new Set(["Tab", "Enter", " ", "Spacebar", "Escape", "ArrowLeft", "ArrowRight"]);
  if (!allowed.has(e.key)) e.preventDefault();
}

function ensureLockLayer() {
  if (document.getElementById("consentLock")) return;
  const lock = el("div", { id: "consentLock", "aria-hidden": "true" });
  document.body.appendChild(lock);
}

function openModal() {
  lastFocus = document.activeElement;
  document.getElementById("mrxConsentModal").classList.add("open");
  document.getElementById("mrxConsentBackdrop").classList.add("open");
  const btn = document.getElementById("mrxBtnAccept");
  if (btn) btn.focus();
}

function closeModal() {
  document.getElementById("mrxConsentModal").classList.remove("open");
  document.getElementById("mrxConsentBackdrop").classList.remove("open");
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
}

function ensureUI() {
  if (document.getElementById("mrxConsentUI")) return;

  const ui = el("div", { id: "mrxConsentUI" });

  const bar = el("div", { id: "mrxConsentBar", role: "dialog", "aria-modal": "true", "aria-label": "Cookie consent" }, [
    el("div", { class: "mrx-consent-text" }, [
      el("div", { class: "mrx-consent-title" }, ["Privacy & cookies"]),
      el("div", { class: "mrx-consent-body" }, [
        "We use necessary storage for core functionality. Optional cookies are used only if you consent. You can accept, reject, or customize."
      ])
    ]),
    el("div", { class: "mrx-consent-actions" }, [
      el("button", { class: "mrx-btn mrx-btn-ghost", id: "mrxBtnReject", onclick: () => { rejectAll(); teardown(); } }, ["Reject"]),
      el("button", { class: "mrx-btn mrx-btn-ghost", onclick: () => openModal() }, ["Customize"]),
      el("button", { class: "mrx-btn mrx-btn-primary", id: "mrxBtnAccept", onclick: () => { acceptAll(); teardown(); } }, ["Accept"])
    ])
  ]);

  const backdrop = el("div", { id: "mrxConsentBackdrop", onclick: () => {} });

  const modal = el("div", { id: "mrxConsentModal", role: "dialog", "aria-modal": "true", "aria-label": "Cookie preferences" }, [
    el("div", { class: "mrx-modal-head" }, [
      el("div", { class: "mrx-modal-title" }, ["Cookie preferences"]),
      el("button", { class: "mrx-btn mrx-btn-x", onclick: () => closeModal(), "aria-label": "Close" }, ["×"])
    ]),
    el("div", { class: "mrx-modal-body" }, [
      el("div", { class: "mrx-row" }, [
        el("div", { class: "mrx-row-left" }, [
          el("div", { class: "mrx-row-title" }, ["Necessary"]),
          el("div", { class: "mrx-row-desc" }, ["Always on. Required for security and core operation."])
        ]),
        el("div", { class: "mrx-row-right" }, [ el("input", { type: "checkbox", checked: "checked", disabled: "disabled" }) ])
      ]),
      el("div", { class: "mrx-row" }, [
        el("div", { class: "mrx-row-left" }, [
          el("div", { class: "mrx-row-title" }, ["Analytics"]),
          el("div", { class: "mrx-row-desc" }, ["Helps us understand usage. Off by default."])
        ]),
        el("div", { class: "mrx-row-right" }, [ el("input", { id: "mrxOptAnalytics", type: "checkbox" }) ])
      ]),
      el("div", { class: "mrx-row" }, [
        el("div", { class: "mrx-row-left" }, [
          el("div", { class: "mrx-row-title" }, ["Marketing"]),
          el("div", { class: "mrx-row-desc" }, ["Used for personalized marketing. Off by default."])
        ]),
        el("div", { class: "mrx-row-right" }, [ el("input", { id: "mrxOptMarketing", type: "checkbox" }) ])
      ])
    ]),
    el("div", { class: "mrx-modal-actions" }, [
      el("button", { class: "mrx-btn mrx-btn-ghost", onclick: () => { rejectAll(); teardown(); closeModal(); } }, ["Reject all"]),
      el("button", { class: "mrx-btn mrx-btn-primary", onclick: () => {
        const analytics = !!document.getElementById("mrxOptAnalytics").checked;
        const marketing = !!document.getElementById("mrxOptMarketing").checked;
        savePreferences({ analytics, marketing });
        teardown();
        closeModal();
      } }, ["Save"])
    ])
  ]);

  ui.appendChild(bar);
  ui.appendChild(backdrop);
  ui.appendChild(modal);
  document.body.appendChild(ui);
}

function teardown() {
  const bar = document.getElementById("mrxConsentBar");
  if (bar) bar.remove();
  const backdrop = document.getElementById("mrxConsentBackdrop");
  if (backdrop) backdrop.remove();
  const modal = document.getElementById("mrxConsentModal");
  if (modal) modal.remove();
  const ui = document.getElementById("mrxConsentUI");
  if (ui) ui.remove();
  window.removeEventListener("keydown", trapKeys, true);
}

export function mountConsentUI() {
  ensureLockLayer();
  ensureUI();
  window.addEventListener("keydown", trapKeys, true);
  openModal();
}

export function maybeMountConsentUI() {
  if (!isDecided()) mountConsentUI();
}
