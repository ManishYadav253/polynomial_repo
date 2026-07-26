/* ══════════════════════════════════════════════════════════
   POLYNOMIAL CALCULATOR — All 8 operations
══════════════════════════════════════════════════════════ */
const Calculator = (() => {
  let currentOp = 'add';

  const TWO_POLY_OPS   = ['add','subtract','multiply','divide','compose','compare'];
  const ONE_POLY_OPS   = ['evaluate','simplify'];
  const X_REQUIRED_OPS = ['evaluate'];

  const OP_SYMBOLS = { add:'+', subtract:'−', multiply:'×', divide:'÷', compose:'∘', compare:'?' };
  const OP_ICONS   = { add:'plus', subtract:'minus', multiply:'asterisk', divide:'divide', evaluate:'calculator', compose:'git-merge', compare:'equal', simplify:'sparkles' };

  function switchOp(op) {
    currentOp = op;
    // Toggle input panels
    const twoPanel = document.getElementById('poly-two-input');
    const onePanel = document.getElementById('poly-one-input');
    const xGroup   = document.getElementById('poly-x-group');
    const symbol   = document.getElementById('poly-op-symbol');

    if (TWO_POLY_OPS.includes(op)) {
      twoPanel.classList.remove('hidden'); onePanel.classList.add('hidden');
      symbol.textContent = OP_SYMBOLS[op] || op;
    } else {
      twoPanel.classList.add('hidden'); onePanel.classList.remove('hidden');
      xGroup?.classList.toggle('hidden', !X_REQUIRED_OPS.includes(op));
    }

    // Clear result
    const resultEl = document.getElementById('poly-result');
    resultEl.classList.add('hidden'); resultEl.innerHTML = '';
  }

  async function calculate() {
    const resultEl = document.getElementById('poly-result');
    const btn = document.getElementById('poly-calculate');

    // Get inputs
    let p1 = document.getElementById('poly-p1')?.value.trim();
    let p2 = document.getElementById('poly-p2')?.value.trim();
    let ps = document.getElementById('poly-single')?.value.trim();
    let xv = document.getElementById('poly-x-val')?.value;

    if (TWO_POLY_OPS.includes(currentOp) && (!p1 || !p2)) {
      Toast.show('Please enter both polynomials', 'error'); return;
    }
    if (ONE_POLY_OPS.includes(currentOp) && !ps) {
      Toast.show('Please enter a polynomial', 'error'); return;
    }

    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Computing…';
    btn.disabled = true;
    if (window.lucide) lucide.createIcons({ nodes: [btn] });

    try {
      let data, html = '';

      switch (currentOp) {
        case 'add':      data = await API.polynomial.add(p1, p2);       break;
        case 'subtract': data = await API.polynomial.subtract(p1, p2);  break;
        case 'multiply': data = await API.polynomial.multiply(p1, p2);  break;
        case 'divide':   data = await API.polynomial.divide(p1, p2);    break;
        case 'compose':  data = await API.polynomial.compose(p1, p2);   break;
        case 'compare':  data = await API.polynomial.compare(p1, p2);   break;
        case 'evaluate': data = await API.polynomial.evaluate(ps, parseFloat(xv)); break;
        case 'simplify': data = await API.polynomial.simplify(ps);       break;
      }

      // Build HTML
      if (currentOp === 'divide') {
        html += ResultRenderer.summary('divide', 'Quotient', data.quotientExpr, [
          { label: 'Remainder', value: data.remainderExpr }
        ]);
      } else if (currentOp === 'evaluate') {
        html += ResultRenderer.summary('calculator', `f(${xv})`, data.expression, [
          { label: 'Polynomial', value: ps }
        ]);
      } else if (currentOp === 'compare') {
        html += ResultRenderer.summary(data.equal ? 'check-circle' : 'x-circle',
          'Comparison', data.expression);
      } else {
        html += ResultRenderer.summary(OP_ICONS[currentOp] || 'sigma',
          `Result (${currentOp})`, data.expression, [
            { label: 'Degree', value: data.coefficients ? (data.coefficients.length - 1) : '—' }
          ]);
      }

      html += ResultRenderer.steps(data.steps || []);

      // Graph it button action
      const poly4Graph = p1 || ps;
      html += `<div style="display:flex;gap:10px;align-items:center;">
        <button class="btn btn-ghost" onclick="GraphPlotter.plotExternal('${(data.expression||'').replace(/'/g,"\\'")}')">
          <i data-lucide="line-chart"></i> Graph Result
        </button>
        <button class="btn btn-ghost" onclick="navigator.clipboard.writeText('${(data.expression||'').replace(/'/g,"\\'")}').then(()=>Toast.show('Copied!','success'))">
          <i data-lucide="copy"></i> Copy
        </button>
      </div>`;

      ResultRenderer.render(resultEl, html);
      Toast.show('Calculated successfully!', 'success');

    } catch (e) {
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

  function clear() {
    ['poly-p1','poly-p2','poly-single','poly-x-val'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const r = document.getElementById('poly-result');
    r.classList.add('hidden'); r.innerHTML = '';
  }

  function init() {
    // Tab clicks
    document.querySelectorAll('#poly-tabs .op-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#poly-tabs .op-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        switchOp(btn.dataset.op);
      });
    });

    document.getElementById('poly-calculate')?.addEventListener('click', calculate);
    document.getElementById('poly-clear')?.addEventListener('click', clear);
    document.getElementById('poly-graph-it')?.addEventListener('click', () => {
      const poly = document.getElementById('poly-p1')?.value || document.getElementById('poly-single')?.value || '';
      if (poly) GraphPlotter.plotExternal(poly);
      else Toast.show('Enter a polynomial first', 'error');
    });

    // Enter key
    ['poly-p1','poly-p2','poly-single'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') calculate(); });
    });

    switchOp('add');
  }

  return { init };
})();
