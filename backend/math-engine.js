/**
 * Pure JavaScript implementation of the C++ polynomial math engine.
 * This acts as the fallback when the native C++ addon is not available.
 * All algorithms match the C++ implementation exactly.
 */

// ─── Polynomial Utilities ───────────────────────────────────────────────────

function trimCoeffs(coeffs) {
  const c = [...coeffs];
  while (c.length > 1 && Math.abs(c[c.length - 1]) < 1e-12) c.pop();
  if (c.length === 0) c.push(0);
  return c;
}

function degree(coeffs) {
  const c = trimCoeffs(coeffs);
  for (let i = c.length - 1; i >= 0; i--)
    if (Math.abs(c[i]) > 1e-12) return i;
  return 0;
}

function isZero(coeffs) {
  return degree(coeffs) === 0 && Math.abs(coeffs[0]) < 1e-12;
}

function formatNum(v) {
  if (Number.isInteger(v) && Math.abs(v) < 1e9) return String(v);
  const s = v.toFixed(4);
  return s.replace(/\.?0+$/, '');
}

function polyToString(coeffs) {
  const c = trimCoeffs(coeffs);
  if (isZero(c)) return '0';
  let parts = [];
  for (let i = c.length - 1; i >= 0; i--) {
    const coef = c[i];
    if (Math.abs(coef) < 1e-12) continue;
    const absC = Math.abs(coef);
    const sign = coef < 0 ? '-' : '+';
    let term = '';
    if (i === 0) term = formatNum(absC);
    else if (i === 1) term = (Math.abs(absC - 1) < 1e-12 ? '' : formatNum(absC)) + 'x';
    else term = (Math.abs(absC - 1) < 1e-12 ? '' : formatNum(absC)) + 'x^' + i;
    parts.push({ sign, term });
  }
  if (parts.length === 0) return '0';
  let result = (parts[0].sign === '-' ? '-' : '') + parts[0].term;
  for (let i = 1; i < parts.length; i++)
    result += ' ' + parts[i].sign + ' ' + parts[i].term;
  return result;
}

function evalPoly(coeffs, x) {
  let result = 0, xpow = 1;
  for (const c of coeffs) { result += c * xpow; xpow *= x; }
  return result;
}

// ─── Polynomial Operations ───────────────────────────────────────────────────

function polyAdd(a, b) {
  const steps = [];
  steps.push({ expression: `(${polyToString(a)}) + (${polyToString(b)})`, explanation: 'Write both polynomials for addition' });
  const len = Math.max(a.length, b.length);
  const c = Array(len).fill(0);
  a.forEach((v, i) => (c[i] += v));
  b.forEach((v, i) => (c[i] += v));
  const result = trimCoeffs(c);
  steps.push({ expression: 'Group like terms by degree', explanation: 'Add coefficients of matching degree terms' });
  steps.push({ expression: polyToString(result), explanation: 'Simplified result' });
  return { coefficients: result, expression: polyToString(result), steps };
}

function polySubtract(a, b) {
  const steps = [];
  steps.push({ expression: `(${polyToString(a)}) - (${polyToString(b)})`, explanation: 'Write both polynomials for subtraction' });
  steps.push({ expression: 'Distribute negative sign', explanation: 'Change all signs of the subtrahend' });
  const len = Math.max(a.length, b.length);
  const c = Array(len).fill(0);
  a.forEach((v, i) => (c[i] += v));
  b.forEach((v, i) => (c[i] -= v));
  const result = trimCoeffs(c);
  steps.push({ expression: polyToString(result), explanation: 'Simplified result' });
  return { coefficients: result, expression: polyToString(result), steps };
}

function polyMultiply(a, b) {
  const steps = [];
  steps.push({ expression: `(${polyToString(a)}) × (${polyToString(b)})`, explanation: 'Distribute each term of the first polynomial over the second' });
  const degA = degree(a), degB = degree(b);
  const c = Array(degA + degB + 1).fill(0);
  for (let i = 0; i <= degA; i++)
    for (let j = 0; j <= degB; j++)
      c[i + j] += a[i] * b[j];
  const result = trimCoeffs(c);
  steps.push({ expression: `Result degree = ${degA} + ${degB} = ${degA + degB}`, explanation: 'Multiply each term pair and add same-degree results' });
  steps.push({ expression: polyToString(result), explanation: 'Simplified product' });
  return { coefficients: result, expression: polyToString(result), steps };
}

