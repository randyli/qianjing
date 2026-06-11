import React, { useState } from 'react';
import { LockKeyhole, LogIn, UserPlus } from 'lucide-react';
import { api } from '../../api';
import type { CurrentUser } from '../../types';
import { cn } from '../../utils';

interface AuthProps {
  title?: string;
  message?: string;
  onAuthenticated: (user: CurrentUser) => void;
}

export function Auth({ title = '请先登录', message = '登录后即可访问您的预警、任务记录和账户设置。', onAuthenticated }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = isRegister
        ? await api.register(email, password, displayName)
        : await api.login(email, password);
      onAuthenticated(payload.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : '认证请求失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[520px] max-w-3xl items-center justify-center">
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/30">
        <div className="mb-8 flex items-start gap-4">
          <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-300 ring-1 ring-indigo-500/20">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-colors', mode === 'login' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300')}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-colors', mode === 'register' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300')}
          >
            注册
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {isRegister && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">显示名称</label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="例如：投资者 Alex"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-indigo-500/60"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">电子邮箱</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-indigo-500/60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">密码</label>
            <input
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={isRegister ? 8 : undefined}
              placeholder={isRegister ? '至少 8 个字符' : '输入您的密码'}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-indigo-500/60"
            />
          </div>

          {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}

          <button
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRegister ? <UserPlus className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
            {submitting ? '提交中...' : isRegister ? '创建账户并登录' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
