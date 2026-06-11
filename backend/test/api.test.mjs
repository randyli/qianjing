import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test, before, after } from 'node:test';

const port = 4100 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
let server;
let token;

function insertStockSearchFixtures() {
  const db = new DatabaseSync('backend/data/test.sqlite');
  const now = new Date().toISOString();
  const statement = db.prepare(`
    INSERT INTO stock_search_index (ts_code, symbol, name, market, list_date, pinyin_full, pinyin_initials, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(ts_code) DO UPDATE SET
      symbol = excluded.symbol,
      name = excluded.name,
      market = excluded.market,
      list_date = excluded.list_date,
      pinyin_full = excluded.pinyin_full,
      pinyin_initials = excluded.pinyin_initials,
      updated_at = excluded.updated_at
  `);
  statement.run('600519.SH', '600519', '贵州茅台', '主板', '20010827', 'guizhoumaotai', 'gzmt', now);
  statement.run('000001.SZ', '000001', '平安银行', '主板', '19910403', 'pinganyinhang', 'payh', now);
  db.close();
}

async function waitForHealth() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('API server did not become healthy');
}

before(async () => {
  rmSync('backend/data/test.sqlite', { force: true });
  server = spawn('./node_modules/.bin/tsx', ['backend/src/server.ts'], {
    env: { ...process.env, API_PORT: String(port), API_HOST: '127.0.0.1', DATABASE_URL: 'backend/data/test.sqlite', JWT_SECRET: 'test-secret' },
    stdio: 'pipe',
  });
  await waitForHealth();
  insertStockSearchFixtures();
  const login = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'demo@example.com', password: 'password' }),
  });
  assert.equal(login.status, 200);
  token = (await login.json()).token;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve) => {
    server.once('exit', resolve);
    server.kill('SIGTERM');
    setTimeout(() => server.kill('SIGKILL'), 1000).unref();
  });
});

test('health endpoint responds', async () => {
  const response = await fetch(`${base}/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test('reports list, detail, and valuation endpoints return seeded data', async () => {
  const list = await fetch(`${base}/api/v1/reports?q=AI`);
  assert.equal(list.status, 200);
  const listJson = await list.json();
  assert.ok(listJson.data.length > 0);

  const id = listJson.data[0].id;
  const detail = await fetch(`${base}/api/v1/reports/${id}`);
  assert.equal(detail.status, 200);
  assert.equal((await detail.json()).data.id, id);

  const valuation = await fetch(`${base}/api/v1/reports/${id}/valuation`);
  assert.equal(valuation.status, 200);
  assert.ok(Array.isArray((await valuation.json()).data));
});

test('alerts CRUD is scoped behind JWT auth', async () => {
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const create = await fetch(`${base}/api/v1/alerts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ targetKey: '测试板块', threshold: 55, direction: 'below', enabled: true }),
  });
  assert.equal(create.status, 201);
  const alert = (await create.json()).data;

  const update = await fetch(`${base}/api/v1/alerts/${alert.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ enabled: false, threshold: 45 }),
  });
  assert.equal(update.status, 200);
  assert.equal((await update.json()).data.enabled, false);

  const list = await fetch(`${base}/api/v1/alerts`, { headers });
  assert.equal(list.status, 200);
  assert.ok((await list.json()).data.some((item) => item.id === alert.id));

  const remove = await fetch(`${base}/api/v1/alerts/${alert.id}`, { method: 'DELETE', headers });
  assert.equal(remove.status, 204);
});


test('health, registration, me, reports filters, and sentiment series match API plan', async () => {
  const health = await fetch(`${base}/api/v1/health`);
  assert.equal(health.status, 200);

  const email = `new-${Date.now()}@example.com`;
  const register = await fetch(`${base}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', displayName: '新用户' }),
  });
  assert.equal(register.status, 201);
  const registeredToken = (await register.json()).token;

  const me = await fetch(`${base}/api/v1/me`, { headers: { authorization: `Bearer ${registeredToken}` } });
  assert.equal(me.status, 200);
  const meJson = await me.json();
  assert.equal(meJson.user.email, email);
  assert.equal(meJson.settings.notificationEmail, email);

  const headers = { authorization: `Bearer ${registeredToken}`, 'content-type': 'application/json' };
  const profile = await fetch(`${base}/api/v1/me`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ displayName: '更新后的用户' }),
  });
  assert.equal(profile.status, 200);
  assert.equal((await profile.json()).user.displayName, '更新后的用户');

  const invalidProfile = await fetch(`${base}/api/v1/me`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ displayName: '' }),
  });
  assert.equal(invalidProfile.status, 400);

  const updatedMe = await fetch(`${base}/api/v1/me`, { headers });
  assert.equal(updatedMe.status, 200);
  assert.equal((await updatedMe.json()).user.displayName, '更新后的用户');

  const filtered = await fetch(`${base}/api/v1/reports?premium=false&page=1&pageSize=5`);
  assert.equal(filtered.status, 200);
  const filteredJson = await filtered.json();
  assert.ok(filteredJson.data.every((report) => report.isPremium === false));
  assert.equal(filteredJson.meta.page, 1);

  const series = await fetch(`${base}/api/v1/sentiment/series?limit=3`);
  assert.equal(series.status, 200);
  assert.ok((await series.json()).data.length <= 3);
});

