export function initLangRailTimers(){
  const switchEl = document.getElementById('lang-switch');
  const railEl   = document.getElementById('lang-rail');
  if (!switchEl || !railEl) return;

  let openTimer = null;
  let closeTimer = null;
  let locked = false;

  const OPEN_DELAY_MS  = 500;
  const CLOSE_DELAY_MS = 3000;

  let firstOpen = true;

  function clearTimers(){
    if (openTimer)  { clearTimeout(openTimer);  openTimer = null; }
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  }

  function ensureStartVisibleOnce(){
    if (!firstOpen) return;
    railEl.scrollLeft = 0;
    firstOpen = false;
  }

  function resetShift(){
    railEl.style.setProperty('--rail-shift', '0px');
  }

  function clampRailIntoViewport(){
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const margin = 8;

    resetShift();

    const rect = railEl.getBoundingClientRect();
    let shift = 0;

    if (rect.left < margin){
      shift = (margin - rect.left);
    } else if (rect.right > (vw - margin)){
      shift = - (rect.right - (vw - margin));
    }

    if (shift !== 0){
      railEl.style.setProperty('--rail-shift', `${Math.round(shift)}px`);
    }
  }

  function placeRailSmart(){
    switchEl.classList.remove('open-right');
    resetShift();

    const vw = window.innerWidth || document.documentElement.clientWidth;
    const margin = 8;

    let rect = railEl.getBoundingClientRect();

    if (rect.left < -margin){
      switchEl.classList.add('open-right');
      rect = railEl.getBoundingClientRect();
    }

    if (rect.right > vw + margin){
      switchEl.classList.remove('open-right');
    }

    clampRailIntoViewport();
  }

  function openRail(){
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    requestAnimationFrame(() => window.scrollTo(0, y));

    switchEl.classList.add('is-open');

    requestAnimationFrame(() => {
      ensureStartVisibleOnce();
      placeRailSmart();
    });
  }

  function closeRail(){
    locked = false;
    switchEl.classList.remove('is-open');
    switchEl.classList.remove('open-right');
    resetShift();
  }

  function scheduleOpen(){
    clearTimers();
    openTimer = setTimeout(() => openRail(), OPEN_DELAY_MS);
  }
  function scheduleClose(){
    clearTimers();
    closeTimer = setTimeout(() => closeRail(), CLOSE_DELAY_MS);
  }

  switchEl.addEventListener('pointerenter', () => {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    if (switchEl.classList.contains('is-open')) return;
    scheduleOpen();
  });

  switchEl.addEventListener('pointerleave', () => {
    if (!switchEl.classList.contains('is-open')) { clearTimers(); return; }
    if (locked) return;
    scheduleClose();
  });

  railEl.addEventListener('pointerenter', () => {
    locked = true;
    clearTimers();
    openRail();
  });

  railEl.addEventListener('pointerleave', () => {
    locked = false;
    scheduleClose();
  });

  const trigger = switchEl.querySelector('.lang-trigger');
  let _touchHandled = false;

  function toggleRail(){
    clearTimers();
    if (switchEl.classList.contains('is-open')) closeRail();
    else openRail();

    trigger?.blur();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  trigger?.addEventListener('touchstart', (e) => {
    _touchHandled = true;
    e.preventDefault();
    toggleRail();
    setTimeout(() => { _touchHandled = false; }, 450);
  }, { passive: false });

  trigger?.addEventListener('click', (e) => {
    if (_touchHandled) return;
    e.preventDefault();
    toggleRail();
  });

  window.addEventListener('resize', () => {
    if (!switchEl.classList.contains('is-open')) return;
    requestAnimationFrame(() => placeRailSmart());
  });
}
