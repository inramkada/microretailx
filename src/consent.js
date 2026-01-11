export function initConsent(){
  const CONSENT_KEY = "mx_consent";
  const CONSENT_ID_KEY = "mx_consent_cid";
  const CMP_VER = 1;

  const cmpEl = document.getElementById("mx-cmp");
  const appRoot = document.getElementById("app-root");

  const cidLine = document.getElementById("mx-cmp-cid");
  const cidText = document.getElementById("mx-cid-text");

  const tgAnalytics = document.getElementById("mx-tg-analytics");
  const tgMarketing = document.getElementById("mx-tg-marketing");

  const btnAccept = document.getElementById("mx-btn-accept");
  const btnReject = document.getElementById("mx-btn-reject");
  const btnSave   = document.getElementById("mx-btn-save");

  let copiedTimer = null;

  function safeParse(json){
    try{ return JSON.parse(json); } catch(_){ return null; }
  }

  function genCID(){
    const bytes = new Uint8Array(12);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i=0;i<bytes.length;i++) bytes[i] = (Math.random()*256)|0;
    return Array.from(bytes).map(b => b.toString(16).padStart(2,"0")).join("");
  }

  function getCID(){
    let cid = localStorage.getItem(CONSENT_ID_KEY);
    if (!cid){
      cid = genCID();
      localStorage.setItem(CONSENT_ID_KEY, cid);
    }
    return cid;
  }

  function readConsent(){
    const v = localStorage.getItem(CONSENT_KEY);
    const obj = safeParse(v);
    if (!obj || typeof obj !== "object") return null;
    if (obj.v !== CMP_VER) return null;
    if (!obj.choices || typeof obj.choices !== "object") return null;
    return obj;
  }

  function writeConsent(choices){
    const payload = {
      v: CMP_VER,
      cid: getCID(),
      ts: Date.now(),
      choices: {
        necessary: true,
        analytics: !!choices.analytics,
        marketing: !!choices.marketing
      }
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    return payload;
  }

  function isDecided(){ return !!readConsent(); }

  function lockUI(){
    document.body.classList.add("mx-consent-locked");
    if (appRoot) appRoot.setAttribute("aria-hidden", "true");
  }

  function unlockUI(){
    document.body.classList.remove("mx-consent-locked");
    if (appRoot) appRoot.removeAttribute("aria-hidden");
  }

  function setToggle(btn, on){
    if (!btn) return;
    btn.setAttribute("data-on", on ? "1" : "0");
  }

  function getToggle(btn){
    if (!btn) return 0;
    return btn.getAttribute("data-on") === "1" ? 1 : 0;
  }

  function toggle(btn){
    const on = getToggle(btn);
    setToggle(btn, on ? 0 : 1);
  }

  async function copyText(text){
    try{
      if (navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch(_){}

    try{
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    } catch(_){
      return false;
    }
  }

  function renderCID(){
    const cid = getCID();
    if (cidText) cidText.textContent = `: ${cid}`;
    if (cidLine) cidLine.setAttribute("data-cid", cid);
  }

  function showCopied(){
    if (!cidLine) return;
    if (copiedTimer) clearTimeout(copiedTimer);
    cidLine.classList.add("is-copied");
    copiedTimer = setTimeout(() => cidLine.classList.remove("is-copied"), 900);
  }

  function openCMP(forceLock){
    if (!cmpEl) return;

    const existing = readConsent();
    setToggle(tgAnalytics, existing?.choices?.analytics ? 1 : 0);
    setToggle(tgMarketing, existing?.choices?.marketing ? 1 : 0);

    renderCID();

    cmpEl.classList.add("is-open");
    if (forceLock) lockUI();
    else unlockUI();
  }

  function closeCMP(){
    if (!cmpEl) return;
    cmpEl.classList.remove("is-open");
    unlockUI();
  }

  function acceptAll(){
    writeConsent({ analytics:true, marketing:true });
    closeCMP();
  }

  function rejectAll(){
    writeConsent({ analytics:false, marketing:false });
    closeCMP();
  }

  function savePrefs(){
    writeConsent({
      analytics: !!getToggle(tgAnalytics),
      marketing: !!getToggle(tgMarketing)
    });
    closeCMP();
  }

  tgAnalytics?.addEventListener("click", (e) => { e.preventDefault(); toggle(tgAnalytics); });
  tgMarketing?.addEventListener("click", (e) => { e.preventDefault(); toggle(tgMarketing); });

  btnAccept?.addEventListener("click", (e) => { e.preventDefault(); acceptAll(); });
  btnReject?.addEventListener("click", (e) => { e.preventDefault(); rejectAll(); });
  btnSave?.addEventListener("click", (e) => { e.preventDefault(); savePrefs(); });

  const gear = document.getElementById("cookiePreferencesGear");
  gear?.addEventListener("click", (e) => {
    e.preventDefault();
    openCMP(false);
  });

  cidLine?.addEventListener("click", async (e) => {
    e.preventDefault();
    const cid = cidLine.getAttribute("data-cid") || getCID();
    const ok = await copyText(`CID:${cid}`);
    if (ok) showCopied();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!isDecided() && cmpEl?.classList.contains("is-open")) return;
    if (cmpEl?.classList.contains("is-open")) closeCMP();
  });

  window.__mxConsent = {
    isDecided,
    getCID,
    getConsent: () => readConsent(),
    open: () => openCMP(false),
    openLocked: () => openCMP(true),
    acceptAll,
    rejectAll,
    savePrefs,
    reset: () => { localStorage.removeItem(CONSENT_KEY); openCMP(true); }
  };

  if (!isDecided()){
    openCMP(true);
  }

  return window.__mxConsent;
}
