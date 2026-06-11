import express from 'express';
import { randomUUID } from 'node:crypto';
import type { SQLInputValue } from 'node:sqlite';
import { db, all, nowIso, one } from './db/client';
import { migrate } from './db/schema';
import { seed } from './db/seed';
import { AuthenticatedRequest, createPasswordHash, createToken, requireAuth, verifyPassword } from './shared/auth';
import { asBoolean, asNumber, asString, badRequest } from './shared/validation';

interface ReportRow {
  id: string;
  title: string;
  ticker: string | null;
  sector: string;
  summary: string;
  content: string | null;
  impact: 'positive' | 'neutral' | 'negative';
  is_premium: number;
  published_at: string;
}

function toReport(row: ReportRow) {
  return {
    id: row.id,
    title: row.title,
    ticker: row.ticker ?? undefined,
    sector: row.sector,
    summary: row.summary,
    content: row.content ?? undefined,
    impact: row.impact,
    date: row.published_at.slice(0, 10),
    isPremium: Boolean(row.is_premium),
  };
}

function reportSelect() {
  return `
    SELECT r.id, r.title, r.ticker, s.name AS sector, r.summary, r.content, r.impact, r.is_premium, r.published_at
    FROM reports r
    JOIN sectors s ON s.id = r.sector_id
  `;
}


type JobStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';

interface JobRow {
  id: string;
  type: string;
  status: JobStatus;
  input_json: string;
  result_json: string | null;
  error: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}

function parseJsonObject(value: unknown, fallback: Record<string, unknown> = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : fallback;
  } catch {
    return fallback;
  }
}

function toJob(row: JobRow) {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    input: parseJsonObject(row.input_json),
    result: row.result_json ? parseJsonObject(row.result_json) : null,
    error: row.error,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    finishedAt: row.finished_at,
  };
}

function createJob(type: string, input: Record<string, unknown>, createdBy: string | null, status: JobStatus = 'pending') {
  const id = randomUUID();
  const now = nowIso();
  db.prepare('INSERT INTO jobs (id, type, status, input_json, result_json, error, created_by, created_at, updated_at, finished_at) VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, ?, NULL)')
    .run(id, type, status, JSON.stringify(input), createdBy, now, now);
  return id;
}

function getScopedJob(id: string, userId: string) {
  return one<JobRow>(
    'SELECT id, type, status, input_json, result_json, error, created_by, created_at, updated_at, finished_at FROM jobs WHERE id = ? AND (created_by = ? OR created_by IS NULL)',
    [id, userId],
  );
}

function createAlertTriggersForLatestSentiment() {
  const alerts = all<{ id: string; target_type: string; target_key: string; threshold: number; direction: string }>(
    'SELECT id, target_type, target_key, threshold, direction FROM alerts WHERE enabled = 1',
  );
  const insertTrigger = db.prepare('INSERT INTO alert_triggers (id, alert_id, score, message, triggered_at, read_at) VALUES (?, ?, ?, ?, ?, NULL)');
  const now = nowIso();
  let triggersCreated = 0;

  for (const alert of alerts) {
    const latestPoint = one<{ score: number }>(
      'SELECT score FROM sentiment_points WHERE target_type = ? AND target_key = ? ORDER BY time_bucket DESC LIMIT 1',
      [alert.target_type, alert.target_key],
    );
    const latestEvent = one<{ score_delta: number }>(
      'SELECT score_delta FROM sentiment_events WHERE target_type = ? AND target_key = ? ORDER BY occurred_at DESC LIMIT 1',
      [alert.target_type, alert.target_key],
    );
    const score = latestPoint?.score ?? (latestEvent ? 60 + latestEvent.score_delta : null);
    if (score === null) continue;

    const matched = alert.direction === 'above' ? score >= alert.threshold : score <= alert.threshold;
    if (!matched) continue;

    const comparison = alert.direction === 'above' ? '高于' : '低于';
    insertTrigger.run(randomUUID(), alert.id, score, `${alert.target_key} 情绪分 ${score.toFixed(1)} ${comparison}阈值 ${alert.threshold}。`, now);
    triggersCreated += 1;
  }

  return triggersCreated;
}

