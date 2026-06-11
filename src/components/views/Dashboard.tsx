import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, ChevronRight, Zap, BookOpen, BellRing, Star, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../api';
import { AlertTrigger, Report, SectorAlert, SentimentData } from '../../types';
import { cn } from '../../utils';

interface DashboardProps {
  onSelectReport?: (id: string) => void;
}

export function Dashboard({ onSelectReport }: DashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>(['300750.SZ', '600519.SH', '002594.SZ', '0700.HK']);
  const [newTicker, setNewTicker] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData[]>([]);
  const [alerts, setAlerts] = useState<SectorAlert[]>([]);
  const [triggers, setTriggers] = useState<AlertTrigger[]>([]);

  useEffect(() => {
    setMounted(true);
    api.listReports().then(setReports).catch(() => setReports([]));
    api.getSentimentPoints().then(setSentiment).catch(() => setSentiment([]));
    api.listAlerts().then(setAlerts).catch(() => setAlerts([]));
    api.getAlertTriggers().then(setTriggers).catch(() => setTriggers([]));
  }, []);

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTicker.trim() && !watchlist.includes(newTicker.trim().toUpperCase())) {
      setWatchlist([...watchlist, newTicker.trim().toUpperCase()]);
      setNewTicker('');
    }
  };

  const topReports = reports.slice(0, 2);
  const activeAlerts = alerts.filter(a => a.enabled).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">全球 AI 情绪</h3>
            <span className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-100">88.5</span>
            <span className="text-sm font-medium text-emerald-400">+4.2%</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">今日聚合自 10k+ 信息源</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">生成的洞察总数</h3>
            <span className="p-2 bg-indigo-500/10 rounded-lg">
              <Zap className="w-4 h-4 text-indigo-400" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-100">1,248</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">过去24小时内的新深度报告</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">活跃板块预警</h3>
            <span className="p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-100">{alerts.filter(a => a.enabled).length}</span>
            <span className="text-sm font-medium text-slate-500">个板块追踪中</span>
          </div>
          <div className="flex mt-2 space-x-1">
            {activeAlerts.map(alert => (
              <span key={alert.id} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {alert.sector}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">日内市场情绪</h2>
            <p className="text-sm text-slate-400">针对新闻、财报电话会议和社交传播的实时NLP分析。</p>
          </div>
          <div className="flex space-x-2">
            {['1天', '1周', '1月', '3月'].map((t, i) => (
              <button
                key={t}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  i === 0 ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentiment} margin={{ top: 10, left: -20, right: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#818cf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">图表加载中...</div>
          )}
        </div>
      </div>

      {/* Two Column Layout for Reports & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Reports */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-400" />
              最新 AI 研究
            </h2>
            <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center">
              查看全部 <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="space-y-4">
            {topReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onSelectReport?.(report.id)}
                className="p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 rounded">
                      {report.sector}
                    </span>
                    {report.ticker && (
                      <span className="text-xs font-mono text-slate-400">
                        ${report.ticker}
                      </span>
                    )}
                  </div>
                  {report.impact === 'positive' ? (
                     <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">看涨</span>
                  ) : report.impact === 'negative' ? (
                     <span className="text-xs font-medium text-rose-400 bg-rose-400/10 px-2 py-1 rounded">看跌</span>
                  ) : (
                     <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded">中性</span>
                  )}
                </div>
                <h3 className="font-medium text-slate-200 mb-2 group-hover:text-indigo-300 transition-colors">{report.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{report.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center">
              <BellRing className="w-5 h-5 mr-2 text-amber-400" />
              触发的预警
            </h2>
          </div>

          <div className="space-y-4">
            {triggers.slice(0, 3).map((trigger) => (
              <div key={trigger.id} className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-medium text-amber-300 mb-1">{trigger.targetKey} / {trigger.score}</h4>
                    <p className="text-sm text-slate-300">{trigger.message}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{new Date(trigger.triggeredAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {triggers.length === 0 && <div className="text-sm text-slate-500">暂无触发历史，可在智能预警页面扫描生成。</div>}
            <button className="w-full py-3 border border-slate-700 border-dashed rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors flex items-center justify-center">
              配置新的预警条件
            </button>
          </div>
        </div>
      </div>

      {/* Watchlist Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center">
            <Star className="w-5 h-5 mr-2 text-amber-400" />
            自选股监控
          </h2>

          <form onSubmit={handleAddTicker} className="flex items-center space-x-2">
            <input
              type="text"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              placeholder="添加代码 (如: 600519.SH)"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
            />
            <button type="submit" className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {watchlist.map(ticker => {
            const report = reports.find(r => r.ticker === ticker);
            return (
              <div
                key={ticker}
                onClick={() => report && onSelectReport?.(report.id)}
                className={cn(
                  "p-4 rounded-lg border flex flex-col justify-between transition-colors",
                  report ? "bg-slate-950 border-slate-800 hover:border-indigo-500/50 cursor-pointer group" : "bg-slate-900 border-slate-800/50 opacity-60"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-bold text-slate-200">{ticker}</span>
                  {report && (
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded uppercase font-bold",
                      report.impact === 'positive' ? "bg-emerald-500/20 text-emerald-400" :
                      report.impact === 'negative' ? "bg-rose-500/20 text-rose-400" :
                      "bg-slate-800 text-slate-400"
                    )}>
                      {report.impact === 'positive' ? '看涨' : report.impact === 'negative' ? '看跌' : '中性'}
                    </span>
                  )}
                </div>
                {report ? (
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 group-hover:text-slate-300 transition-colors">
                    {report.title}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1 italic">
                    AI引擎正在收集中...
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
