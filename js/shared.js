export const $ = s => document.querySelector(s);
export const norm = v => String(v || "").trim().toLowerCase();

export function startPixelTimer(bar, duration, onEnd) {
  const start = Date.now();
  function tick() {
    const r = Math.max(0, 1 - (Date.now() - start) / duration);
    bar.style.transform = `scaleX(${r})`;
    r <= 0 ? onEnd() : requestAnimationFrame(tick);
  }
  tick();
}
