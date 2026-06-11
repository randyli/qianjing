import { useMemo, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PeBandData } from '../../types';

const colors = ['#38bdf8', '#818cf8', '#f59e0b', '#22c55e', '#f472b6', '#a78bfa', '#14b8a6', '#f97316'];
const chartTextColor = '#94a3b8';
const gridColor = '#1e293b';

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
  payload?: unknown;
}

function formatDate(value: string) {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function PeBandTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as { peTtm?: number; ttmEps?: number } | undefined;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-xs shadow-2xl">
      <p className="mb-2 font-semibold text-slate-200">{label ? formatDate(label) : ''}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={`${entry.dataKey}-${entry.name}`} className="flex min-w-40 items-center justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-mono text-slate-200">{Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-slate-800 pt-2 text-slate-400">TTM EPS：{point?.ttmEps?.toFixed(2)} · TTM PE：{point?.peTtm?.toFixed(2)}x</div>
      </div>
    </div>
  );
}

export function PeBandChart({ data }: { data: PeBandData }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const chartData = useMemo(() => data.series.map((point) => ({
    ...point,
    ...Object.fromEntries(Object.entries(point.bands).map(([multiple, value]) => [`band_${multiple}`, value])),
  })), [data.series]);

  const handleLegendClick = (legendItem: { dataKey?: string | number | ((obj: unknown) => unknown) }) => {
    const key = typeof legendItem.dataKey === 'function' ? '' : String(legendItem.dataKey ?? '');
    if (!key) return;
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-100">股价与固定 PE 通道</h3>
          <p className="text-sm text-slate-500">band_price = close / pe_ttm × PE multiple。点击图例可隐藏或显示通道。</p>
        </div>
        <span className="text-xs text-slate-500">点位：{data.series.length}</span>
      </div>
      <div className="h-[520px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="tradeDate"
              tickFormatter={formatDate}
              minTickGap={48}
              tick={{ fill: chartTextColor, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={false} tickLine={false} width={64} />
            <Tooltip content={<PeBandTooltip />} />
            <Legend onClick={handleLegendClick} wrapperStyle={{ color: chartTextColor, fontSize: 12, cursor: 'pointer' }} />
            <Line type="monotone" dataKey="close" name="收盘价" stroke="#e2e8f0" strokeWidth={3} dot={false} activeDot={{ r: 4 }} hide={hidden.has('close')} />
            {data.multiples.map((multiple, index) => {
              const key = `band_${multiple}`;
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={`${multiple}x 通道`}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 3 }}
                  hide={hidden.has(key)}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
