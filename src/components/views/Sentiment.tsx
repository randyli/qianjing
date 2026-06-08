import React from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { mockSentiment } from '../../mockData';

export function Sentiment() {
  const sectors = [
    { name: '科技', score: 82, trend: 5.4 },
    { name: '能源', score: 45, trend: -2.1 },
    { name: '医疗保健', score: 38, trend: -8.5 },
    { name: '金融', score: 65, trend: 1.2 },
    { name: '消费', score: 75, trend: 12.4 },
    { name: '房地产', score: 28, trend: -0.5 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">实时情绪引擎</h1>
          <p className="text-slate-400 mt-1">每天聚合超过1,400万份文档中的自然语言信号。</p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
          {['24小时', '7天', '30天', '本年迄今'].map((t, i) => (
             <button key={t} className={`px-4 py-1.5 text-sm font-medium rounded-md ${i === 0 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                {t}
             </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-100 mb-6 flex items-center">
             <Activity className="w-5 h-5 mr-2 text-indigo-400" />
             全球情绪漂移 (24h)
          </h2>
          <div className="flex-1 min-h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={mockSentiment} margin={{ top: 10, left: -20, right: 0, bottom: 0 }}>
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
             {sectors.sort((a,b) => b.score - a.score).map((sector) => (
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
                   {/* Progress bar representing sentiment (0-100) */}
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
    </div>
  );
}
