/* ══════════════════════════════════════════════════════════
   FORMULA LIBRARY — Interactive math reference cards
══════════════════════════════════════════════════════════ */
const FormulaLibrary = (() => {

  const FORMULAS = [
    // ── Derivative Rules ─────────────────────────────────
    { category: 'derivative', tag: 'Derivative', title: 'Power Rule', expr: 'd/dx[xⁿ] = nxⁿ⁻¹', desc: 'Multiply by exponent, reduce exponent by 1.', example: 'x^4' },
    { category: 'derivative', tag: 'Derivative', title: 'Constant Rule', expr: 'd/dx[c] = 0', desc: 'The derivative of any constant is always zero.', example: '7' },
    { category: 'derivative', tag: 'Derivative', title: 'Sum Rule', expr: 'd/dx[f+g] = f\'+g\'', desc: 'Differentiate each term independently then add.', example: 'x^3 + 2x' },
    { category: 'derivative', tag: 'Derivative', title: 'Product Rule', expr: 'd/dx[fg] = f\'g + fg\'', desc: 'Used when two functions are multiplied together.', example: null },
    { category: 'derivative', tag: 'Derivative', title: 'Quotient Rule', expr: 'd/dx[f/g] = (f\'g−fg\')/g²', desc: 'Used when one function is divided by another.', example: null },
    { category: 'derivative', tag: 'Derivative', title: 'Chain Rule', expr: 'd/dx[f(g(x))] = f\'(g(x))·g\'(x)', desc: 'Used for composite functions. Differentiate outer, multiply by derivative of inner.', example: null },

    // ── Integration Rules ────────────────────────────────
    { category: 'integral', tag: 'Integral', title: 'Power Rule', expr: '∫xⁿ dx = xⁿ⁺¹/(n+1) + C', desc: 'Increase exponent by 1, divide by new exponent. (n ≠ −1)', example: 'x^3 + x' },
    { category: 'integral', tag: 'Integral', title: 'Constant Rule', expr: '∫c dx = cx + C', desc: 'A constant integrates to a linear term.', example: '5' },
    { category: 'integral', tag: 'Integral', title: 'Sum Rule', expr: '∫[f+g] dx = ∫f dx + ∫g dx', desc: 'Integrate each term independently.', example: '2x^2 + 3x' },
    { category: 'integral', tag: 'Integral', title: 'Fundamental Theorem', expr: '∫ₐᵇ f(x)dx = F(b)−F(a)', desc: 'Definite integral equals antiderivative evaluated at bounds.', example: null },
    { category: 'integral', tag: 'Integral', title: 'Linearity', expr: '∫[af+bg]dx = a∫f dx + b∫g dx', desc: 'Constants can be factored out of integrals.', example: null },

    // ── Polynomial Identities ────────────────────────────
    { category: 'polynomial', tag: 'Identity', title: 'Difference of Squares', expr: 'a²−b² = (a+b)(a−b)', desc: 'Factoring pattern for difference of two perfect squares.', example: null },
    { category: 'polynomial', tag: 'Identity', title: 'Perfect Square', expr: '(a+b)² = a²+2ab+b²', desc: 'Expanding a perfect square binomial.', example: null },
    { category: 'polynomial', tag: 'Identity', title: 'Difference of Squares 2', expr: '(a−b)² = a²−2ab+b²', desc: 'Expanding a perfect square with subtraction.', example: null },
    { category: 'polynomial', tag: 'Identity', title: 'Sum of Cubes', expr: 'a³+b³ = (a+b)(a²−ab+b²)', desc: 'Factor the sum of two perfect cubes.', example: null },
    { category: 'polynomial', tag: 'Identity', title: 'Difference of Cubes', expr: 'a³−b³ = (a−b)(a²+ab+b²)', desc: 'Factor the difference of two perfect cubes.', example: null },
    { category: 'polynomial', tag: 'Identity', title: 'Binomial Theorem (n=3)', expr: '(a+b)³ = a³+3a²b+3ab²+b³', desc: 'Cube of a sum expanded using binomial coefficients.', example: null },
    { category: 'polynomial', tag: 'Identity', title: 'Vieta\'s Formulas (Quad)', expr: 'r₁+r₂ = −b/a, r₁r₂ = c/a', desc: 'Relationship between roots and coefficients of ax²+bx+c.', example: null },
    { category: 'polynomial', tag: 'Identity', title: 'Quadratic Formula', expr: 'x = (−b ± √(b²−4ac)) / 2a', desc: 'Solve any quadratic equation. Discriminant Δ=b²−4ac determines root type.', example: 'x^2 - 5x + 6' },

    // ── Rules Reference ──────────────────────────────────
    { category: 'rules', tag: 'Rules', title: 'Newton-Raphson', expr: 'xₙ₊₁ = xₙ − f(xₙ)/f\'(xₙ)', desc: 'Iterative root-finding method. Converges quadratically near roots.', example: 'x^3 - 2x - 5' },
    { category: 'rules', tag: 'Rules', title: 'Synthetic Division', expr: 'P(x) ÷ (x−r) via row reduction', desc: 'Efficient method to divide polynomial by linear factor (x−r).', example: null },
    { category: 'rules', tag: 'Rules', title: 'Remainder Theorem', expr: 'P(r) = remainder of P(x)÷(x−r)', desc: 'When dividing by (x−r), the remainder equals P(r).', example: null },
    { category: 'rules', tag: 'Rules', title: 'Factor Theorem', expr: '(x−r) is a factor ⟺ P(r)=0', desc: 'r is a root if and only if (x−r) divides the polynomial exactly.', example: null },
    { category: 'rules', tag: 'Rules', title: 'Degree of Product', expr: 'deg(P·Q) = deg(P) + deg(Q)', desc: 'The degree of a product equals the sum of individual degrees.', example: null },
  ];

  let filtered = [...FORMULAS];

  function renderCard(f) {
    return `
      <div class="formula-card glass glass-glow ${f.category}" data-title="${f.title}">
        <span class="formula-tag">${f.tag}</span>
        <div class="formula-title">${f.title}</div>
        <code class="formula-expr">${f.expr}</code>
        <div class="formula-desc">${f.desc}</div>
        ${f.example ? `
          <button class="formula-try" data-example="${f.example}" data-section="${f.category === 'derivative' || f.category === 'integral' ? 'calculus' : (f.title.includes('Newton') ? 'roots' : 'polynomial')}">
            <i data-lucide="play"></i> Try Example
          </button>` : ''}
      </div>`;
  }

  function render() {
    const grid = document.getElementById('formula-grid');
    if (!grid) return;
    grid.innerHTML = filtered.map(renderCard).join('');

    // Animate cards
    gsap.from('#formula-grid .formula-card', {
      opacity: 0, y: 20, stagger: 0.04, duration: 0.4, ease: 'power2.out'
    });

    // Try example buttons
    grid.querySelectorAll('.formula-try').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        const example = btn.dataset.example;
        Router.navigate(section);
        // Pre-fill the input after navigation
        const inputMap = {
          'calculus': '#calc-poly',
          'roots': '#roots-poly',
          'polynomial': '#poly-single'
        };
        const input = document.querySelector(inputMap[section] || `#${section}-poly, #calc-poly, #poly-single`);
        if (input) {
          input.value = example;
          input.focus();
          gsap.from(input, { borderColor: 'var(--accent-emerald)', duration: 0.8 });
        }
      });
    });

    if (window.lucide) lucide.createIcons({ nodes: [grid] });
  }

  function filter(query) {
    const q = query.toLowerCase();
    filtered = FORMULAS.filter(f =>
      f.title.toLowerCase().includes(q) ||
      f.tag.toLowerCase().includes(q) ||
      f.expr.toLowerCase().includes(q) ||
      f.desc.toLowerCase().includes(q)
    );
    render();
  }

  function init() {
    render();
    const searchInput = document.getElementById('formula-search');
    if (searchInput) {
      searchInput.addEventListener('input', e => filter(e.target.value));
    }
  }

  return { init };
})();
