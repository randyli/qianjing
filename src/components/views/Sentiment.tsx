import React, { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Minus, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../api';
import { SentimentData, SentimentEvent } from '../../types';

export function Sentiment() {
  const [sentiment, setSentiment] = useState<SentimentData[]>([]);
  const [sectors, setSectors] = useState<Array<{ name: string; score: number; trend: number }>>([]);
  const [events, setEvents] = useState<SentimentEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [jobMessage, setJobMessage] = useState<string | null>(null);

  const loadSentiment = () => {
    api.getSentimentPoints().then(setSentiment).catch(() => setSentiment([]));
    api.getSentimentOverview().then((overview) => setSectors(overview.sectors)).catch(() => setSectors([]));
    api.getSentimentEvents().then(setEvents).catch(() => setEvents([]));
  };

  useEffect(() => {
    loadSentiment();
  }, []);

  const handleRecalculate = async () => {
    setRunning(true);
    setJobMessage(null);
    try {
      const job = await api.recalculateSentiment({ source: 'sentiment_view' });
      setJobMessage(`任务 ${job.id.slice(0, 8)} 已完成，新增 ${job.result?.triggersCreated ?? 0} 条触发记录。`);
      loadSentiment();
    } catch (error) {
      setJobMessage(error instanceof Error ? error.message : '情绪重算失败。');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">实时情绪引擎</h1>
          <p className="text-slate-400 mt-1">每天聚合超过1,400万份文档中的自然语言信号。</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRecalculate}
            disabled={running}
            className="flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {running ? '正在重算...' : '重算情绪并记录任务'}
          </button>
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
            {['24小时', '7天', '30天', '本年迄今'].map((t, i) => (
              <button key={t} className={`px-4 py-1.5 text-sm font-medium rounded-md ${i === 0 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {jobMessage && <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm text-indigo-200">{jobMessage}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-100 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-indigo-400" />
            全球情绪漂移 (24h)
          </h2>
          <div className="flex-1 min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentiment} margin={{ top: 10, left: -20, right: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Area type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorGlobal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">板块细分</h2>
          <div className="space-y-4">
            {[...sectors].sort((a,b) => b.score - a.score).map((sector) => (
              <div key={sector.name} className="flex flex-col p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-slate-200">{sector.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-slate-100">{sector.score}</span>
                    {sector.trend > 5 ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    ) : sector.trend < -5 ? (
                      <ArrowDownRight className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      sector.score >= 60 ? 'bg-emerald-500' :
                      sector.score <= 40 ? 'bg-rose-500' :
                      'bg-amber-500'
                    }`}
                    style={{ width: `${sector.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">情绪事件解释</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">{event.targetKey}</span>
                <span className={event.scoreDelta >= 0 ? 'text-sm font-mono text-emerald-400' : 'text-sm font-mono text-rose-400'}>
                  {event.scoreDelta >= 0 ? '+' : ''}{event.scoreDelta}
                </span>
              </div>
              <h3 className="font-medium text-slate-100">{event.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{event.reason}</p>
              <p className="mt-3 text-xs text-slate-600">{new Date(event.occurredAt).toLocaleString()}</p>
            </div>
          ))}
          {events.length === 0 && <div className="text-sm text-slate-500">暂无情绪事件。</div>}
        </div>
      </div>
    </div>
  );
}