function runJob(row: JobRow) {
  const startedAt = nowIso();
  db.prepare('UPDATE jobs SET status = ?, error = NULL, updated_at = ?, finished_at = NULL WHERE id = ?').run('running', startedAt, row.id);

  try {
    const input = parseJsonObject(row.input_json);
    let result: Record<string, unknown>;
    if (row.type === 'seed' || row.type === 'import_seed_data') {
      seed();
      result = { seeded: true };
    } else if (row.type === 'recalculate_sentiment') {
      const triggersCreated = createAlertTriggersForLatestSentiment();
      result = { recalculated: true, triggersCreated };
    } else {
      result = { accepted: true, message: 'MVP 暂未配置该任务类型的执行器，已记录为空操作。', input };
    }

    const finishedAt = nowIso();
    db.prepare('UPDATE jobs SET status = ?, result_json = ?, error = NULL, updated_at = ?, finished_at = ? WHERE id = ?')
      .run('succeeded', JSON.stringify(result), finishedAt, finishedAt, row.id);
  } catch (error) {
    const finishedAt = nowIso();
    db.prepare('UPDATE jobs SET status = ?, error = ?, updated_at = ?, finished_at = ? WHERE id = ?')
      .run('failed', error instanceof Error ? error.message : String(error), finishedAt, finishedAt, row.id);
  }

  return one<JobRow>('SELECT id, type, status, input_json, result_json, error, created_by, created_at, updated_at, finished_at FROM jobs WHERE id = ?', [row.id])!;
}

migrate();
if (!one<{ count: number }>('SELECT COUNT(*) AS count FROM reports')?.count) {
  seed();
}

export const app = express();
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  const requestId = req.header('x-request-id') ?? randomUUID();
  res.setHeader('x-request-id', requestId);
  res.setHeader('access-control-allow-origin', process.env.CORS_ORIGIN ?? '*');
  res.setHeader('access-control-allow-headers', 'content-type, authorization, x-request-id');
  res.setHeader('access-control-allow-methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

function healthResponse(_req: express.Request, res: express.Response) {
  res.json({ ok: true, service: 'qianjing-api', time: nowIso() });
}

app.get('/health', healthResponse);
app.get('/api/v1/health', healthResponse);

app.post('/api/v1/auth/register', (req, res) => {
  const email = asString(req.body?.email).toLowerCase();
  const password = asString(req.body?.password);
  const displayName = asString(req.body?.displayName) || email.split('@')[0] || '新用户';
  if (!email.includes('@')) return badRequest(res, 'email 必须是有效邮箱。');
  if (password.length < 8) return badRequest(res, 'password 至少需要 8 个字符。');

  const id = randomUUID();
  const now = nowIso();
  try {
    db.prepare('INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, email, createPasswordHash(password), displayName, 'user', now, now);
    db.prepare('INSERT INTO user_settings (user_id, notification_email, daily_digest_enabled, watchlist_alert_enabled, theme, updated_at) VALUES (?, ?, 1, 1, ?, ?)')
      .run(id, email, 'dark', now);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      res.status(409).json({ error: { code: 'email_exists', message: '该邮箱已注册。' } });
      return;
    }
    throw error;
  }

  const user = { id, email, displayName, role: 'user' };
  res.status(201).json({ token: createToken(user), user });
});

app.post('/api/v1/auth/login', (req, res) => {
  const email = asString(req.body?.email).toLowerCase();
  const password = asString(req.body?.password);
  if (!email || !password) return badRequest(res, 'email 和 password 为必填字段。');

  const row = one<{ id: string; email: string; password_hash: string; display_name: string; role: string }>(
    'SELECT id, email, password_hash, display_name, role FROM users WHERE email = ?',
    [email],
  );
  if (!row || !verifyPassword(password, row.password_hash)) {
    res.status(401).json({ error: { code: 'invalid_credentials', message: '邮箱或密码不正确。' } });
    return;
  }

  const user = { id: row.id, email: row.email, displayName: row.display_name, role: row.role };
  res.json({ token: createToken(user), user });
});

app.patch('/api/v1/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const displayName = asString(req.body?.displayName);
  if (!displayName) return badRequest(res, 'displayName 不能为空。');
  if (displayName.length > 50) return badRequest(res, 'displayName 长度必须在 1-50 个字符之间。');

  const now = nowIso();
  db.prepare('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?').run(displayName, now, req.user!.id);

  res.json({
    user: {
      ...req.user!,
      displayName,
    },
  });
});

