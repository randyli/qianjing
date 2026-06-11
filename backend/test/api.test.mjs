import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { test, before, after } from 'node:test';

const port = 4100 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
let server;
let token;

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
