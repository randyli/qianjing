import React, { useEffect, useState } from 'react';
import { User, BellRing, Monitor, Shield, CreditCard, ChevronRight, LogOut } from 'lucide-react';
import { api } from '../../api';
import type { CurrentUser, UserSettings } from '../../types';
import { cn } from '../../utils';

interface SettingsProps {
  user: CurrentUser | null;
  onLogout: () => void;
}

export function Settings({ user, onLogout }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('account');
  const [settings, setSettings] = useState<UserSettings>({ notificationEmail: user?.email ?? '', dailyDigestEnabled: true, watchlistAlertEnabled: true, theme: 'dark' });
  const [subscriptionEnd, setSubscriptionEnd] = useState('2026-07-08');

  useEffect(() => {
    api.getSettings().then((payload) => {
      if (payload.settings) setSettings(payload.settings);
      if (payload.subscription) setSubscriptionEnd(payload.subscription.currentPeriodEnd.slice(0, 10));
    }).catch(() => undefined);
  }, []);

  const saveSettings = () => {
    api.updateSettings(settings).then((payload) => setSettings(payload.settings)).catch(() => undefined);
  };

  const tabs = [
    { id: 'account', label: '账户', icon: User },
    { id: 'notifications', label: '通知', icon: BellRing },
    { id: 'appearance', label: '外观', icon: Monitor },
    { id: 'billing', label: '订阅与计费', icon: CreditCard },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">设置</h1>
        <p className="text-slate-400 mt-1">管理您的账户体验、通知偏好和订阅与计费。</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-slate-800 text-slate-200" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-slate-300" : "text-slate-500")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        <div className="flex-1">
          {activeTab === 'account' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-slate-100">账户信息</h2>
                <p className="text-sm text-slate-500 mt-1">更新您的个人资料和联系方式。</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xl font-bold">
                    {(user?.displayName || user?.email || '用户').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{user?.displayName ?? '已登录用户'}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <button onClick={onLogout} className="ml-auto flex items-center px-4 py-2 bg-slate-800 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/30 rounded-lg text-sm font-medium text-slate-300 hover:text-rose-300 transition-colors">
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">显示名称</label>
                    <input type="text" value={user?.displayName ?? ''} readOnly className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">电子邮件邮箱地址</label>
                    <input type="email" value={settings.notificationEmail} onChange={(event) => setSettings({ ...settings, notificationEmail: event.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button onClick={saveSettings} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
                    保存更改
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-slate-100">通知偏好</h2>
                <p className="text-sm text-slate-500 mt-1">选择您希望如何接收预警和更新。</p>
              </div>
              <div className="p-6 space-y-6">
                {[
                  { title: '包含最新研报的每日摘要', desc: '每天早晨收到一份由AI生成的市场洞察摘要。', key: 'dailyDigestEnabled' as const },
                  { title: '自选股情绪异动预警', desc: '当自选股情绪得分由于突发新闻大幅波动时接收推送。', key: 'watchlistAlertEnabled' as const },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-200">{item.title}</h3>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                    <button onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })} className={cn(
                      "w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0",
                      settings[item.key] ? "bg-indigo-500" : "bg-slate-700"
                    )}>
                      <span className={cn(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200",
                        settings[item.key] ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                ))}
                <div className="pt-2 flex justify-end">
                  <button onClick={saveSettings} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
                    保存通知设置
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-slate-100">外观</h2>
                <p className="text-sm text-slate-500 mt-1">自定义终羰的视觉体验。</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-indigo-500/50 bg-slate-950 p-4 rounded-xl cursor-pointer">
                    <div className="h-20 bg-slate-900 rounded border border-slate-800 mb-3 flex items-center justify-center">
                       <span className="text-xs text-slate-400">暗色模式 (默认)</span>
                    </div>
                    <p className="text-center text-sm font-medium text-indigo-400">Dark</p>
                  </div>
                  <div className="border border-slate-800 bg-slate-950 p-4 rounded-xl opacity-50 cursor-not-allowed">
                    <div className="h-20 bg-white rounded border border-slate-200 mb-3 flex items-center justify-center">
                       <span className="text-xs text-slate-400">即将推出</span>
                    </div>
                    <p className="text-center text-sm font-medium text-slate-400">Light</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-slate-100">订阅与计费</h2>
                <p className="text-sm text-slate-500 mt-1">管理您的专业版计划。</p>
              </div>
              <div className="p-6">
                 <div className="p-4 border border-indigo-500/30 bg-indigo-500/5 rounded-xl flex items-center justify-between mb-6">
                    <div>
                       <span className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1 block">当前计划</span>
                       <h3 className="text-xl font-bold text-slate-100">FinSight 专业版</h3>
                       <p className="text-sm text-slate-400 mt-1">解锁完整的AI洞察和极速预警。</p>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-bold text-slate-100">¥299<span className="text-sm text-slate-500 font-normal"> / 月</span></p>
                       <p className="text-xs text-slate-500 mt-1">下次续费日期：{subscriptionEnd}</p>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <button className="w-full flex justify-between items-center px-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors group">
                       <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100">更新付款方式</span>
                       <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                    </button>
                    <button className="w-full flex justify-between items-center px-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors group">
                       <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100">查看账单历史</span>
                       <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                    </button>
                    <button className="w-full flex justify-between items-center px-4 py-3 border border-transparent hover:bg-rose-500/10 rounded-lg transition-colors group mt-8">
                       <span className="text-sm font-medium text-rose-500">取消订阅</span>
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
