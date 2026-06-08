import React from 'react';
import { Bell, Plus, Check } from 'lucide-react';
import { mockAlerts } from '../../mockData';
import { cn } from '../../utils';

export function Alerts() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">智能预警配置</h1>
        <p className="text-slate-400 mt-1">为您关心的板块和情绪设置自定义的AI驱动通知。</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">活跃板块触发器</h2>
            <p className="text-sm text-slate-500">当情绪得分越界您配置的阈值时，将会触发预警。</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            新建预警
          </button>
        </div>

        <div className="divide-y divide-slate-800">
          {mockAlerts.map(alert => (
            <div key={alert.id} className="p-6 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
              <div className="flex items-center space-x-4">
                <button 
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
                 <button className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors">
                   编辑
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
