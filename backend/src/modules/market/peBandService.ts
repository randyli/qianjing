import { randomUUID } from 'node:crypto';
import { config } from '../../config';
import { db, nowIso, one } from '../../db/client';
import { fetchTushareRows, TushareError, type TushareRow } from './tushareClient';

export interface PeBandQuery {
  tsCode: string;
  range?: string;
  startDate?: string;
  endDate?: string;
  multiples?: string;
}

interface SnapshotRow {
  data_json: string;
  warnings_json: string;
  source_json: string;
  expires_at: string;
}

const DEFAULT_MULTIPLES = [15, 20, 25, 30];
const RANGE_YEARS: Record<string, number> = { '1y': 1, '3y': 3, '5y': 5, '10y': 10 };
const TS_CODE_RE = /^\d{6}\.(SH|SZ|BJ)$/;

function yyyymmdd(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function parseYmd(value: string) {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isFinite(date.getTime()) && yyyymmdd(date) === value ? date : null;
}

function formatNumber(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function normalizeDates(query: PeBandQuery) {
  const today = new Date();
  const end = query.endDate && parseYmd(query.endDate) ? parseYmd(query.endDate)! : today;
  const clippedEnd = end > today ? today : end;
  let start: Date;
  if (query.startDate && parseYmd(query.startDate)) {
    start = parseYmd(query.startDate)!;
  } else {
    const years = RANGE_YEARS[(query.range || '5y').toLowerCase()] ?? 5;
    start = new Date(Date.UTC(clippedEnd.getUTCFullYear() - years, clippedEnd.getUTCMonth(), clippedEnd.getUTCDate()));
  }
  if (start > clippedEnd) {
    throw new TushareError('invalid_date_range', 'startDate 不能晚于 endDate。', 400);
  }
  return { startDate: yyyymmdd(start), endDate: yyyymmdd(clippedEnd), requestedEndClipped: end > today };
}

function parseMultiples(value?: string) {
  if (!value) return DEFAULT_MULTIPLES;
  const multiples = value.split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0 && item <= 500);
  const unique = Array.from(new Set(multiples)).slice(0, 8);
  if (!unique.length) throw new TushareError('invalid_multiples', 'multiples 必须包含至少一个正数 PE 倍数。', 400);
  return unique;
}

function asNum(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asStr(value: unknown) {
  return typeof value === 'string' ? value : String(value ?? '');
}

function snapshotKey(tsCode: string, startDate: string, endDate: string, multiples: number[]) {
  return JSON.stringify({ tsCode, startDate, endDate, multiples });
}

function findFreshSnapshot(key: string) {
  return one<SnapshotRow>(
    'SELECT data_json, warnings_json, source_json, expires_at FROM pe_band_snapshots WHERE id = ? AND expires_at > ?',
    [key, nowIso()],
  );
}

function periodFromEndDate(endDate: string) {
  const year = endDate.slice(0, 4);
  const quarterByMonth: Record<string, string> = { '0331': 'Q1', '0630': 'Q2', '0930': 'Q3', '1231': 'Q4' };
  return `${year}${quarterByMonth[endDate.slice(4)] ?? ''}`;
}

function writeSnapshot(key: string, tsCode: string, startDate: string, endDate: string, multiples: number[], data: unknown, warnings: string[], source: unknown) {
  const now = nowIso();
  const expiresAt = new Date(Date.now() + config.marketDataCacheTtlHours * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO pe_band_snapshots (id, ts_code, start_date, end_date, multiples_json, data_json, warnings_json, source_json, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      data_json = excluded.data_json,
      warnings_json = excluded.warnings_json,
      source_json = excluded.source_json,
      created_at = excluded.created_at,
      expires_at = excluded.expires_at
  `).run(key, tsCode, startDate, endDate, JSON.stringify(multiples), JSON.stringify(data), JSON.stringify(warnings), JSON.stringify(source), now, expiresAt);
}

function recordRefreshJob(input: Record<string, unknown>, result: Record<string, unknown>) {
  const now = nowIso();
  db.prepare('INSERT INTO jobs (id, type, status, input_json, result_json, error, created_by, created_at, updated_at, finished_at) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)')
    .run(randomUUID(), 'refresh_pe_band', 'succeeded', JSON.stringify(input), JSON.stringify(result), now, now, now);
}

export async function getPeBandData(query: PeBandQuery) {
  const tsCode = query.tsCode.trim().toUpperCase();
  if (!TS_CODE_RE.test(tsCode)) throw new TushareError('invalid_ts_code', '股票代码格式错误，请使用 600519.SH 这类 Tushare 标准代码。', 400);

  const { startDate, endDate, requestedEndClipped } = normalizeDates(query);
  const multiples = parseMultiples(query.multiples);
  const key = snapshotKey(tsCode, startDate, endDate, multiples);
  const snapshot = findFreshSnapshot(key);
  if (snapshot) {
    const data = JSON.parse(snapshot.data_json) as Record<string, unknown>;
    data.source = { ...(JSON.parse(snapshot.source_json) as Record<string, unknown>), cacheHit: true };
    return data;
  }

  const warnings = new Set<string>();
  if (requestedEndClipped) warnings.add('range_clipped');

  const stockResult = await fetchTushareRows('stock_basic', { ts_code: tsCode }, ['ts_code', 'name', 'market', 'list_date'], config.marketDataFinancialTtlHours);
  const target = stockResult.rows[0];
  if (!target) throw new TushareError('market_data_not_found', '未找到该 A 股标的基础信息。', 404);

  const listDate = asStr(target.list_date);
  const effectiveStartDate = listDate && listDate > startDate ? listDate : startDate;
  if (effectiveStartDate !== startDate) warnings.add('range_clipped');

  const dailyResult = await fetchTushareRows(
    'daily_basic',
    { ts_code: tsCode, start_date: effectiveStartDate, end_date: endDate },
    ['ts_code', 'trade_date', 'close', 'pe_ttm', 'pe', 'pb'],
    config.marketDataCacheTtlHours,
  );

  const incomeResult = await fetchTushareRows(
    'income',
    { ts_code: tsCode, start_date: effectiveStartDate, end_date: endDate },
    ['ts_code', 'end_date', 'ann_date', 'basic_eps', 'diluted_eps'],
    config.marketDataFinancialTtlHours,
  ).catch(() => {
    warnings.add('income_missing');
    return { rows: [], fetchedAt: nowIso(), cacheHit: false, stale: false };
  });

  if (stockResult.stale || dailyResult.stale || incomeResult.stale) warnings.add('stale_cache');

  const byDate = new Map<string, TushareRow>();
  for (const row of dailyResult.rows) {
    const tradeDate = asStr(row.trade_date);
    if (tradeDate && !byDate.has(tradeDate)) byDate.set(tradeDate, row);
  }

  let missingPe = 0;
  let nonPositivePe = 0;
  const series = Array.from(byDate.values())
    .sort((a, b) => asStr(a.trade_date).localeCompare(asStr(b.trade_date)))
    .flatMap((row) => {
      const close = asNum(row.close);
      const peTtm = asNum(row.pe_ttm);
      if (close === null || peTtm === null) {
        missingPe += 1;
        return [];
      }
      if (peTtm <= 0) {
        nonPositivePe += 1;
        return [];
      }
      const ttmEps = close / peTtm;
      const bands = multiples.reduce<Record<string, number>>((acc, multiple) => {
        acc[String(multiple)] = formatNumber(ttmEps * multiple);
        return acc;
      }, {});
      return [{ tradeDate: asStr(row.trade_date), close: formatNumber(close), peTtm: formatNumber(peTtm), ttmEps: formatNumber(ttmEps), bands }];
    });

  if (missingPe) warnings.add('pe_ttm_missing');
  if (nonPositivePe) warnings.add('pe_ttm_non_positive');
  if (!series.length) throw new TushareError('market_data_not_found', '该区间没有可用于计算 PE 通道的行情估值数据。', 404);

  const incomeRows = incomeResult.rows
    .filter((row) => row.end_date && row.ann_date && asNum(row.basic_eps) !== null)
    .sort((a, b) => asStr(a.end_date).localeCompare(asStr(b.end_date)));
  if (!incomeRows.length) warnings.add('income_missing');

  const financialMarkers = incomeRows.map((row) => ({
    period: periodFromEndDate(asStr(row.end_date)),
    endDate: asStr(row.end_date),
    annDate: asStr(row.ann_date),
    basicEps: formatNumber(asNum(row.basic_eps) ?? 0),
  }));

  const first = series[0];
  const latest = series[series.length - 1];
  const metrics = {
    latestClose: latest.close,
    latestTradeDate: latest.tradeDate,
    latestPeTtm: latest.peTtm,
    latestTtmEps: latest.ttmEps,
    priceChangePct: formatNumber(((latest.close - first.close) / first.close) * 100),
    ttmEpsChangePct: formatNumber(((latest.ttmEps - first.ttmEps) / first.ttmEps) * 100),
  };

  const fetchedAt = [stockResult.fetchedAt, dailyResult.fetchedAt, incomeResult.fetchedAt].sort().at(-1) ?? nowIso();
  const source = { provider: 'tushare', apis: ['stock_basic', 'daily_basic', 'income'], fetchedAt, cacheHit: false };
  const data = {
    target: { tsCode, name: asStr(target.name), currency: 'CNY' as const },
    range: { startDate, endDate, actualStartDate: first.tradeDate, actualEndDate: latest.tradeDate },
    multiples,
    metrics,
    series,
    financialMarkers,
    source,
    warnings: Array.from(warnings),
  };

  writeSnapshot(key, tsCode, startDate, endDate, multiples, data, Array.from(warnings), source);
  recordRefreshJob({ tsCode, startDate, endDate, multiples }, { points: series.length, cacheHit: false, warnings: Array.from(warnings) });
  return data;
}
