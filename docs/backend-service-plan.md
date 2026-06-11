# MVP 后台服务规划

## 1. 规划原则

当前项目是一个前端原型，核心目标是尽快把页面从 `mockData` 迁移到可维护的后台 API。MVP 阶段应优先保证简单、可运行、可迭代，暂不引入过多基础设施。

MVP 明确采用以下约束：

- **数据库暂用 SQLite**：本地开发、演示和小规模部署足够简单；后续如有多用户并发和运维需求，再迁移 PostgreSQL。
- **不引入独立异步任务系统**：暂不使用 Redis、BullMQ、消息队列或 worker 集群；需要记录后台动作时，先写入 `jobs` 表并由接口或人工流程触发处理。
- **采用模块化单体**：一个 Node.js 后台服务承载认证、研报、情绪、预警、设置和 AI 任务记录。
- **先做只读与基础写入**：优先支撑 Dashboard、Research、ReportDetail、Sentiment、Alerts、Settings 页面真实数据展示。
- **保留升级路径**：表结构和接口命名尽量不绑定 SQLite 特性，未来可平滑迁移到 PostgreSQL、队列和对象存储。

## 2. MVP 技术栈

| 层级 | MVP 选择 | 暂不引入/后续升级 |
| --- | --- | --- |
| API 服务 | Node.js + Fastify + TypeScript | 后续如团队需要强约束，可迁移 NestJS。 |
| 数据库 | SQLite | 后续迁移 PostgreSQL。 |
| ORM/迁移 | Prisma 或 Drizzle | 二者都支持 SQLite；建议选团队更熟悉的方案。 |
| 搜索 | SQLite `LIKE` 或 FTS5 | 数据量变大后再迁移 OpenSearch/Elasticsearch。 |
| 任务记录 | `jobs` 数据表 | 暂不使用 Redis/BullMQ；必要时由管理接口手动重试。 |
| 文件存储 | 本地 `uploads/` 目录 | 后续迁移 S3 兼容存储。 |
| 鉴权 | 简单 JWT + 本地密码哈希 | 后续接 OIDC、SSO 或机构账号体系。 |
| 观测 | 结构化日志 + 请求 ID | 后续补 OpenTelemetry、Prometheus、Sentry。 |

## 3. 后台目录建议

MVP 不需要复杂微服务拆分，建议在仓库内新增 `backend/`：

```text
backend/
  src/
    app.ts
    config.ts
    db/
      client.ts
      schema.ts
      seed.ts
    modules/
      auth/
      users/
      reports/
      sentiment/
      alerts/
      settings/
      jobs/
    shared/
      errors.ts
      auth.ts
      pagination.ts
      validation.ts
  prisma/ 或 drizzle/
  uploads/
```

模块说明：

- **auth**：登录、注册、当前用户、JWT 校验。
- **users/settings**：用户资料、订阅状态、通知偏好、外观偏好。
- **reports**：研报列表、详情、估值数据、发布状态。
- **sentiment**：情绪概览、情绪曲线、情绪事件解释。
- **alerts**：用户预警规则和触发历史。
- **jobs**：AI 生成、导入、重算情绪等动作的状态记录表和查询接口。

## 4. MVP 数据模型

### 4.1 用户、会话与设置

| 表 | 关键字段 | 用途 |
| --- | --- | --- |
| `users` | `id`, `email`, `password_hash`, `display_name`, `role`, `created_at`, `updated_at` | 用户基础信息。 |
| `user_settings` | `user_id`, `notification_email`, `daily_digest_enabled`, `watchlist_alert_enabled`, `theme`, `updated_at` | Settings 页面配置。 |
| `subscriptions` | `id`, `user_id`, `plan_code`, `status`, `current_period_end` | MVP 订阅状态，可先手动维护。 |

MVP 可以不做独立 `sessions` 表，使用短期 JWT 即可；如果需要登出失效，再增加 `token_revocations` 表。

### 4.2 研报与估值

| 表 | 关键字段 | 用途 |
| --- | --- | --- |
| `sectors` | `id`, `name`, `created_at` | 行业分类。 |
| `reports` | `id`, `title`, `ticker`, `sector_id`, `summary`, `content`, `impact`, `is_premium`, `status`, `published_at`, `created_at`, `updated_at` | 研报主表。 |
| `valuation_points` | `id`, `report_id`, `year`, `price`, `eps`, `pe`, `note` | 报告详情页估值图数据。 |

MVP 暂不做复杂版本管理。若需要保存修改记录，可先增加 `updated_at` 和审计日志；正式编辑流稳定后再补 `report_versions`。

### 4.3 情绪与预警

