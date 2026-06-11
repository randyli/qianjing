import { db } from './client';

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      notification_email TEXT NOT NULL,
      daily_digest_enabled INTEGER NOT NULL DEFAULT 1,
      watchlist_alert_enabled INTEGER NOT NULL DEFAULT 1,
      theme TEXT NOT NULL DEFAULT 'dark',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_code TEXT NOT NULL,
      status TEXT NOT NULL,
      current_period_end TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sectors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      ticker TEXT,
      sector_id TEXT NOT NULL REFERENCES sectors(id),
      summary TEXT NOT NULL,
      content TEXT,
      impact TEXT NOT NULL CHECK (impact IN ('positive', 'neutral', 'negative')),
      is_premium INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS valuation_points (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
      year TEXT NOT NULL,
      price REAL NOT NULL,
      eps REAL NOT NULL,
      pe REAL NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS sentiment_points (
      id TEXT PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL,
      time_bucket TEXT NOT NULL,
      score REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sentiment_events (
      id TEXT PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL,
      title TEXT NOT NULL,
      reason TEXT NOT NULL,
      score_delta REAL NOT NULL,
      occurred_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      threshold REAL NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alert_triggers (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
      score REAL NOT NULL,
      message TEXT NOT NULL,
      triggered_at TEXT NOT NULL,
      read_at TEXT
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      input_json TEXT NOT NULL DEFAULT '{}',
      result_json TEXT,
      error TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      finished_at TEXT
    );

    CREATE TABLE IF NOT EXISTS market_data_cache (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      api_name TEXT NOT NULL,
      cache_key TEXT NOT NULL UNIQUE,
      params_json TEXT NOT NULL,
      data_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pe_band_snapshots (
      id TEXT PRIMARY KEY,
      ts_code TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      multiples_json TEXT NOT NULL,
      data_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL DEFAULT '[]',
      source_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_search_index (
      ts_code TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      market TEXT,
      list_date TEXT,
      pinyin_full TEXT NOT NULL,
      pinyin_initials TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reports_published_at ON reports(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_ticker ON reports(ticker);
    CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
    CREATE INDEX IF NOT EXISTS idx_sentiment_target ON sentiment_points(target_type, target_key, time_bucket);
    CREATE INDEX IF NOT EXISTS idx_market_data_cache_key ON market_data_cache(cache_key);
    CREATE INDEX IF NOT EXISTS idx_pe_band_snapshots_target ON pe_band_snapshots(ts_code, start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_stock_search_symbol ON stock_search_index(symbol);
    CREATE INDEX IF NOT EXISTS idx_stock_search_pinyin_full ON stock_search_index(pinyin_full);
    CREATE INDEX IF NOT EXISTS idx_stock_search_pinyin_initials ON stock_search_index(pinyin_initials);
    CREATE INDEX IF NOT EXISTS idx_stock_search_name ON stock_search_index(name);
  `);
}
