import { randomUUID } from 'node:crypto';
import { db, nowIso, one } from './client';
import { migrate } from './schema';
import { createPasswordHash } from '../shared/auth';
import { config } from '../config';
import { mockAlerts, mockReports, mockSentiment } from '../../../src/mockData';

function sectorId(name: string) {
  return `sector-${Buffer.from(name).toString('base64url')}`;
}

function upsertDemoUser() {
  const existing = one<{ id: string }>('SELECT id FROM users WHERE email = ?', [config.demoUserEmail]);
  const userId = existing?.id ?? 'user-demo';
  const now = nowIso();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'user', ?, ?)
    ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, updated_at = excluded.updated_at
  `).run(userId, config.demoUserEmail, createPasswordHash(config.demoUserPassword), '投资者 Alex', now, now);

  db.prepare(`
    INSERT INTO user_settings (user_id, notification_email, daily_digest_enabled, watchlist_alert_enabled, theme, updated_at)
    VALUES (?, ?, 1, 1, 'dark', ?)
    ON CONFLICT(user_id) DO NOTHING
  `).run(userId, config.demoUserEmail, now);

  db.prepare(`
    INSERT INTO subscriptions (id, user_id, plan_code, status, current_period_end)
    VALUES ('sub-demo', ?, 'pro', 'active', '2026-07-08T00:00:00.000Z')
    ON CONFLICT(id) DO UPDATE SET status = excluded.status, current_period_end = excluded.current_period_end
  `).run(userId);

  return userId;
}

export function seed() {
  migrate();
  const now = nowIso();
  const userId = upsertDemoUser();

  const insertSector = db.prepare('INSERT INTO sectors (id, name, created_at) VALUES (?, ?, ?) ON CONFLICT(name) DO NOTHING');
  const insertReport = db.prepare(`
    INSERT INTO reports (id, title, ticker, sector_id, summary, content, impact, is_premium, status, published_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      ticker = excluded.ticker,
      sector_id = excluded.sector_id,
      summary = excluded.summary,
      content = excluded.content,
      impact = excluded.impact,
      is_premium = excluded.is_premium,
      status = excluded.status,
      published_at = excluded.published_at,
      updated_at = excluded.updated_at
  `);
  const deleteValuations = db.prepare('DELETE FROM valuation_points WHERE report_id = ?');
  const insertValuation = db.prepare('INSERT INTO valuation_points (id, report_id, year, price, eps, pe, note) VALUES (?, ?, ?, ?, ?, ?, ?)');

  for (const report of mockReports) {
    const sid = sectorId(report.sector);
    insertSector.run(sid, report.sector, now);
    insertReport.run(report.id, report.title, report.ticker ?? null, sid, report.summary, report.content ?? null, report.impact, report.isPremium ? 1 : 0, `${report.date}T00:00:00.000Z`, now, now);
    deleteValuations.run(report.id);
    for (const point of report.valuationData ?? []) {
      insertValuation.run(randomUUID(), report.id, point.year, point.price, point.eps, point.pe, point.note ?? null);
    }
  }

  db.prepare('DELETE FROM sentiment_points').run();
  const insertSentiment = db.prepare('INSERT INTO sentiment_points (id, target_type, target_key, time_bucket, score, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  for (const point of mockSentiment) {
    insertSentiment.run(randomUUID(), 'global', 'GLOBAL', point.time, point.score, now);
  }

  db.prepare('DELETE FROM sentiment_events').run();
  const insertEvent = db.prepare('INSERT INTO sentiment_events (id, target_type, target_key, title, reason, score_delta, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertEvent.run(randomUUID(), 'sector', '新能源', '新能源政策讨论热度上升', 'AI 检测到产业链补贴调整传闻导致讨论量异常。', -8.5, now);
  insertEvent.run(randomUUID(), 'sector', '消费', '消费情绪快速修复', '零售板块情绪越过用户预警阈值，资金关注度提升。', 12.4, now);
  insertEvent.run(randomUUID(), 'sector', '科技', 'AI 基础设施预期继续升温', '云厂商资本支出语义信号持续偏正面。', 5.4, now);

  db.prepare('DELETE FROM alert_triggers').run();
  db.prepare('DELETE FROM alerts WHERE user_id = ?').run(userId);
  const insertAlert = db.prepare('INSERT INTO alerts (id, user_id, target_type, target_key, enabled, threshold, direction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertTrigger = db.prepare('INSERT INTO alert_triggers (id, alert_id, score, message, triggered_at, read_at) VALUES (?, ?, ?, ?, ?, NULL)');

  for (const alert of mockAlerts) {
    insertAlert.run(alert.id, userId, 'sector', alert.sector, alert.enabled ? 1 : 0, alert.threshold, 'below', now, now);
  }
  insertTrigger.run(randomUUID(), mockAlerts[0]?.id ?? 'alert-1', 35, '波动率飙升：新能源 (A股) 的政策讨论热度上涨。', now);
  insertTrigger.run(randomUUID(), mockAlerts[1]?.id ?? 'alert-2', 75, '情绪转变：零售板块情绪越过您的阈值。', now);

  db.prepare(`
    INSERT INTO jobs (id, type, status, input_json, result_json, error, created_by, created_at, updated_at, finished_at)
    VALUES ('job-seed', 'seed', 'succeeded', '{}', ?, NULL, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET status = excluded.status, result_json = excluded.result_json, updated_at = excluded.updated_at, finished_at = excluded.finished_at
  `).run(JSON.stringify({ reports: mockReports.length, sentimentPoints: mockSentiment.length }), userId, now, now, now);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
  console.log('Seeded SQLite database at', config.databaseUrl);
}
