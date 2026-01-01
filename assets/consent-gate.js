/* /assets/consent-gate.js */
(function () {
  // Mantén esta key alineada con tu app.js
  const KEY = "cookieConsent";
  const decided = () => {
    const v = localStorage.getItem(KEY);
    return v === "accepted" || v === "rejected";
  };

  // Si estamos en una página LEGAL y no hay decisión -> redirige al home y guarda next
  const isLegalPage = () =>
    /\/legal\/(terms|privacy|cookies|legal)\.html$/i.test(location.pathname);

  if (isLegalPage() && !decided()) {
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    location.replace("/?consent_required=1&next=" + next);
    return;
  }

  // Si estamos en HOME con "consent_required=1", abre banner+modal y conserva "next"
  const params = new URLSearchParams(location.search);
  if (params.get("consent_required") === "1") {
    const next = params.get("next") || "";

    // guarda next para usarlo después de aceptar/rechazar
    try {
      if (next) sessionStorage.setItem("consentNext", next);
    } catch (_) {}

    // Intenta abrir tu UI de consentimiento (banner + modal)
    const banner = document.getElementById("consentBanner");
    if (banner) banner.style.display = "block";

    const backdrop = document.getElementById("consentModalBackdrop");
    if (backdrop) backdrop.setAttribute("aria-hidden", "false");
  }

  // Cuando el usuario decide (accepted o rejected), si había next -> vuelve
  const maybeGoNext = () => {
    if (!decided()) return;
    let next = "";
    try { next = sessionStorage.getItem("consentNext") || ""; } catch (_) {}
    if (next) {
      try { sessionStorage.removeItem("consentNext"); } catch (_) {}
      location.href = next;
    }
  };

  // Escucha clicks de tus botones de aceptar/rechazar/guardar (tu app.js setea localStorage)
  // Ponemos un pequeño delay para que dé tiempo a escribir localStorage.
  ["consentAccept", "consentReject", "consentSave", "consentAcceptAll"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", () => setTimeout(maybeGoNext, 80));
  });
})();