| 表 | 关键字段 | 用途 |
| --- | --- | --- |
| `sentiment_points` | `id`, `target_type`, `target_key`, `time_bucket`, `score`, `created_at` | 情绪曲线数据。 |
| `sentiment_events` | `id`, `target_type`, `target_key`, `title`, `reason`, `score_delta`, `occurred_at` | 情绪变化解释。 |
| `alerts` | `id`, `user_id`, `target_type`, `target_key`, `enabled`, `threshold`, `direction`, `created_at`, `updated_at` | 用户预警规则。 |
| `alert_triggers` | `id`, `alert_id`, `score`, `message`, `triggered_at`, `read_at` | 预警触发历史。 |

MVP 阶段预警可以在写入情绪数据时同步计算，也可以通过管理接口手动触发扫描，不需要队列。

### 4.4 任务记录表

| 表 | 关键字段 | 用途 |
| --- | --- | --- |
| `jobs` | `id`, `type`, `status`, `input_json`, `result_json`, `error`, `created_by`, `created_at`, `updated_at`, `finished_at` | 记录 AI 生成、数据导入、情绪重算等动作。 |

`jobs.status` 建议使用：`pending`, `running`, `succeeded`, `failed`, `cancelled`。MVP 中任务可以先由 API 请求同步执行并更新状态；耗时任务后续再接 worker。

## 5. API 设计草案

统一使用 `/api/v1` 前缀，返回 JSON。列表接口统一支持 `page`、`pageSize` 和基础筛选参数。

### 5.1 健康检查与认证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/health` | 健康检查。 |
| `POST` | `/api/v1/auth/register` | 注册。MVP 可只允许白名单或开发环境开放。 |
| `POST` | `/api/v1/auth/login` | 登录并返回 JWT。 |
| `GET` | `/api/v1/me` | 获取当前用户、订阅和设置。 |
| `PATCH` | `/api/v1/me/settings` | 更新通知和外观设置。 |

### 5.2 研报接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/reports` | 研报列表，支持 `q`, `sector`, `ticker`, `impact`, `premium`。 |
| `GET` | `/api/v1/reports/:id` | 研报详情。会员报告在 MVP 中可先返回摘要或用字段提示锁定。 |
| `POST` | `/api/v1/reports` | 创建研报，管理员可用。 |
| `PATCH` | `/api/v1/reports/:id` | 更新研报，管理员可用。 |
| `GET` | `/api/v1/reports/:id/valuation` | 获取估值曲线。 |
| `PUT` | `/api/v1/reports/:id/valuation` | 覆盖估值曲线，管理员可用。 |

### 5.3 情绪与预警接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/sentiment/overview` | 首页或 Sentiment 页概览。 |
| `GET` | `/api/v1/sentiment/series` | 情绪时间序列，参数为 `targetType`, `targetKey`, `range`。 |
| `GET` | `/api/v1/sentiment/events` | 情绪变化原因列表。 |
| `POST` | `/api/v1/sentiment/recalculate` | MVP 管理接口：同步重算并写入 `jobs` 记录。 |
| `GET` | `/api/v1/alerts` | 当前用户预警配置。 |
| `POST` | `/api/v1/alerts` | 新建预警。 |
| `PATCH` | `/api/v1/alerts/:id` | 修改预警开关、阈值或方向。 |
| `DELETE` | `/api/v1/alerts/:id` | 删除预警。 |
| `GET` | `/api/v1/alerts/triggers` | 预警触发历史。 |

### 5.4 任务记录接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/v1/jobs` | 创建任务记录，如 `generate_report`, `import_seed_data`, `recalculate_sentiment`。 |
| `GET` | `/api/v1/jobs` | 查询任务记录。 |
| `GET` | `/api/v1/jobs/:id` | 查询单个任务状态和结果。 |
| `POST` | `/api/v1/jobs/:id/run` | MVP 管理接口：同步执行或重新执行任务。 |

## 6. 前端接入顺序

1. **研报只读接口**：先把 `mockReports` 导入 SQLite，接通 `GET /reports` 与 `GET /reports/:id`。
2. **研报详情与估值曲线**：接通 `GET /reports/:id/valuation`，让 ReportDetail 使用真实估值数据。
3. **基础搜索**：Header 搜索先调用 `GET /reports?q=`，不单独建设搜索服务。
4. **情绪数据**：导入少量示例情绪点，接通 Sentiment 页面曲线和概览。
5. **预警设置**：Alerts 页面支持增删改查并展示触发历史。
6. **用户设置**：Settings 页面接通 `/me/settings` 和订阅状态。
7. **任务记录**：AI 生成或数据导入先写 `jobs` 表，后续再决定是否引入真正后台 worker。

