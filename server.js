const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'db.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const barcodeDb = {
  '890123': { name: 'Amul Protein Lassi', calories: 180, protein: 15, carbs: 16, fat: 5, mealType: 'Snack' },
  '901234': { name: 'Britannia NutriChoice', calories: 140, protein: 3, carbs: 20, fat: 5, mealType: 'Snack' },
  '012345': { name: 'MTR Ready Poha', calories: 320, protein: 8, carbs: 52, fat: 9, mealType: 'Breakfast' },
};

function seedDb() {
  return {
    profile: {
      name: 'Guest',
      city: 'Bengaluru',
      calorieTarget: 2200,
      proteinGoal: 120,
      carbGoal: 260,
      fatGoal: 70,
      budgetInr: 300,
    },
    meals: [],
    waterByDate: {},
  };
}

function ensureDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(seedDb(), null, 2));
}

function dbRead() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function dbWrite(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function send(res, status, payload, headers = {}) {
  let body = payload;
  if (!Buffer.isBuffer(payload) && typeof payload !== 'string') body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': headers['Content-Type'] || 'application/json; charset=utf-8', ...headers });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function dateKey(iso = new Date().toISOString()) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDate(iso, key) {
  return dateKey(iso) === key;
}

function totalsForDate(db, key = dateKey()) {
  const todayMeals = db.meals.filter((m) => isSameDate(m.date, key));
  return todayMeals.reduce(
    (acc, m) => {
      acc.calories += Number(m.calories || 0);
      acc.protein += Number(m.protein || 0);
      acc.carbs += Number(m.carbs || 0);
      acc.fat += Number(m.fat || 0);
      acc.count += 1;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }
  );
}

function estimateFromText(text = '') {
  const t = text.toLowerCase();
  const rules = [
    ['dal', { name: 'Dal-Chawal Plate', calories: 520, protein: 18, carbs: 78, fat: 14 }],
    ['paneer', { name: 'Paneer Roti Combo', calories: 610, protein: 28, carbs: 46, fat: 30 }],
    ['idli', { name: 'Idli Sambar', calories: 340, protein: 12, carbs: 56, fat: 6 }],
    ['dosa', { name: 'Masala Dosa', calories: 480, protein: 10, carbs: 62, fat: 20 }],
    ['biryani', { name: 'Chicken Biryani', calories: 720, protein: 30, carbs: 75, fat: 32 }],
    ['poha', { name: 'Kanda Poha', calories: 330, protein: 8, carbs: 52, fat: 10 }],
  ];
  const hit = rules.find(([k]) => t.includes(k));
  return hit ? hit[1] : { name: 'Mixed Indian Thali', calories: 640, protein: 22, carbs: 80, fat: 24 };
}

function buildInsights(db, totals) {
  const p = db.profile;
  const water = db.waterByDate[dateKey()] || 0;
  const messages = [];
  const kcalPct = Math.round((totals.calories / p.calorieTarget) * 100 || 0);
  messages.push(`Aapne aaj ${kcalPct}% calorie target complete kiya.`);
  if (totals.protein < p.proteinGoal) {
    messages.push(`Protein ${p.proteinGoal - totals.protein}g kam hai. Add: paneer, curd, egg ya sprouts.`);
  } else {
    messages.push('Protein goal achieved. Bahut badhiya!');
  }
  if (water < 2500) messages.push(`Hydration reminder: ${2500 - water}ml paani aur piyen.`);
  const budgetPerMeal = Math.round((p.budgetInr || 300) / 3);
  messages.push(`Smart budget tip: har meal ~₹${budgetPerMeal} ke andar rakhein for sustainable diet.`);
  return messages;
}


function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function validateMealInput(body) {
  if (!body || typeof body !== 'object') return 'Invalid meal payload';
  const calories = toNumber(body.calories, NaN);
  const protein = toNumber(body.protein, NaN);
  const carbs = toNumber(body.carbs, NaN);
  const fat = toNumber(body.fat, NaN);
  if (!body.name || String(body.name).trim().length < 2) return 'Meal name is required';
  if (!Number.isFinite(calories) || calories < 0) return 'Calories must be a non-negative number';
  if (!Number.isFinite(protein) || protein < 0) return 'Protein must be a non-negative number';
  if (!Number.isFinite(carbs) || carbs < 0) return 'Carbs must be a non-negative number';
  if (!Number.isFinite(fat) || fat < 0) return 'Fat must be a non-negative number';
  return null;
}

function validateProfileInput(body) {
  if (!body || typeof body !== 'object') return 'Invalid profile payload';
  const checks = [
    ['calorieTarget', 1000],
    ['proteinGoal', 0],
    ['carbGoal', 0],
    ['fatGoal', 0],
    ['budgetInr', 0],
  ];
  for (const [field, min] of checks) {
    if (body[field] === undefined) continue;
    const n = toNumber(body[field], NaN);
    if (!Number.isFinite(n) || n < min) return `${field} must be >= ${min}`;
  }
  return null;
}
function normalizeMeal(body) {
  return {
    id: randomUUID(),
    date: new Date().toISOString(),
    name: String(body.name || 'Untitled Meal'),
    calories: toNumber(body.calories, 0),
    protein: toNumber(body.protein, 0),
    carbs: toNumber(body.carbs, 0),
    fat: toNumber(body.fat, 0),
    mealType: String(body.mealType || 'Meal'),
    source: String(body.source || 'Manual'),
  };
}

function serveStatic(res, pathname) {
  const filePath = pathname === '/' ? path.join(ROOT, 'index.html') : path.join(ROOT, pathname);
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain' });
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain' });
    send(res, 200, data, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
  });
}

