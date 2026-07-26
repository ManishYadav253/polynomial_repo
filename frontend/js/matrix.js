/* ══════════════════════════════════════════════════════════
   MATRIX OPERATIONS MODULE
══════════════════════════════════════════════════════════ */
const MatrixModule = (() => {
  let currentOp = 'add';
  let rows = 2, cols = 2;

  const NEED_B = ['add','multiply'];

  function buildGrid(containerId, r, c) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.style.gridTemplateColumns = `repeat(${c}, 1fr)`;
    grid.innerHTML = '';
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        const input = document.createElement('input');
        input.type = 'number'; input.value = (i === j ? 1 : 0);
        input.className = 'matrix-cell';
        input.id = `${containerId}-${i}-${j}`;
        input.step = 'any';
        input.addEventListener('keydown', e => { if (e.key === 'Enter') calculate(); });
        grid.appendChild(input);
      }
    }
  }

  function readMatrix(containerId, r, c) {
    const mat = [];
    for (let i = 0; i < r; i++) {
      mat.push([]);
      for (let j = 0; j < c; j++) {
        const val = parseFloat(document.getElementById(`${containerId}-${i}-${j}`)?.value) || 0;
        mat[i].push(val);
      }
    }
    return mat;
  }

  function randomMatrix(containerId, r, c) {
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        const el = document.getElementById(`${containerId}-${i}-${j}`);
        if (el) el.value = Math.floor(Math.random() * 9) - 4;
      }
    }
  }

  function switchOp(op) {
    currentOp = op;
    const bSection = document.getElementById('matrix-b-section');
    if (bSection) bSection.style.display = NEED_B.includes(op) ? 'block' : 'none';
    document.getElementById('matrix-result')?.classList.add('hidden');
  }

  async function calculate() {
    const btn = document.getElementById('mat-calculate');
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Computing…';
    btn.disabled = true;
    if (window.lucide) lucide.createIcons({ nodes: [btn] });

    const resultEl = document.getElementById('matrix-result');

    try {
      const A = readMatrix('matrix-a-grid', rows, cols);
      const B = readMatrix('matrix-b-grid', rows, cols);
      let data, html = '';

      switch (currentOp) {
        case 'add':         data = await API.matrix.add(A, B);        break;
        case 'multiply':    data = await API.matrix.multiply(A, B);   break;
        case 'determinant': data = await API.matrix.det(A);           break;
        case 'inverse':     data = await API.matrix.inverse(A);       break;
        case 'gaussian':    data = await API.matrix.gaussian(A);      break;
      }

      if (data.error) throw new Error(data.error);

      // Summary
      if (currentOp === 'determinant') {
        html += ResultRenderer.summary('hash', 'Determinant det(A)', fmtNum(data.determinant));
      } else if (currentOp === 'add') {
        html += ResultRenderer.summary('plus', 'A + B', '');
        html += ResultRenderer.matrix(data.matrix, 'Result Matrix (A + B)');
      } else if (currentOp === 'multiply') {
        html += ResultRenderer.summary('x', 'A × B', '');
        html += ResultRenderer.matrix(data.matrix, 'Result Matrix (A × B)');
      } else if (currentOp === 'inverse') {
        html += ResultRenderer.summary('rotate-ccw', 'Inverse A⁻¹', '', [
          { label: 'det(A)', value: fmtNum(data.determinant) }
        ]);
        html += ResultRenderer.matrix(data.matrix, 'A⁻¹ (Inverse Matrix)');
      } else if (currentOp === 'gaussian') {
        html += ResultRenderer.summary('table-2', 'Row Echelon Form', '');
        html += ResultRenderer.matrix(data.matrix, 'Row Echelon Form');
      }

      html += ResultRenderer.steps(data.steps || [], 'Operation Steps');

      ResultRenderer.render(resultEl, html);
      Toast.show('Matrix computed!', 'success');

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
    // Build initial grids
    buildGrid('matrix-a-grid', rows, cols);
    buildGrid('matrix-b-grid', rows, cols);

    // Op tabs
    document.querySelectorAll('#matrix-tabs .op-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#matrix-tabs .op-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        switchOp(btn.dataset.op);
      });
    });

    // Resize
    document.getElementById('mat-resize')?.addEventListener('click', () => {
      rows = Math.max(1, Math.min(6, parseInt(document.getElementById('mat-rows').value) || 2));
      cols = Math.max(1, Math.min(6, parseInt(document.getElementById('mat-cols').value) || 2));
      document.getElementById('mat-rows').value = rows;
      document.getElementById('mat-cols').value = cols;
      buildGrid('matrix-a-grid', rows, cols);
      buildGrid('matrix-b-grid', rows, cols);
    });

    document.getElementById('mat-calculate')?.addEventListener('click', calculate);
    document.getElementById('mat-clear')?.addEventListener('click', () => {
      buildGrid('matrix-a-grid', rows, cols);
      buildGrid('matrix-b-grid', rows, cols);
      document.getElementById('matrix-result')?.classList.add('hidden');
    });
    document.getElementById('mat-random')?.addEventListener('click', () => {
      randomMatrix('matrix-a-grid', rows, cols);
      randomMatrix('matrix-b-grid', rows, cols);
    });

    switchOp('add');
  }

  return { init };
})();
