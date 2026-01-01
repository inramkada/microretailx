"use strict";

    const menuToggle = document.getElementById("menuToggle");
    const menuDropdown = document.getElementById("menuDropdown");
    const verticalsLink = document.getElementById("verticalsLink");
    const verticalsSubmenu = document.getElementById("verticalsSubmenu");
    const contactLink = document.getElementById("contactLink");

    function positionVerticalsSubmenu() {
      if (!menuDropdown.classList.contains("open")) return;

      const d = menuDropdown.getBoundingClientRect();
      const v = verticalsLink.getBoundingClientRect();
      const top = Math.max(0, Math.round(v.top - d.top));
      verticalsSubmenu.style.top = `${top}px`;

      const openToLeft = (d.left + d.width / 2) > (window.innerWidth / 2);
      if (openToLeft) {
        verticalsSubmenu.style.right = "100%";
        verticalsSubmenu.style.left = "auto";
        verticalsSubmenu.style.marginRight = "14px";
        verticalsSubmenu.style.marginLeft = "0";
      } else {
        verticalsSubmenu.style.left = "100%";
        verticalsSubmenu.style.right = "auto";
        verticalsSubmenu.style.marginLeft = "14px";
        verticalsSubmenu.style.marginRight = "0";
      }
    }

    function setMenuOpen(open) {
      menuDropdown.classList.toggle("open", open);
      menuDropdown.setAttribute("aria-hidden", String(!open));
      menuToggle.classList.toggle("active", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

      if (!open) {
        verticalsSubmenu.classList.remove("open");
        verticalsSubmenu.setAttribute("aria-hidden", "true");
        verticalsLink.setAttribute("aria-expanded", "false");
        menuToggle.classList.remove("shake", "double");
      }
    }

    function toggleMenu() { setMenuOpen(!menuDropdown.classList.contains("open")); }

    function setVerticalsOpen(open) {
      verticalsSubmenu.classList.toggle("open", open);
      verticalsSubmenu.setAttribute("aria-hidden", String(!open));
      verticalsLink.setAttribute("aria-expanded", String(open));
      if (open) positionVerticalsSubmenu();
    }

    menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
    menuToggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleMenu(); }
      if (e.key === "Escape") { setMenuOpen(false); menuToggle.blur(); }
    });

    verticalsLink.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      if (menuDropdown.classList.contains("open")) {
        menuToggle.classList.add("shake", "double");
        setTimeout(() => menuToggle.classList.remove("shake", "double"), 230);
      }
      setVerticalsOpen(!verticalsSubmenu.classList.contains("open"));
    });

    if (contactLink) contactLink.addEventListener("click", () => setMenuOpen(false));

    document.addEventListener("click", (e) => {
      if (!menuDropdown.contains(e.target) && !menuToggle.contains(e.target) && !verticalsSubmenu.contains(e.target)) {
        setMenuOpen(false);
      }
    });

    verticalsSubmenu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenuOpen(false)));
    window.addEventListener("resize", () => { if (verticalsSubmenu.classList.contains("open")) positionVerticalsSubmenu(); });

    const CONSENT_KEY = "mrxx_consent_v1";
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

    function lockSite() {
      document.body.classList.add("consent-locked");
      document.documentElement.style.overflow = "hidden";
    }
    function unlockSite() {
      document.body.classList.remove("consent-locked");
      document.documentElement.style.overflow = "";
    }
    function wakeSite() {
      unlockSite();
      void document.body.offsetHeight;
      document.body.classList.add("consent-waking");
      setTimeout(() => document.body.classList.remove("consent-waking"), 1250);
    }

    function persistConsent(state) {
      const payload = JSON.stringify(state);
      localStorage.setItem(CONSENT_KEY, payload);
    }

    function loadConsent() {
      const ls = localStorage.getItem(CONSENT_KEY);
      if (!ls) return null;
      try { return JSON.parse(ls); } catch (_) { return null; }
    }

    function generateAuditID() {
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    }
    function displayAuditID(id) {
      let el = document.getElementById("audit-display");
      if (!el) {
        el = document.createElement("div");
        el.id = "audit-display";
        el.style.cssText = "font-size:7px;opacity:0.25;margin-top:8px;letter-spacing:1px;text-transform:uppercase;color:white;";
        document.querySelector(".footer-bar").appendChild(el);
      }
      el.textContent = id ? `CONSENT-REF: ${String(id).toUpperCase()}` : "PREFERENCES: MINIMAL";
    }

    let analyticsLoaded = false;
    let marketingLoaded = false;

    function applyConsent(consent) {
      document.documentElement.dataset.analytics = consent.analytics ? "1" : "0";
      document.documentElement.dataset.marketing = consent.marketing ? "1" : "0";
      document.documentElement.dataset.consent = (consent.analytics || consent.marketing) ? "granted" : "denied";

      if (consent.analytics && !analyticsLoaded) {
        analyticsLoaded = true;
      }
      if (consent.marketing && !marketingLoaded) {
        marketingLoaded = true;
      }
    }

    function setToggle(el, on) {
      el.classList.toggle("on", !!on);
      el.setAttribute("aria-checked", String(!!on));
    }

    function openConsentPanel() {
      const current = loadConsent() || { necessary:true, analytics:false, marketing:false, ts:Date.now(), decision:"rejected", auditId:null };
      setToggle(toggleAnalytics, !!current.analytics);
      setToggle(toggleMarketing, !!current.marketing);
      consentModalBackdrop.classList.add("open");
      consentModalBackdrop.setAttribute("aria-hidden", "false");
    }

    function closeConsentPanel() {
      consentModalBackdrop.classList.remove("open");
      consentModalBackdrop.setAttribute("aria-hidden", "true");
    }

    function hideBanner() {
      consentBanner.classList.remove("open");
      wakeSite();
    }

    function setAllConsent(val) {
      const granted = !!val;
      const consent = {
        necessary: true,
        analytics: granted,
        marketing: granted,
        ts: Date.now(),
        decision: granted ? "accepted" : "rejected",
        auditId: granted ? generateAuditID() : null
      };

      persistConsent(consent);
      applyConsent(consent);
      displayAuditID(consent.auditId);

      hideBanner();
      closeConsentPanel();
    }

    function saveFromPanel() {
      const prev = loadConsent();
      const analytics = toggleAnalytics.classList.contains("on");
      const marketing = toggleMarketing.classList.contains("on");
      const optionalOn = analytics || marketing;

      const consent = {
        necessary: true,
        analytics,
        marketing,
        ts: Date.now(),
        decision: optionalOn ? "accepted" : "rejected",
        auditId: optionalOn ? (prev && prev.auditId ? prev.auditId : generateAuditID()) : null
      };

      persistConsent(consent);
      applyConsent(consent);
      displayAuditID(consent.auditId);

      hideBanner();
      closeConsentPanel();
    }

    function toggleSwitch(el) { setToggle(el, !el.classList.contains("on")); }
    function handleSwitchKey(el, e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSwitch(el); }
    }

    cookiePreferencesLink.addEventListener("click", (e) => { e.preventDefault(); openConsentPanel(); });
    cookiePreferencesInline.addEventListener("click", (e) => { e.preventDefault(); openConsentPanel(); });

    consentManage.addEventListener("click", () => openConsentPanel());
    consentReject.addEventListener("click", () => setAllConsent(false));
    consentAccept.addEventListener("click", () => setAllConsent(true));

    consentModalClose.addEventListener("click", () => closeConsentPanel());
    consentSave.addEventListener("click", () => saveFromPanel());
    consentAcceptAll.addEventListener("click", () => setAllConsent(true));

    consentModalBackdrop.addEventListener("click", (e) => { if (e.target === consentModalBackdrop) closeConsentPanel(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeConsentPanel(); });

    toggleAnalytics.addEventListener("click", () => toggleSwitch(toggleAnalytics));
    toggleMarketing.addEventListener("click", () => toggleSwitch(toggleMarketing));
    toggleAnalytics.addEventListener("keydown", (e) => handleSwitchKey(toggleAnalytics, e));
    toggleMarketing.addEventListener("keydown", (e) => handleSwitchKey(toggleMarketing, e));

    const existingConsent = loadConsent();
    if (existingConsent) {
      applyConsent(existingConsent);
      displayAuditID(existingConsent.auditId);
      wakeSite();
    } else {
      lockSite();
      consentBanner.classList.add("open");
    }


    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const mouse = { x: -1000, y: -1000 };

    function setPointer(x, y) { mouse.x = x; mouse.y = y; }
    window.addEventListener("mousemove", e => setPointer(e.clientX, e.clientY), { passive: true });
    window.addEventListener("touchmove", e => {
      if (!e.touches || !e.touches[0]) return;
      setPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    function isMobile() {
      return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    }

    const MOBILE_MODE = isMobile();
  const UA = navigator.userAgent || "";
  const IS_IOS = /iPhone|iPad|iPod/i.test(UA) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const IS_ANDROID = /Android/i.test(UA);
  let DOT_RGB = { r:0, g:234, b:255 };
  let PULSE_RGB = { r:255, g:35, b:90 };

    const REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let xPhaseT = 0;
    let xLastT = performance.now();

    const X_PHASE_IN = 2.8;
    const X_PHASE_HOLD = 1.15;
    const X_PHASE_OUT = 2.2;
    const X_PHASE_REST = 0.55;
    const X_CYCLE = X_PHASE_IN + X_PHASE_HOLD + X_PHASE_OUT + X_PHASE_REST;

    function xClamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
    function xEaseInOutCubic(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }
    function xSmoothPulse(t){ return 0.5 - 0.5*Math.cos(Math.PI * xClamp(t,0,1)); }
    function xLerp(a,b,t){ return a + (b-a)*t; }
    function xBlendRGB(a,b,t){ return { r:Math.round(xLerp(a.r,b.r,t)), g:Math.round(xLerp(a.g,b.g,t)), b:Math.round(xLerp(a.b,b.b,t)) }; }

    function xDrawGlowDot(x, y, r, a, rgb){
      if (a <= 0) return;
      const c = rgb || DOT_RGB;
      const boost = IS_IOS ? 1.45 : 1.0; // iPhone needs more punch
      const aa = Math.min(1, a * boost);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${aa})`);
      g.addColorStop(0.35, `rgba(${c.r},${c.g},${c.b},${aa*0.35})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }


    function xDrawLines(alpha){
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

    function renderTermsX(now){
      function redPulseMix(t){
        const p = Math.pow(t, 1.6);
        const r = Math.round(234 * p + 0 * (1-p));
        const g = Math.round(20 * p + 234 * (1-p));
        const b = Math.round(40 * p + 255 * (1-p));
        return {r,g,b};
      }

      const dt = Math.min(0.05, (now - xLastT) / 1000);
      xLastT = now;
      xPhaseT = (xPhaseT + dt) % X_CYCLE;

      const cx = width / 2;
      const cy = height / 2;

      // Platform color profile
      DOT_RGB = IS_ANDROID ? { r: 40, g: 255, b: 150 } : { r: 0, g: 234, b: 255 };
      PULSE_RGB = IS_IOS ? { r: 255, g: 35, b: 90 } : (IS_ANDROID ? { r: 120, g: 255, b: 120 } : { r: 255, g: 35, b: 90 });

      const tIn = xClamp(xPhaseT / X_PHASE_IN, 0, 1);
      const tHold = xClamp((xPhaseT - X_PHASE_IN) / X_PHASE_HOLD, 0, 1);
      const tOut = xClamp((xPhaseT - X_PHASE_IN - X_PHASE_HOLD) / X_PHASE_OUT, 0, 1);

      const inActive = xPhaseT < X_PHASE_IN;
      const holdActive = xPhaseT >= X_PHASE_IN && xPhaseT < X_PHASE_IN + X_PHASE_HOLD;
      const outActive = xPhaseT >= X_PHASE_IN + X_PHASE_HOLD && xPhaseT < X_PHASE_IN + X_PHASE_HOLD + X_PHASE_OUT;

      const travelIn = xEaseInOutCubic(tIn);
      const travelOut = xEaseInOutCubic(tOut);

      const glowUp = xSmoothPulse(tHold);
      const fadeOut = 1 - xSmoothPulse(tOut);

      const baseA = 0.065;
      let lineA = baseA;
      if (inActive) lineA = baseA + 0.08 * xSmoothPulse(tIn);
      if (holdActive) lineA = baseA + 0.18 * glowUp;
      if (outActive) lineA = baseA + 0.14 * fadeOut;

      xDrawLines(lineA);

      const origins = [
        {x:0, y:0},
        {x:width, y:0},
        {x:0, y:height},
        {x:width, y:height}
      ];

      function posFromOrigin(o, progress){
        return { x: xLerp(o.x, cx, progress), y: xLerp(o.y, cy, progress) };
      }
      function posReturnToOrigin(o, progress){
        return { x: xLerp(cx, o.x, progress), y: xLerp(cy, o.y, progress) };
      }

      const headR = 70;
      const tailSteps = 14;
      const tailSpan = 0.10;

      function drawTrailTo(posFn, prog, alphaScale){
        for (let oi = 0; oi < origins.length; oi++){
          const o = origins[oi];
          const head = posFn(o, prog);
          const tint = (IS_IOS ? xClamp((prog - 0.70) / 0.30, 0, 1) : 0);
          const headRGB = (tint > 0 ? xBlendRGB(DOT_RGB, PULSE_RGB, tint) : DOT_RGB);


          for (let i = 0; i < tailSteps; i++){
            const k = i / tailSteps;
            const tt = xClamp(prog - k*tailSpan, 0, 1);
            const e = xEaseInOutCubic(tt);
            const p = posFn(o, e);
            const fade = (1 - k);
            xDrawGlowDot(p.x, p.y, 38 * fade, alphaScale * (0.08 * fade), DOT_RGB);
          }
          xDrawGlowDot(head.x, head.y, headR, alphaScale * 0.24, headRGB);
        }
      }

      if (inActive){
        drawTrailTo(posFromOrigin, travelIn, 1);
      } else if (holdActive){
        const centerBurst = 0.25 + 0.70 * glowUp;

        xDrawGlowDot(cx, cy, 120, centerBurst * 0.22, DOT_RGB);

        if (glowUp > 0.55){
          const pulseA = (IS_IOS ? 0.62 : 0.48) * centerBurst;
          xDrawGlowDot(cx, cy, 145 + 45*glowUp, pulseA, PULSE_RGB);
          xDrawGlowDot(cx, cy, 92 + 20*glowUp, pulseA * 0.55, PULSE_RGB);
        }

        xDrawGlowDot(cx, cy, 44, centerBurst * 0.68, DOT_RGB);
} else if (outActive){
        const a = Math.max(0, 0.9 * fadeOut);
        drawTrailTo(posReturnToOrigin, travelOut, a);
        const centerA = (0.10 + 0.20 * fadeOut);
        xDrawGlowDot(cx, cy, 78, centerA * 0.35);
      } else {
        xDrawGlowDot(cx, cy, 64, 0.02);
      }
    }


    const CORES = navigator.hardwareConcurrency || 4;
    const BASE_PARTICLES_DESKTOP = 1800;
    const BASE_PARTICLES_MOBILE = 250;

    const NUM_PARTICLES = REDUCED_MOTION
      ? Math.min(220, MOBILE_MODE ? 140 : 220)
      : (MOBILE_MODE ? BASE_PARTICLES_MOBILE : Math.min(BASE_PARTICLES_DESKTOP, CORES * 420));

    const MAX_CONNECTIONS = REDUCED_MOTION ? 2 : (MOBILE_MODE ? 4 : 10);
    const SPEED = REDUCED_MOTION ? 0.35 : 0.5;

    const xZoneMargin = 42;
    const X_SAT_THRESHOLD = MOBILE_MODE ? 30 : 80;

    const particles = [];
    const deathMarkers = [];

    function inXZone(x, y) {
      const d1 = Math.abs(y - (x * height / width));
      const d2 = Math.abs(y - (height - x * height / width));
      return (d1 < xZoneMargin || d2 < xZoneMargin);
    }

    function randomHex() {
      return "#" + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0");
    }

    function createParticle() {
      let x, y;
      do {
        x = Math.random() * width;
        y = Math.random() * height;
      } while (inXZone(x, y));

      return {
        x, y,
        ox: x, oy: y,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        radius: 1.5,
        baseColor: "white",
        color: "white",
        inX: false,
        prevInX: false,
        hexCode: randomHex()
      };
    }

    for (let i = 0; i < NUM_PARTICLES; i++) particles.push(createParticle());

    function drawConnections() {
      const MAX_DIST = 100;
      const MAX_DIST2 = MAX_DIST * MAX_DIST;

      for (let i = 0; i < particles.length; i++) {
        let connections = 0;
        const pi = particles[i];
        for (let j = i + 1; j < particles.length && connections < MAX_CONNECTIONS; j++) {
          const pj = particles[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < MAX_DIST2) {
            const dist = Math.sqrt(dist2);
            const mobileCleanAlpha = MOBILE_MODE ? 0.78 : 1;
            ctx.strokeStyle = `rgba(0,255,255,${(1 - dist / MAX_DIST) * mobileCleanAlpha})`;
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.stroke();
            connections++;
          }
        }
      }
    }

    function addDeathMarker(x, y) {
      deathMarkers.push({
        x, y,
        createdAt: performance.now(),
        angle: Math.random() * Math.PI * 2
      });
    }

    function drawDeathMarkers(now) {
      const LIFETIME = 650;
      for (let i = deathMarkers.length - 1; i >= 0; i--) {
        const m = deathMarkers[i];
        const age = now - m.createdAt;
        if (age > LIFETIME) {
          deathMarkers.splice(i, 1);
          continue;
        }
        const t = age / LIFETIME;
        const alpha = 1 - t;
        const rays = 4;
        const len = 2 + (8 * t);

        ctx.save();
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.4})`;
        ctx.lineWidth = 0.8;

        for (let k = 0; k < rays; k++) {
          const a = m.angle + (Math.PI * 2 * k / rays);
          const x2 = m.x + Math.cos(a) * len;
          const y2 = m.y + Math.sin(a) * len;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    function animate(now) {

      // --- iOS/iPad performance airbags ---
      if (typeof paused === "undefined") {
        window.paused = false;
        document.addEventListener("visibilitychange", () => { window.paused = document.hidden; }, { passive:true });
        window.TARGET_FPS_IOS = 30;
        window._lastFrameT = 0;
      }
      if (window.paused) { requestAnimationFrame(animate); return; }

      // Cap FPS only on iOS/iPad (prevents overheating on Safari)
      if (IS_IOS) {
        const minDt = 1000 / window.TARGET_FPS_IOS;
        if (now - window._lastFrameT < minDt) { requestAnimationFrame(animate); return; }
        window._lastFrameT = now;
      }


      if (MOBILE_MODE){
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);

        if (REDUCED_MOTION){
          ctx.save();
          ctx.strokeStyle = "rgba(0,234,255,0.12)";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(0, 0); ctx.lineTo(width, height);
          ctx.moveTo(width, 0); ctx.lineTo(0, height);
          ctx.stroke();
          ctx.restore();
        } else {
          renderTermsX(now);
        }

        requestAnimationFrame(animate);
        return;
      }

      let inXCount = 0;

      for (const p of particles) {
        p.prevInX = p.inX;
        p.inX = inXZone(p.x, p.y);
        if (p.inX) inXCount++;
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const saturated = inXCount >= X_SAT_THRESHOLD;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);
      if (MOBILE_MODE && !REDUCED_MOTION){
        renderTermsX(now);
      } else {
        ctx.strokeStyle = "rgba(0,255,255,0.06)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
      }
drawConnections();
      if (!REDUCED_MOTION) drawDeathMarkers(now);

      for (const p of particles) {
        const dxm = p.x - mouse.x;
        const dym = p.y - mouse.y;
        const distm2 = dxm * dxm + dym * dym;
        if (distm2 < 10000 && distm2 > 0.0001) {
          const distm = Math.sqrt(distm2);
          const force = (100 - distm) * 0.007;
          p.vx += (dxm / distm) * force;
          p.vy += (dym / distm) * force;
        }

        if (p.inX && !p.prevInX && !REDUCED_MOTION) addDeathMarker(p.x, p.y);

        if (p.inX && saturated) {
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          p.vx += (dx / d) * 1.2;
          p.vy += (dy / d) * 1.2;
        }

        p.color = p.baseColor;

        if (p.inX && !REDUCED_MOTION) {
          p.vx += Math.sin(now * 0.1 + p.x) * 0.4;
          p.vy += Math.cos(now * 0.1 + p.y) * 0.4;
          p.radius = 3.3 + Math.sin(now * 0.05 + p.x + p.y) * 1.4;
          if (Math.random() < 0.4) p.hexCode = randomHex();
          ctx.font = "12px monospace";
          ctx.fillStyle = "white";
          ctx.fillText(p.hexCode, p.x + 10, p.y + 6);
        } else {
          if (p.prevInX) {
            p.radius = 1.5;
            p.hexCode = randomHex();
          }
        }

        p.vx += (p.ox - p.x) * 0.002;
        p.vy += (p.oy - p.y) * 0.002;

        if (!REDUCED_MOTION) {
          p.vx += (Math.random() - 0.5) * 0.05;
          p.vy += (Math.random() - 0.5) * 0.05;
        }

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= 0.97;
        p.vy *= 0.97;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
