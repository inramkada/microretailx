"use strict";

    
    // iOS/Safari viewport fix: use --vh based on innerHeight (handles URL bar collapse/expand)
    function setVhVar(){
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", vh + "px");
    }
    setVhVar();
    window.addEventListener("resize", setVhVar, { passive: true });
    window.addEventListener("orientationchange", setVhVar, { passive: true });

const toastEl = document.getElementById("privacyToast");
    let toastTimer = null;
    function showToast(msg){
      if (!toastEl) return;
      toastEl.textContent = msg;
      toastEl.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(()=>toastEl.classList.remove("show"), 2600);
    }

    function numberSections(){
      const root = document.getElementById("termsText");
      if (!root) return;
      const headings = Array.from(root.querySelectorAll("h2"));
      let major = 0;
      headings.forEach(h => {
        major += 1;
        const span = document.createElement("span");
        span.className = "secno";
        span.textContent = `${major}.`;
        h.prepend(span);
      });
    }
    numberSections();

    const CONSENT_KEY = "mrxx_consent_v1";
    const CONSENT_MAX_DAYS = 365;

    const consentBanner = document.getElementById("consentBanner");
    const consentModalBackdrop = document.getElementById("consentModalBackdrop");
    const cookiePreferencesLink = document.getElementById("cookiePreferencesLink");
    const cookiePreferencesInline = document.getElementById("cookiePreferencesInline");

    const consentReject = document.getElementById("consentReject");
    const consentManage = document.getElementById("consentManage");
    const consentAccept = document.getElementById("consentAccept");

    const consentModalClose = document.getElementById("consentModalClose");
    const consentSave = document.getElementById("consentSave");
    const consentAcceptAll = document.getElementById("consentAcceptAll");

    const toggleAnalytics = document.getElementById("toggleAnalytics");
    const toggleMarketing = document.getElementById("toggleMarketing");

    

    // Accessibility: focus trap for consent modal (prevents tabbing behind the lock)
    let lastActiveEl = null;
    function getFocusable(container){
      if (!container) return [];
      const sel = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])"
      ].join(",");
      return Array.from(container.querySelectorAll(sel)).filter(el => {
        const style = window.getComputedStyle(el);
        return style.visibility !== "hidden" && style.display !== "none";
      });
    }
    function trapFocus(e){
      if (!consentModalBackdrop.classList.contains("open")) return;
      if (e.key !== "Tab") return;
      const modal = consentModalBackdrop.querySelector(".consent-modal");
      const focusables = getFocusable(modal);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey){
        if (active === first || !modal.contains(active)){
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last){
          e.preventDefault();
          first.focus();
        }
      }
    }


    function trapFocusBanner(e){
      if (!document.body.classList.contains("consent-locked")) return;
      if (!consentBanner.classList.contains("open")) return;
      if (consentModalBackdrop.classList.contains("open")) return;
      if (e.key !== "Tab") return;
      const focusables = getFocusable(consentBanner);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey){
        if (active === first || !consentBanner.contains(active)){
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last){
          e.preventDefault();
          first.focus();
        }
      }
    }

