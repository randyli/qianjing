import 'dotenv/config';
import { config } from '../../../config';
import { db, nowIso } from '../../../db/client';
import { migrate } from '../../../db/schema';
import { toPinyinFull, toPinyinInitials } from '../pinyin';
import { fetchFreshTushareRows, TushareError, type TushareRow } from '../tushareClient';

interface IndexedStock {
  tsCode: string;
  symbol: string;
  name: string;
  market: string | null;
  listDate: string | null;
  pinyinFull: string;
  pinyinInitials: string;
}

function asStr(value: unknown) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim();
}

function isRegularAStock(row: TushareRow) {
  const tsCode = asStr(row.ts_code).toUpperCase();
  const symbol = asStr(row.symbol);
  const name = asStr(row.name);
  return /^\d{6}\.(SH|SZ|BJ)$/.test(tsCode) && /^\d{6}$/.test(symbol) && name.length > 0;
}

function toIndexedStock(row: TushareRow): IndexedStock | null {
  const tsCode = asStr(row.ts_code).toUpperCase();
  const symbol = asStr(row.symbol);
  const name = asStr(row.name);
  const pinyinFull = toPinyinFull(name);
  const pinyinInitials = toPinyinInitials(name);
  if (!pinyinFull || !pinyinInitials) return null;
  return {
    tsCode,
    symbol,
    name,
    market: asStr(row.market) || null,
    listDate: asStr(row.list_date) || null,
    pinyinFull,
    pinyinInitials,
  };
}

async function main() {
  if (!config.tushareToken) {
    throw new TushareError('tushare_not_configured', 'TUSHARE_TOKEN 未配置，无法构建股票搜索索引。', 500);
  }

  migrate();
  const fields = ['ts_code', 'symbol', 'name', 'area', 'industry', 'market', 'list_date'];
  const result = await fetchFreshTushareRows('stock_basic', { exchange: '', list_status: 'L' }, fields, config.marketDataFinancialTtlHours);
  const rows = result.rows;
  const fetched = rows.length;
  let skipped = 0;
  const stocks: IndexedStock[] = [];

  for (const row of rows) {
    if (!isRegularAStock(row)) {
      skipped += 1;
      continue;
    }

    try {
      const stock = toIndexedStock(row);
      if (stock) stocks.push(stock);
      else skipped += 1;
    } catch {
      skipped += 1;
    }
  }

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
  const updatedAt = nowIso();

  db.exec('BEGIN');
  try {
    for (const stock of stocks) {
      statement.run(stock.tsCode, stock.symbol, stock.name, stock.market, stock.listDate, stock.pinyinFull, stock.pinyinInitials, updatedAt);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  console.log('Indexed stock search table');
  console.log(`- fetched: ${fetched}`);
  console.log(`- upserted: ${stocks.length}`);
  console.log(`- skipped: ${skipped}`);
  console.log(`- database: ${config.databaseUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
