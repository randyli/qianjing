import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Database, FileText } from 'lucide-react';
import { api } from '../../api';
import type { PeBandData } from '../../types';
import { PeBandChart } from '../charts/PeBandChart';
import { PeBandControls } from '../charts/PeBandControls';
import { PeBandSummary } from '../charts/PeBandSummary';

function parseMultiples(value: string) {
  return value.split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function warningLabel(code: string) {
  const labels: Record<string, string> = {
    pe_ttm_missing: '部分交易日缺少 pe_ttm，已跳过不可计算点。',
    pe_ttm_non_positive: '部分交易日 pe_ttm 小于或等于 0，已剔除。',
    income_missing: '缺少部分财报 EPS，财报节点可能不完整。',
    stale_cache: 'Tushare 拉取失败，当前展示过期缓存数据。',
    range_clipped: '查询区间超出上市日期或未来日期，已裁剪到可用范围。',
  };
  return labels[code] ?? code;
}

function PeBandDataTable({ data }: { data: PeBandData }) {
  const rows = useMemo(() => data.series.slice(-30).reverse(), [data.series]);
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-100"><Database className="h-5 w-5 text-indigo-400" />底层数据表</h3>
          <p className="mt-1 text-sm text-slate-500">展示最近 30 个可计算交易日，完整数据由接口返回。</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-500">
            <tr className="border-b border-slate-800">
              <th className="px-3 py-3 text-left">交易日</th>
              <th className="px-3 py-3 text-right">收盘价</th>
              <th className="px-3 py-3 text-right">TTM EPS</th>
              <th className="px-3 py-3 text-right">TTM PE</th>
              {data.multiples.map((multiple) => <th key={multiple} className="px-3 py-3 text-right">{multiple}x</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {rows.map((row) => (
              <tr key={row.tradeDate} className="text-slate-300 hover:bg-slate-800/30">
                <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-400">{row.tradeDate}</td>
                <td className="px-3 py-3 text-right font-mono">{row.close.toFixed(2)}</td>
                <td className="px-3 py-3 text-right font-mono">{row.ttmEps.toFixed(2)}</td>
                <td className="px-3 py-3 text-right font-mono">{row.peTtm.toFixed(2)}</td>
                {data.multiples.map((multiple) => <td key={multiple} className="px-3 py-3 text-right font-mono">{row.bands[String(multiple)]?.toFixed(2)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MarketTools() {
  const [tsCode, setTsCode] = useState('600519.SH');
  const [range, setRange] = useState('5y');
  const [multiplesText, setMultiplesText] = useState('15,20,25,30');
  const [data, setData] = useState<PeBandData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getPeBand({ tsCode, range, multiples: parseMultiples(multiplesText) });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PE 通道数据加载失败。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">Research Tools</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-100">A 股 PE 通道图</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              使用 Tushare Pro 的 daily_basic 与 income 数据，展示历史收盘价、TTM EPS、TTM PE 与固定 PE 倍数之间的关系。
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            仅用于历史数据和估值倍数展示，不构成任何投资建议或交易依据。
          </div>
        </div>
        <PeBandControls
          tsCode={tsCode}
          range={range}
          multiplesText={multiplesText}
          loading={loading}
          onTsCodeChange={setTsCode}
          onRangeChange={setRange}
          onMultiplesTextChange={setMultiplesText}
          onSubmit={loadData}
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading && !data && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">正在生成 PE 通道图...</div>}

      {data && (
        <>
          <PeBandSummary data={data} />
          {data.warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              <div className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />数据提示</div>
              <ul className="list-disc space-y-1 pl-5">
                {data.warnings.map((warning) => <li key={warning}>{warningLabel(warning)}</li>)}
              </ul>
            </div>
          )}
          <PeBandChart data={data} />
          <PeBandDataTable data={data} />
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-sm leading-6 text-slate-400">
            <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-200"><FileText className="h-5 w-5 text-cyan-400" />数据口径与免责声明</h3>
            <p>TTM EPS = daily_basic.close / daily_basic.pe_ttm；固定 PE 通道价格 = TTM EPS × PE 倍数。pe_ttm 缺失或小于等于 0 的交易日不参与通道计算。</p>
            <p className="mt-2">数据来源为 Tushare Pro。PE 通道图仅用于展示历史价格、TTM EPS 与固定 PE 倍数之间的关系，不构成任何投资建议或交易依据。</p>
          </div>
        </>
      )}
    </div>
  );
}
