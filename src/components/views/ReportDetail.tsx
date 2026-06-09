import React from 'react';
import { ArrowLeft, Lock, Share2, BookmarkPlus, Calendar, Box } from 'lucide-react';
import Markdown from 'react-markdown';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Report, ValuationPoint } from '../../types';

const formatNumber = (value?: number | string, options: Intl.NumberFormatOptions = {}) => {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const numericValue = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    ...options,
  }).format(numericValue);
};

const formatPrice = (value?: number | string) => formatNumber(value);

const formatUpside = (value?: number | string) => {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const numericValue = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  const percentValue = Math.abs(numericValue) <= 1 ? numericValue * 100 : numericValue;
  return `${percentValue > 0 ? '+' : ''}${formatNumber(percentValue)}%`;
};

const getValuationChartData = (valuation?: ValuationPoint[]) => (
  valuation?.filter((point): point is ValuationPoint => Boolean(point?.year)) ?? []
);

interface ReportDetailProps {
  report: Report;
  onBack: () => void;
}

export function ReportDetail({ report, onBack }: ReportDetailProps) {
  // Use abstract content if none provided
  const contentToRender = report.content || `## 数据收集中\n\nAI引擎正在生成更详尽的深度分析报告，请稍后再来查看完整内容。\n\n**摘要回顾:**\n${report.summary}`;
  const valuationChartData = getValuationChartData(report.valuation);
  const hasValuationData = Boolean(report.valuation) && (
    valuationChartData.length > 0 ||
    report.currentPrice !== undefined ||
    report.targetPrice !== undefined ||
    report.upside !== undefined ||
    Boolean(report.rating)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center text-sm font-medium text-slate-400 hover:text-indigo-400 py-2 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回上一页
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 rounded flex items-center">
            <Box className="w-3 h-3 mr-1.5" />
            {report.sector}
          </span>
          {report.ticker && (
            <span className="text-sm font-mono text-slate-400 border border-slate-700 px-3 py-1 rounded bg-slate-950">
              ${report.ticker}
            </span>
          )}
          <span className="text-sm text-slate-500 flex items-center bg-slate-950/50 px-3 py-1 pb-1 rounded border border-transparent">
            <Calendar className="w-4 h-4 mr-1.5" />
            {report.date}
          </span>
          
          <div className="ml-auto flex items-center space-x-2">
             <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700">
               <Share2 className="w-4 h-4" />
             </button>
             <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700">
               <BookmarkPlus className="w-4 h-4" />
             </button>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-6 leading-tight">
          {report.title}
        </h1>

        <div className="flex items-center space-x-4 pb-8 border-b border-slate-800">
          <div className="flex items-center space-x-3 pr-4 border-r border-slate-800">
             <div className="w-10 h-10 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
               <span className="text-indigo-400 font-bold text-sm">AI</span>
             </div>
             <div>
               <p className="text-sm font-medium text-slate-200">FinSight 核心算法</p>
               <p className="text-xs text-slate-500">自动生成</p>
             </div>
          </div>
          
          <div>
             <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                report.impact === 'positive' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-500/20' : 
                report.impact === 'negative' ? 'text-rose-400 bg-rose-400/10 border border-rose-500/20' : 
                'text-slate-400 bg-slate-800 border border-slate-700'
              }`}>
                {report.impact === 'positive' ? '看涨前景' : report.impact === 'negative' ? '看跌前景' : '中性前景'}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-8 relative">

          {hasValuationData && (
            <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400">Valuation Bridge</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-100">估值拆解：Price = EPS × PE</h2>
                  <p className="mt-2 text-sm text-slate-400">拆分盈利预测与估值倍数，快速定位目标价变化的核心驱动。</p>
                </div>
                {report.ticker && (
                  <span className="w-fit rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                    {report.ticker}
                  </span>
                )}
              </div>

              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs font-medium text-slate-500">当前价格</p>
                  <p className="mt-2 text-2xl font-bold text-slate-100">{formatPrice(report.currentPrice)}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs font-medium text-slate-500">目标价格</p>
                  <p className="mt-2 text-2xl font-bold text-indigo-300">{formatPrice(report.targetPrice)}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs font-medium text-slate-500">潜在空间</p>
                  <p className={`mt-2 text-2xl font-bold ${String(report.upside ?? '').startsWith('-') ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatUpside(report.upside)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs font-medium text-slate-500">评级</p>
                  <p className="mt-2 text-2xl font-bold text-slate-100">{report.rating ?? '—'}</p>
                </div>
              </div>

              {valuationChartData.length > 0 && (
                <div className="h-[360px] rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={valuationChartData} margin={{ top: 12, right: 8, bottom: 8, left: 0 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="year"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        dy={10}
                      />
                      <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickFormatter={(value) => formatNumber(value)}
                        label={{ value: 'EPS / 股价', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickFormatter={(value) => `${formatNumber(value)}x`}
                        label={{ value: 'PE', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f1f5f9' }}
                        labelStyle={{ color: '#cbd5e1', fontWeight: 700 }}
                        itemStyle={{ color: '#cbd5e1' }}
                        formatter={(value, name) => {
                          const labelMap: Record<string, string> = { eps: 'EPS', pe: 'PE', price: 'Price' };
                          const formattedValue = name === 'pe' ? `${formatNumber(value as number)}x` : formatNumber(value as number);
                          return [formattedValue, labelMap[String(name)] ?? String(name)];
                        }}
                      />
                      <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12, paddingTop: 12 }} />
                      <Bar yAxisId="left" dataKey="price" name="Price" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={42} />
                      <Line yAxisId="left" type="monotone" dataKey="eps" name="EPS" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} />
                      <Line yAxisId="right" type="monotone" dataKey="pe" name="PE" stroke="#fb7185" strokeWidth={3} dot={{ r: 4, fill: '#fb7185', strokeWidth: 0 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          )}
          {report.isPremium ? (
            <div className="prose prose-invert prose-slate max-w-none prose-headings:text-slate-100 prose-a:text-indigo-400 prose-p:text-slate-300 prose-strong:text-slate-200">
               <div className="markdown-body">
                 <Markdown>{contentToRender}</Markdown>
               </div>
            </div>
          ) : (
            <div className="prose prose-invert prose-slate max-w-none relative">
               <div className="markdown-body blur-[4px] select-none opacity-40">
                 <Markdown>{contentToRender}</Markdown>
               </div>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm">
                   <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Lock className="w-8 h-8 text-amber-400" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-100 mb-2">需要专业版权限</h3>
                   <p className="text-slate-400 text-sm mb-6">升级至Pro计划以解锁完整的AI深度分析模型和实时参数预测。</p>
                   <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors">
                     立即升级
                   </button>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