function polyDivide(num, den) {
  const steps = [];
  if (isZero(den)) return { error: 'Division by zero polynomial' };
  steps.push({ expression: `(${polyToString(num)}) ÷ (${polyToString(den)})`, explanation: 'Polynomial long division' });

  let remainder = [...num];
  const quotient = [];
  const denDeg = degree(den);

  while (true) {
    const remDeg = degree(remainder);
    if (remDeg < denDeg || isZero(remainder)) break;
    const coef = remainder[remDeg] / den[denDeg];
    const expDiff = remDeg - denDeg;
    while (quotient.length <= expDiff) quotient.push(0);
    quotient[expDiff] = coef;
    steps.push({
      expression: `Divide: ${formatNum(remainder[remDeg])}x^${remDeg} ÷ ${formatNum(den[denDeg])}x^${denDeg} = ${formatNum(coef)}x^${expDiff}`,
      explanation: 'Divide leading terms to find next quotient term'
    });
    for (let i = 0; i <= denDeg; i++) remainder[i + expDiff] -= coef * (den[i] || 0);
    remainder = trimCoeffs(remainder);
  }

  const q = trimCoeffs(quotient.length ? quotient : [0]);
  const r = trimCoeffs(remainder);
  steps.push({ expression: `${polyToString(q)} remainder ${polyToString(r)}`, explanation: 'Final result' });
  return {
    quotient: q, remainder: r,
    quotientExpr: polyToString(q), remainderExpr: polyToString(r), steps
  };
}

function polyEvaluate(coeffs, x) {
  const steps = [];
  steps.push({ expression: `f(${formatNum(x)}) where f(x) = ${polyToString(coeffs)}`, explanation: 'Substitute x = ' + formatNum(x) });
  let result = 0, xpow = 1, parts = [];
  for (let i = 0; i < coeffs.length; i++) {
    if (Math.abs(coeffs[i]) > 1e-12) {
      parts.push(`${formatNum(coeffs[i])} × (${formatNum(x)})^${i}`);
    }
    result += coeffs[i] * xpow; xpow *= x;
  }
  steps.push({ expression: parts.join(' + '), explanation: 'Replace x with the value in each term' });
  steps.push({ expression: `f(${formatNum(x)}) = ${formatNum(result)}`, explanation: 'Final evaluated result' });
  return { value: result, expression: formatNum(result), steps };
}

function polyCompose(f, g) {
  const steps = [];
  steps.push({ expression: `f(g(x)) where f(x) = ${polyToString(f)}, g(x) = ${polyToString(g)}`, explanation: 'Substitute g(x) into f(x)' });
  let result = [0];
  let gPow = [1];
  for (let i = 0; i < f.length; i++) {
    if (Math.abs(f[i]) > 1e-12) {
      const term = polyMultiply(gPow, [f[i]]);
      result = polyAdd(result, term.coefficients).coefficients;
    }
    if (i + 1 < f.length) gPow = polyMultiply(gPow, g).coefficients;
  }
  result = trimCoeffs(result);
  steps.push({ expression: polyToString(result), explanation: 'Simplified composition f(g(x))' });
  return { coefficients: result, expression: polyToString(result), steps };
}

function polyCompare(a, b) {
  const ta = trimCoeffs(a), tb = trimCoeffs(b);
  if (ta.length !== tb.length) return { equal: false, expression: `${polyToString(a)} ≠ ${polyToString(b)}`, steps: [{ expression: 'Polynomials have different degrees', explanation: 'Not equal' }] };
  const equal = ta.every((v, i) => Math.abs(v - tb[i]) < 1e-9);
  return {
    equal,
    expression: equal ? `${polyToString(a)} = ${polyToString(b)}` : `${polyToString(a)} ≠ ${polyToString(b)}`,
    steps: [{ expression: equal ? 'Both polynomials are identical' : 'Polynomials differ', explanation: '' }]
  };
}

// ─── Calculus ────────────────────────────────────────────────────────────────

function differentiate(coeffs) {
  const steps = [];
  steps.push({ expression: 'f(x) = ' + polyToString(coeffs), explanation: 'Original polynomial' });
  steps.push({ expression: "Apply Power Rule: d/dx[axⁿ] = n·axⁿ⁻¹", explanation: 'Differentiate each term' });
  const deg = degree(coeffs);
  if (deg === 0) {
    steps.push({ expression: 'd/dx[constant] = 0', explanation: 'Derivative of a constant is 0' });
    return { coefficients: [0], expression: '0', steps };
  }
  const dc = [];
  for (let i = 1; i <= deg; i++) {
    dc.push(i * (coeffs[i] || 0));
    if (Math.abs(coeffs[i]) > 1e-12) {
      steps.push({
        expression: `d/dx[${formatNum(coeffs[i])}x^${i}] = ${formatNum(i)} × ${formatNum(coeffs[i])}x^${i - 1} = ${formatNum(i * coeffs[i])}${i - 1 > 0 ? 'x^' + (i - 1) : ''}`,
        explanation: 'Power rule: bring exponent down, reduce by 1'
      });
    }
  }
  const result = trimCoeffs(dc);
  steps.push({ expression: "f'(x) = " + polyToString(result), explanation: 'Final derivative' });
  return { coefficients: result, expression: polyToString(result), steps };
}

