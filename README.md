<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Qianjing MVP

Qianjing 是一个投研工作台 MVP，包含 React/Vite 前端与 Node.js/Express 后台服务。当前版本采用模块化单体架构，使用 SQLite 存储演示数据与业务状态，并提供 JWT 鉴权、研报、估值、情绪、预警、用户设置、任务记录和市场工具 API。

## 功能概览

- **前端工作台**：Dashboard、Research、ReportDetail、Sentiment、Alerts、Settings、Jobs、Market Tools 等页面。
- **MVP 后台 API**：Express + TypeScript，统一提供 `/api/v1` 接口。
- **本地数据库**：基于 Node.js 内置 `node:sqlite`，默认数据库文件为 `backend/data/qianjing.sqlite`。
- **认证与用户设置**：支持注册、登录、当前用户资料、通知设置与主题偏好。
- **研报与估值数据**：提供研报列表、详情、估值点数据，以及前端图表展示所需数据结构。
- **情绪与预警**：提供情绪概览、时间序列、事件解释、预警规则和触发历史。
- **任务记录**：用 `jobs` 表记录 AI 生成、情绪重算等后台动作的状态。
- **市场工具**：支持 A 股搜索建议、PE Band 数据生成与 Tushare 数据缓存。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React 19、Vite、TypeScript、Tailwind CSS、Recharts、lucide-react |
| 后台 | Node.js、Express、TypeScript、tsx |
| 数据库 | SQLite（`node:sqlite`） |
| 鉴权 | JWT + 本地密码哈希 |
| 测试 | Node.js 内置 test runner |
| 外部数据 | Tushare（可选，用于市场工具实时数据） |

## 目录结构

```text
qianjing/
  src/                         # React/Vite 前端源码
    components/                # 页面、图表和通用组件
    api.ts                     # 前端 API client
    mockData.ts                # seed 使用的演示数据来源
  backend/
    src/
      app.ts                   # Express 应用与 API 路由
      config.ts                # 后台配置读取
      db/                      # SQLite client、schema、seed
      modules/market/          # 股票搜索、Tushare、PE Band
      shared/                  # 鉴权、校验等共享代码
    test/                      # API 集成测试
  docs/
    backend-service-plan.md    # MVP 后台服务规划
```

> 当前仓库仍保留根目录前端结构，并在 `backend/` 下新增后台服务。后续如需更清晰的部署边界，可按文档规划迁移为 `frontend/` + `backend/` 双目录结构。

## 环境要求

- Node.js **24+**（后台依赖内置 `node:sqlite`）。
- npm。
- 可选：Tushare token（仅市场工具的实时数据和股票索引需要）。

## 本地运行

1. 安装依赖：

   ```bash
   npm install
   ```

2. 复制并调整环境变量：

   ```bash
   cp .env.example .env.local
   ```

3. 初始化 SQLite 表结构和演示数据：

   ```bash
   npm run seed
   ```

4. 同时启动前端和后台：

   ```bash
   npm run dev
   ```

启动后默认地址：

- 前端：`http://localhost:3000`
- 后台健康检查：`http://localhost:4000/health`
- API base URL：`http://localhost:4000/api/v1`

也可以分别启动：

```bash
npm run dev:backend
npm run dev:frontend
```

前端默认访问 `http://localhost:4000/api/v1`，可通过 `VITE_API_BASE_URL` 覆盖。

## 环境变量

`.env.example` 已包含本地开发所需的基础变量。常用配置如下：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `API_PORT` | `4000` | 后台服务端口。 |
| `API_HOST` | `0.0.0.0` | 后台监听地址。 |
| `DATABASE_URL` | `backend/data/qianjing.sqlite` | SQLite 数据库文件路径。 |
| `JWT_SECRET` | `replace-with-a-long-random-secret` | JWT 签名密钥，本地可用示例值，部署时必须更换。 |
| `DEMO_USER_EMAIL` | `demo@example.com` | seed 创建的演示账号邮箱。 |
| `DEMO_USER_PASSWORD` | `password` | seed 创建的演示账号密码。 |
| `CORS_ORIGIN` | `http://localhost:3000` | 允许访问后台的前端来源。 |
| `VITE_API_BASE_URL` | `http://localhost:4000/api/v1` | 前端 API client 使用的 base URL。 |
| `VITE_DEMO_USER_EMAIL` | `demo@example.com` | 前端演示登录默认邮箱。 |
| `VITE_DEMO_USER_PASSWORD` | `password` | 前端演示登录默认密码。 |
| `TUSHARE_TOKEN` | 空 | 可选；市场实时数据、PE Band 和股票索引需要。 |
| `TUSHARE_API_URL` | `https://api.tushare.pro` | 可选；Tushare API 地址。 |
| `MARKET_DATA_CACHE_TTL_HOURS` | `24` | 市场行情缓存小时数。 |
| `MARKET_DATA_FINANCIAL_TTL_HOURS` | `168` | 财务/基础资料缓存小时数。 |

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 同时启动后台和前端。 |
| `npm run dev:backend` | 启动 API 服务。 |
| `npm run dev:frontend` | 启动 Vite 前端。 |
| `npm run seed` | 创建/迁移 SQLite 表，并从 `src/mockData.ts` 导入 MVP 示例数据。 |
| `npm run index:stocks` | 从 Tushare 拉取 A 股基础资料并构建股票搜索索引。 |
| `npm run lint` | 类型检查前端和后台 TypeScript。 |
| `npm test` | 运行后台 API 集成测试。 |
| `npm run build` | 构建前端并类型检查后台。 |
| `npm run clean` | 清理构建产物和本地 SQLite 数据库。 |

