import { TrendingUp } from 'lucide-react';
import type { PeBandData } from '../../types';

function formatPercent(value: number) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-100">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

export function PeBandSummary({ data }: { data: PeBandData }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-cyan-300">
            <TrendingUp className="h-4 w-4" />
            <span>PE 通道图</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-100">{data.target.name} · {data.target.tsCode}</h2>
          <p className="mt-1 text-sm text-slate-500">交易日区间：{data.range.actualStartDate} - {data.range.actualEndDate}</p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
          {data.source?.cacheHit ? '缓存数据' : '最新拉取'} · Tushare Pro
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="最新收盘价" value={data.metrics.latestClose.toFixed(2)} detail={data.metrics.latestTradeDate} />
        <MetricCard label="TTM EPS" value={data.metrics.latestTtmEps.toFixed(2)} detail="close / pe_ttm" />
        <MetricCard label="TTM PE" value={`${data.metrics.latestPeTtm.toFixed(2)}x`} detail="Tushare daily_basic" />
        <MetricCard label="区间价格变化" value={formatPercent(data.metrics.priceChangePct)} detail="仅描述历史变化" />
        <MetricCard label="区间 EPS 变化" value={formatPercent(data.metrics.ttmEpsChangePct)} detail="基于 TTM EPS" />
      </div>
    </div>
  );
}
