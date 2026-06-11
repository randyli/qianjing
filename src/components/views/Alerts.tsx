import React, { useEffect, useState } from 'react';
import { Bell, Plus, Check } from 'lucide-react';
import { api } from '../../api';
import { SectorAlert } from '../../types';
import { cn } from '../../utils';

export function Alerts() {
  const [alerts, setAlerts] = useState<SectorAlert[]>([]);
  const [triggers, setTriggers] = useState<Array<{ id: string; targetKey: string; score: number; message: string; triggeredAt: string }>>([]);
  const [newSector, setNewSector] = useState('科技');
  const [newThreshold, setNewThreshold] = useState(40);

  useEffect(() => {
    api.listAlerts().then(setAlerts).catch(() => setAlerts([]));
    api.getAlertTriggers().then(setTriggers).catch(() => setTriggers([]));
  }, []);

  const toggleAlert = async (alert: SectorAlert) => {
    const updated = await api.updateAlert(alert.id, { enabled: !alert.enabled });
    setAlerts((items) => items.map((item) => item.id === alert.id ? { ...item, ...updated } : item));
  };

  const createAlert = async (event: React.FormEvent) => {
    event.preventDefault();
    const created = await api.createAlert({ sector: newSector, enabled: true, threshold: newThreshold });
    setAlerts((items) => [created, ...items]);
    setNewSector('科技');
    setNewThreshold(40);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">智能预警配置</h1>
        <p className="text-slate-400 mt-1">为您关心的板块和情绪设置自定义的AI驱动通知。</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col gap-4 bg-slate-900/50 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">活跃板块触发器</h2>
            <p className="text-sm text-slate-500">当情绪得分越界您配置的阈值时，将会触发预警。</p>
          </div>
          <form onSubmit={createAlert} className="flex flex-wrap items-center gap-2">
            <input value={newSector} onChange={(event) => setNewSector(event.target.value)} className="w-28 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200" />
            <input type="number" min={0} max={100} value={newThreshold} onChange={(event) => setNewThreshold(Number(event.target.value))} className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200" />
            <button className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              新建预警
            </button>
          </form>
        </div>

        <div className="divide-y divide-slate-800">
          {alerts.map(alert => (
            <div key={alert.id} className="p-6 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => toggleAlert(alert)}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-colors duration-200",
                    alert.enabled ? "bg-indigo-500" : "bg-slate-700"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200",
                    alert.enabled ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
                
                <div>
                  <h3 className="font-medium text-slate-200">{alert.sector}</h3>
                  <p className="text-sm text-slate-500 flex items-center">
                    当情绪跌破 
                    <span className="inline-block px-2 border border-slate-700 rounded bg-slate-950 mx-1 text-slate-300">
                      {alert.threshold}
                    </span>
                    或每小时飙升 &gt; 15% 时预警
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                 <span className="p-2 text-slate-500 rounded-md flex items-center text-sm">
                   <Check className="w-4 h-4 mr-1" /> 已接入 API
                 </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center"><Bell className="w-5 h-5 mr-2 text-amber-400" />触发历史</h2>
        <div className="space-y-3">
          {triggers.map((trigger) => (
            <div key={trigger.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-200">{trigger.targetKey} / {trigger.score}</span>
                <span className="text-slate-500">{new Date(trigger.triggeredAt).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{trigger.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