function lockSite(){
      document.body.classList.add("consent-locked");
      document.documentElement.style.overflow = "hidden";
      // Hide background content from screen readers while locked
      const bg = document.querySelector(".terms-wrap");
      const footer = document.querySelector(".footer-bar");
      if (bg) bg.setAttribute("aria-hidden","true");
      if (footer) footer.setAttribute("aria-hidden","true");
    }
    function unlockSite(){
      document.body.classList.remove("consent-locked");
      document.documentElement.style.overflow = "";
      const bg = document.querySelector(".terms-wrap");
      const footer = document.querySelector(".footer-bar");
      if (bg) bg.removeAttribute("aria-hidden");
      if (footer) footer.removeAttribute("aria-hidden");
    }
    function wakeSite(){
      unlockSite();
      void document.body.offsetHeight;
      document.body.classList.add("consent-waking");
      setTimeout(()=>document.body.classList.remove("consent-waking"), 1250);
    }

    // HARD LOCK guards: block any interaction/navigation behind the consent UI until a decision is made
    function isConsentLocked(){
      return document.body.classList.contains("consent-locked");
    }
    function isInsideConsentUI(node){
      return (consentModalBackdrop && consentModalBackdrop.contains(node)) ||
             (consentBanner && consentBanner.contains(node));
    }
    (function installHardLockGuards(){
      // Clicks (links/buttons) behind the consent UI
      document.addEventListener("click", (e)=>{
        if (!isConsentLocked()) return;
        if (isInsideConsentUI(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        // Keep banner visible and focusable
        if (consentBanner) consentBanner.classList.add("open");
        try { consentAccept && consentAccept.focus({preventScroll:true}); } catch(_){}
      }, true);

      // Keyboard activation behind the consent UI (Enter/Space/etc.)
      document.addEventListener("keydown", (e)=>{
        if (!isConsentLocked()) return;
        if (isInsideConsentUI(e.target)) return;

        // Allow only focus management keys; everything else gets blocked
        const allowed = (e.key === "Tab" || e.key === "Shift" || e.key === "Escape");
        if (!allowed){
          e.preventDefault();
          e.stopPropagation();
        }

        if (e.key === "Escape"){
          e.preventDefault();
          e.stopPropagation();
          if (consentBanner) consentBanner.classList.add("open");
          try { consentAccept && consentAccept.focus({preventScroll:true}); } catch(_){}
        }
      }, true);

      // Wheel / touch scrolling behind the consent UI
      window.addEventListener("wheel", (e)=>{
        if (!isConsentLocked()) return;
        if (isInsideConsentUI(e.target)) return;
        e.preventDefault();
      }, { passive:false, capture:true });

      window.addEventListener("touchmove", (e)=>{
        if (!isConsentLocked()) return;
        if (isInsideConsentUI(e.target)) return;
        e.preventDefault();
      }, { passive:false, capture:true });
    })();

    function setCookie(name, value, days){
      const d = new Date();
      d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
    }
    function getCookie(name){
      const parts = document.cookie ? document.cookie.split("; ") : [];
      for (const p of parts){
        const idx = p.indexOf("=");
        const k = idx >= 0 ? p.slice(0, idx) : p;
        const v = idx >= 0 ? p.slice(idx + 1) : "";
        if (k === name) return decodeURIComponent(v);
      }
      return null;
    }

    function loadConsent(){
      const ls = localStorage.getItem(CONSENT_KEY);
      if (ls){ try { return JSON.parse(ls); } catch(_){} }
      const ck = getCookie(CONSENT_KEY);
      if (ck){ try { return JSON.parse(ck); } catch(_){} }
      return null;
    }
    function saveConsent(consent){
      const payload = JSON.stringify(consent);
      localStorage.setItem(CONSENT_KEY, payload);
      setCookie(CONSENT_KEY, payload, CONSENT_MAX_DAYS);
    }

    function generateAuditID(){
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    }
    function displayAuditID(id){
      let el = document.getElementById("audit-display");
      if (!el){
        el = document.createElement("div");
        el.id = "audit-display";
        el.style.cssText = "font-size:7px;opacity:0.25;margin-top:8px;letter-spacing:1px;text-transform:uppercase;color:white;";
        document.querySelector(".footer-bar").appendChild(el);
      }
      el.textContent = id ? `CONSENT-REF: ${String(id).toUpperCase()}` : "PREFERENCES: MINIMAL";
    }

    function applyConsent(consent){
      document.documentElement.dataset.analytics = consent.analytics ? "1" : "0";
      document.documentElement.dataset.marketing = consent.marketing ? "1" : "0";
      document.documentElement.dataset.consent = (consent.analytics || consent.marketing) ? "granted" : "denied";
    }

    function setToggle(el, on){
      el.classList.toggle("on", !!on);
      el.setAttribute("aria-checked", String(!!on));
    }

    function openConsentPanel(){
      const current = loadConsent() || { necessary:true, analytics:false, marketing:false, ts:Date.now(), decision:"rejected", auditId:null };
      setToggle(toggleAnalytics, !!current.analytics);
      setToggle(toggleMarketing, !!current.marketing);
      consentModalBackdrop.classList.add("open");
      consentModalBackdrop.setAttribute("aria-hidden", "false");
    
      // Save focus and move focus into modal
      lastActiveEl = document.activeElement;
      const modal = consentModalBackdrop.querySelector(".consent-modal");
      const focusables = getFocusable(modal);
      (focusables[0] || modal).focus({ preventScroll:true });
}

    function closeConsentPanel(){
      consentModalBackdrop.classList.remove("open");
      consentModalBackdrop.setAttribute("aria-hidden", "true");
    
      // Restore focus to where the user was
      if (lastActiveEl && typeof lastActiveEl.focus === "function"){
        try { lastActiveEl.focus({ preventScroll:true }); } catch(_){ try{ lastActiveEl.focus(); }catch(__){} }
      }
      lastActiveEl = null;
}

    function hideBanner(){
      consentBanner.classList.remove("open");
      wakeSite();
    }

    function setAllConsent(val){
      const granted = !!val;
      const consent = {
        necessary:true,
        analytics:granted,
        marketing:granted,
        ts:Date.now(),
        decision: granted ? "accepted" : "rejected",
        auditId: granted ? generateAuditID() : null
      };
      saveConsent(consent);
      applyConsent(consent);
      displayAuditID(consent.auditId);
      hideBanner();
      closeConsentPanel();
    }

    function saveFromPanel(){
      const prev = loadConsent();
      const analytics = toggleAnalytics.classList.contains("on");
      const marketing = toggleMarketing.classList.contains("on");
      const optionalOn = analytics || marketing;

      const consent = {
        necessary:true,
        analytics,
        marketing,
        ts:Date.now(),
        decision: optionalOn ? "accepted" : "rejected",
        auditId: optionalOn ? (prev && prev.auditId ? prev.auditId : generateAuditID()) : null
      };

      saveConsent(consent);
      applyConsent(consent);
      displayAuditID(consent.auditId);
      hideBanner();
      closeConsentPanel();
    }

    function toggleSwitch(el){ setToggle(el, !el.classList.contains("on")); }
    function handleSwitchKey(el, e){
      if (e.key === "Enter" || e.key === " "){ e.preventDefault(); toggleSwitch(el); }
    }

    cookiePreferencesLink.addEventListener("click", (e)=>{ e.preventDefault(); openConsentPanel(); });
    cookiePreferencesInline.addEventListener("click", (e)=>{ e.preventDefault(); openConsentPanel(); });

    consentManage.addEventListener("click", ()=>openConsentPanel());
    consentReject.addEventListener("click", ()=>setAllConsent(false));
    consentAccept.addEventListener("click", ()=>setAllConsent(true));

    consentModalClose.addEventListener("click", ()=>closeConsentPanel());
    consentSave.addEventListener("click", ()=>saveFromPanel());
    consentAcceptAll.addEventListener("click", ()=>setAllConsent(true));

    consentModalBackdrop.addEventListener("click", (e)=>{ if (e.target === consentModalBackdrop) closeConsentPanel(); });
    document.addEventListener("keydown", (e)=>{ if (e.key === "Escape") closeConsentPanel(); });

    
    document.addEventListener("keydown", trapFocus);
    document.addEventListener("keydown", trapFocusBanner);
toggleAnalytics.addEventListener("click", ()=>toggleSwitch(toggleAnalytics));
    toggleMarketing.addEventListener("click", ()=>toggleSwitch(toggleMarketing));
    toggleAnalytics.addEventListener("keydown", (e)=>handleSwitchKey(toggleAnalytics, e));
    toggleMarketing.addEventListener("keydown", (e)=>handleSwitchKey(toggleMarketing, e));

    const existingConsent = loadConsent();
    if (existingConsent){
      applyConsent(existingConsent);
      displayAuditID(existingConsent.auditId);
      wakeSite();
    } else {
      lockSite();
      consentBanner.classList.add("open");
          // Focus primary action for keyboard users
      try { consentAccept.focus({preventScroll:true}); } catch(_) { try{ consentAccept.focus(); }catch(__){} }
}

    function printViaIframe(){
      const content = document.getElementById("termsText")?.innerHTML || "";
      if (!content.trim()){
        showToast("Nothing to print.");
        return;
      }

      const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>MICRORETAILX TERMS OF USE (MRX-TOU-2025-12-25 V1)</title>
<style>
  html,body{margin:0;padding:0;background:#fff;color:#000;font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;}
  .wrap{padding:18px 20px;}
  @page{ margin:14mm; }
  h2{margin:18px 0 8px;font-size:12.5px;letter-spacing:1px;text-transform:uppercase;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;}
  .meta{font-size:11px;line-height:1.45;margin-bottom:14px;}
  .body{font-size:13px;line-height:1.75;}
  .secno{margin-right:8px;}

/* Back to Top button */
#backToTop {
  position: fixed;
  right: 22px;
  bottom: 78px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.25);
  background: rgba(0,0,0,0.65);
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transform: translateY(8px);
  transition: opacity .25s ease, transform .25s ease, background .25s ease;
  z-index: 9999;
}
#backToTop.show {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}
#backToTop:hover {
  background: rgba(255,255,255,0.12);
}


/* Ensure internal scroll area clears the fixed footer */
#termsScroll, .terms-scroll {
  padding-bottom: 90px;
  box-sizing: border-box;
  scroll-padding-bottom: 90px;
}