function integrate(coeffs) {
  const steps = [];
  steps.push({ expression: '∫ ' + polyToString(coeffs) + ' dx', explanation: 'Set up the integral' });
  steps.push({ expression: 'Apply Power Rule: ∫axⁿ dx = axⁿ⁺¹/(n+1) + C', explanation: 'Integrate each term' });
  const deg = degree(coeffs);
  const ic = [0];
  for (let i = 0; i <= deg; i++) {
    ic.push((coeffs[i] || 0) / (i + 1));
    if (Math.abs(coeffs[i]) > 1e-12) {
      steps.push({
        expression: `∫ ${formatNum(coeffs[i])}x^${i} dx = ${formatNum(coeffs[i])}/${i + 1} · x^${i + 1} = ${formatNum(coeffs[i] / (i + 1))}x^${i + 1}`,
        explanation: 'Increase exponent by 1, divide by new exponent'
      });
    }
  }
  const result = trimCoeffs(ic);
  const expr = polyToString(result) + ' + C';
  steps.push({ expression: '∫ f(x) dx = ' + expr, explanation: 'Final indefinite integral (C = constant of integration)' });
  return { coefficients: result, expression: expr, steps };
}

function definiteIntegral(coeffs, a, b) {
  const res = integrate(coeffs);
  const F = res.coefficients;
  const Fb = evalPoly(F, b), Fa = evalPoly(F, a);
  const value = Fb - Fa;
  res.steps.push({ expression: `F(x) = ${polyToString(F)}`, explanation: 'Antiderivative (without C)' });
  res.steps.push({ expression: `F(${formatNum(b)}) - F(${formatNum(a)}) = ${formatNum(Fb)} - (${formatNum(Fa)})`, explanation: 'Apply Fundamental Theorem of Calculus' });
  res.steps.push({ expression: `= ${formatNum(value)}`, explanation: 'Area under curve' });
  return { ...res, definiteValue: value, expression: formatNum(value), hasDefinite: true };
}

// ─── Root Finding ─────────────────────────────────────────────────────────────

function solveLinear(coeffs) {
  const b = coeffs[0], a = coeffs[1];
  const x = -b / a;
  return {
    roots: [{ real: x, imag: 0 }],
    steps: [
      { expression: `${polyToString(coeffs)} = 0`, explanation: 'Set equal to zero' },
      { expression: `${formatNum(a)}x = ${formatNum(-b)}`, explanation: 'Move constant to right' },
      { expression: `x = ${formatNum(-b)} / ${formatNum(a)} = ${formatNum(x)}`, explanation: 'Divide by coefficient' }
    ],
    newtonTable: []
  };
}

function solveQuadratic(coeffs) {
  const c = coeffs[0], b = coeffs[1], a = coeffs[2];
  const disc = b * b - 4 * a * c;
  const steps = [
    { expression: `${polyToString(coeffs)} = 0`, explanation: 'Set equal to zero' },
    { expression: 'Use Quadratic Formula: x = (-b ± √(b²-4ac)) / 2a', explanation: `a=${formatNum(a)}, b=${formatNum(b)}, c=${formatNum(c)}` },
    { expression: `Δ = b² - 4ac = ${formatNum(b)}² - 4(${formatNum(a)})(${formatNum(c)}) = ${formatNum(disc)}`, explanation: 'Compute discriminant' }
  ];
  const roots = [];
  if (disc > 1e-12) {
    const sq = Math.sqrt(disc);
    const x1 = (-b + sq) / (2 * a), x2 = (-b - sq) / (2 * a);
    roots.push({ real: x1, imag: 0 }, { real: x2, imag: 0 });
    steps.push({ expression: 'Δ > 0: Two distinct real roots', explanation: '' });
    steps.push({ expression: `x₁ = ${formatNum(x1)}, x₂ = ${formatNum(x2)}`, explanation: 'Real roots' });
  } else if (Math.abs(disc) < 1e-12) {
    const x = -b / (2 * a);
    roots.push({ real: x, imag: 0 });
    steps.push({ expression: 'Δ = 0: One repeated real root', explanation: '' });
    steps.push({ expression: `x = ${formatNum(x)}`, explanation: 'Repeated root' });
  } else {
    const sq = Math.sqrt(-disc);
    const re = -b / (2 * a), im = sq / (2 * a);
    roots.push({ real: re, imag: im }, { real: re, imag: -im });
    steps.push({ expression: 'Δ < 0: Two complex conjugate roots', explanation: '' });
    steps.push({ expression: `x = ${formatNum(re)} ± ${formatNum(im)}i`, explanation: 'Complex roots' });
  }
  return { roots, steps, newtonTable: [] };
}

