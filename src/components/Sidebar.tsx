import React from 'react';
import { cn } from '../utils';
import { LayoutDashboard, BookOpen, Activity, Bell, Settings, LogOut } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as View, label: '仪表盘', icon: LayoutDashboard },
    { id: 'research' as View, label: '研究报告', icon: BookOpen },
    { id: 'sentiment' as View, label: '市场情绪', icon: Activity },
    { id: 'alerts' as View, label: '智能预警', icon: Bell },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          FinSight AI
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-indigo-400" : "text-slate-500")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">专业版计划</span>
          </div>
          <p className="text-xs text-slate-400">您已拥有AI洞察和实时情绪数据的完全访问权限。</p>
        </div>
        
        <button 
          onClick={() => onViewChange('settings')}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
        >
          <Settings className="w-5 h-5 text-slate-500" />
          <span>设置</span>
        </button>
        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
          <LogOut className="w-5 h-5 text-slate-500" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
