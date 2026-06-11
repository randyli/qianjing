import { randomUUID } from 'node:crypto';
import { config } from '../../config';
import { db, nowIso, one } from '../../db/client';

export type TushareApiName = 'stock_basic' | 'daily_basic' | 'income';

export interface TushareRow {
  [key: string]: string | number | null;
}

interface TushareResponse {
  code: number;
  msg?: string;
  data?: {
    fields: string[];
    items: Array<Array<string | number | null>>;
  };
}

interface CacheRow {
  id: string;
  data_json: string;
  fetched_at: string;
  expires_at: string;
}

export class TushareError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 502) {
    super(message);
    this.name = 'TushareError';
    this.code = code;
    this.status = status;
  }
}

function stableJson(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return JSON.stringify(value);
  const sorted = Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = (value as Record<string, unknown>)[key];
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

function cacheKey(apiName: TushareApiName, params: Record<string, unknown>, fields: string[]) {
  return `tushare:${apiName}:${stableJson(params)}:${fields.join(',')}`;
}

function toRows(response: TushareResponse): TushareRow[] {
  const fields = response.data?.fields ?? [];
  const items = response.data?.items ?? [];
  return items.map((item) => fields.reduce<TushareRow>((row, field, index) => {
    row[field] = item[index] ?? null;
    return row;
  }, {}));
}

function getFreshCache(key: string) {
  return one<CacheRow>(
    'SELECT id, data_json, fetched_at, expires_at FROM market_data_cache WHERE cache_key = ? AND expires_at > ?',
    [key, nowIso()],
  );
}

function getAnyCache(key: string) {
  return one<CacheRow>(
    'SELECT id, data_json, fetched_at, expires_at FROM market_data_cache WHERE cache_key = ?',
    [key],
  );
}

function writeCache(provider: string, apiName: TushareApiName, key: string, params: Record<string, unknown>, rows: TushareRow[], ttlHours: number) {
  const now = nowIso();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO market_data_cache (id, provider, api_name, cache_key, params_json, data_json, fetched_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET
      provider = excluded.provider,
      api_name = excluded.api_name,
      params_json = excluded.params_json,
      data_json = excluded.data_json,
      fetched_at = excluded.fetched_at,
      expires_at = excluded.expires_at
  `).run(randomUUID(), provider, apiName, key, JSON.stringify(params), JSON.stringify(rows), now, expiresAt);
  return { fetchedAt: now, expiresAt };
}

async function requestTushare(apiName: TushareApiName, params: Record<string, unknown>, fields: string[]) {
  if (!config.tushareToken) {
    throw new TushareError('tushare_not_configured', 'Tushare token 未配置。', 500);
  }

  let response: Response;
  try {
    response = await fetch(config.tushareApiUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ api_name: apiName, token: config.tushareToken, params, fields: fields.join(',') }),
    });
  } catch (error) {
    throw new TushareError('tushare_network_error', error instanceof Error ? error.message : 'Tushare 网络请求失败。', 502);
  }

  if (!response.ok) {
    throw new TushareError('tushare_http_error', `Tushare HTTP 请求失败：${response.status}`, 502);
  }

  const payload = await response.json() as TushareResponse;
  if (payload.code !== 0) {
    const message = payload.msg || 'Tushare 返回错误。';
    if (/权限|permission/i.test(message)) throw new TushareError('tushare_permission_denied', message, 502);
    if (/频次|limit|too many|rate/i.test(message)) throw new TushareError('tushare_rate_limited', message, 429);
    throw new TushareError('tushare_error', message, 502);
  }

  return toRows(payload);
}

export async function fetchTushareRows(apiName: TushareApiName, params: Record<string, unknown>, fields: string[], ttlHours: number) {
  const key = cacheKey(apiName, params, fields);
  const fresh = getFreshCache(key);
  if (fresh) {
    return { rows: JSON.parse(fresh.data_json) as TushareRow[], fetchedAt: fresh.fetched_at, cacheHit: true, stale: false };
  }

  try {
    const rows = await requestTushare(apiName, params, fields);
    const written = writeCache('tushare', apiName, key, params, rows, ttlHours);
    return { rows, fetchedAt: written.fetchedAt, cacheHit: false, stale: false };
  } catch (error) {
    const stale = getAnyCache(key);
    if (stale) {
      return { rows: JSON.parse(stale.data_json) as TushareRow[], fetchedAt: stale.fetched_at, cacheHit: true, stale: true };
    }
    throw error;
  }
}