## API 示例

### 健康检查与公开数据

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/health
curl 'http://localhost:4000/api/v1/reports?q=AI'
curl http://localhost:4000/api/v1/reports/1
curl http://localhost:4000/api/v1/reports/1/valuation
curl http://localhost:4000/api/v1/sentiment/overview
curl http://localhost:4000/api/v1/sentiment/series
```

### 登录并访问鉴权接口

```bash
TOKEN=$(curl -s http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","password":"password"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')

curl http://localhost:4000/api/v1/me -H "authorization: Bearer $TOKEN"
curl http://localhost:4000/api/v1/me/settings -H "authorization: Bearer $TOKEN"
curl http://localhost:4000/api/v1/alerts -H "authorization: Bearer $TOKEN"
curl http://localhost:4000/api/v1/jobs -H "authorization: Bearer $TOKEN"
```

### 市场工具接口

股票搜索接口依赖 `stock_search_index` 表。配置 `TUSHARE_TOKEN` 后先执行：

```bash
npm run index:stocks
```

然后调用：

```bash
curl 'http://localhost:4000/api/v1/market/stocks?q=600519&limit=5'
curl 'http://localhost:4000/api/v1/market/stocks?q=maotai&limit=5'
curl 'http://localhost:4000/api/v1/market/pe-band?tsCode=600519.SH&range=3y'
```

`/api/v1/market/pe-band` 会调用 Tushare 的 `stock_basic`、`daily_basic`、`income` 数据，并写入 `market_data_cache`。当远端请求失败但已有历史缓存时，服务会优先返回可用缓存。

## 后台 API 范围

| 模块 | 主要接口 |
| --- | --- |
| Health | `GET /health`、`GET /api/v1/health` |
| Auth | `POST /api/v1/auth/register`、`POST /api/v1/auth/login` |
| Me & Settings | `GET /api/v1/me`、`PATCH /api/v1/me`、`GET/PATCH /api/v1/me/settings` |
| Reports | `GET /api/v1/reports`、`GET /api/v1/reports/:id`、`GET /api/v1/reports/:id/valuation` |
| Sentiment | `GET /api/v1/sentiment/overview`、`GET /api/v1/sentiment/series`、`GET /api/v1/sentiment/events`、`POST /api/v1/sentiment/recalculate` |
| Alerts | `GET/POST /api/v1/alerts`、`PATCH/DELETE /api/v1/alerts/:id`、`GET /api/v1/alerts/triggers` |
| Jobs | `GET/POST /api/v1/jobs`、`GET /api/v1/jobs/:id`、`POST /api/v1/jobs/:id/run` |
| Market | `GET /api/v1/market/stocks`、`GET /api/v1/market/pe-band` |

## 测试与构建

提交前建议运行：

```bash
npm run lint
npm test
npm run build
```

说明：

- `npm run lint` 只做 TypeScript 类型检查，不运行 ESLint。
- `npm test` 会覆盖 health、研报列表/详情/估值、预警 CRUD 等 API 行为。
- `npm run build` 会执行前端 Vite 构建，并对后台执行 `tsc --noEmit`。

## 后台服务规划

MVP 后台服务规划见 [docs/backend-service-plan.md](docs/backend-service-plan.md)。当前实现优先保证本地可运行和演示闭环；当用户量、部署和协作需求增长时，可逐步迁移 PostgreSQL、异步任务队列、对象存储和更完整的观测体系。
