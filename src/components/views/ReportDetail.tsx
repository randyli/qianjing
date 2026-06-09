import React from 'react';
import { ArrowLeft, Lock, Share2, BookmarkPlus, Calendar, Box } from 'lucide-react';
import Markdown from 'react-markdown';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Report } from '../../types';

interface ReportDetailProps {
  report: Report;
  onBack: () => void;
}

const chartTextColor = '#94a3b8';
const gridColor = '#1e293b';

export function ReportDetail({ report, onBack }: ReportDetailProps) {
  // Use abstract content if none provided
  const contentToRender = report.content || `## 数据收集中\n\nAI引擎正在生成更详尽的深度分析报告，请稍后再来查看完整内容。\n\n**摘要回顾:**\n${report.summary}`;
  const hasValuationData = Boolean(report.valuationData?.length);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          {report.isPremium ? (
            <div className="space-y-8">
              {hasValuationData && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 sm:p-6 not-prose">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-100">股价拆分：EPS × PE</h2>
                      <p className="text-sm text-slate-400 mt-1">柱状图为每股收益，折线图拆解股价与隐含市盈率变化。</p>
                    </div>
                    <span className="text-xs text-slate-500">单位：股价/ EPS 为元，PE 为倍</span>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="h-[330px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report.valuationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="year" tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                            formatter={(value, name) => [Number(value).toFixed(2), name === 'eps' ? 'EPS' : name]}
                            labelStyle={{ color: '#cbd5e1' }}
                          />
                          <Bar dataKey="eps" name="EPS" fill="#818cf8" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-[330px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={report.valuationData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="year" tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="left" tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                            formatter={(value, name) => [Number(value).toFixed(2), name === 'price' ? '股价' : 'PE']}
                            labelStyle={{ color: '#cbd5e1' }}
                          />
                          <Legend wrapperStyle={{ color: chartTextColor, fontSize: 12 }} />
                          <Line yAxisId="left" type="monotone" dataKey="price" name="股价" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          <Line yAxisId="right" type="monotone" dataKey="pe" name="PE" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {report.valuationNote && (
                    <p className="mt-4 text-xs leading-relaxed text-slate-500">{report.valuationNote}</p>
                  )}
                </div>
              )}

              <div className="prose prose-invert prose-slate max-w-none prose-headings:text-slate-100 prose-a:text-indigo-400 prose-p:text-slate-300 prose-strong:text-slate-200">
                 <div className="markdown-body">
                   <Markdown>{contentToRender}</Markdown>
                 </div>
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
