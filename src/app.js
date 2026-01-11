import { initConsent } from "./consent.js";
import { loadDict, RTL_LANGS, DEFAULT_LANG, LANG_STORAGE_KEY } from "./i18n.js";
import { initLangRailTimers } from "./ui-lang-rail.js";
import { initVerticals } from "./ui-verticals.js";

function poolForLang(lang){
  const POOL_LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const POOL_CYR   = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЭЮЯ0123456789";
  const POOL_DEV   = "अआइईउऊएऐओऔकखगघचछजझटठडढतथदधनपफबभमयरलवशषसह०१२३४५६७८९";
  const POOL_CJK   = "的一是在不了有人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经";
  const POOL_AR    = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي٠١٢٣٤٥٦٧٨٩";

  if (lang === "ru") return POOL_CYR;
  if (lang === "hi") return POOL_DEV;
  if (lang === "zh") return POOL_CJK;
  if (lang === "ar") return POOL_AR;
  return POOL_LATIN;
}

function scrambleSmart(el, finalText, durationMs, lang){
  const base = String(finalText ?? "");
  const pool = poolForLang(lang);
  const isArabic = (lang === "ar");

  const start = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - start) / durationMs);
    const reveal = Math.floor(p * base.length);

    if (isArabic){
      const shown = base.slice(0, reveal);
      const hidden = base.slice(reveal).replace(/[^\s]/g, " ");
      el.textContent = shown + hidden;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = base;
      return;
    }

    let out = "";
    for (let i = 0; i < base.length; i++){
      const c = base[i];
      if (i < reveal) { out += c; continue; }
      if (c === " ") { out += " "; continue; }
      if (/[\.\,\!\?\:\;\-\—\–\(\)\[\]\/\&\+%#@€$£"']/.test(c)) { out += c; continue; }
      out += pool[(Math.random() * pool.length) | 0];
    }
    el.textContent = out;

    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = base;
  };
  requestAnimationFrame(tick);
}

function getLang(){ return localStorage.getItem(LANG_STORAGE_KEY) || DEFAULT_LANG; }
function setLang(lang){ localStorage.setItem(LANG_STORAGE_KEY, lang); }

async function applyLang(lang){
  document.body.classList.add("is-i18n-switching");

  try{
    const dict = await loadDict(lang);
    const fallback = await loadDict(DEFAULT_LANG);

    const html = document.documentElement;
    html.lang = lang;
    html.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";

    const switchEl = document.getElementById("lang-switch");
    switchEl?.classList.remove("is-open");
    switchEl?.classList.remove("open-right");

    const railEl = document.getElementById("lang-rail");
    if (railEl){
      railEl.querySelectorAll(".lang-pill").forEach(btn => {
        const l = btn.getAttribute("data-lang");
        btn.hidden = (l === lang);
      });
      railEl.scrollLeft = 0;
    }

    const nodes = Array.from(document.querySelectorAll("[data-i18n]"));
    nodes.forEach(el => el.classList.add("mx-i18n-out"));

    setTimeout(() => {
      nodes.forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (!key) return;

        const val = (dict[key] ?? fallback[key]);
        if (typeof val !== "string") return;

        scrambleSmart(el, val, 220, lang);

        el.classList.remove("mx-i18n-out");
        el.classList.add("mx-i18n-in");
      });

      const gear = document.getElementById("cookiePreferencesGear");
      if (gear){
        const tip = (dict["cookie.prefs"] ?? fallback["cookie.prefs"] ?? "Cookie Preferences");
        gear.setAttribute("data-tip", tip);
        gear.setAttribute("aria-label", tip);
      }

      setTimeout(() => nodes.forEach(el => el.classList.remove("mx-i18n-in")), 220);
    }, 160);

  } finally {
    setTimeout(() => document.body.classList.remove("is-i18n-switching"), 260);
  }
}

function initRailSelection(){
  const rail = document.getElementById("lang-rail");
  if (!rail) return;

  const isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);

  const TAP_MOVE_PX = 14;
  const TAP_SCROLL_PX = 6;

  let startX = 0, startY = 0, startScroll = 0;
  let dragging = false;
  let pressedBtn = null;

  function ptFromTouch(t){ return { x: t.clientX, y: t.clientY }; }

  rail.addEventListener("touchstart", (e) => {
    const targetBtn = e.target && e.target.closest ? e.target.closest(".lang-pill") : null;
    pressedBtn = targetBtn && rail.contains(targetBtn) ? targetBtn : null;

    if (!e.touches || e.touches.length === 0) return;
    const p = ptFromTouch(e.touches[0]);
    startX = p.x;
    startY = p.y;
    startScroll = rail.scrollLeft;
    dragging = false;

    if (pressedBtn){
      e.preventDefault();
    }
  }, { passive:false });

  rail.addEventListener("touchmove", (e) => {
    if (!e.touches || e.touches.length === 0) return;

    const p = ptFromTouch(e.touches[0]);
    const dx = Math.abs(p.x - startX);
    const dy = Math.abs(p.y - startY);
    const ds = Math.abs(rail.scrollLeft - startScroll);

    if (dx > TAP_MOVE_PX || dy > TAP_MOVE_PX || ds > TAP_SCROLL_PX){
      dragging = true;
    }
  }, { passive:true });

  rail.addEventListener("touchend", (e) => {
    if (dragging){ pressedBtn = null; return; }

    let btn = pressedBtn;

    if (!btn){
      const ct = e.changedTouches && e.changedTouches[0];
      if (ct){
        const p = ptFromTouch(ct);
        const el = document.elementFromPoint(p.x, p.y);
        const maybe = el && el.closest ? el.closest(".lang-pill") : null;
        if (maybe && rail.contains(maybe)) btn = maybe;
      }
    }

    if (!btn || btn.hidden){ pressedBtn = null; return; }

    e.preventDefault();
    e.stopPropagation();

    const lang = btn.getAttribute("data-lang") || DEFAULT_LANG;
    setLang(lang);
    applyLang(lang);

    btn.blur();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

    pressedBtn = null;
  }, { passive:false });

  rail.addEventListener("touchcancel", () => {
    dragging = false;
    pressedBtn = null;
  }, { passive:true });

  rail.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, true);

  if (!isTouch){
    let downX = 0, downY = 0;
    let pDragging = false;

    rail.addEventListener("pointerdown", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(".lang-pill") : null;
      if (btn) e.preventDefault();
      downX = e.clientX; downY = e.clientY;
      pDragging = false;
    }, { passive:false });

    rail.addEventListener("pointermove", (e) => {
      if (Math.abs(e.clientX - downX) > 10 || Math.abs(e.clientY - downY) > 10) pDragging = true;
    }, { passive:true });

    rail.addEventListener("pointerup", (e) => {
      if (pDragging) return;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const btn = el && el.closest ? el.closest(".lang-pill") : null;
      if (!btn || !rail.contains(btn) || btn.hidden) return;

      const lang = btn.getAttribute("data-lang") || DEFAULT_LANG;
      setLang(lang);
      applyLang(lang);

      btn.blur();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }, { passive:true });
  }
}

(async () => {
  initConsent();
  await applyLang(getLang());
  initRailSelection();
  initLangRailTimers();
  initVerticals();
  window.__mxApplyLang = applyLang;
})();