app.get('/api/v1/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const settings = one<{ notification_email: string; daily_digest_enabled: number; watchlist_alert_enabled: number; theme: string; updated_at: string }>(
    'SELECT notification_email, daily_digest_enabled, watchlist_alert_enabled, theme, updated_at FROM user_settings WHERE user_id = ?',
    [req.user!.id],
  );
  const subscription = one<{ plan_code: string; status: string; current_period_end: string }>(
    'SELECT plan_code, status, current_period_end FROM subscriptions WHERE user_id = ?',
    [req.user!.id],
  );

  res.json({
    user: req.user,
    settings: settings ? {
      notificationEmail: settings.notification_email,
      dailyDigestEnabled: Boolean(settings.daily_digest_enabled),
      watchlistAlertEnabled: Boolean(settings.watchlist_alert_enabled),
      theme: settings.theme,
      updatedAt: settings.updated_at,
    } : null,
    subscription: subscription ? {
      planCode: subscription.plan_code,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
    } : null,
  });
});

app.get('/api/v1/me/settings', requireAuth, (req: AuthenticatedRequest, res) => {
  const settings = one<{ notification_email: string; daily_digest_enabled: number; watchlist_alert_enabled: number; theme: string; updated_at: string }>(
    'SELECT notification_email, daily_digest_enabled, watchlist_alert_enabled, theme, updated_at FROM user_settings WHERE user_id = ?',
    [req.user!.id],
  );
  const subscription = one<{ plan_code: string; status: string; current_period_end: string }>(
    'SELECT plan_code, status, current_period_end FROM subscriptions WHERE user_id = ?',
    [req.user!.id],
  );

  res.json({
    settings: settings ? {
      notificationEmail: settings.notification_email,
      dailyDigestEnabled: Boolean(settings.daily_digest_enabled),
      watchlistAlertEnabled: Boolean(settings.watchlist_alert_enabled),
      theme: settings.theme,
      updatedAt: settings.updated_at,
    } : null,
    subscription: subscription ? {
      planCode: subscription.plan_code,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
    } : null,
  });
});

app.patch('/api/v1/me/settings', requireAuth, (req: AuthenticatedRequest, res) => {
  const notificationEmail = asString(req.body?.notificationEmail);
  const dailyDigestEnabled = asBoolean(req.body?.dailyDigestEnabled, true);
  const watchlistAlertEnabled = asBoolean(req.body?.watchlistAlertEnabled, true);
  const theme = asString(req.body?.theme) || 'dark';
  if (!notificationEmail.includes('@')) return badRequest(res, 'notificationEmail 必须是有效邮箱。');
  const now = nowIso();

  db.prepare(`
    INSERT INTO user_settings (user_id, notification_email, daily_digest_enabled, watchlist_alert_enabled, theme, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      notification_email = excluded.notification_email,
      daily_digest_enabled = excluded.daily_digest_enabled,
      watchlist_alert_enabled = excluded.watchlist_alert_enabled,
      theme = excluded.theme,
      updated_at = excluded.updated_at
  `).run(req.user!.id, notificationEmail, dailyDigestEnabled ? 1 : 0, watchlistAlertEnabled ? 1 : 0, theme, now);

  res.json({ settings: { notificationEmail, dailyDigestEnabled, watchlistAlertEnabled, theme, updatedAt: now } });
});

