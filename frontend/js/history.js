/* ══════════════════════════════════════════════════════════
   HISTORY MODULE — Recent calculations & bookmarks
══════════════════════════════════════════════════════════ */
const HistoryModule = (() => {
  let currentTab = 'recent';
  // Local history (when not logged in)
  let localHistory = JSON.parse(localStorage.getItem('poly_local_history') || '[]');

  function saveLocal(operation, inputStr, resultStr) {
    const entry = {
      id: Date.now(),
      operation,
      input: inputStr,
      result: resultStr,
      created_at: new Date().toISOString()
    };
    localHistory.unshift(entry);
    if (localHistory.length > 100) localHistory = localHistory.slice(0, 100);
    localStorage.setItem('poly_local_history', JSON.stringify(localHistory));
  }

  function fmtDate(dateStr) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString();
    } catch { return dateStr; }
  }

  function opLabel(op) {
    const map = {
      polynomial_add:'Add', polynomial_subtract:'Subtract', polynomial_multiply:'Multiply',
      polynomial_divide:'Divide', polynomial_evaluate:'Evaluate', polynomial_compose:'Compose',
      polynomial_compare:'Compare', differentiate:'Derivative', integrate:'Integral',
      definite_integral:'∫ Definite', solve_roots:'Roots', newton_raphson:'Newton',
      matrix_add:'Matrix Add', matrix_multiply:'Matrix ×',
    };
    return map[op] || op.replace(/_/g,' ');
  }

  function renderItems(items) {
    if (!items.length) {
      return `<div class="empty-state"><i data-lucide="history"></i><p>No calculations yet. Start computing!</p></div>`;
    }
    return items.map(item => {
      const inputStr  = typeof item.input  === 'object' ? JSON.stringify(item.input)  : (item.input  || '');
      const resultStr = typeof item.result === 'object' ? JSON.stringify(item.result) : (item.result || '');
      const display   = (inputStr.length > 80 ? inputStr.slice(0,80)+'…' : inputStr);
      return `
        <div class="history-item" data-id="${item.id}">
          <span class="history-op-badge">${opLabel(item.operation)}</span>
          <span class="history-expr" title="${display}">${display}</span>
          <span class="history-date">${fmtDate(item.created_at)}</span>
          <div class="history-actions-item">
            <button title="Copy" onclick="navigator.clipboard.writeText('${resultStr.replace(/'/g,"\\'")}').then(()=>Toast.show('Copied!','success'))">
              <i data-lucide="copy"></i>
            </button>
            <button title="Delete" onclick="HistoryModule.deleteItem(${item.id})">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>`;
    }).join('');
  }

  async function loadHistory() {
    const listEl = document.getElementById('history-list');
    if (!listEl) return;

    listEl.innerHTML = `<div class="shimmer" style="height:60px;margin-bottom:8px;"></div>`.repeat(3);

    try {
      if (Auth.isLoggedIn()) {
        const data = await API.history.list();
        const items = data.calculations || [];
        listEl.innerHTML = renderItems(items);
      } else {
        listEl.innerHTML = renderItems(localHistory);
      }
    } catch {
      listEl.innerHTML = renderItems(localHistory);
    }
    if (window.lucide) lucide.createIcons({ nodes: [listEl] });
  }

  async function loadBookmarks() {
    const listEl = document.getElementById('history-list');
    if (!listEl) return;
    if (!Auth.isLoggedIn()) {
      listEl.innerHTML = `<div class="empty-state"><i data-lucide="bookmark"></i><p>Sign in to view bookmarks</p></div>`;
      if (window.lucide) lucide.createIcons({ nodes: [listEl] });
      return;
    }
    try {
      const data = await API.history.bookmarks();
      const items = (data.bookmarks || []).map(b => ({ ...b, operation: b.operation || 'bookmark' }));
      listEl.innerHTML = renderItems(items);
    } catch {
      listEl.innerHTML = `<div class="empty-state"><i data-lucide="bookmark"></i><p>Could not load bookmarks</p></div>`;
    }
    if (window.lucide) lucide.createIcons({ nodes: [listEl] });
  }

  async function deleteItem(id) {
    if (Auth.isLoggedIn()) {
      try { await API.history.delete(id); } catch {}
    }
    localHistory = localHistory.filter(h => h.id !== id);
    localStorage.setItem('poly_local_history', JSON.stringify(localHistory));
    currentTab === 'recent' ? loadHistory() : loadBookmarks();
    Toast.show('Deleted', 'info');
  }

  async function exportFile(format) {
    if (!Auth.isLoggedIn()) {
      // Export local
      const data = format === 'csv'
        ? 'id,operation,input,result,date\n' + localHistory.map(h => `${h.id},"${h.operation}","${h.input}","${h.result}",${h.created_at}`).join('\n')
        : JSON.stringify(localHistory, null, 2);
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `calculations.${format}`; a.click();
      URL.revokeObjectURL(url);
      return;
    }
    try {
      const res = format === 'csv' ? await API.history.exportCSV() : await API.history.exportJSON();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `calculations.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch(e) { Toast.show('Export failed: ' + e.message, 'error'); }
  }

  function init() {
    document.querySelectorAll('[data-htab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-htab]').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.htab;
        currentTab === 'recent' ? loadHistory() : loadBookmarks();
      });
    });

    document.getElementById('history-export-json')?.addEventListener('click', () => exportFile('json'));
    document.getElementById('history-export-csv')?.addEventListener('click',  () => exportFile('csv'));
    document.getElementById('history-clear-all')?.addEventListener('click', () => {
      localHistory = [];
      localStorage.setItem('poly_local_history', JSON.stringify(localHistory));
      loadHistory();
      Toast.show('History cleared', 'info');
    });
  }

  return { init, loadHistory, saveLocal, deleteItem };
})();
