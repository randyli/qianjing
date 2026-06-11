import React from 'react';
import { Search, BellRing, LogIn, LogOut, Sparkles } from 'lucide-react';
import type { CurrentUser } from '../types';

interface HeaderProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  user: CurrentUser | null;
  onAuthClick: () => void;
  onLogout: () => void;
}

function getInitials(user: CurrentUser | null) {
  if (!user) return '访';
  const source = user.displayName || user.email;
  return source.slice(0, 2).toUpperCase();
}

export function Header({ searchTerm, onSearch, user, onAuthClick, onLogout }: HeaderProps) {
  return (
    <header className="h-16 px-8 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
      <div className="flex items-center w-96 relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="搜索股票代码、板块或报告..." 
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center text-sm font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
          <Sparkles className="w-4 h-4 mr-2" />
          AI 引擎已激活
        </div>
        
        <button className="relative text-slate-400 hover:text-slate-200 transition-colors" aria-label="通知">
          <BellRing className="w-5 h-5" />
          {user && <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse border border-slate-950"></span>}
        </button>

        <div className="flex items-center space-x-3 border-l border-slate-800 pl-6">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-200">{user ? user.displayName : '未登录'}</p>
            <p className="text-xs text-slate-500">{user ? user.email : '登录后启用个人预警'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
            {getInitials(user)}
          </div>
          {user ? (
            <button onClick={onLogout} className="flex items-center rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-400 transition-colors hover:border-rose-500/40 hover:text-rose-300">
              <LogOut className="mr-2 h-4 w-4" />
              退出
            </button>
          ) : (
            <button onClick={onAuthClick} className="flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500">
              <LogIn className="mr-2 h-4 w-4" />
              登录/注册
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