app.get('/api/v1/reports', (req, res) => {
  const q = asString(req.query.q).toLowerCase();
  const sector = asString(req.query.sector);
  const ticker = asString(req.query.ticker).toLowerCase();
  const impact = asString(req.query.impact);
  const premium = asString(req.query.premium).toLowerCase();
  const page = Math.max(asNumber(req.query.page, 1), 1);
  const pageSize = Math.min(Math.max(asNumber(req.query.pageSize ?? req.query.limit, 50), 1), 100);
  const params: SQLInputValue[] = [];
  const where: string[] = ["r.status = 'published'"];

  if (q) {
    where.push('(LOWER(r.title) LIKE ? OR LOWER(r.summary) LIKE ? OR LOWER(r.ticker) LIKE ? OR LOWER(s.name) LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (sector) {
    where.push('s.name = ?');
    params.push(sector);
  }
  if (ticker) {
    where.push('LOWER(r.ticker) = ?');
    params.push(ticker);
  }
  if (impact) {
    where.push('r.impact = ?');
    params.push(impact);
  }
  if (['true', 'false', '1', '0'].includes(premium)) {
    where.push('r.is_premium = ?');
    params.push(['true', '1'].includes(premium) ? 1 : 0);
  }

  const whereSql = where.join(' AND ');
  const total = one<{ count: number }>(`SELECT COUNT(*) AS count FROM reports r JOIN sectors s ON s.id = r.sector_id WHERE ${whereSql}`, params)?.count ?? 0;
  const rows = all<ReportRow>(`${reportSelect()} WHERE ${whereSql} ORDER BY r.published_at DESC LIMIT ? OFFSET ?`, [...params, pageSize, (page - 1) * pageSize]);
  res.json({ data: rows.map(toReport), meta: { count: rows.length, total, page, pageSize } });
});

app.get('/api/v1/reports/:id', (req, res) => {
  const row = one<ReportRow>(`${reportSelect()} WHERE r.id = ?`, [req.params.id]);
  if (!row) {
    res.status(404).json({ error: { code: 'not_found', message: '报告不存在。' } });
    return;
  }
  res.json({ data: toReport(row) });
});

app.get('/api/v1/reports/:id/valuation', (req, res) => {
  const exists = one<{ id: string }>('SELECT id FROM reports WHERE id = ?', [req.params.id]);
  if (!exists) {
    res.status(404).json({ error: { code: 'not_found', message: '报告不存在。' } });
    return;
  }
  const rows = all<{ year: string; price: number; eps: number; pe: number; note: string | null }>(
    'SELECT year, price, eps, pe, note FROM valuation_points WHERE report_id = ? ORDER BY year',
    [req.params.id],
  );
  res.json({ data: rows.map((row) => ({ ...row, note: row.note ?? undefined })) });
});

app.get('/api/v1/sentiment/overview', (_req, res) => {
  const sectors = all<{ name: string; score: number; trend: number }>(`
    SELECT target_key AS name, 60 + score_delta AS score, score_delta AS trend
    FROM sentiment_events
    WHERE target_type = 'sector'
    ORDER BY occurred_at DESC
  `);
  const latest = one<{ score: number }>('SELECT score FROM sentiment_points WHERE target_type = ? AND target_key = ? ORDER BY rowid DESC LIMIT 1', ['global', 'GLOBAL']);
  res.json({ data: { globalScore: latest?.score ?? 0, sectors } });
});


function sentimentSeriesResponse(req: express.Request, res: express.Response) {
  const targetType = asString(req.query.targetType) || 'global';
  const targetKey = asString(req.query.targetKey) || 'GLOBAL';
  const limit = Math.min(Math.max(asNumber(req.query.limit, 365), 1), 1000);
  const rows = all<{ time_bucket: string; score: number }>(
    'SELECT time_bucket, score FROM sentiment_points WHERE target_type = ? AND target_key = ? ORDER BY time_bucket DESC LIMIT ?',
    [targetType, targetKey, limit],
  ).reverse();
  res.json({ data: rows.map((row) => ({ time: row.time_bucket, score: row.score })) });
}

app.get('/api/v1/sentiment/points', sentimentSeriesResponse);
app.get('/api/v1/sentiment/series', sentimentSeriesResponse);

app.post('/api/v1/sentiment/recalculate', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = createJob('recalculate_sentiment', parseJsonObject(req.body), req.user!.id, 'pending');
  const job = runJob(getScopedJob(id, req.user!.id)!);
  res.status(201).json({ data: toJob(job) });
});

