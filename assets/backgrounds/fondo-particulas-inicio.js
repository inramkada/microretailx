export function init(canvasId = "canvas") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return () => {};

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  let w = 0, h = 0, dpr = 1, raf = 0;
  let paused = false;

  const CFG = {
    density: 0.00009,
    maxNodes: 180,
    minNodes: 70,
    maxLinkDist: 140,
    mouseRadius: 170,
    drift: 0.22,
    repulse: 1.2,
    fade: 0.14
  };

  const nodes = [];
  const mouse = { x: -9999, y: -9999, active: false };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  const makeNode = () => ({
    x: rand(0, w),
    y: rand(0, h),
    vx: rand(-CFG.drift, CFG.drift),
    vy: rand(-CFG.drift, CFG.drift),
    r: rand(1.0, 2.2)
  });

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = clamp(Math.floor(w * h * CFG.density), CFG.minNodes, CFG.maxNodes);
    while (nodes.length < target) nodes.push(makeNode());
    while (nodes.length > target) nodes.pop();
  };

  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.active = true;
  };

  const onLeave = () => {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  };

  const step = () => {
    if (paused) return;

    ctx.fillStyle = `rgba(0,0,0,${CFG.fade})`;
    ctx.fillRect(0, 0, w, h);

    for (const p of nodes) {
      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        const r2 = CFG.mouseRadius * CFG.mouseRadius;
        if (dist2 < r2 && dist2 > 0.0001) {
          const dist = Math.sqrt(dist2);
          const force = (1 - dist / CFG.mouseRadius) * CFG.repulse;
          p.vx += (dx / dist) * force * 0.18;
          p.vy += (dy / dist) * force * 0.18;
        }
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.992;
      p.vy *= 0.992;

      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x > w) { p.x = w; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y > h) { p.y = h; p.vy *= -1; }

      p.vx += rand(-0.006, 0.006);
      p.vy += rand(-0.006, 0.006);
    }

    const maxD = CFG.maxLinkDist;
    const maxD2 = maxD * maxD;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];

      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fill();

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > maxD2) continue;

        const d = Math.sqrt(d2);
        const t = 1 - d / maxD;
        ctx.strokeStyle = `rgba(255,255,255,${0.22 * t})`;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    raf = requestAnimationFrame(step);
  };

  const onVis = () => {
    if (document.visibilityState === "hidden") {
      paused = true;
      cancelAnimationFrame(raf);
    } else {
      paused = false;
      raf = requestAnimationFrame(step);
    }
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onMove, { passive: true });
  window.addEventListener("pointerleave", onLeave, { passive: true });
  document.addEventListener("visibilitychange", onVis);

  raf = requestAnimationFrame(step);

  return function destroy() {
    paused = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onMove);
    window.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("visibilitychange", onVis);
    try {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } catch (_) {}
  };
}
