/* ══════════════════════════════════════════════════════════
   GRAPH PLOTTER — Chart.js with zoom/pan
══════════════════════════════════════════════════════════ */
const GraphPlotter = (() => {
  let mainChart = null;

  const DATASET_STYLES = [
    { color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  label: 'f(x)' },
    { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)',  label: "f'(x)" },
    { color: '#10b981', bg: 'rgba(16,185,129,0.06)',  label: '∫f(x)dx' },
  ];

  function buildChartConfig(datasets) {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    const labelColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

    return {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 600, easing: 'easeInOutQuart' },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: labelColor, padding: 20, font: { family: 'Inter', size: 12 }, usePointStyle: true, pointStyleWidth: 10 }
          },
          tooltip: {
            backgroundColor: isDark ? 'rgba(14,16,24,0.95)' : 'rgba(255,255,255,0.97)',
            borderColor: 'rgba(99,102,241,0.25)', borderWidth: 1,
            titleColor: isDark ? '#f1f5f9' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            padding: 12, cornerRadius: 10,
            callbacks: {
              title: items => `x = ${items[0].parsed.x.toFixed(3)}`,
              label: item => ` ${item.dataset.label}: ${item.parsed.y.toFixed(4)}`
            }
          },
          zoom: {
            zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
            pan: { enabled: true, mode: 'xy' }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'center',
            grid: { color: gridColor },
            border: { color: 'rgba(99,102,241,0.3)' },
            ticks: { color: labelColor, maxTicksLimit: 12, font: { family: 'JetBrains Mono', size: 11 } },
            title: { display: true, text: 'x', color: labelColor, font: { family: 'Inter' } }
          },
          y: {
            grid: { color: gridColor },
            border: { color: 'rgba(99,102,241,0.3)' },
            ticks: { color: labelColor, maxTicksLimit: 10, font: { family: 'JetBrains Mono', size: 11 } },
            title: { display: true, text: 'y', color: labelColor, font: { family: 'Inter' } }
          }
        }
      }
    };
  }

  function apiDataToDatasets(apiData) {
    return apiData.datasets.map((ds, i) => {
      const style = DATASET_STYLES[i] || { color: '#6366f1', bg: 'rgba(99,102,241,0.08)' };
      return {
        label: ds.label,
        data: ds.data,
        borderColor: ds.color || style.color,
        backgroundColor: style.bg,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: ds.color || style.color,
        fill: false,
        tension: 0.2,
        parsing: { xAxisKey: 'x', yAxisKey: 'y' }
      };
    });
  }

  async function plot() {
    const poly  = document.getElementById('graph-poly').value.trim();
    const xMin  = parseFloat(document.getElementById('graph-xmin').value) || -10;
    const xMax  = parseFloat(document.getElementById('graph-xmax').value) || 10;
    const showF  = document.getElementById('graph-show-f').checked;
    const showDf = document.getElementById('graph-show-df').checked;
    const showIf = document.getElementById('graph-show-if').checked;

    if (!poly) { Toast.show('Enter a polynomial first', 'error'); return; }

    const plotBtn = document.getElementById('graph-plot');
    plotBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Plotting…';
    plotBtn.disabled = true;
    if (window.lucide) lucide.createIcons({ nodes: [plotBtn] });

    try {
      const data = await API.graph.data(poly, xMin, xMax, 300, showDf, showIf);

      // Filter datasets
      let datasets = [];
      if (showF  && data.datasets[0]) datasets.push(data.datasets[0]);
      if (showDf && data.datasets[1]) datasets.push(data.datasets[1]);
      if (showIf && data.datasets[2]) datasets.push(data.datasets[2]);

      const builtDatasets = apiDataToDatasets({ datasets });

      const placeholder = document.getElementById('graph-placeholder');
      const canvas      = document.getElementById('main-graph');
      if (placeholder) placeholder.style.display = 'none';
      canvas.style.display = 'block';

      if (mainChart) { mainChart.destroy(); mainChart = null; }

      const ctx = canvas.getContext('2d');
      mainChart = new Chart(ctx, buildChartConfig(builtDatasets));

      // Info panel
      const info = document.getElementById('graph-info');
      const infoContent = document.getElementById('graph-info-content');
      if (info && infoContent) {
        infoContent.innerHTML = `
          <div style="display:flex;gap:24px;flex-wrap:wrap;font-size:13px;">
            ${data.datasets.map(ds => `<div><span style="color:${ds.color};font-weight:600;">●</span> <strong>${ds.label}</strong></div>`).join('')}
            <div style="color:var(--text-muted);">Range: [${xMin}, ${xMax}] · 300 points · Scroll to zoom · Drag to pan</div>
          </div>`;
        info.classList.remove('hidden');
      }

      gsap.from('#main-graph', { opacity: 0, scaleY: 0.95, duration: 0.5, ease: 'power2.out', transformOrigin: 'bottom' });
      Toast.show('Graph plotted successfully', 'success');

    } catch (e) {
      Toast.show('Graph error: ' + e.message, 'error');
    } finally {
      plotBtn.innerHTML = '<i data-lucide="line-chart"></i> Plot Graph';
      plotBtn.disabled = false;
      if (window.lucide) lucide.createIcons({ nodes: [plotBtn] });
    }
  }

  // External: plot a polynomial from another section
  function plotExternal(poly) {
    Router.navigate('graph');
    setTimeout(() => {
      document.getElementById('graph-poly').value = poly;
      plot();
    }, 250);
  }

  function init() {
    document.getElementById('graph-plot')?.addEventListener('click', plot);
    document.getElementById('graph-clear')?.addEventListener('click', () => {
      if (mainChart) { mainChart.destroy(); mainChart = null; }
      document.getElementById('graph-poly').value = '';
      const placeholder = document.getElementById('graph-placeholder');
      const canvas      = document.getElementById('main-graph');
      if (placeholder) placeholder.style.display = 'flex';
      canvas.style.display = 'none';
      document.getElementById('graph-info')?.classList.add('hidden');
    });
    document.getElementById('graph-reset-zoom')?.addEventListener('click', () => {
      if (mainChart) mainChart.resetZoom();
    });
    document.getElementById('graph-poly')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') plot();
    });
  }

  return { init, plotExternal };
})();