app.get('/api/v1/sentiment/events', (_req, res) => {
  const rows = all<{ id: string; target_type: string; target_key: string; title: string; reason: string; score_delta: number; occurred_at: string }>(
    'SELECT id, target_type, target_key, title, reason, score_delta, occurred_at FROM sentiment_events ORDER BY occurred_at DESC LIMIT 20',
  );
  res.json({ data: rows.map((row) => ({ id: row.id, targetType: row.target_type, targetKey: row.target_key, title: row.title, reason: row.reason, scoreDelta: row.score_delta, occurredAt: row.occurred_at })) });
});

app.get('/api/v1/alerts', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = all<{ id: string; target_type: string; target_key: string; enabled: number; threshold: number; direction: string; created_at: string; updated_at: string }>(
    'SELECT id, target_type, target_key, enabled, threshold, direction, created_at, updated_at FROM alerts WHERE user_id = ? ORDER BY created_at DESC',
    [req.user!.id],
  );
  res.json({ data: rows.map((row) => ({ id: row.id, targetType: row.target_type, targetKey: row.target_key, sector: row.target_key, enabled: Boolean(row.enabled), threshold: row.threshold, direction: row.direction, createdAt: row.created_at, updatedAt: row.updated_at })) });
});

app.post('/api/v1/alerts', requireAuth, (req: AuthenticatedRequest, res) => {
  const targetKey = asString(req.body?.targetKey || req.body?.sector);
  const threshold = asNumber(req.body?.threshold, Number.NaN);
  const direction = asString(req.body?.direction) || 'below';
  if (!targetKey) return badRequest(res, 'targetKey 为必填字段。');
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) return badRequest(res, 'threshold 必须在 0 到 100 之间。');
  if (!['above', 'below'].includes(direction)) return badRequest(res, 'direction 必须是 above 或 below。');

  const id = randomUUID();
  const now = nowIso();
  db.prepare('INSERT INTO alerts (id, user_id, target_type, target_key, enabled, threshold, direction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.user!.id, asString(req.body?.targetType) || 'sector', targetKey, asBoolean(req.body?.enabled, true) ? 1 : 0, threshold, direction, now, now);
  res.status(201).json({ data: { id, targetType: 'sector', targetKey, sector: targetKey, enabled: asBoolean(req.body?.enabled, true), threshold, direction, createdAt: now, updatedAt: now } });
});