</style>
</head>
<body>
  <div class="wrap">
    <div class="meta">
      <div><strong>MICRORETAILX LLC</strong> (Delaware, USA)</div>
      <div>MICRORETAILX GROUP – Global Operations Framework</div>
      <div>Last updated: 2025-12-25 · Effective date: 2025-12-25</div>
      <div><strong>CT, 1209 Orange Street, Wilmington, DE 19801, United States of America.</strong></div>
    </div>
    <div class="body">${content}</div>
  </div>

<!-- Back to Top -->
<button id="backToTop" aria-label="Back to top">↑</button>

</body>
</html>`;

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.opacity = "0";
      iframe.setAttribute("aria-hidden", "true");
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      const w = iframe.contentWindow;
      const cleanup = () => { try { document.body.removeChild(iframe); } catch(e){} };
      const tryPrint = () => {
        try { w.focus(); } catch(e){}
        try { w.print(); } catch(e){ cleanup(); }
      };

      w.onafterprint = cleanup;

      if (doc.readyState === "complete") {
        setTimeout(tryPrint, 50);
      } else {
        iframe.onload = () => setTimeout(tryPrint, 50);
        setTimeout(tryPrint, 200);
      }
    }

    const printBtn = document.getElementById("printPDF");
    if (printBtn){
      printBtn.addEventListener("mouseenter", ()=>showToast("Opens Print dialog (Save as PDF)."));
      printBtn.addEventListener("click", ()=>printViaIframe());
    }

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d", { alpha:false });

    let width = window.innerWidth;
    let height = window.innerHeight;

    const PR = Math.min(2, window.devicePixelRatio || 1);

    function resizeHiDPI(){
      canvas.width = Math.floor(window.innerWidth * PR);
      canvas.height = Math.floor(window.innerHeight * PR);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(PR, 0, 0, PR, 0, 0);
      width = window.innerWidth;
      height = window.innerHeight;
    }
    resizeHiDPI();
    window.addEventListener("resize", resizeHiDPI);

    function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
    function easeInOutCubic(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }
    function smoothPulse(t){ return 0.5 - 0.5*Math.cos(Math.PI * clamp(t,0,1)); }

    function drawGlowDot(x, y, r, a){
      if (a <= 0) return;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(0,234,255,${a})`);
      g.addColorStop(0.35, `rgba(0,234,255,${a*0.35})`);
      g.addColorStop(1, `rgba(0,234,255,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawX(alpha){
      ctx.save();
      ctx.strokeStyle = `rgba(0,234,255,${alpha})`;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(width, height);
      ctx.moveTo(width, 0); ctx.lineTo(0, height);
      ctx.stroke();

      ctx.strokeStyle = `rgba(0,234,255,${alpha*0.52})`;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(width, height);
      ctx.moveTo(width, 0); ctx.lineTo(0, height);
      ctx.stroke();
      ctx.restore();
    }

    let phaseT = 0;
    let last = performance.now();

    const PHASE_IN = 2.8;
    const PHASE_HOLD = 1.15;
    const PHASE_OUT = 2.2;
    const PHASE_REST = 0.55;
    const CYCLE = PHASE_IN + PHASE_HOLD + PHASE_OUT + PHASE_REST;

    function lerp(a,b,t){ return a + (b-a)*t; }


    let rafId = null;
    let rafPaused = false;

    function startAnim(){
      if (rafId != null) return;
      rafPaused = false;
      last = performance.now();
      rafId = rafId = requestAnimationFrame(loop);
    }
    function stopAnim(){
      rafPaused = true;
      if (rafId != null){
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    document.addEventListener("visibilitychange", ()=>{
      if (document.visibilityState === "hidden") stopAnim();
      else startAnim();
    });


    function loop(now){
      if (rafPaused) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      phaseT = (phaseT + dt) % CYCLE;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      const tIn = clamp(phaseT / PHASE_IN, 0, 1);
      const tHold = clamp((phaseT - PHASE_IN) / PHASE_HOLD, 0, 1);
      const tOut = clamp((phaseT - PHASE_IN - PHASE_HOLD) / PHASE_OUT, 0, 1);
      const inActive = phaseT < PHASE_IN;
      const holdActive = phaseT >= PHASE_IN && phaseT < PHASE_IN + PHASE_HOLD;
      const outActive = phaseT >= PHASE_IN + PHASE_HOLD && phaseT < PHASE_IN + PHASE_HOLD + PHASE_OUT;

      const travelIn = easeInOutCubic(tIn);
      const travelOut = easeInOutCubic(tOut);

      const glowUp = smoothPulse(tHold);
      const fadeOut = 1 - smoothPulse(tOut);

      const baseA = 0.045;

      let lineA = baseA;
      if (inActive) lineA = baseA + 0.08 * smoothPulse(tIn);
      if (holdActive) lineA = baseA + 0.18 * glowUp;
      if (outActive) lineA = baseA + 0.14 * fadeOut;

      drawX(lineA);

      const origins = [
        {x:0, y:0},
        {x:width, y:0},
        {x:0, y:height},
        {x:width, y:height}
      ];

      function positionFromOrigin(origin, progress){
        return { x: lerp(origin.x, cx, progress), y: lerp(origin.y, cy, progress) };
      }

      function positionReturnToOrigin(origin, progress){
        return { x: lerp(cx, origin.x, progress), y: lerp(cy, origin.y, progress) };
      }

      const headR = 62;
      const tailSteps = 14;
      const tailSpan = 0.10;

      function drawTrailTo(posFn, prog, alphaScale){
        for (let oi = 0; oi < origins.length; oi++){
          const o = origins[oi];
          const head = posFn(o, prog);
          for (let i = 0; i < tailSteps; i++){
            const k = i / tailSteps;
            const tt = clamp(prog - k*tailSpan, 0, 1);
            const e = easeInOutCubic(tt);
            const p = posFn(o, e);
            const fade = (1 - k);
            drawGlowDot(p.x, p.y, 38 * fade, alphaScale * (0.08 * fade));
          }
          drawGlowDot(head.x, head.y, headR, alphaScale * 0.22);
        }
      }

      if (inActive){
        drawTrailTo(positionFromOrigin, travelIn, 1);
      } else if (holdActive){
        const centerBurst = 0.25 + 0.70 * glowUp;
        drawGlowDot(cx, cy, 120, centerBurst * 0.35);
        drawGlowDot(cx, cy, 78, centerBurst * 0.55);
        drawGlowDot(cx, cy, 44, centerBurst * 0.75);
      } else if (outActive){
        const a = Math.max(0, 0.9 * fadeOut);
        drawTrailTo(positionReturnToOrigin, travelOut, a);
        const centerA = (0.10 + 0.20 * fadeOut);
        drawGlowDot(cx, cy, 78, centerA * 0.35);
      } else {
        const restA = 0.02;
        drawGlowDot(cx, cy, 64, restA);
      }

      rafId = requestAnimationFrame(loop);
    }
    startAnim();

    (function termsAudio(){
      const playBtn = document.getElementById("ttsPlay");
      const pauseBtn = document.getElementById("ttsPause");
      const stopBtn = document.getElementById("ttsStop");
      const termsEl = document.getElementById("termsText");
      if (!playBtn || !pauseBtn || !stopBtn || !termsEl) return;

      const synth = window.speechSynthesis;
      const supported = !!(synth && window.SpeechSynthesisUtterance);
      if (!supported){
        playBtn.disabled = true;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        return;
      }

      function setState(state){
        if (state === "idle"){
          playBtn.disabled = false;
          pauseBtn.disabled = true;
          stopBtn.disabled = true;
          pauseBtn.title = "Pause";
        } else if (state === "speaking"){
          playBtn.disabled = true;
          pauseBtn.disabled = false;
          stopBtn.disabled = false;
          pauseBtn.title = "Pause";
        } else {
          playBtn.disabled = true;
          pauseBtn.disabled = false;
          stopBtn.disabled = false;
          pauseBtn.title = "Resume";
        }
      }

      function normalizeText(str){ return (str || "").replace(/\s+/g, " ").trim(); }

      function chunkText(text, maxLen = 900){
        const chunks = [];
        let t = text;
        while (t.length > maxLen){
          let cut = t.lastIndexOf(". ", maxLen);
          if (cut < 200) cut = t.lastIndexOf("; ", maxLen);
          if (cut < 200) cut = t.lastIndexOf(", ", maxLen);
          if (cut < 200) cut = maxLen;
          chunks.push(t.slice(0, cut + 1).trim());
          t = t.slice(cut + 1).trim();
        }
        if (t.length) chunks.push(t);
        return chunks;
      }

      let queue = [];
      function cancelAll(){
        try { synth.cancel(); } catch(_){}
        queue = [];
        setState("idle");
      }

      function speakNext(){
        if (!queue.length){ setState("idle"); return; }
        const part = queue.shift();
        const u = new SpeechSynthesisUtterance(part);
        try{
          const voices = synth.getVoices ? synth.getVoices() : [];
          const enVoice = voices.find(v => /^en(-|_)?/i.test(v.lang || ""));
          if (enVoice) u.voice = enVoice;
          u.lang = enVoice?.lang || "en-US";
        } catch(_){
          u.lang = "en-US";
        }
        u.rate = 1.02;
        u.pitch = 1.0;
        u.volume = 1.0;
        u.onend = ()=>{ if (!synth.paused) speakNext(); };
        u.onerror = ()=>{ speakNext(); };
        setState("speaking");
        synth.speak(u);
      }

      const msg = "Audio runs locally in your browser/device (no uploads, no storage). You can stop anytime.";
      [playBtn, pauseBtn, stopBtn].forEach(el => el.addEventListener("mouseenter", ()=>showToast(msg)));

      playBtn.addEventListener("click", ()=>{
        showToast(msg);
        cancelAll();
        const text = normalizeText(termsEl.innerText);
        if (!text) return;
        queue = chunkText(text, 900);
        speakNext();
      });

      pauseBtn.addEventListener("click", ()=>{
        if (synth.paused){
          try { synth.resume(); } catch(_){}
          setState("speaking");
        } else {
          try { synth.pause(); } catch(_){}
          setState("paused");
        }
      });

      stopBtn.addEventListener("click", ()=>cancelAll());
      window.addEventListener("beforeunload", ()=>{ try { synth.cancel(); } catch(_){} });
      setState("idle");
    })();
  
// Back to Top (terms-panel aware)
window.addEventListener("DOMContentLoaded", () => {
  const backToTop = document.getElementById("backToTop");
  const scrollContainer = document.getElementById("termsPanel") || window;
  if (!backToTop) return;

  function getScrollTop(){
    return scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
  }

  function scrollToTop(){
    if (scrollContainer === window){
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  (scrollContainer === window ? window : scrollContainer).addEventListener("scroll", () => {
    if (getScrollTop() > 300) backToTop.classList.add("show");
    else backToTop.classList.remove("show");
  }, { passive: true });

  backToTop.addEventListener("click", scrollToTop);
});