function newtonRaphson(coeffs, x0 = 1.0, maxIter = 60) {
  const dc = differentiate(coeffs).coefficients;
  const steps = [
    { expression: 'Newton-Raphson: xₙ₊₁ = xₙ - f(xₙ)/f\'(xₙ)', explanation: 'Iterative root finding method' },
    { expression: 'f(x) = ' + polyToString(coeffs), explanation: '' },
    { expression: "f'(x) = " + polyToString(dc), explanation: '' },
    { expression: `Initial guess: x₀ = ${formatNum(x0)}`, explanation: '' }
  ];
  const newtonTable = [];
  let x = x0;
  const tol = 1e-10;
  for (let i = 0; i < maxIter; i++) {
    const fx = evalPoly(coeffs, x);
    const dfx = evalPoly(dc, x);
    newtonTable.push({ x, fx });
    if (Math.abs(dfx) < 1e-15) { steps.push({ expression: 'Derivative is zero, stopping', explanation: '' }); break; }
    const xNext = x - fx / dfx;
    steps.push({
      expression: `Iter ${i + 1}: x=${formatNum(x)}, f(x)=${formatNum(fx)}, f'(x)=${formatNum(dfx)} → x_new=${formatNum(xNext)}`,
      explanation: ''
    });
    if (Math.abs(xNext - x) < tol) { x = xNext; newtonTable.push({ x, fx: evalPoly(coeffs, x) }); break; }
    x = xNext;
  }
  steps.push({ expression: `Root ≈ ${formatNum(x)}`, explanation: 'Converged' });
  return { roots: [{ real: x, imag: 0 }], steps, newtonTable };
}

function solveRoots(coeffs) {
  const deg = degree(coeffs);
  if (deg === 0) return { error: 'Constant polynomial has no roots' };
  if (deg === 1) return solveLinear(coeffs);
  if (deg === 2) return solveQuadratic(coeffs);
  return newtonRaphson(coeffs, 1.0);
}

// ─── Matrix Operations ────────────────────────────────────────────────────────

function matAdd(a, b) {
  if (a.length !== b.length || a[0].length !== b[0].length) return { error: 'Matrix dimensions must match' };
  const steps = [{ expression: 'Matrix Addition: Aᵢⱼ + Bᵢⱼ', explanation: 'Add corresponding elements' }];
  const result = a.map((row, i) => row.map((v, j) => v + b[i][j]));
  steps.push({ expression: JSON.stringify(result), explanation: 'Result matrix' });
  return { matrix: result, steps };
}

function matMultiply(a, b) {
  if (a[0].length !== b.length) return { error: 'A columns must equal B rows' };
  const steps = [{ expression: 'Cᵢⱼ = Σ Aᵢₖ × Bₖⱼ', explanation: 'Dot product of rows with columns' }];
  const result = a.map((row, i) => b[0].map((_, j) => row.reduce((sum, _, k) => sum + a[i][k] * b[k][j], 0)));
  steps.push({ expression: JSON.stringify(result), explanation: 'Result matrix' });
  return { matrix: result, steps };
}

function det(m, n) {
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let d = 0;
  for (let f = 0; f < n; f++) {
    const sub = m.slice(1).map(row => row.filter((_, j) => j !== f));
    d += (f % 2 === 0 ? 1 : -1) * m[0][f] * det(sub, n - 1);
  }
  return d;
}

function matDeterminant(a) {
  if (a.length !== a[0].length) return { error: 'Determinant requires square matrix' };
  const d = det(a, a.length);
  return {
    matrix: a, determinant: d, hasDeterminant: true,
    steps: [{ expression: 'Cofactor expansion', explanation: '' }, { expression: `det(A) = ${formatNum(d)}`, explanation: 'Final determinant' }]
  };
}

