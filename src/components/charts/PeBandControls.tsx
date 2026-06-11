import { StockSuggestInput } from '../StockSuggestInput';
interface PeBandControlsProps {
  tsCode: string;
  range: string;
  multiplesText: string;
  loading: boolean;
  onTsCodeChange: (value: string) => void;
  onRangeChange: (value: string) => void;
  onMultiplesTextChange: (value: string) => void;
  onSubmit: () => void;
}

export function PeBandControls({ tsCode, range, multiplesText, loading, onTsCodeChange, onRangeChange, onMultiplesTextChange, onSubmit }: PeBandControlsProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr_1.2fr_auto] lg:items-end">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-300">A 股代码</span>
          <StockSuggestInput value={tsCode} onChange={onTsCodeChange} disabled={loading} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-300">时间范围</span>
          <select
            value={range}
            onChange={(event) => onRangeChange(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-500"
          >
            <option value="3y">近 3 年</option>
            <option value="5y">近 5 年</option>
            <option value="10y">近 10 年</option>
            <option value="1y">近 1 年</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-300">PE 通道倍数</span>
          <input
            value={multiplesText}
            onChange={(event) => onMultiplesTextChange(event.target.value)}
            placeholder="15,20,25,30"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-500"
          />
        </label>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '生成中...' : '生成图表'}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500">支持代码、拼音、首字母或中文名称搜索，也可直接输入 Tushare 标准代码，例如 600519.SH。通道倍数用英文逗号分隔。</p>
    </div>
  );
}
