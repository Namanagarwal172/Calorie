const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORT = 4188;
const BASE = `http://127.0.0.1:${PORT}`;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-ai-test-'));
const dbPath = path.join(tmpDir, 'db.json');
let serverProc;

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('Server did not start in time');
}

test.before(async () => {
  serverProc = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: String(PORT), DB_FILE: dbPath },
    stdio: 'ignore',
    cwd: path.resolve(__dirname, '..'),
  });
  await waitForServer();
});

test.after(() => {
  if (serverProc) serverProc.kill('SIGTERM');
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('GET /api/profile returns seeded profile', async () => {
  const res = await fetch(`${BASE}/api/profile`);
  assert.equal(res.status, 200);
  const profile = await res.json();
  assert.equal(profile.city, 'Bengaluru');
  assert.equal(profile.budgetInr, 300);
});

test('POST /api/profile updates profile', async () => {
  const res = await fetch(`${BASE}/api/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Priya', city: 'Delhi', budgetInr: 500 }),
  });
  assert.equal(res.status, 200);
  const profile = await res.json();
  assert.equal(profile.name, 'Priya');
  assert.equal(profile.city, 'Delhi');
  assert.equal(profile.budgetInr, 500);
});

test('scan + add meal updates dashboard totals', async () => {
  const scanRes = await fetch(`${BASE}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: 'paneer dinner' }),
  });
  const scan = await scanRes.json();
  assert.equal(scan.name, 'Paneer Roti Combo');

  const mealAdd = await fetch(`${BASE}/api/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...scan, mealType: 'Dinner', source: 'AI Vision' }),
  });
  assert.equal(mealAdd.status, 201);

  const dashboardRes = await fetch(`${BASE}/api/dashboard`);
  const dashboard = await dashboardRes.json();
  assert.equal(dashboard.totals.count, 1);
  assert.equal(dashboard.totals.calories, 610);
});

test('barcode add and water add endpoints work', async () => {
  const barcodeRes = await fetch(`${BASE}/api/barcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: '890123' }),
  });
  assert.equal(barcodeRes.status, 201);

  const waterRes = await fetch(`${BASE}/api/water/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 500 }),
  });
  const water = await waterRes.json();
  assert.equal(water.waterMl, 500);

  const mealsRes = await fetch(`${BASE}/api/meals`);
  const meals = await mealsRes.json();
  assert.ok(meals.length >= 2);
});


test('invalid JSON payload returns 400', async () => {
  const res = await fetch(`${BASE}/api/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad json',
  });
  assert.equal(res.status, 400);
  const payload = await res.json();
  assert.equal(payload.error, 'Invalid JSON payload');
});

test('invalid meal payload is rejected with 400', async () => {
  const res = await fetch(`${BASE}/api/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '', calories: -10, protein: 1, carbs: 1, fat: 1 }),
  });
  assert.equal(res.status, 400);
  const payload = await res.json();
  assert.ok(payload.error.includes('required') || payload.error.includes('non-negative'));
});

test('invalid water amount is rejected with 400', async () => {
  const res = await fetch(`${BASE}/api/water/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 0 }),
  });
  assert.equal(res.status, 400);
  const payload = await res.json();
  assert.equal(payload.error, 'amount must be a positive number');
});
