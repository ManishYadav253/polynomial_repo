const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');

const app       = express();
const PORT      = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'poly-calc-secret-2024';
const DB_PATH   = process.env.VERCEL ? '/tmp/db.json' : path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── Pure-JS JSON Database ────────────────────────────────────────────────────
const DB = (() => {
  function load() {
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
    catch { return { users: [], calculations: [], bookmarks: [], nextId: 1 }; }
  }
  function save(data) {
    try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); } catch {}
  }
  function nextId(data) {
    const id = data.nextId || 1;
    data.nextId = id + 1;
    return id;
  }
  return { load, save, nextId };
})();

console.log('✅ Pure-JS JSON database ready at', DB_PATH);

// ─── Math Engine ──────────────────────────────────────────────────────────────
const math = require('./math-engine');

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) { req.user = null; return next(); }
  try { req.user = jwt.verify(header.slice(7), JWT_SECRET); }
  catch { req.user = null; }
  next();
}
app.use(authMiddleware);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

function saveCalc(userId, operation, input, result) {
  if (!userId) return null;
  const data = DB.load();
  const id   = DB.nextId(data);
  data.calculations.push({
    id, user_id: userId, operation,
    input: JSON.stringify(input),
    result: JSON.stringify(result),
    created_at: new Date().toISOString()
  });
  DB.save(data);
  return id;
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const data = DB.load();
    if (data.users.find(u => u.email === email || u.username === username))
      return res.status(409).json({ error: 'Username or email already exists' });
    const hash = await bcrypt.hash(password, 10);
    const id   = DB.nextId(data);
    const user = { id, username, email, password: hash, created_at: new Date().toISOString() };
    data.users.push(user);
    DB.save(data);
    const token = jwt.sign({ id, username, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, username, email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = DB.load();
    const user = data.users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/profile', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: req.user });
});

// ─── Polynomial Routes ────────────────────────────────────────────────────────
app.post('/api/polynomial/add', (req, res) => {
  try {
    const { p1, p2 } = req.body;
    const result = math.polyAdd(math.parsePoly(p1), math.parsePoly(p2));
    saveCalc(req.user?.id, 'polynomial_add', { p1, p2 }, result);
    res.json({ success: true, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/polynomial/subtract', (req, res) => {
  try {
    const { p1, p2 } = req.body;
    const result = math.polySubtract(math.parsePoly(p1), math.parsePoly(p2));
    saveCalc(req.user?.id, 'polynomial_subtract', { p1, p2 }, result);
    res.json({ success: true, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/polynomial/multiply', (req, res) => {
  try {
    const { p1, p2 } = req.body;
    const result = math.polyMultiply(math.parsePoly(p1), math.parsePoly(p2));
    saveCalc(req.user?.id, 'polynomial_multiply', { p1, p2 }, result);
    res.json({ success: true, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/polynomial/divide', (req, res) => {
  try {
    const { p1, p2 } = req.body;
    const result = math.polyDivide(math.parsePoly(p1), math.parsePoly(p2));
    if (result.error) return res.status(400).json({ error: result.error });
    saveCalc(req.user?.id, 'polynomial_divide', { p1, p2 }, result);
    res.json({ success: true, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/polynomial/evaluate', (req, res) => {
  try {
    const { polynomial, x } = req.body;
    const result = math.polyEvaluate(math.parsePoly(polynomial), parseFloat(x));
    saveCalc(req.user?.id, 'polynomial_evaluate', { polynomial, x }, result);
    res.json({ success: true, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/polynomial/compose', (req, res) => {
  try {
    const { f, g } = req.body;
    const result = math.polyCompose(math.parsePoly(f), math.parsePoly(g));
    saveCalc(req.user?.id, 'polynomial_compose', { f, g }, result);
    res.json({ success: true, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/polynomial/compare', (req, res) => {
  try {
    const { p1, p2 } = req.body;
    const result = math.polyCompare(math.parsePoly(p1), math.parsePoly(p2));
    res.json({ success: true, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/polynomial/simplify', (req, res) => {
  try {
    const { polynomial } = req.body;
    const coeffs = math.parsePoly(polynomial);
    const expr   = math.polyToString(coeffs);
    res.json({ success: true, coefficients: coeffs, expression: expr, steps: [
      { expression: polynomial, explanation: 'Original input' },
      { expression: expr, explanation: 'Collected and simplified like terms' }
    ]});
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Calculus Routes ──────────────────────────────────────────────────────────
app.post('/api/calculus/differentiate', (req, res) => {
  try {
    const { polynomial } = req.body;
    const result = math.differentiate(math.parsePoly(polynomial));
    saveCalc(req.user?.id, 'differentiate', { polynomial }, result);
    res.json({ success: true, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/calculus/integrate', (req, res) => {
  try {
    const { polynomial } = req.body;
    const result = math.integrate(math.parsePoly(polynomial));
    saveCalc(req.user?.id, 'integrate', { polynomial }, result);
    res.json({ success: true, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/calculus/definite-integral', (req, res) => {
  try {
    const { polynomial, a, b } = req.body;
    const result = math.definiteIntegral(math.parsePoly(polynomial), parseFloat(a), parseFloat(b));
    saveCalc(req.user?.id, 'definite_integral', { polynomial, a, b }, result);
    res.json({ success: true, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Roots Routes ─────────────────────────────────────────────────────────────
app.post('/api/roots/solve', (req, res) => {
  try {
    const { polynomial } = req.body;
    const result = math.solveRoots(math.parsePoly(polynomial));
    if (result.error) return res.status(400).json({ error: result.error });
    saveCalc(req.user?.id, 'solve_roots', { polynomial }, result);
    res.json({ success: true, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/roots/newton-raphson', (req, res) => {
  try {
    const { polynomial, initial = 1.0 } = req.body;
    const result = math.newtonRaphson(math.parsePoly(polynomial), parseFloat(initial));
    saveCalc(req.user?.id, 'newton_raphson', { polynomial, initial }, result);
    res.json({ success: true, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Graph Route ──────────────────────────────────────────────────────────────
app.post('/api/graph/data', (req, res) => {
  try {
    const { polynomial, xMin = -10, xMax = 10, points = 200, showDerivative = true, showIntegral = true } = req.body;
    const coeffs  = math.parsePoly(polynomial);
    const dCoeffs = math.differentiate(coeffs).coefficients;
    const iCoeffs = math.integrate(coeffs).coefficients;

    const step = (xMax - xMin) / points;
    const fData = [], dfData = [], ifData = [];

    for (let i = 0; i <= points; i++) {
      const x = xMin + i * step;
      const xR = parseFloat(x.toFixed(3));
      fData.push({ x: xR, y: parseFloat(math.evalPoly(coeffs, x).toFixed(6)) });
      if (showDerivative) dfData.push({ x: xR, y: parseFloat(math.evalPoly(dCoeffs, x).toFixed(6)) });
      if (showIntegral)   ifData.push({ x: xR, y: parseFloat(math.evalPoly(iCoeffs, x).toFixed(6)) });
    }

    res.json({
      success: true,
      datasets: [
        { label: `f(x) = ${math.polyToString(coeffs)}`,                  data: fData,  color: '#6366f1' },
        ...(showDerivative ? [{ label: `f'(x) = ${math.polyToString(dCoeffs)}`, data: dfData, color: '#f59e0b' }] : []),
        ...(showIntegral   ? [{ label: `F(x) = ${math.polyToString(iCoeffs)} + C`, data: ifData, color: '#10b981' }] : [])
      ]
    });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Matrix Routes ────────────────────────────────────────────────────────────
app.post('/api/matrix/add',         (req, res) => { try { const r = math.matAdd(req.body.a, req.body.b);       if (r.error) return res.status(400).json({ error: r.error }); res.json({ success: true, ...r }); } catch(e) { res.status(400).json({ error: e.message }); } });
app.post('/api/matrix/multiply',    (req, res) => { try { const r = math.matMultiply(req.body.a, req.body.b);  if (r.error) return res.status(400).json({ error: r.error }); res.json({ success: true, ...r }); } catch(e) { res.status(400).json({ error: e.message }); } });
app.post('/api/matrix/determinant', (req, res) => { try { const r = math.matDeterminant(req.body.matrix);     if (r.error) return res.status(400).json({ error: r.error }); res.json({ success: true, ...r }); } catch(e) { res.status(400).json({ error: e.message }); } });
app.post('/api/matrix/inverse',     (req, res) => { try { const r = math.matInverse(req.body.matrix);         if (r.error) return res.status(400).json({ error: r.error }); res.json({ success: true, ...r }); } catch(e) { res.status(400).json({ error: e.message }); } });
app.post('/api/matrix/gaussian',    (req, res) => { try { const r = math.matGaussian(req.body.matrix);        res.json({ success: true, ...r }); } catch(e) { res.status(400).json({ error: e.message }); } });

// ─── History Routes ───────────────────────────────────────────────────────────
app.get('/api/history', (req, res) => {
  if (!req.user) return res.json({ calculations: [] });
  const data = DB.load();
  const calcs = data.calculations
    .filter(c => c.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50)
    .map(c => ({ ...c, input: JSON.parse(c.input || '{}'), result: JSON.parse(c.result || '{}') }));
  res.json({ calculations: calcs });
});

app.post('/api/history/bookmark', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Auth required' });
  const data = DB.load();
  const id   = DB.nextId(data);
  data.bookmarks.push({ id, user_id: req.user.id, calc_id: req.body.calc_id, note: req.body.note || '', created_at: new Date().toISOString() });
  DB.save(data);
  res.json({ success: true });
});

app.get('/api/history/bookmarks', (req, res) => {
  if (!req.user) return res.json({ bookmarks: [] });
  const data  = DB.load();
  const marks = data.bookmarks.filter(b => b.user_id === req.user.id);
  const enriched = marks.map(b => {
    const calc = data.calculations.find(c => c.id === b.calc_id);
    if (!calc) return null;
    return { ...b, ...calc, input: JSON.parse(calc.input || '{}'), result: JSON.parse(calc.result || '{}') };
  }).filter(Boolean);
  res.json({ bookmarks: enriched });
});

app.delete('/api/history/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Auth required' });
  const data = DB.load();
  data.calculations = data.calculations.filter(c => !(c.id == req.params.id && c.user_id === req.user.id));
  DB.save(data);
  res.json({ success: true });
});

app.get('/api/history/export', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Auth required' });
  const data  = DB.load();
  const calcs = data.calculations.filter(c => c.user_id === req.user.id);
  if (req.query.format === 'csv') {
    const csv = ['id,operation,input,result,created_at',
      ...calcs.map(c => `${c.id},"${c.operation}","${c.input.replace(/"/g,'""')}","${c.result.replace(/"/g,'""')}",${c.created_at}`)
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=calculations.csv');
    return res.send(csv);
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=calculations.json');
  res.send(JSON.stringify(calcs, null, 2));
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
app.get('/api/dashboard/stats', (req, res) => {
  if (!req.user) return res.json({ stats: { totalCalculations: 0, topOperations: [], recentCalculations: [] } });
  const data  = DB.load();
  const calcs = data.calculations.filter(c => c.user_id === req.user.id);
  const opCount = {};
  calcs.forEach(c => { opCount[c.operation] = (opCount[c.operation] || 0) + 1; });
  const topOps = Object.entries(opCount).map(([operation, count]) => ({ operation, count })).sort((a,b) => b.count - a.count).slice(0,5);
  const recent = calcs.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,5)
    .map(c => ({ ...c, input: JSON.parse(c.input || '{}'), result: JSON.parse(c.result || '{}') }));
  res.json({ stats: { totalCalculations: calcs.length, topOperations: topOps, recentCalculations: recent } });
});

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Polynomial Calculator & Calculus Toolkit`);
    console.log(`   ➜  http://localhost:${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api\n`);
  });
}
module.exports = app;
