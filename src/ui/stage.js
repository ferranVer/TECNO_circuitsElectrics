// Escenari de la dreta: targeta amb el circuit, eines i mesures.
export function stageShell(stage, { eyebrow = '', title = '', tools = '', foot = '' }) {
  stage.innerHTML = `
    <div class="stage-card">
      <div class="stage-head">
        <div><div class="eyebrow">${eyebrow}</div><h3>${title}</h3></div>
        <div class="stage-tools">${tools}</div>
      </div>
      <div class="stage-canvas"></div>
      <div class="stage-foot">${foot}</div>
    </div>`;
  const canvas = stage.querySelector('.stage-canvas');
  const footEl = stage.querySelector('.stage-foot');
  return {
    canvas,
    foot: footEl,
    tools: stage.querySelector('.stage-tools'),
    setSvg(svg) { canvas.innerHTML = svg; },
    setFoot(html) { footEl.innerHTML = html; },
    highlight(ids = []) {
      canvas.querySelectorAll('[data-id]').forEach((el) => el.classList.toggle('hl', ids.includes(el.dataset.id)));
    },
  };
}

export function meters(list) {
  return `<div class="meters">${list
    .map((m) => `<div class="meter ${m.cls || ''}"><span>${m.label}</span><b>${m.value}</b></div>`)
    .join('')}</div>`;
}

/** Tooltip global per a elements amb data-tip */
export function initTooltip(tip) {
  document.addEventListener('mousemove', (e) => {
    const t = e.target.closest?.('[data-tip]');
    if (!t) { tip.classList.remove('show'); return; }
    tip.textContent = '';
    t.dataset.tip.split('\n').forEach((line, i) => {
      const d = document.createElement('div');
      d.textContent = line;
      if (i === 0) d.className = 'tt-title';
      tip.appendChild(d);
    });
    tip.style.left = `${e.clientX + 14}px`;
    tip.style.top = `${e.clientY + 14}px`;
    tip.classList.add('show');
  });
}
