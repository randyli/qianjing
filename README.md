<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Qianjing MVP

本仓库包含一个 React/Vite 前端，以及按 [`docs/backend-service-plan.md`](docs/backend-service-plan.md) 落地的 MVP 后台服务。后台采用模块化单体思路，提供 SQLite 数据库、JWT 鉴权、研报、估值、情绪、预警、用户设置与任务记录 API。

## 本地运行

**Prerequisites:** Node.js 24+（后台使用内置 `node:sqlite`）。

1. 安装依赖：
   ```bash
   npm install
   ```
2. 复制并调整环境变量：
   ```bash
   cp .env.example .env.local
   ```
3. 初始化 SQLite 示例数据：
   ```bash
   npm run seed
   ```
4. 同时启动前端和后台：
   ```bash
   npm run dev
   ```

也可以分别启动：

```bash
npm run dev:backend
npm run dev:frontend
```

前端默认访问 `http://localhost:4000/api/v1`，可通过 `VITE_API_BASE_URL` 覆盖。

## 后台脚本

- `npm run seed`：创建/迁移 SQLite 表，并从当前 `src/mockData.ts` 导入 MVP 示例数据。
- `npm run dev:backend`：启动 API 服务。
- `npm run lint`：检查前端和后台 TypeScript。
- `npm test`：覆盖 health、研报列表/详情/估值、预警 CRUD。
- `npm run build`：构建前端并类型检查后台。

## API 示例

```bash
curl http://localhost:4000/health
curl 'http://localhost:4000/api/v1/reports?q=AI'
curl http://localhost:4000/api/v1/reports/1
curl http://localhost:4000/api/v1/reports/1/valuation
```

需要登录的接口先获取演示 JWT：

```bash
TOKEN=$(curl -s http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","password":"password"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')

curl http://localhost:4000/api/v1/me/settings -H "authorization: Bearer $TOKEN"
curl http://localhost:4000/api/v1/alerts -H "authorization: Bearer $TOKEN"
```

## 后台服务规划

MVP 后台服务规划见 [docs/backend-service-plan.md](docs/backend-service-plan.md)。当前实现先保留根目录前端结构并新增 `backend/`，后续若需要更清晰的部署边界，可再将现有 React/Vite 文件整体迁入 `frontend/`。
