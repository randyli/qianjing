import React from 'react';
import {
  Activity,
  ArrowRight,
  BellRing,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  LineChart,
  LockKeyhole,
  PlayCircle,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Workflow,
  Zap,
} from 'lucide-react';
import type { CurrentUser } from '../../types';
import { Auth } from './Auth';

interface LandingProps {
  user: CurrentUser | null;
  authMode?: 'login' | 'register' | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onExploreClick: () => void;
  onAuthenticated: (user: CurrentUser) => void;
}

const capabilities = [
  {
    icon: BookOpen,
    title: '研究报告',
    description: '聚合券商研报、财报纪要与行业资料，自动提炼关键假设、评级变化与估值逻辑。',
  },
  {
    icon: Activity,
    title: '市场情绪',
    description: '追踪新闻、公告与社媒传播趋势，将非结构化信息转化为可比较的情绪分数。',
  },
  {
    icon: BellRing,
    title: '智能预警',
    description: '围绕自选标的、板块和风险关键词配置阈值，异动出现时优先推送高置信信号。',
  },
  {
    icon: Workflow,
    title: '任务自动化',
    description: '把日报汇总、事件追踪和复盘清单交给 AI 代理，减少重复检索与整理时间。',
  },
];

const workflow = [
  '信息源聚合：研报、公告、新闻与公开市场数据统一入库。',
  'AI 分析：抽取核心事件、影响方向、置信度与待验证假设。',
  '个性化提醒：按关注行业、标的和风险偏好生成行动清单。',
];

const previewReports = [
  { sector: '半导体', ticker: 'NVDA', title: 'AI 算力链景气度延续，关注资本开支弹性', impact: '看涨' },
  { sector: '新能源', ticker: '300750.SZ', title: '电池材料价格企稳，毛利率修复进入观察窗口', impact: '中性' },
  { sector: '消费', ticker: '600519.SH', title: '渠道库存回落，节假日动销仍需跟踪验证', impact: '观察' },
];

const sentimentBars = [72, 84, 66, 91, 78, 88, 94];

