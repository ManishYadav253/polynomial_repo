/* ══════════════════════════════════════════════════════════
   ROOT FINDER — Auto Solve + Newton-Raphson with convergence chart
══════════════════════════════════════════════════════════ */
const RootsModule = (() => {
  let currentOp = 'solve';
  let newtonChart = null;

  function switchOp(op) {
    currentOp = op;
    const newtonOpts = document.getElementById('newton-opts');
    newtonOpts?.classList.toggle('hidden', op !== 'newton');
    document.getElementById('roots-result')?.classList.add('hidden');
    document.getElementById('newton-chart-wrap')?.classList.add('hidden');
  }

  async function calculate() {
    const poly = document.getElementById('roots-poly')?.value.trim();
    if (!poly) { Toast.show('Enter a polynomial', 'error'); return; }

    const btn = document.getElementById('roots-calculate');
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Finding Roots…';
    btn.disabled = true;
    if (window.lucide) lucide.createIcons({ nodes: [btn] });

    const resultEl = document.getElementById('roots-result');

    try {
      let data, html = '';

      if (currentOp === 'solve') {
        data = await API.roots.solve(poly);
      } else {
        const x0 = parseFloat(document.getElementById('roots-x0')?.value || '1');
        data = await API.roots.newtonRaphson(poly, x0);
      }

      // Root summary
      html += `<div class="result-summary glass">
        <div class="result-icon"><i data-lucide="crosshair"></i></div>
        <div>
          <div class="result-title">Roots of ${poly} = 0</div>
          <div class="result-value">${data.roots.length} root${data.roots.length !== 1 ? 's' : ''} found</div>
        </div>
      </div>`;

      html += ResultRenderer.roots(data.roots);
      html += ResultRenderer.steps(data.steps || [], 'Solution Steps');

      // Newton table
      if (data.newtonTable?.length > 0) {
        html += `<h3 style="font-size:14px;font-weight:600;color:var(--text-primary);">Iteration Table</h3>`;
        html += ResultRenderer.newtonTable(data.newtonTable);

        // Render convergence chart
        setTimeout(() => renderNewtonChart(data.newtonTable), 100);
      }

      html += `<button class="btn btn-ghost" onclick="GraphPlotter.plotExternal('${poly.replace(/'/g,"\\'")}')">
        <i data-lucide="line-chart"></i> Visualize Polynomial
      </button>`;

      ResultRenderer.render(resultEl, html);
      Toast.show('Roots found!', 'success');

    } catch(e) {
      ResultRenderer.render(resultEl, `<div class="result-summary glass" style="border-color:rgba(244,63,94,0.3);">
        <div class="result-icon" style="background:var(--accent-rose)"><i data-lucide="alert-circle"></i></div>
        <div><div class="result-title">Error</div><div class="result-value" style="font-size:16px;color:var(--accent-rose)">${e.message}</div></div>
      </div>`);
    } finally {
      btn.innerHTML = '<i data-lucide="play"></i> Find Roots';
      btn.disabled = false;
      if (window.lucide) lucide.createIcons({ nodes: [btn] });
    }
  }

  function renderNewtonChart(table) {
    const wrap   = document.getElementById('newton-chart-wrap');
    const canvas = document.getElementById('newton-chart');
    if (!wrap || !canvas) return;

    if (newtonChart) { newtonChart.destroy(); newtonChart = null; }

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const labelColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
    const gridColor  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';

    const labels   = table.map((_, i) => `Iter ${i}`);
    const fxValues = table.map(r => Math.abs(r.fx));
    const xValues  = table.map(r => r.x);

    newtonChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '|f(x)| (Error)',
            data: fxValues,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.08)',
            borderWidth: 2.5, pointRadius: 5,
            pointBackgroundColor: '#f59e0b',
            tension: 0.3, yAxisID: 'y'
          },
          {
            label: 'x (Approximation)',
            data: xValues,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.08)',
            borderWidth: 2.5, pointRadius: 5,
            pointBackgroundColor: '#6366f1',
            tension: 0.3, yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeInOutQuart' },
        plugins: {
          legend: { labels: { color: labelColor, font: { family: 'Inter', size: 12 } } },
          tooltip: {
            backgroundColor: isDark ? 'rgba(14,16,24,0.95)' : 'rgba(255,255,255,0.97)',
            borderColor: 'rgba(99,102,241,0.25)', borderWidth: 1,
            titleColor: isDark ? '#f1f5f9' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            padding: 10, cornerRadius: 8
          }
        },
        scales: {
          x: { ticks: { color: labelColor, font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: gridColor } },
          y: { type: 'logarithmic', position: 'left', ticks: { color: '#f59e0b', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: gridColor }, title: { display: true, text: '|f(x)|', color: '#f59e0b' } },
          y1: { type: 'linear', position: 'right', ticks: { color: '#6366f1', font: { family: 'JetBrains Mono', size: 11 } }, grid: { drawOnChartArea: false }, title: { display: true, text: 'x', color: '#6366f1' } }
        }
      }
    });

    wrap.classList.remove('hidden');
    gsap.from(wrap, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' });
  }

  function init() {
    document.querySelectorAll('#roots-tabs .op-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#roots-tabs .op-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        switchOp(btn.dataset.op);
      });
    });

    document.getElementById('roots-calculate')?.addEventListener('click', calculate);
    document.getElementById('roots-clear')?.addEventListener('click', () => {
      document.getElementById('roots-poly').value = '';
      document.getElementById('roots-result')?.classList.add('hidden');
      document.getElementById('newton-chart-wrap')?.classList.add('hidden');
    });
    document.getElementById('roots-poly')?.addEventListener('keydown', e => { if (e.key === 'Enter') calculate(); });

    switchOp('solve');
  }

  return { init };
})();
