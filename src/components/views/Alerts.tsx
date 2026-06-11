import React, { useEffect, useState } from 'react';
import { Bell, Plus, Check, Trash2, Save } from 'lucide-react';
import { api } from '../../api';
import { AlertTrigger, SectorAlert } from '../../types';
import { cn } from '../../utils';

export function Alerts() {
  const [alerts, setAlerts] = useState<SectorAlert[]>([]);
  const [triggers, setTriggers] = useState<AlertTrigger[]>([]);
  const [newSector, setNewSector] = useState('科技');
  const [newThreshold, setNewThreshold] = useState(40);
  const [newDirection, setNewDirection] = useState<'above' | 'below'>('below');
  const [message, setMessage] = useState<string | null>(null);

  const loadAlerts = () => {
    api.listAlerts().then(setAlerts).catch(() => setAlerts([]));
    api.getAlertTriggers().then(setTriggers).catch(() => setTriggers([]));
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const toggleAlert = async (alert: SectorAlert) => {
    const updated = await api.updateAlert(alert.id, { enabled: !alert.enabled });
    setAlerts((items) => items.map((item) => item.id === alert.id ? { ...item, ...updated } : item));
  };

  const updateAlert = async (alert: SectorAlert, patch: Partial<SectorAlert>) => {
    const updated = await api.updateAlert(alert.id, patch);
    setAlerts((items) => items.map((item) => item.id === alert.id ? { ...item, ...updated } : item));
    setMessage(`${updated.sector} 预警已更新。`);
  };

  const deleteAlert = async (alert: SectorAlert) => {
    await api.deleteAlert(alert.id);
    setAlerts((items) => items.filter((item) => item.id !== alert.id));
    setTriggers((items) => items.filter((item) => item.alertId !== alert.id));
    setMessage(`${alert.sector} 预警已删除。`);
  };

  const createAlert = async (event: React.FormEvent) => {
    event.preventDefault();
    const created = await api.createAlert({ sector: newSector, enabled: true, threshold: newThreshold, direction: newDirection });
    setAlerts((items) => [created, ...items]);
    setNewSector('科技');
    setNewThreshold(40);
    setNewDirection('below');
    setMessage(`${created.sector} 预警已创建。`);
  };

  const recalculateTriggers = async () => {
    const job = await api.recalculateSentiment({ source: 'alerts_view' });
    setMessage(`情绪扫描完成，新增 ${job.result?.triggersCreated ?? 0} 条触发记录。`);
    api.getAlertTriggers().then(setTriggers).catch(() => setTriggers([]));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">智能预警配置</h1>
          <p className="text-slate-400 mt-1">为您关心的板块和情绪设置自定义的AI驱动通知。</p>
        </div>
        <button onClick={recalculateTriggers} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-indigo-500/50 hover:text-indigo-300">
          扫描并生成触发历史
        </button>
      </div>

      {message && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col gap-4 bg-slate-900/50 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">活跃板块触发器</h2>
            <p className="text-sm text-slate-500">当情绪得分越界您配置的阈值时，将会触发预警。</p>
          </div>
          <form onSubmit={createAlert} className="flex flex-wrap items-center gap-2">
            <input value={newSector} onChange={(event) => setNewSector(event.target.value)} className="w-28 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200" />
            <select value={newDirection} onChange={(event) => setNewDirection(event.target.value as 'above' | 'below')} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200">
              <option value="below">跌破</option>
              <option value="above">高于</option>
            </select>
            <input type="number" min={0} max={100} value={newThreshold} onChange={(event) => setNewThreshold(Number(event.target.value))} className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200" />
            <button className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              新建预警
            </button>
          </form>
        </div>

        <div className="divide-y divide-slate-800">
          {alerts.map(alert => (
            <div key={alert.id} className="p-6 flex flex-col gap-4 hover:bg-slate-800/20 transition-colors md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => toggleAlert(alert)}
                  className={cn(
                    'w-12 h-6 rounded-full relative transition-colors duration-200',
                    alert.enabled ? 'bg-indigo-500' : 'bg-slate-700'
                  )}
                >
                  <span className={cn(
                    'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200',
                    alert.enabled ? 'translate-x-6' : 'translate-x-0'
                  )} />
                </button>
                <div>
                  <h3 className="font-medium text-slate-200">{alert.sector}</h3>
                  <p className="text-sm text-slate-500">
                    当情绪{(alert.direction ?? 'below') === 'below' ? '跌破' : '高于'} {alert.threshold} 时预警
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={alert.direction ?? 'below'}
                  onChange={(event) => updateAlert(alert, { direction: event.target.value as 'above' | 'below' })}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                >
                  <option value="below">跌破</option>
                  <option value="above">高于</option>
                </select>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={alert.threshold}
                  onChange={(event) => setAlerts((items) => items.map((item) => item.id === alert.id ? { ...item, threshold: Number(event.target.value) } : item))}
                  className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                />
                <button onClick={() => updateAlert(alert, { threshold: alert.threshold })} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100" title="保存阈值">
                  <Save className="h-4 w-4" />
                </button>
                <span className="p-2 text-slate-500 rounded-md flex items-center text-sm">
                  <Check className="w-4 h-4 mr-1" /> 已接入 API
                </span>
                <button onClick={() => deleteAlert(alert)} className="rounded-md p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300" title="删除预警">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {alerts.length === 0 && <div className="p-6 text-sm text-slate-500">暂无预警规则。</div>}
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
          {triggers.length === 0 && <div className="text-sm text-slate-500">暂无触发记录，可点击上方按钮扫描当前情绪。</div>}
        </div>
      </div>
    </div>
  );
}
