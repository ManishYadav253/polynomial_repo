/* ══════════════════════════════════════════════════════════
   CALCULUS MODULE — Differentiation & Integration
══════════════════════════════════════════════════════════ */
const CalculusModule = (() => {
  let currentOp = 'differentiate';

  function switchOp(op) {
    currentOp = op;
    const bounds = document.getElementById('definite-bounds');
    bounds?.classList.toggle('hidden', op !== 'definite');
    document.getElementById('calc-result')?.classList.add('hidden');
  }

  async function calculate() {
    const poly = document.getElementById('calc-poly')?.value.trim();
    if (!poly) { Toast.show('Enter a polynomial', 'error'); return; }

    const btn = document.getElementById('calc-calculate');
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Computing…';
    btn.disabled = true;
    if (window.lucide) lucide.createIcons({ nodes: [btn] });

    const resultEl = document.getElementById('calc-result');

    try {
      let data, html = '';

      if (currentOp === 'differentiate') {
        data = await API.calculus.differentiate(poly);
        html += ResultRenderer.summary('trending-up', "Derivative f'(x)", data.expression, [
          { label: 'Original f(x)', value: poly }
        ]);
        html += ResultRenderer.steps(data.steps, 'Differentiation Steps');

      } else if (currentOp === 'integrate') {
        data = await API.calculus.integrate(poly);
        html += ResultRenderer.summary('infinity', '∫ f(x) dx', data.expression, [
          { label: 'Original f(x)', value: poly }
        ]);
        html += ResultRenderer.steps(data.steps, 'Integration Steps');

      } else if (currentOp === 'definite') {
        const a = parseFloat(document.getElementById('calc-a').value);
        const b = parseFloat(document.getElementById('calc-b').value);
        if (isNaN(a) || isNaN(b)) { Toast.show('Enter valid bounds', 'error'); return; }
        data = await API.calculus.definiteIntegral(poly, a, b);
        html += ResultRenderer.summary('chart-area', `∫ from ${a} to ${b}`, fmtNum(data.definiteValue), [
          { label: 'f(x)', value: poly },
          { label: 'Area Under Curve', value: fmtNum(data.definiteValue) + ' units²' }
        ]);
        html += ResultRenderer.steps(data.steps, 'Definite Integration Steps');

        // Area visualization hint
        html += `<div class="glass" style="padding:16px 20px;border-color:rgba(16,185,129,0.25);">
          <p style="font-size:13px;color:var(--text-secondary);">
            <i data-lucide="info" style="width:14px;height:14px;vertical-align:-2px;color:var(--accent-emerald);"></i>
            The shaded area between f(x) and the x-axis from x=${a} to x=${b} equals <strong style="color:var(--accent-emerald)">${fmtNum(data.definiteValue)}</strong> square units.
          </p>
        </div>`;
      }

      html += `<div style="display:flex;gap:10px;">
        <button class="btn btn-ghost" onclick="GraphPlotter.plotExternal('${poly.replace(/'/g,"\\'")}')">
          <i data-lucide="line-chart"></i> Visualize on Graph
        </button>
        <button class="btn btn-ghost" onclick="navigator.clipboard.writeText('${(data?.expression||'').replace(/'/g,"\\'")}').then(()=>Toast.show('Copied!','success'))">
          <i data-lucide="copy"></i> Copy Result
        </button>
      </div>`;

      ResultRenderer.render(resultEl, html);
      Toast.show('Calculus computed!', 'success');

    } catch(e) {
      ResultRenderer.render(resultEl, `<div class="result-summary glass" style="border-color:rgba(244,63,94,0.3);">
        <div class="result-icon" style="background:var(--accent-rose)"><i data-lucide="alert-circle"></i></div>
        <div><div class="result-title">Error</div><div class="result-value" style="font-size:16px;color:var(--accent-rose)">${e.message}</div></div>
      </div>`);
    } finally {
      btn.innerHTML = '<i data-lucide="play"></i> Calculate';
      btn.disabled = false;
      if (window.lucide) lucide.createIcons({ nodes: [btn] });
    }
  }

  function init() {
    document.querySelectorAll('#calc-tabs .op-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#calc-tabs .op-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        switchOp(btn.dataset.op);
      });
    });

    document.getElementById('calc-calculate')?.addEventListener('click', calculate);
    document.getElementById('calc-clear')?.addEventListener('click', () => {
      document.getElementById('calc-poly').value = '';
      document.getElementById('calc-result')?.classList.add('hidden');
    });
    document.getElementById('calc-graph-it')?.addEventListener('click', () => {
      const poly = document.getElementById('calc-poly')?.value;
      if (poly) GraphPlotter.plotExternal(poly);
      else Toast.show('Enter a polynomial first', 'error');
    });
    document.getElementById('calc-poly')?.addEventListener('keydown', e => { if (e.key === 'Enter') calculate(); });

    switchOp('differentiate');
  }

  return { init };
})();
