/* ══════════════════════════════════════════════════════════
   DASHBOARD MODULE — Stats, recent activity, quick start
══════════════════════════════════════════════════════════ */
const Dashboard = (() => {

  function animateCount(el, target) {
    if (!el) return;
    const duration = 900;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  }

  async function loadStats() {
    if (!Auth.isLoggedIn()) {
      // Use local history count
      const local = JSON.parse(localStorage.getItem('poly_local_history') || '[]');
      const valEl = document.getElementById('stat-val-total');
      animateCount(valEl, local.length);
      renderRecent(local.slice(0, 6));
      return;
    }
    try {
      const data = await API.dashboard.stats();
      const stats = data.stats || {};
      animateCount(document.getElementById('stat-val-total'), stats.totalCalculations || 0);
      renderRecent(stats.recentCalculations || []);
    } catch {
      const local = JSON.parse(localStorage.getItem('poly_local_history') || '[]');
      animateCount(document.getElementById('stat-val-total'), local.length);
      renderRecent(local.slice(0, 6));
    }
  }

  function renderRecent(items) {
    const el = document.getElementById('dashboard-recent');
    if (!el) return;
    if (!items || items.length === 0) {
      el.innerHTML = `<div class="empty-state"><i data-lucide="sparkles"></i><p>Your recent calculations will appear here</p></div>`;
      if (window.lucide) lucide.createIcons({ nodes: [el] });
      return;
    }

    el.innerHTML = items.map(item => {
      const inputStr = typeof item.input === 'object' ? JSON.stringify(item.input) : (item.input || '');
      const op = (item.operation || '').replace(/_/g,' ');
      return `
        <div class="history-item glass-glow">
          <span class="history-op-badge">${op}</span>
          <span class="history-expr">${inputStr.length > 60 ? inputStr.slice(0,60)+'…' : inputStr}</span>
          <span class="history-date">${new Date(item.created_at).toLocaleTimeString()}</span>
        </div>`;
    }).join('');

    gsap.from('#dashboard-recent .history-item', {
      opacity: 0, x: -20, stagger: 0.07, duration: 0.4, ease: 'power2.out'
    });

    if (window.lucide) lucide.createIcons({ nodes: [el] });
  }

  function initQuickStart() {
    document.querySelectorAll('.qs-card[data-goto]').forEach(card => {
      card.addEventListener('click', () => Router.navigate(card.dataset.goto));
    });

    // Animate stat cards on load
    gsap.from('.stat-card', {
      opacity: 0, y: 30, stagger: 0.1, duration: 0.5, ease: 'power2.out', delay: 0.1
    });
    gsap.from('.qs-card', {
      opacity: 0, y: 20, stagger: 0.06, duration: 0.4, ease: 'power2.out', delay: 0.3
    });
    gsap.from('.section-hero', {
      opacity: 0, y: -20, duration: 0.6, ease: 'power2.out'
    });
  }

  function init() {
    initQuickStart();
    loadStats();
  }

  return { init, loadStats };
})();
