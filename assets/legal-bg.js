/* legal-bg.js - Motor de fondo MICRORETAILX */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

let phaseT = 0;
let last = performance.now();
const PHASE_IN = 2.8, PHASE_HOLD = 1.15, PHASE_OUT = 2.2, PHASE_REST = 0.55;
const CYCLE = PHASE_IN + PHASE_HOLD + PHASE_OUT + PHASE_REST;

function drawX(alpha) {
    ctx.save();
    ctx.strokeStyle = `rgba(0,234,255,${alpha})`;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(width, height);
    ctx.moveTo(width, 0); ctx.lineTo(0, height);
    ctx.stroke();
    ctx.restore();
}

function anim(now) {
    const dt = (now - last) / 1000;
    last = now;
    phaseT = (phaseT + dt) % CYCLE;
    
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    
    let lineA = 0.05;
    if (phaseT < PHASE_IN) lineA += 0.08;
    
    drawX(lineA);
    requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
