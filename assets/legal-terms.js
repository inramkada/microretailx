/* legal-terms.js — MICRORETAILX LLC
   Legal pages UX + consent management (future use) + local CONSENT REF
   No external dependencies · CSP-safe · A11y-first
*/
(() => {
  "use strict";

  /* ---------------------------------------------------
     Viewport fix (iOS Safari)
  --------------------------------------------------- */
  function setVhVar(){
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }
  setVhVar();
  window.addEventListener("resize", setVhVar, { passive:true });
  window.addEventListener("orientationchange", setVhVar, { passive:true });

  /* ---------------------------------------------------
     Helpers
  --------------------------------------------------- */
  const $ = (q, r=document) => r.querySelector(q);
  const $$ = (q, r=document) => Array.from(r.querySelectorAll(q));

  function safeJSON(v){ try { return JSON.parse(v); } catch { return null; } }

  function toast(msg){
    const el = $("#privacyToast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* ---------------------------------------------------
     Section numbering (legal docs)
  --------------------------------------------------- */
  (function numberSections(){
    const root = $("#termsText");
    if (!root) return;
    let i = 0;
    root.querySelectorAll("h2").forEach(h => {
      i++;
      const s = document.createElement("span");
      s.className = "secno";
      s.textContent = `${i}.`;
      h.prepend(s);
    });
  })();

  /* ---------------------------------------------------
     Consent / CONSENT REF
  --------------------------------------------------- */
  const CONSENT_KEY = "mrx_consent_v1";
  const CONSENT_DAYS = 365;

  function genConsentRef(){
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    return "cr_" + btoa(String.fromCharCode(...b))
      .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  }

  function setCookie(name,val,days){
    const d = new Date();
    d.setTime(d.getTime() + days*864e5);
    document.cookie = `${name}=${encodeURIComponent(val)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  }

  function getCookie(name){
    return document.cookie
      .split("; ")
      .map(v=>v.split("="))
      .find(v=>v[0]===name)?.[1] || null;
  }

  function loadConsent(){
    return safeJSON(localStorage.getItem(CONSENT_KEY))
        || safeJSON(getCookie(CONSENT_KEY));
  }

  function saveConsent(obj){
    const s = JSON.stringify(obj);
    localStorage.setItem(CONSENT_KEY, s);
    setCookie(CONSENT_KEY, s, CONSENT_DAYS);
  }

  function applyConsent(c){
    document.documentElement.dataset.consent =
      (c.analytics || c.marketing) ? "granted" : "denied";
    document.documentElement.dataset.analytics = c.analytics ? "1":"0";
    document.documentElement.dataset.marketing = c.marketing ? "1":"0";
  }

  function showConsentRef(id){
    if (!id) return;
    let el = document.getElementById("audit-display");
    if (!el){
      el = document.createElement("div");
      el.id = "audit-display";
      el.style.cssText =
        "font-size:7px;opacity:.25;margin-top:6px;letter-spacing:1px;color:#fff";
      document.querySelector(".footer-bar")?.appendChild(el);
    }
    el.textContent = `CONSENT-REF: ${id.toUpperCase()}`;
  }

  /* ---------------------------------------------------
     Consent UI elements
  --------------------------------------------------- */
  const banner = $("#consentBanner");
  const modalBg = $("#consentModalBackdrop");

  const btnReject = $("#consentReject");
  const btnAccept = $("#consentAccept");
  const btnManage = $("#consentManage");
  const btnSave = $("#consentSave");
  const btnAcceptAll = $("#consentAcceptAll");
  const btnClose = $("#consentModalClose");

  const tAnalytics = $("#toggleAnalytics");
  const tMarketing = $("#toggleMarketing");

  function setToggle(el,on){
    el.classList.toggle("on", !!on);
    el.setAttribute("aria-checked", String(!!on));
  }

  function lock(){
    document.body.classList.add("consent-locked");
    document.documentElement.style.overflow = "hidden";
  }
  function unlock(){
    document.body.classList.remove("consent-locked");
    document.documentElement.style.overflow = "";
  }

  function openPanel(){
    const c = loadConsent() || {analytics:false,marketing:false};
    setToggle(tAnalytics, c.analytics);
    setToggle(tMarketing, c.marketing);
    modalBg.classList.add("open");
    modalBg.setAttribute("aria-hidden","false");
  }
  function closePanel(){
    modalBg.classList.remove("open");
    modalBg.setAttribute("aria-hidden","true");
  }

  function commitConsent(analytics, marketing){
    const opt = analytics || marketing;
    const prev = loadConsent();
    const c = {
      necessary:true,
      analytics, marketing,
      decision: opt ? "accepted":"rejected",
      ts: Date.now(),
      auditId: opt ? (prev?.auditId || genConsentRef()) : null
    };
    saveConsent(c);
    applyConsent(c);
    showConsentRef(c.auditId);
    banner?.classList.remove("open");
    closePanel();
    unlock();
  }

  /* ---------------------------------------------------
     Bindings
  --------------------------------------------------- */
  btnReject?.addEventListener("click",()=>commitConsent(false,false));
  btnAccept?.addEventListener("click",()=>commitConsent(true,true));
  btnAcceptAll?.addEventListener("click",()=>commitConsent(true,true));
  btnManage?.addEventListener("click",openPanel);
  btnSave?.addEventListener("click",()=>commitConsent(
    tAnalytics.classList.contains("on"),
    tMarketing.classList.contains("on")
  ));
  btnClose?.addEventListener("click",closePanel);

  tAnalytics?.addEventListener("click",()=>setToggle(tAnalytics,!tAnalytics.classList.contains("on")));
  tMarketing?.addEventListener("click",()=>setToggle(tMarketing,!tMarketing.classList.contains("on")));

  document.getElementById("cookiePreferencesLink")?.addEventListener("click",(e)=>{
    e.preventDefault(); openPanel();
  });
  document.getElementById("cookiePreferencesInline")?.addEventListener("click",(e)=>{
    e.preventDefault(); openPanel();
  });

  /* ---------------------------------------------------
     Init
  --------------------------------------------------- */
  const existing = loadConsent();
  if (existing){
    applyConsent(existing);
    showConsentRef(existing.auditId);
  } else {
    lock();
    banner?.classList.add("open");
    btnAccept?.focus?.();
  }

  /* ---------------------------------------------------
     Back to top
  --------------------------------------------------- */
  window.addEventListener("DOMContentLoaded",()=>{
    const btn = document.getElementById("backToTop");
    const sc = document.getElementById("termsScroll");
    if (!btn || !sc) return;
    sc.addEventListener("scroll",()=>{
      btn.classList.toggle("show", sc.scrollTop > 300);
    },{passive:true});
    btn.addEventListener("click",()=>sc.scrollTo({top:0,behavior:"smooth"}));
  });
})();
