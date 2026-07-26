/* ══════════════════════════════════════════════════════════
   APP.JS — SPA Router, Toast, Theme, Equation Solver, Init
══════════════════════════════════════════════════════════ */

// ─── TOAST ─────────────────────────────────────────────────
const Toast = {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const ICONS = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${ICONS[type] || 'info'}"></i><span>${message}</span>`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons({ nodes: [toast] });

    gsap.from(toast, { x: 60, opacity: 0, duration: 0.35, ease: 'back.out(1.5)' });

    setTimeout(() => {
      gsap.to(toast, {
        x: 60, opacity: 0, duration: 0.25, ease: 'power2.in',
        onComplete: () => toast.remove()
      });
    }, duration);
  }
};

// ─── ROUTER ────────────────────────────────────────────────
const Router = (() => {
  const SECTIONS = ['dashboard','polynomial','calculus','roots','graph','matrix','equations','formulas','history'];
  let current = 'dashboard';

  function navigate(section) {
    if (!SECTIONS.includes(section)) section = 'dashboard';
    if (section === current) return;

    // Fade out old
    const oldEl = document.getElementById(`section-${current}`);
    if (oldEl) {
      gsap.to(oldEl, { opacity: 0, y: -8, duration: 0.18, ease: 'power2.in', onComplete: () => {
        oldEl.classList.remove('active');
        showSection(section);
      }});
    } else {
      showSection(section);
    }
  }

  function showSection(section) {
    current = section;

    // Activate section
    const newEl = document.getElementById(`section-${section}`);
    if (newEl) {
      newEl.classList.add('active');
      gsap.from(newEl, { opacity: 0, y: 12, duration: 0.3, ease: 'power2.out' });
    }

    // Update sidebar active
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    // Update topbar title
    const titleEl = newEl?.dataset.title || section.charAt(0).toUpperCase() + section.slice(1);
    const topbarTitle = document.getElementById('topbar-title');
    if (topbarTitle) topbarTitle.textContent = typeof titleEl === 'string' ? titleEl : section;

    // Update URL hash
    history.pushState(null, null, `#${section}`);

    // Section-specific on-enter
    if (section === 'dashboard') Dashboard.loadStats();
    if (section === 'history')   HistoryModule.loadHistory();
    if (section === 'formulas')  FormulaLibrary.init();

    // Close mobile sidebar
    closeSidebar();
  }

  function init() {
    // Nav clicks
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      item.addEventListener('click', e => { e.preventDefault(); navigate(item.dataset.section); });
    });

    // Hash routing
    const hash = window.location.hash.slice(1);
    if (hash && SECTIONS.includes(hash)) {
      showSection(hash);
    } else {
      showSection('dashboard');
    }

    window.addEventListener('popstate', () => {
      const h = window.location.hash.slice(1);
      if (h && SECTIONS.includes(h)) showSection(h);
    });
  }

  return { navigate, init };
})();

// ─── SIDEBAR MOBILE ────────────────────────────────────────
function openSidebar()  {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('active');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
}

// ─── THEME ─────────────────────────────────────────────────
const Theme = (() => {
  function set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('poly_theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) { icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon'); }
    if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('theme-toggle')] });
    document.dispatchEvent(new Event('themechange'));
  }

  function toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    set(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    const saved = localStorage.getItem('poly_theme') || 'dark';
    set(saved);
    document.getElementById('theme-toggle')?.addEventListener('click', toggle);
  }

  return { init };
})();

// ─── EQUATION SOLVER (Alias of Roots) ──────────────────────
const EqSolver = (() => {
  async function solve() {
    const poly = document.getElementById('eq-poly')?.value.trim();
    if (!poly) { Toast.show('Enter an equation', 'error'); return; }

    const btn = document.getElementById('eq-solve');
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Solving…';
    btn.disabled = true;
    if (window.lucide) lucide.createIcons({ nodes: [btn] });

    const resultEl = document.getElementById('eq-result');
    try {
      const data = await API.roots.solve(poly);
      let html = ResultRenderer.summary('equal', `${poly} = 0`, `${data.roots.length} root(s)`);
      html += ResultRenderer.roots(data.roots);
      html += ResultRenderer.steps(data.steps || [], 'Solution Steps');
      html += `<button class="btn btn-ghost" onclick="GraphPlotter.plotExternal('${poly.replace(/'/g,"\\'")}')">
        <i data-lucide="line-chart"></i> Graph this equation
      </button>`;
      ResultRenderer.render(resultEl, html);
      Toast.show('Equation solved!', 'success');
    } catch(e) {
      ResultRenderer.render(resultEl, `<div class="result-summary glass" style="border-color:rgba(244,63,94,0.3);">
        <div class="result-icon" style="background:var(--accent-rose)"><i data-lucide="alert-circle"></i></div>
        <div><div class="result-title">Error</div><div class="result-value" style="font-size:16px;color:var(--accent-rose)">${e.message}</div></div>
      </div>`);
    } finally {
      btn.innerHTML = '<i data-lucide="play"></i> Solve';
      btn.disabled = false;
      if (window.lucide) lucide.createIcons({ nodes: [btn] });
    }
  }

  function init() {
    document.getElementById('eq-solve')?.addEventListener('click', solve);
    document.getElementById('eq-clear')?.addEventListener('click', () => {
      document.getElementById('eq-poly').value = '';
      document.getElementById('eq-result')?.classList.add('hidden');
    });
    document.getElementById('eq-poly')?.addEventListener('keydown', e => { if (e.key === 'Enter') solve(); });
  }

  return { init };
})();

// ─── GLOBAL SEARCH ─────────────────────────────────────────
function initGlobalSearch() {
  const search = document.getElementById('global-search');
  if (!search) return;
  search.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = search.value.toLowerCase().trim();
      if (!q) return;
      if (q.includes('deriv')) Router.navigate('calculus');
      else if (q.includes('integr')) Router.navigate('calculus');
      else if (q.includes('root') || q.includes('zero')) Router.navigate('roots');
      else if (q.includes('graph') || q.includes('plot')) Router.navigate('graph');
      else if (q.includes('matrix')) Router.navigate('matrix');
      else if (q.includes('formula')) Router.navigate('formulas');
      else if (q.includes('history')) Router.navigate('history');
      else Router.navigate('polynomial');
    }
  });
}

// ─── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons globally
  if (window.lucide) lucide.createIcons();

  // Init modules
  Theme.init();
  Auth.init();
  Router.init();
  Calculator.init();
  CalculusModule.init();
  RootsModule.init();
  GraphPlotter.init();
  MatrixModule.init();
  EqSolver.init();
  HistoryModule.init();
  Dashboard.init();
  FormulaLibrary.init();
  initGlobalSearch();

  // Mobile sidebar
  document.getElementById('hamburger')?.addEventListener('click', openSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

  // Debounced icon refresh (avoids infinite loop with MutationObserver)
  let iconRefreshTimer = null;
  const observer = new MutationObserver(() => {
    if (iconRefreshTimer) clearTimeout(iconRefreshTimer);
    iconRefreshTimer = setTimeout(() => {
      observer.disconnect();
      if (window.lucide) lucide.createIcons();
      observer.observe(document.body, { childList: true, subtree: true });
    }, 150);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // GSAP intro animation
  gsap.from('.sidebar', { x: -40, opacity: 0, duration: 0.6, ease: 'power3.out' });
  gsap.from('.topbar',  { y: -20, opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.15 });
});