function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    try {
      if (pathname === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true });

      if (pathname === '/api/profile' && req.method === 'GET') return send(res, 200, dbRead().profile);

      if (pathname === '/api/profile' && req.method === 'POST') {
        const body = await parseBody(req);
        const error = validateProfileInput(body);
        if (error) return send(res, 400, { error });
        const db = dbRead();
        db.profile = { ...db.profile, ...body };
        dbWrite(db);
        return send(res, 200, db.profile);
      }

      if (pathname === '/api/meals' && req.method === 'GET') {
        const db = dbRead();
        const key = url.searchParams.get('date') || dateKey();
        return send(res, 200, db.meals.filter((m) => isSameDate(m.date, key)));
      }

      if (pathname === '/api/meals' && req.method === 'POST') {
        const body = await parseBody(req);
        const error = validateMealInput(body);
        if (error) return send(res, 400, { error });
        const db = dbRead();
        const meal = normalizeMeal(body);
        db.meals.unshift(meal);
        dbWrite(db);
        return send(res, 201, meal);
      }

      if (pathname.startsWith('/api/meals/') && req.method === 'DELETE') {
        const id = pathname.split('/').pop();
        const db = dbRead();
        db.meals = db.meals.filter((m) => m.id !== id);
        dbWrite(db);
        return send(res, 200, { ok: true });
      }

      if (pathname === '/api/barcode' && req.method === 'POST') {
        const body = await parseBody(req);
        const item = barcodeDb[String(body.code || '').trim()];
        if (!item) return send(res, 404, { error: 'Barcode not found' });
        const db = dbRead();
        const meal = normalizeMeal({ ...item, source: 'Barcode' });
        db.meals.unshift(meal);
        dbWrite(db);
        return send(res, 201, meal);
      }

      if (pathname === '/api/scan' && req.method === 'POST') {
        const body = await parseBody(req);
        return send(res, 200, estimateFromText(`${body.fileName || ''} ${body.note || ''}`));
      }

      if (pathname === '/api/water/add' && req.method === 'POST') {
        const body = await parseBody(req);
        const amount = toNumber(body.amount ?? 250, NaN);
        if (!Number.isFinite(amount) || amount <= 0) return send(res, 400, { error: 'amount must be a positive number' });
        const db = dbRead();
        const key = dateKey();
        db.waterByDate[key] = (db.waterByDate[key] || 0) + amount;
        dbWrite(db);
        return send(res, 200, { date: key, waterMl: db.waterByDate[key] });
      }

      if (pathname === '/api/dashboard' && req.method === 'GET') {
        const db = dbRead();
        const totals = totalsForDate(db);
        const waterMl = db.waterByDate[dateKey()] || 0;
        return send(res, 200, { profile: db.profile, totals, waterMl, insights: buildInsights(db, totals) });
      }

      if (pathname.startsWith('/api/')) return send(res, 404, { error: 'Not found' });
      return serveStatic(res, pathname);
    } catch (error) {
      if (error instanceof SyntaxError) return send(res, 400, { error: 'Invalid JSON payload' });
      return send(res, 500, { error: 'Server error', detail: error.message });
    }
  });
}

function startServer() {
  ensureDb();
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`Health AI server running on http://localhost:${PORT}`);
  });
  return server;
}

if (require.main === module) startServer();

module.exports = { createServer, startServer, estimateFromText, totalsForDate, buildInsights, dateKey };
