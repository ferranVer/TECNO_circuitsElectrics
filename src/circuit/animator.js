// Anima els punts de corrent (stroke-dashoffset) amb requestAnimationFrame.
// La velocitat de cada tram és proporcional a la seua intensitat.
// Els desplaçaments es guarden per clau perquè l'animació no salte en redibuixar.
const PERIOD = 22; // ha de coincidir amb stroke-dasharray de .flow
const offsets = new Map();
const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');

export function startAnimator() {
  let last = performance.now();
  const frame = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (!reduce?.matches && !document.hidden) {
      const els = document.querySelectorAll('.flow');
      for (const el of els) {
        const sp = +el.dataset.speed || 0;
        const k = el.dataset.key;
        const o = ((offsets.get(k) || 0) - sp * dt) % PERIOD;
        offsets.set(k, o);
        el.style.strokeDashoffset = o.toFixed(2);
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
