import React from 'react';
import { Search, BellRing, Sparkles } from 'lucide-react';

interface HeaderProps {
  searchTerm: string;
  onSearch: (term: string) => void;
}

export function Header({ searchTerm, onSearch }: HeaderProps) {
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
        
        <button className="relative text-slate-400 hover:text-slate-200 transition-colors">
          <BellRing className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse border border-slate-950"></span>
        </button>

        <div className="flex items-center space-x-3 border-l border-slate-800 pl-6">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-200">投资者 Alex</p>
            <p className="text-xs text-slate-500">专业版订阅者</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
            AI
          </div>
        </div>
      </div>
    </header>
  );
}
