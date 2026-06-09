import React from 'react';
import { Search, Filter, Lock } from 'lucide-react';
import { mockReports } from '../../mockData';

interface ResearchProps {
  onSelectReport?: (id: string) => void;
  searchTerm: string;
  onSearch: (term: string) => void;
}

type ResearchReport = (typeof mockReports)[number] & {
  companyName?: string;
  isDemo?: boolean;
  valuation?: unknown;
  financials?: unknown;
};

const companyNameByTicker: Record<string, string> = {
  NVDA: '英伟达',
  '300750.SZ': '宁德时代',
  ICLN: 'iShares全球清洁能源ETF',
  '600519.SH': '贵州茅台',
  '002594.SZ': '比亚迪',
  '0700.HK': '腾讯控股',
  XBI: 'SPDR生物科技ETF',
};

const valueInvestingReportIds = new Set(['1', '5', '6', '7', '8']);
const demoReportIds = new Set(mockReports.map((report) => report.id));

const getCompanyName = (report: ResearchReport) =>
  report.companyName || (report.ticker ? companyNameByTicker[report.ticker.toUpperCase()] : undefined);

const isAStock = (ticker?: string) => {
  const normalizedTicker = ticker?.toUpperCase();
  return normalizedTicker?.endsWith('.SH') || normalizedTicker?.endsWith('.SZ');
};

const hasValueInvestingData = (report: ResearchReport) =>
  Boolean(report.valuation || report.financials || valueInvestingReportIds.has(report.id));

const isDemoReport = (report: ResearchReport) =>
  Boolean(report.isDemo || report.summary.includes('演示样例') || demoReportIds.has(report.id));

export function Research({ onSelectReport, searchTerm, onSearch }: ResearchProps) {
  const filteredReports = mockReports.filter((report) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      report.title.toLowerCase().includes(term) ||
      report.sector.toLowerCase().includes(term) ||
      report.ticker?.toLowerCase().includes(term) ||
      getCompanyName(report)?.toLowerCase().includes(term) ||
      report.summary.toLowerCase().includes(term)
    );
  });

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
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
            
            <div className="flex flex-wrap items-center gap-2 mb-4 pr-6">
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 rounded">
                {report.sector}
              </span>
              {isAStock(report.ticker) && (
                <span className="px-2 py-1 text-[10px] font-bold tracking-wider bg-red-500/10 text-red-300 border border-red-500/20 rounded">
                  A股
                </span>
              )}
              {hasValueInvestingData(report) && (
                <span className="px-2 py-1 text-[10px] font-bold tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                  价值投资
                </span>
              )}
              {isDemoReport(report) && (
                <span className="px-2 py-1 text-[10px] font-bold tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">
                  演示样例
                </span>
              )}
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
    </div>
  );
}
