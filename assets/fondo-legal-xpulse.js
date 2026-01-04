export function init(canvasId = "canvas") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return () => {};

  const ctx = canvas.getContext("2d", { alpha: false });

  let width = 0;
  let height = 0;
  let rafId = null;
  let paused = false;

  const PR = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * PR);
    canvas.height = Math.floor(height * PR);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(PR, 0, 0, PR, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  const pulse = t => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));
  const lerp = (a, b, t) => a + (b - a) * t;

  function glow(x, y, r, a) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(0,234,255,${a})`);
    g.addColorStop(0.35, `rgba(0,234,255,${a * 0.35})`);
    g.addColorStop(1, `rgba(0,234,255,0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawX(a) {
    ctx.save();
    ctx.strokeStyle = `rgba(0,234,255,${a})`;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    ctx.strokeStyle = `rgba(0,234,255,${a * 0.52})`;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
    ctx.restore();
  }

  let t = 0;
  let last = performance.now();

  const IN = 2.8;
  const HOLD = 1.15;
  const OUT = 2.2;
  const REST = 0.55;
  const CYCLE = IN + HOLD + OUT + REST;

  function loop(now) {
    if (paused) return;

    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t = (t + dt) % CYCLE;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    const tin = clamp(t / IN, 0, 1);
    const th = clamp((t - IN) / HOLD, 0, 1);
    const tout = clamp((t - IN - HOLD) / OUT, 0, 1);

    const inA = t < IN;
    const holdA = t >= IN && t < IN + HOLD;
    const outA = t >= IN + HOLD && t < IN + HOLD + OUT;

    const baseA = 0.045;
    let lineA = baseA;
    if (inA) lineA += 0.08 * pulse(tin);
    if (holdA) lineA += 0.18 * pulse(th);
    if (outA) lineA += 0.14 * (1 - pulse(tout));

    drawX(lineA);

    const origins = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: 0, y: height },
      { x: width, y: height }
    ];

    const headR = 62;
    const tailSteps = 14;
    const tailSpan = 0.1;

    function trail(posFn, prog, a) {
      for (const o of origins) {
        const head = posFn(o, prog);
        for (let i = 0; i < tailSteps; i++) {
          const k = i / tailSteps;
          const tt = clamp(prog - k * tailSpan, 0, 1);
          const e = ease(tt);
          const p = posFn(o, e);
          const f = 1 - k;
          glow(p.x, p.y, 38 * f, a * (0.08 * f));
        }
        glow(head.x, head.y, headR, a * 0.22);
      }
    }

    if (inA) {
      trail(o => ({ x: lerp(o.x, cx, ease(tin)), y: lerp(o.y, cy, ease(tin)) }), ease(tin), 1);
    } else if (holdA) {
      const c = 0.25 + 0.7 * pulse(th);
      glow(cx, cy, 120, c * 0.35);
      glow(cx, cy, 78, c * 0.55);
      glow(cx, cy, 44, c * 0.75);
    } else if (outA) {
      const a = Math.max(0, 0.9 * (1 - pulse(tout)));
      trail(o => ({ x: lerp(cx, o.x, ease(tout)), y: lerp(cy, o.y, ease(tout)) }), ease(tout), a);
      glow(cx, cy, 78, (0.1 + 0.2 * (1 - pulse(tout))) * 0.35);
    } else {
      glow(cx, cy, 64, 0.02);
    }

    rafId = requestAnimationFrame(loop);
  }

  function onVis() {
    if (document.visibilityState === "hidden") {
      paused = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      paused = false;
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  }

  document.addEventListener("visibilitychange", onVis);
  rafId = requestAnimationFrame(loop);

  return function destroy() {
    paused = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVis);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}
