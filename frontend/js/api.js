/* ══════════════════════════════════════════════════════════
   API CLIENT — Communicates with Express backend
══════════════════════════════════════════════════════════ */
const API = (() => {
  const BASE = window.location.origin + '/api';

  function getToken() {
    return localStorage.getItem('poly_token') || '';
  }

  async function request(method, path, body = null) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
      }
    };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(BASE + path, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (e) {
      throw e;
    }
  }

  // ── Auth ──────────────────────────────────────────────
  const auth = {
    login:    (email, password) => request('POST', '/auth/login', { email, password }),
    register: (username, email, password) => request('POST', '/auth/register', { username, email, password }),
    profile:  () => request('GET', '/auth/profile')
  };

  // ── Polynomial ────────────────────────────────────────
  const polynomial = {
    add:      (p1, p2) => request('POST', '/polynomial/add',      { p1, p2 }),
    subtract: (p1, p2) => request('POST', '/polynomial/subtract', { p1, p2 }),
    multiply: (p1, p2) => request('POST', '/polynomial/multiply', { p1, p2 }),
    divide:   (p1, p2) => request('POST', '/polynomial/divide',   { p1, p2 }),
    evaluate: (polynomial, x) => request('POST', '/polynomial/evaluate', { polynomial, x }),
    compose:  (f, g)   => request('POST', '/polynomial/compose',  { f, g }),
    compare:  (p1, p2) => request('POST', '/polynomial/compare',  { p1, p2 }),
    simplify: (polynomial) => request('POST', '/polynomial/simplify', { polynomial })
  };

  // ── Calculus ──────────────────────────────────────────
  const calculus = {
    differentiate:    (polynomial)    => request('POST', '/calculus/differentiate',     { polynomial }),
    integrate:        (polynomial)    => request('POST', '/calculus/integrate',         { polynomial }),
    definiteIntegral: (polynomial, a, b) => request('POST', '/calculus/definite-integral', { polynomial, a, b })
  };

  // ── Roots ─────────────────────────────────────────────
  const roots = {
    solve:         (polynomial)           => request('POST', '/roots/solve',          { polynomial }),
    newtonRaphson: (polynomial, initial)  => request('POST', '/roots/newton-raphson', { polynomial, initial })
  };

  // ── Graph ─────────────────────────────────────────────
  const graph = {
    data: (polynomial, xMin, xMax, points, showDerivative, showIntegral) =>
      request('POST', '/graph/data', { polynomial, xMin, xMax, points, showDerivative, showIntegral })
  };

  // ── Matrix ────────────────────────────────────────────
  const matrix = {
    add:       (a, b)    => request('POST', '/matrix/add',       { a, b }),
    multiply:  (a, b)    => request('POST', '/matrix/multiply',  { a, b }),
    det:       (matrix)  => request('POST', '/matrix/determinant', { matrix }),
    inverse:   (matrix)  => request('POST', '/matrix/inverse',   { matrix }),
    gaussian:  (matrix)  => request('POST', '/matrix/gaussian',  { matrix })
  };

  // ── History ───────────────────────────────────────────
  const history = {
    list:       () => request('GET', '/history'),
    bookmark:   (calc_id, note) => request('POST', '/history/bookmark', { calc_id, note }),
    bookmarks:  () => request('GET', '/history/bookmarks'),
    delete:     (id) => request('DELETE', `/history/${id}`),
    exportJSON: () => fetch(BASE + '/history/export?format=json', { headers: { Authorization: `Bearer ${getToken()}` } }),
    exportCSV:  () => fetch(BASE + '/history/export?format=csv',  { headers: { Authorization: `Bearer ${getToken()}` } })
  };

  // ── Dashboard ─────────────────────────────────────────
  const dashboard = {
    stats: () => request('GET', '/dashboard/stats')
  };

  return { auth, polynomial, calculus, roots, graph, matrix, history, dashboard };
})();
