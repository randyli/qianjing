import React, { useEffect, useState } from 'react';
import { Search, Filter, Lock } from 'lucide-react';
import { api } from '../../api';
import { Report } from '../../types';

interface ResearchProps {
  onSelectReport?: (id: string) => void;
  searchTerm: string;
  onSearch: (term: string) => void;
}

export function Research({ onSelectReport, searchTerm, onSearch }: ResearchProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listReports(searchTerm)
      .then((items) => {
        if (!cancelled) {
          setReports(items);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">AI 深度挖掘</h1>
          <p className="text-slate-400 mt-1">覆盖微观和宏观经济转变的生成式分析。</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="搜索报告..." 
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}
      {loading && <div className="text-sm text-slate-500">正在从后台 API 加载研报...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div 
            key={report.id} 
            onClick={() => onSelectReport?.(report.id)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/30 transition-all group flex flex-col h-full cursor-pointer relative overflow-hidden"
          >
            {report.isPremium && (
              <div className="absolute top-4 right-4 text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
            )}
            
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 rounded">
                {report.sector}
              </span>
              <span className="text-xs text-slate-500">{report.date}</span>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-100 mb-3 group-hover:text-indigo-300 transition-colors">
              {report.title}
            </h3>
            
            <p className="text-sm text-slate-400 flex-1 leading-relaxed mb-6">
              {report.summary}
            </p>
            
            <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between">
              {report.ticker ? (
                <span className="text-xs font-mono text-slate-500 border border-slate-800 px-2 py-1 rounded">
                  ${report.ticker}
                </span>
              ) : (
                <span className="text-xs text-slate-600">宏观分析</span>
              )}
              
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                report.impact === 'positive' ? 'text-emerald-400 bg-emerald-400/10' : 
                report.impact === 'negative' ? 'text-rose-400 bg-rose-400/10' : 
                'text-slate-400 bg-slate-800'
              }`}>
                {report.impact === 'positive' ? '看涨前景' : report.impact === 'negative' ? '看跌前景' : '中性前景'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!loading && reports.length === 0 && <div className="text-sm text-slate-500">没有找到匹配的研报。</div>}
    </div>
  );
}