app.patch('/api/v1/alerts/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const current = one<{ id: string; target_key: string; enabled: number; threshold: number; direction: string }>('SELECT id, target_key, enabled, threshold, direction FROM alerts WHERE id = ? AND user_id = ?', [req.params.id, req.user!.id]);
  if (!current) {
    res.status(404).json({ error: { code: 'not_found', message: '预警不存在。' } });
    return;
  }
  const targetKey = asString(req.body?.targetKey || req.body?.sector) || current.target_key;
  const threshold = req.body?.threshold === undefined ? current.threshold : asNumber(req.body?.threshold, Number.NaN);
  const enabled = req.body?.enabled === undefined ? Boolean(current.enabled) : asBoolean(req.body?.enabled);
  const direction = asString(req.body?.direction) || current.direction;
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) return badRequest(res, 'threshold 必须在 0 到 100 之间。');
  if (!['above', 'below'].includes(direction)) return badRequest(res, 'direction 必须是 above 或 below。');
  const now = nowIso();

  db.prepare('UPDATE alerts SET target_key = ?, enabled = ?, threshold = ?, direction = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(targetKey, enabled ? 1 : 0, threshold, direction, now, req.params.id, req.user!.id);
  res.json({ data: { id: req.params.id, targetType: 'sector', targetKey, sector: targetKey, enabled, threshold, direction, updatedAt: now } });
});

app.delete('/api/v1/alerts/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const result = db.prepare('DELETE FROM alerts WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  if (!result.changes) {
    res.status(404).json({ error: { code: 'not_found', message: '预警不存在。' } });
    return;
  }
  res.status(204).end();
});

app.get('/api/v1/alerts/triggers', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = all<{ id: string; alert_id: string; target_key: string; score: number; message: string; triggered_at: string; read_at: string | null }>(`
    SELECT t.id, t.alert_id, a.target_key, t.score, t.message, t.triggered_at, t.read_at
    FROM alert_triggers t
    JOIN alerts a ON a.id = t.alert_id
    WHERE a.user_id = ?
    ORDER BY t.triggered_at DESC
    LIMIT 20
  `, [req.user!.id]);
  res.json({ data: rows.map((row) => ({ id: row.id, alertId: row.alert_id, targetKey: row.target_key, score: row.score, message: row.message, triggeredAt: row.triggered_at, readAt: row.read_at })) });
});

app.post('/api/v1/jobs', requireAuth, (req: AuthenticatedRequest, res) => {
  const type = asString(req.body?.type);
  if (!type) return badRequest(res, 'type 为必填字段。');
  const status = asString(req.body?.status) || 'pending';
  if (!['pending', 'running', 'succeeded', 'failed', 'cancelled'].includes(status)) return badRequest(res, 'status 不是有效任务状态。');
  const id = createJob(type, parseJsonObject(req.body?.input), req.user!.id, status as JobStatus);
  const row = getScopedJob(id, req.user!.id)!;
  res.status(201).json({ data: toJob(row) });
});

app.get('/api/v1/jobs', requireAuth, (req: AuthenticatedRequest, res) => {
  const type = asString(req.query.type);
  const status = asString(req.query.status);
  const pageSize = Math.min(Math.max(asNumber(req.query.pageSize ?? req.query.limit, 50), 1), 100);
  const params: SQLInputValue[] = [req.user!.id];
  const where = ['(created_by = ? OR created_by IS NULL)'];
  if (type) {
    where.push('type = ?');
    params.push(type);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  const rows = all<JobRow>(
    `SELECT id, type, status, input_json, result_json, error, created_by, created_at, updated_at, finished_at FROM jobs WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ?`,
    [...params, pageSize],
  );
  res.json({ data: rows.map(toJob), meta: { count: rows.length } });
});

app.get('/api/v1/jobs/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const row = getScopedJob(req.params.id, req.user!.id);
  if (!row) {
    res.status(404).json({ error: { code: 'not_found', message: '任务不存在。' } });
    return;
  }
  res.json({ data: toJob(row) });
});

app.post('/api/v1/jobs/:id/run', requireAuth, (req: AuthenticatedRequest, res) => {
  const row = getScopedJob(req.params.id, req.user!.id);
  if (!row) {
    res.status(404).json({ error: { code: 'not_found', message: '任务不存在。' } });
    return;
  }
  if (row.status === 'running') return badRequest(res, '任务正在运行中。');
  res.json({ data: toJob(runJob(row)) });
});