test('jobs can be created, fetched, listed, and run', async () => {
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const create = await fetch(`${base}/api/v1/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'generate_report', input: { ticker: 'TEST' } }),
  });
  assert.equal(create.status, 201);
  const job = (await create.json()).data;
  assert.equal(job.status, 'pending');

  const detail = await fetch(`${base}/api/v1/jobs/${job.id}`, { headers });
  assert.equal(detail.status, 200);
  assert.equal((await detail.json()).data.id, job.id);

  const run = await fetch(`${base}/api/v1/jobs/${job.id}/run`, { method: 'POST', headers });
  assert.equal(run.status, 200);
  const runJson = await run.json();
  assert.equal(runJson.data.status, 'succeeded');
  assert.equal(runJson.data.result.accepted, true);

  const list = await fetch(`${base}/api/v1/jobs?status=succeeded`, { headers });
  assert.equal(list.status, 200);
  assert.ok((await list.json()).data.some((item) => item.id === job.id));
});

test('stock search supports symbol, pinyin, initials, name, and priority dedupe', async () => {
  const cases = [
    ['600', 'symbol_prefix'],
    ['600519.s', 'ts_code_prefix'],
    ['guizhou', 'pinyin_prefix'],
    ['gzmt', 'initials_prefix'],
    ['茅台', 'name_contains'],
  ];

  for (const [query, matchType] of cases) {
    const response = await fetch(`${base}/api/v1/market/stocks?q=${encodeURIComponent(query)}&limit=10`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.data[0].tsCode, '600519.SH');
    assert.equal(payload.data[0].matchType, matchType);
  }

  const duplicate = await fetch(`${base}/api/v1/market/stocks?q=600519&limit=10`);
  assert.equal(duplicate.status, 200);
  const duplicateJson = await duplicate.json();
  assert.equal(duplicateJson.data.filter((item) => item.tsCode === '600519.SH').length, 1);
  assert.equal(duplicateJson.data[0].matchType, 'symbol_prefix');
});

test('sentiment recalculation records a succeeded job', async () => {
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const recalculate = await fetch(`${base}/api/v1/sentiment/recalculate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason: 'test' }),
  });
  assert.equal(recalculate.status, 201);
  const payload = await recalculate.json();
  assert.equal(payload.data.type, 'recalculate_sentiment');
  assert.equal(payload.data.status, 'succeeded');
  assert.equal(payload.data.result.recalculated, true);
});
