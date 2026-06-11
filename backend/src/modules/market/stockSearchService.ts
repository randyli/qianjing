import { all, one } from '../../db/client';

export type StockMatchType = 'symbol_prefix' | 'ts_code_prefix' | 'pinyin_prefix' | 'initials_prefix' | 'name_contains';

export interface StockSearchResult {
  tsCode: string;
  symbol: string;
  name: string;
  market?: string;
  matchType: StockMatchType;
}

interface StockSearchRow {
  ts_code: string;
  symbol: string;
  name: string;
  market: string | null;
  match_type: StockMatchType;
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;
let warnedEmptyIndex = false;

export function normalizeStockSearchQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function normalizeLimit(value: unknown) {
  const parsed = typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export function searchStocks(rawQuery: string, rawLimit?: unknown): StockSearchResult[] {
  const q = normalizeStockSearchQuery(rawQuery);
  if (!q) return [];

  const limit = normalizeLimit(rawLimit);
  const prefix = `${escapeLike(q)}%`;
  const contains = `%${escapeLike(q)}%`;
  const rows = all<StockSearchRow>(`
    WITH candidates AS (
      SELECT 1 AS priority, 'symbol_prefix' AS match_type, ts_code, symbol, name, market
      FROM stock_search_index
      WHERE symbol LIKE ? ESCAPE '\\'
      UNION ALL
      SELECT 2 AS priority, 'ts_code_prefix' AS match_type, ts_code, symbol, name, market
      FROM stock_search_index
      WHERE LOWER(ts_code) LIKE ? ESCAPE '\\'
      UNION ALL
      SELECT 3 AS priority, 'pinyin_prefix' AS match_type, ts_code, symbol, name, market
      FROM stock_search_index
      WHERE pinyin_full LIKE ? ESCAPE '\\'
      UNION ALL
      SELECT 4 AS priority, 'initials_prefix' AS match_type, ts_code, symbol, name, market
      FROM stock_search_index
      WHERE pinyin_initials LIKE ? ESCAPE '\\'
      UNION ALL
      SELECT 5 AS priority, 'name_contains' AS match_type, ts_code, symbol, name, market
      FROM stock_search_index
      WHERE name LIKE ? ESCAPE '\\'
    ), ranked AS (
      SELECT candidates.*,
             ROW_NUMBER() OVER (PARTITION BY ts_code ORDER BY priority ASC) AS rn
      FROM candidates
    )
    SELECT ts_code, symbol, name, market, match_type
    FROM ranked
    WHERE rn = 1
    ORDER BY priority ASC, symbol ASC
    LIMIT ?
  `, [prefix, prefix, prefix, prefix, contains, limit]);

  if (!rows.length && !warnedEmptyIndex) {
    const count = one<{ count: number }>('SELECT COUNT(*) AS count FROM stock_search_index')?.count ?? 0;
    if (count === 0) {
      warnedEmptyIndex = true;
      console.warn('stock_search_index is empty; run npm run index:stocks before using stock suggestions.');
    }
  }

  return rows.map((row) => ({
    tsCode: row.ts_code,
    symbol: row.symbol,
    name: row.name,
    market: row.market ?? undefined,
    matchType: row.match_type,
  }));
}
