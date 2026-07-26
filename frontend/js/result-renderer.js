/* ══════════════════════════════════════════════════════════
   RESULT RENDERER — Shared utility for building result HTML
══════════════════════════════════════════════════════════ */
const ResultRenderer = {

  steps(steps = [], title = 'Step-by-Step Solution') {
    if (!steps || steps.length === 0) return '';
    const id = 'steps-' + Math.random().toString(36).slice(2, 8);
    return `
      <div class="steps-accordion glass">
        <div class="steps-header" onclick="ResultRenderer.toggleSteps('${id}')">
          <h3><i data-lucide="list-ordered"></i> ${title}</h3>
          <i data-lucide="chevron-down" class="chevron"></i>
        </div>
        <div class="steps-body open" id="${id}">
          ${steps.map((s, i) => `
            <div class="step-item" style="animation-delay:${i * 0.06}s">
              <div class="step-num">${i + 1}</div>
              <div class="step-content">
                <div class="step-expr">${s.expression || s.expr || ''}</div>
                ${(s.explanation || s.explain) ? `<div class="step-explain">${s.explanation || s.explain}</div>` : ''}
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  toggleSteps(id) {
    const body   = document.getElementById(id);
    const header = body?.previousElementSibling;
    if (!body) return;
    const open = body.classList.toggle('open');
    header?.classList.toggle('open', open);
    if (window.lucide) lucide.createIcons({ nodes: [header] });
  },

  summary(icon, label, value, extra = []) {
    const extraHtml = extra.length ? `
      <div class="result-extra">
        ${extra.map(e => `<div class="extra-item glass"><div class="extra-label">${e.label}</div><div class="extra-value">${e.value}</div></div>`).join('')}
      </div>` : '';
    return `
      <div class="result-summary glass">
        <div class="result-icon"><i data-lucide="${icon}"></i></div>
        <div>
          <div class="result-title">${label}</div>
          <div class="result-value">${value}</div>
        </div>
      </div>
      ${extraHtml}`;
  },

  roots(roots = []) {
    if (!roots.length) return '<div class="empty-state"><i data-lucide="x-circle"></i><p>No roots found</p></div>';
    return `
      <div class="roots-display">
        ${roots.map((r, i) => {
          const isComplex = Math.abs(r.imag) > 1e-10;
          const val = isComplex
            ? `${fmtNum(r.real)} ${r.imag >= 0 ? '+' : '−'} ${fmtNum(Math.abs(r.imag))}i`
            : fmtNum(r.real);
          return `
            <div class="root-badge ${isComplex ? 'complex' : 'real'}">
              <span class="root-label">x${subscript(i+1)}</span>
              <span class="root-value">${val}</span>
              <span class="badge ${isComplex ? 'badge-warning' : 'badge-success'}">${isComplex ? 'Complex' : 'Real'}</span>
            </div>`;
        }).join('')}
      </div>`;
  },

  newtonTable(table = []) {
    if (!table.length) return '';
    return `
      <div class="glass scroll-x" style="border-radius:var(--radius-lg);overflow:hidden;">
        <table class="newton-table">
          <thead><tr><th>#</th><th>x</th><th>f(x)</th><th>|f(x)|</th></tr></thead>
          <tbody>
            ${table.map((row, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${fmtNum(row.x)}</td>
                <td>${fmtNum(row.fx)}</td>
                <td><span class="badge ${Math.abs(row.fx) < 0.001 ? 'badge-success' : 'badge-warning'}">${fmtNum(Math.abs(row.fx))}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  matrix(mat = [], title = 'Result Matrix') {
    if (!mat.length) return '';
    const rows = mat.length, cols = mat[0].length;
    return `
      <div style="overflow-x:auto;">
        <h4 style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${title}</h4>
        <div class="matrix-result-grid" style="grid-template-columns:repeat(${cols},1fr);">
          ${mat.flat().map(v => `<div class="matrix-result-cell">${fmtNum(v)}</div>`).join('')}
        </div>
      </div>`;
  },

  render(container, html) {
    if (!container) return;
    container.innerHTML = html;
    container.classList.remove('hidden');
    if (window.lucide) lucide.createIcons({ nodes: [container] });
    gsap.from(container, { opacity: 0, y: 16, duration: 0.4, ease: 'power2.out' });
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

function fmtNum(v) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  const abs = Math.abs(v);
  if (abs === 0) return '0';
  if (abs < 0.0001 || abs > 1e9) return v.toExponential(4);
  const s = v.toFixed(6);
  return s.replace(/\.?0+$/, '');
}

function subscript(n) {
  const map = { 1:'₁',2:'₂',3:'₃',4:'₄',5:'₅',6:'₆',7:'₇',8:'₈',9:'₉',0:'₀' };
  return String(n).split('').map(c => map[c]||c).join('');
}