function matInverse(a) {
  if (a.length !== a[0].length) return { error: 'Inverse requires square matrix' };
  const n = a.length;
  const d = det(a, n);
  if (Math.abs(d) < 1e-12) return { error: 'Matrix is singular, inverse does not exist' };
  const steps = [
    { expression: 'Gauss-Jordan: [A|I] → [I|A⁻¹]', explanation: '' },
    { expression: `det(A) = ${formatNum(d)} ≠ 0`, explanation: 'Inverse exists' }
  ];
  const aug = a.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let i = col + 1; i < n; i++) if (Math.abs(aug[i][col]) > Math.abs(aug[maxRow][col])) maxRow = i;
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
    for (let i = 0; i < n; i++) {
      if (i === col) continue;
      const factor = aug[i][col];
      for (let j = 0; j < 2 * n; j++) aug[i][j] -= factor * aug[col][j];
    }
  }
  const inv = aug.map(row => row.slice(n));
  steps.push({ expression: JSON.stringify(inv), explanation: 'A⁻¹ (Inverse Matrix)' });
  return { matrix: inv, determinant: d, hasDeterminant: true, steps };
}

function matGaussian(a) {
  const n = a.length;
  const m = a.map(row => [...row]);
  const steps = [{ expression: 'Gaussian Elimination with partial pivoting', explanation: '' }];
  for (let col = 0; col < Math.min(n, a[0].length); col++) {
    let maxRow = col;
    for (let i = col + 1; i < n; i++) if (Math.abs(m[i][col]) > Math.abs(m[maxRow][col])) maxRow = i;
    [m[col], m[maxRow]] = [m[maxRow], m[col]];
    if (Math.abs(m[col][col]) < 1e-12) continue;
    for (let i = col + 1; i < n; i++) {
      const factor = m[i][col] / m[col][col];
      for (let j = col; j < a[0].length; j++) m[i][j] -= factor * m[col][j];
      steps.push({ expression: `R${i+1} = R${i+1} - ${formatNum(factor)} × R${col+1}`, explanation: '' });
    }
  }
  steps.push({ expression: JSON.stringify(m), explanation: 'Row Echelon Form' });
  return { matrix: m, steps };
}

// ─── Polynomial Parser ─────────────────────────────────────────────────────

/**
 * Parse natural polynomial string like "3x^2 + 2x - 5" into coefficients array.
 * Returns [constant, x^1, x^2, ...]
 */
function parsePoly(str) {
  if (!str || str.trim() === '') throw new Error('Empty polynomial');
  // Normalize
  str = str.trim()
    .replace(/\s+/g, '')
    .replace(/[−–]/g, '-')
    .replace(/\*/g, '')
    .replace(/×/g, '')
    .toLowerCase();

  // Make sure leading term without sign has implicit +
  if (str[0] !== '-') str = '+' + str;

  // Match terms like: +3x^2, -x^3, +2.5x, -7, +x
  const termRe = /[+\-][^+\-]*/g;
  const terms = str.match(termRe) || [];
  const coeffMap = {};

  for (let raw of terms) {
    raw = raw.trim();
    if (!raw) continue;
    const sign = raw[0] === '-' ? -1 : 1;
    let body = raw.slice(1); // remove sign

    let coef = 0, exp = 0;

    if (body.includes('x')) {
      const xIdx = body.indexOf('x');
      const cStr = body.slice(0, xIdx);
      const rest  = body.slice(xIdx + 1); // after 'x'

      // Coefficient
      if (cStr === '' || cStr === '.') coef = sign * 1;
      else coef = sign * (parseFloat(cStr) || 0);

      // Exponent
      if (rest.startsWith('^')) {
        exp = parseInt(rest.slice(1));
        if (isNaN(exp)) exp = 1;
      } else {
        exp = 1; // just x
      }
    } else {
      coef = sign * (parseFloat(body) || 0);
      exp  = 0;
    }

    if (!isNaN(coef) && isFinite(coef)) {
      coeffMap[exp] = (coeffMap[exp] || 0) + coef;
    }
  }

  if (Object.keys(coeffMap).length === 0) throw new Error('Could not parse polynomial: ' + str);

  const maxDeg = Math.max(0, ...Object.keys(coeffMap).map(Number));
  const coeffs = Array(maxDeg + 1).fill(0);
  for (const [e, c] of Object.entries(coeffMap)) coeffs[Number(e)] = c;
  return trimCoeffs(coeffs);
}


module.exports = {
  // Polynomial ops
  polyAdd, polySubtract, polyMultiply, polyDivide, polyEvaluate, polyCompose, polyCompare,
  // Calculus
  differentiate, integrate, definiteIntegral,
  // Roots
  solveRoots, newtonRaphson, solveLinear, solveQuadratic,
  // Matrix
  matAdd, matMultiply, matDeterminant, matInverse, matGaussian,
  // Utils
  parsePoly, polyToString, evalPoly, formatNum, trimCoeffs, degree
};