export function Landing({ user, authMode = null, onLoginClick, onRegisterClick, onExploreClick, onAuthenticated }: LandingProps) {
  const primaryAction = user ? onAuthenticated.bind(null, user) : onRegisterClick;
  const primaryLabel = user ? '进入仪表盘' : '免费开始';

  return (
    <div className="relative -m-8 min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.16),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0)_0%,#020617_80%)]" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <header className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/70 px-5 py-4 shadow-2xl shadow-slate-950/30 backdrop-blur">
          <button type="button" onClick={user ? primaryAction : onExploreClick} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/20">
              <Activity className="h-6 w-6 text-white" />
            </span>
            <span className="text-xl font-bold tracking-tight">FinSight AI</span>
          </button>

          <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
            <a href="#capabilities" className="transition-colors hover:text-slate-100">产品能力</a>
            <a href="#workflow" className="transition-colors hover:text-slate-100">可信流程</a>
            <a href="#preview" className="transition-colors hover:text-slate-100">示例看板</a>
          </nav>

          <div className="flex items-center gap-3">
            {!user && (
              <button type="button" onClick={onLoginClick} className="hidden rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white sm:inline-flex">
                登录
              </button>
            )}
            <button type="button" onClick={primaryAction} className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500">
              {primaryLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </header>



        {authMode && !user && (
          <section className="py-8" aria-label="认证入口">
            <Auth
              key={authMode}
              title={authMode === 'login' ? '登录 FinSight AI' : '创建 FinSight AI 账户'}
              message="认证成功后将进入个人化仪表盘，或继续打开您刚才尝试访问的受保护页面。"
              initialMode={authMode}
              onAuthenticated={onAuthenticated}
            />
          </section>
        )}

        <section className="grid items-center gap-10 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-200">
              <Sparkles className="mr-2 h-4 w-4" />
              面向投资研究团队的 AI 信息中枢
            </div>
            <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl">
              用 AI 聚合研报、情绪与预警，
              <span className="bg-gradient-to-r from-indigo-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">更快形成投资判断。</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              FinSight AI 将公开研究、市场情绪与事件预警汇入统一工作台，帮助你从噪音中提取可信线索、验证假设，并把关键变化及时推送到行动清单。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={primaryAction} className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-600/20 transition-colors hover:bg-indigo-500">
                {primaryLabel}
                <Zap className="ml-2 h-4 w-4" />
              </button>
              <button type="button" onClick={onExploreClick} className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-900">
                进入公开研究
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-4 text-sm text-slate-400">
              <div><span className="block text-2xl font-bold text-white">24/7</span>事件监控</div>
              <div><span className="block text-2xl font-bold text-white">3步</span>信号流程</div>
              <div><span className="block text-2xl font-bold text-white">0次</span>落地页敏感请求</div>
            </div>
          </div>

          <div id="preview" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">示例看板预览</p>
                  <h2 className="text-xl font-semibold text-white">AI 投研驾驶舱</h2>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">静态演示</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['全球 AI 情绪', '88.5', '+12.4%'],
                  ['今日新研报', '24', '+8'],
                  ['风险预警', '5', '需关注'],
                ].map(([label, value, delta]) => (
                  <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs text-slate-500">{label}</p>
                    <div className="mt-3 flex items-end justify-between">
                      <span className="text-2xl font-bold text-white">{value}</span>
                      <span className="text-xs font-medium text-emerald-300">{delta}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-medium text-slate-200">日内市场情绪</p>
                  <LineChart className="h-4 w-4 text-indigo-300" />
                </div>
                <div className="flex h-32 items-end gap-2">
                  {sentimentBars.map((height, index) => (
                    <div key={index} className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-600/40 to-cyan-300/80" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {previewReports.map((report) => (
                  <div key={report.title} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded bg-slate-800 px-2 py-1 font-semibold text-slate-300">{report.sector}</span>
                        <span className="font-mono text-slate-500">${report.ticker}</span>
                      </div>
                      <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-xs text-indigo-200">{report.impact}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{report.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" className="grid gap-4 py-8 md:grid-cols-2 xl:grid-cols-4">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition-colors hover:border-indigo-400/40">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
              </div>
            );
          })}
        </section>

        <section id="workflow" className="grid gap-6 py-14 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold text-white">从信息源到提醒，每一步都保留可追溯上下文。</h2>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Landing 页面仅展示静态示例，不读取受保护账户数据；登录后才会进入个人化仪表盘、预警和任务记录。
            </p>
          </div>
          <div className="grid gap-4">
            {workflow.map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-indigo-200">0{index + 1}</div>
                <div>
                  <h3 className="font-semibold text-white">{item.split('：')[0]}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{item.split('：')[1]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 py-8 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <Search className="mb-4 h-6 w-6 text-indigo-300" />
            <h3 className="font-semibold text-white">减少检索切换</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">将公开研究入口、情绪线索和预警解释放在同一个研究上下文中。</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <Radar className="mb-4 h-6 w-6 text-cyan-300" />
            <h3 className="font-semibold text-white">发现边际变化</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">以事件、分数和趋势视角识别市场叙事拐点。</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <CheckCircle2 className="mb-4 h-6 w-6 text-emerald-300" />
            <h3 className="font-semibold text-white">形成行动清单</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">把研判、跟踪和提醒沉淀为可持续执行的投研流程。</p>
          </div>
        </section>

        <section className="py-14">
          <div className="overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-cyan-600/10 p-8 text-center shadow-2xl shadow-indigo-950/20">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
              <PlayCircle className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-bold text-white">准备好让 AI 成为你的投研副驾驶了吗？</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              立即登录或注册，进入个人化仪表盘；也可以先查看公开研究，了解 FinSight AI 的信息组织方式。
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={onLoginClick} className="inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-950/60 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-slate-400">
                <LockKeyhole className="mr-2 h-4 w-4" />
                登录
              </button>
              <button type="button" onClick={onRegisterClick} className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">
                注册免费账户
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <button type="button" onClick={onExploreClick} className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500">
                进入公开研究
                <TrendingUp className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