## 7. MVP 业务流程

### 7.1 研报数据流程

```text
导入 mockData 或管理员创建研报
  -> 写入 reports / valuation_points
  -> 前端通过 API 查询列表和详情
  -> 管理员手动更新或重新导入
```

### 7.2 情绪与预警流程

```text
导入或手动生成 sentiment_points
  -> 同步检查 alerts 阈值
  -> 命中后写入 alert_triggers
  -> 前端轮询或刷新查看触发历史
```

### 7.3 AI/导入任务流程

```text
创建 jobs 记录
  -> 接口内同步执行轻量任务，或保持 pending 等待人工触发
  -> 写入 result_json 或 error
  -> 前端/管理页查看任务状态
```

## 8. 安全与合规底线

MVP 可以简化架构，但不应省略以下底线：

- **密码安全**：密码必须哈希保存，不允许明文入库。
- **接口鉴权**：写操作、用户设置和预警接口必须校验 JWT。
- **用户隔离**：`alerts`、`alert_triggers`、`user_settings` 必须按当前 `user_id` 查询。
- **会员字段保留**：`reports.is_premium` 必须保留，MVP 可以先做简单锁定提示。
- **金融免责声明**：研报详情和 AI 生成内容需要展示“非投资建议”。
- **操作留痕**：管理员创建、更新研报和执行任务时，至少写入 `jobs` 或 `updated_at`；后续再扩展审计表。
- **输入校验**：所有 POST/PATCH 接口使用 schema 校验，避免脏数据进入 SQLite。

## 9. MVP 非功能目标

| 指标 | MVP 目标 |
| --- | --- |
| 启动方式 | 一条命令启动前端和后台，或分别 `npm run dev` / `npm run dev:api`。 |
| 数据库 | SQLite 文件可本地重建，提供 seed 脚本导入当前 mock 数据。 |
| API 延迟 | 本地研报列表和详情 P95 < 300ms。 |
| 测试 | 至少覆盖 health、reports list/detail、alerts CRUD。 |
| 文档 | 提供 `.env.example`、迁移命令、seed 命令和 API 示例。 |
| 部署 | 可先部署为单实例服务，数据库文件持久化挂载。 |

## 10. 简化里程碑

### M0：后台骨架（2-3 天）

- 新增 `backend/` TypeScript 服务。
- 接入 SQLite、迁移工具、seed 脚本。
- 提供 `/health`、统一错误响应、请求日志。

### M1：研报 API（3-5 天）

- 建立 `sectors`、`reports`、`valuation_points`。
- 把当前 `mockData` 导入 SQLite。
- 前端 Dashboard、Research、ReportDetail 改用 API。

### M2：用户设置与预警（3-5 天）

- 建立 `users`、`user_settings`、`subscriptions`、`alerts`、`alert_triggers`。
- 完成登录、当前用户、设置更新、预警 CRUD。
- 前端 Settings 和 Alerts 改用 API。

### M3：情绪与任务记录（3-5 天）

- 建立 `sentiment_points`、`sentiment_events`、`jobs`。
- 提供情绪概览、曲线、事件接口。
- AI/导入/重算动作先写 `jobs` 表，不引入队列。

### M4：MVP 收口（2-3 天）

- 补测试、README、`.env.example` 和 API 示例。
- 增加基础错误态、加载态和会员锁定提示。
- 准备单实例部署说明。

## 11. MVP 验收清单

- 可以通过 seed 脚本把当前 mock 研报导入 SQLite。
- Dashboard、Research、ReportDetail 不再直接依赖 `mockReports`。
- Research 支持服务端 `q` 搜索和基础筛选。
- Settings 可以读取并更新用户设置。
- Alerts 可以创建、启停、修改阈值、删除并查看触发历史。
- Sentiment 可以展示 SQLite 中的示例情绪曲线和事件解释。
- AI 或导入动作会写入 `jobs` 表，能查看状态和错误信息。
- 不依赖 Redis、BullMQ、PostgreSQL、OpenSearch 或 S3 即可运行 MVP。

## 12. 立即落地事项

1. 新建 `backend/` 工程，选择 Fastify + SQLite + Prisma/Drizzle。
2. 定义 `reports`、`valuation_points`、`sectors` 三张表并编写 seed 脚本。
3. 先实现 `GET /api/v1/reports`、`GET /api/v1/reports/:id`、`GET /api/v1/reports/:id/valuation`。
4. 前端添加 API client，把 Research 和 ReportDetail 从 `mockData` 切到接口。
5. 再补用户、设置、预警和情绪表，避免一开始引入复杂任务队列和外部服务。
