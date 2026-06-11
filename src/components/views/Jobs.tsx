import React, { useEffect, useState } from 'react';
import { Play, Plus, RefreshCw, TerminalSquare } from 'lucide-react';
import { api } from '../../api';
import { JobRecord } from '../../types';

const statusClasses: Record<JobRecord['status'], string> = {
  pending: 'bg-amber-500/10 text-amber-300',
  running: 'bg-indigo-500/10 text-indigo-300',
  succeeded: 'bg-emerald-500/10 text-emerald-300',
  failed: 'bg-rose-500/10 text-rose-300',
  cancelled: 'bg-slate-500/10 text-slate-300',
};

function formatJson(value: unknown) {
  if (value === null || value === undefined) return '—';
  return JSON.stringify(value, null, 2);
}

export function Jobs() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [type, setType] = useState('generate_report');
  const [input, setInput] = useState('{\n  "ticker": "TEST"\n}');
  const [message, setMessage] = useState<string | null>(null);

  const loadJobs = () => {
    api.listJobs().then(setJobs).catch(() => setJobs([]));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const createJob = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      const parsed = input.trim() ? JSON.parse(input) as Record<string, unknown> : {};
      const created = await api.createJob(type, parsed);
      setJobs((items) => [created, ...items]);
      setMessage(`任务 ${created.id.slice(0, 8)} 已创建。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建任务失败。');
    }
  };

  const runJob = async (job: JobRecord) => {
    const updated = await api.runJob(job.id);
    setJobs((items) => items.map((item) => item.id === job.id ? updated : item));
    setMessage(`任务 ${updated.id.slice(0, 8)} 执行完成：${updated.status}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">后台任务记录</h1>
          <p className="text-slate-400 mt-1">查看 AI 生成、数据导入、情绪重算等 MVP 后台动作的状态和错误信息。</p>
        </div>
        <button onClick={loadJobs} className="flex items-center rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-indigo-500/50 hover:text-indigo-300">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </button>
      </div>

      {message && <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm text-indigo-200">{message}</div>}

      <form onSubmit={createJob} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6 lg:grid-cols-[220px_1fr_auto] lg:items-start">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">任务类型</label>
          <select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200">
            <option value="generate_report">AI 生成研报</option>
            <option value="import_seed_data">导入 Seed 数据</option>
            <option value="recalculate_sentiment">重算情绪</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">输入 JSON</label>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={5} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200" />
        </div>
        <button className="mt-7 flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500">
          <Plus className="mr-2 h-4 w-4" />
          创建任务
        </button>
      </form>

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <h2 className="flex items-center text-lg font-semibold text-slate-100"><TerminalSquare className="mr-2 h-5 w-5 text-indigo-400" />任务列表</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {jobs.map((job) => (
            <div key={job.id} className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-[1fr_1fr_auto]">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-slate-300">{job.id}</span>
                  <span className={`rounded px-2 py-1 text-xs font-medium ${statusClasses[job.status]}`}>{job.status}</span>
                  <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">{job.type}</span>
                </div>
                <p className="text-xs text-slate-500">创建：{new Date(job.createdAt).toLocaleString()} / 更新：{new Date(job.updatedAt).toLocaleString()}</p>
                {job.error && <p className="mt-2 rounded bg-rose-500/10 p-2 text-sm text-rose-300">{job.error}</p>}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <pre className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-400">{formatJson(job.input)}</pre>
                <pre className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-400">{formatJson(job.result)}</pre>
              </div>
              <div className="flex items-start justify-end">
                <button onClick={() => runJob(job)} disabled={job.status === 'running'} className="flex items-center rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
                  <Play className="mr-2 h-4 w-4" />
                  运行
                </button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && <div className="p-6 text-sm text-slate-500">暂无任务记录。</div>}
        </div>
      </div>
    </div>
  );
}
