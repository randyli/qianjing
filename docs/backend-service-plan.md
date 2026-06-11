# 后台服务规划

## 1. 项目定位与后台目标

当前前端是一个以 AI 投研、市场情绪、预警、报告详情和账户设置为核心的金融洞察应用。后台服务的目标不是简单替换 `mockData`，而是提供可审计、可扩展、可权限控制的投研数据与 AI 工作流平台。

后台需要支撑以下业务目标：

- **研报生产与分发**：管理 AI 深度报告、估值数据、行业标签、标的代码、会员可见性和报告版本。
- **市场情绪分析**：接入新闻、公告、社媒、行情和内部模型输出，生成可追溯的情绪时间序列。
- **预警系统**：允许用户按行业、标的和情绪阈值订阅预警，并通过站内、邮件、Webhook 或短信推送。
- **搜索与发现**：支持标题、摘要、正文、标的、行业和时间范围检索。
- **账户与订阅**：支撑用户资料、通知偏好、会员权限、账单与审计日志。
- **AI 能力编排**：安全地调用大模型、保存提示词版本、追踪生成来源，并对高风险金融内容进行人工复核。

## 2. 推荐技术栈

考虑到前端已经使用 TypeScript/Vite/React，建议后台优先采用 TypeScript 生态，降低团队上下文切换成本。

| 层级 | 推荐方案 | 说明 |
| --- | --- | --- |
| API 服务 | Node.js + Fastify 或 NestJS | Fastify 轻量高性能；NestJS 更适合大型团队和模块化治理。MVP 可从 Fastify 起步。 |
| 数据库 | PostgreSQL | 适合结构化投研数据、用户数据、权限和审计日志。 |
| ORM/迁移 | Prisma 或 Drizzle | Prisma 迭代快、类型友好；Drizzle 更贴近 SQL。 |
| 缓存 | Redis | 存放会话、限流计数、热点报告、短期行情和任务状态。 |
| 搜索 | PostgreSQL FTS 起步，后续接 OpenSearch/Elasticsearch | MVP 先减少系统复杂度；正文规模上来后再拆搜索服务。 |
| 异步任务 | BullMQ + Redis | 处理爬取、AI 摘要、报告生成、通知投递、重试和死信队列。 |
| 对象存储 | S3 兼容存储 | 保存原始新闻、公告 PDF、报告附件、导出文件。 |
| 鉴权 | JWT + Refresh Token，后续接 OIDC | 支持 Web 端登录、接口鉴权和服务间令牌。 |
| 观测 | OpenTelemetry + Prometheus/Grafana + Sentry | 覆盖日志、指标、链路追踪和前后端错误。 |

## 3. 服务边界与模块划分

建议先采用模块化单体，等吞吐或团队规模增长后再拆微服务。模块化单体能更快交付，也能保留清晰的服务边界。

```text
backend/
  src/
    app.ts
    config/
    modules/
      auth/
      users/
      reports/
      sentiment/
      alerts/
      search/
      billing/
      ai-workflows/
      market-data/
      notifications/
      audit/
    jobs/
    db/
    integrations/
    observability/
```

### 3.1 核心模块

- **Auth 模块**：登录、注册、刷新令牌、登出、密码重置、设备会话管理。
- **Users 模块**：用户资料、偏好设置、关注行业、关注标的、通知渠道。
- **Reports 模块**：研报 CRUD、发布状态、会员权限、版本管理、估值曲线、报告引用来源。
- **Sentiment 模块**：行业/标的情绪分、情绪时间序列、来源聚合、模型置信度。
- **Alerts 模块**：阈值配置、触发记录、通知状态、降噪策略、重试策略。
- **Search 模块**：统一检索接口、筛选器、排序、分页、搜索审计。
- **AI Workflows 模块**：提示词模板、模型调用、任务编排、生成结果、人工审核队列。
- **Market Data 模块**：行情、财务指标、公告和新闻源接入。
- **Billing 模块**：套餐、订阅、订单、发票、权益校验。
- **Audit 模块**：重要操作、数据变更、AI 生成链路、权限变更留痕。

## 4. 数据模型草案

### 4.1 用户与权限

| 表 | 关键字段 | 用途 |
| --- | --- | --- |
| `users` | `id`, `email`, `phone`, `display_name`, `status`, `created_at` | 用户基础信息。 |
| `user_profiles` | `user_id`, `company`, `role`, `risk_preference`, `locale`, `timezone` | 投研偏好与本地化设置。 |
| `sessions` | `id`, `user_id`, `refresh_token_hash`, `expires_at`, `revoked_at` | 登录会话与刷新令牌。 |
| `plans` | `id`, `code`, `name`, `price`, `features` | 订阅套餐。 |
| `subscriptions` | `id`, `user_id`, `plan_id`, `status`, `current_period_end` | 用户权益。 |

### 4.2 研报与估值

| 表 | 关键字段 | 用途 |
| --- | --- | --- |
| `reports` | `id`, `title`, `ticker`, `sector_id`, `summary`, `content`, `impact`, `status`, `is_premium`, `published_at` | 研报主表。 |
| `report_versions` | `id`, `report_id`, `version`, `content`, `change_note`, `created_by` | 研报版本与审计。 |
| `valuation_points` | `id`, `report_id`, `year`, `price`, `eps`, `pe`, `note` | 报告详情页估值图数据。 |
| `report_sources` | `id`, `report_id`, `source_type`, `source_url`, `snapshot_object_key` | 报告引用材料和原始底稿。 |
| `sectors` | `id`, `name`, `parent_id` | 行业树。 |

### 4.3 情绪与预警

| 表 | 关键字段 | 用途 |
| --- | --- | --- |
| `sentiment_series` | `id`, `target_type`, `target_id`, `time_bucket`, `score`, `confidence` | 情绪时间序列。 |
| `sentiment_events` | `id`, `target_type`, `target_id`, `source_id`, `score_delta`, `reason`, `occurred_at` | 情绪变化事件解释。 |
| `alerts` | `id`, `user_id`, `target_type`, `target_id`, `enabled`, `threshold`, `direction`, `cooldown_minutes` | 用户预警规则。 |
| `alert_triggers` | `id`, `alert_id`, `triggered_at`, `score`, `status`, `dedupe_key` | 预警触发记录。 |
| `notification_deliveries` | `id`, `trigger_id`, `channel`, `recipient`, `status`, `attempt_count` | 通知投递状态。 |

### 4.4 AI 工作流

| 表 | 关键字段 | 用途 |
| --- | --- | --- |
| `ai_jobs` | `id`, `job_type`, `status`, `input`, `output`, `model`, `cost`, `created_by` | AI 任务主表。 |
| `prompt_templates` | `id`, `name`, `version`, `template`, `risk_level`, `enabled` | 提示词模板版本化。 |
| `review_tasks` | `id`, `entity_type`, `entity_id`, `reviewer_id`, `status`, `decision` | 人工审核队列。 |

## 5. API 设计草案

接口统一使用 `/api/v1` 前缀。列表接口默认支持 `page`, `pageSize`, `sort`, `order`，并返回 `items` 与 `pagination`。

### 5.1 认证与用户

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | 注册。 |
| `POST` | `/api/v1/auth/login` | 登录并返回 access token 与 refresh token。 |
| `POST` | `/api/v1/auth/refresh` | 刷新 access token。 |
| `POST` | `/api/v1/auth/logout` | 注销当前会话。 |
| `GET` | `/api/v1/me` | 获取当前用户、订阅和权限。 |
| `PATCH` | `/api/v1/me/preferences` | 更新通知、外观、关注行业等偏好。 |

### 5.2 研报

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/reports` | 研报列表，支持 `q`, `sector`, `ticker`, `impact`, `premium`, `dateFrom`, `dateTo`。 |
| `POST` | `/api/v1/reports` | 创建研报，需编辑或管理员权限。 |
| `GET` | `/api/v1/reports/:id` | 获取研报详情，校验会员权限。 |
| `PATCH` | `/api/v1/reports/:id` | 更新研报。 |
| `POST` | `/api/v1/reports/:id/publish` | 发布研报并生成版本。 |
| `GET` | `/api/v1/reports/:id/valuation` | 获取估值曲线。 |
| `PUT` | `/api/v1/reports/:id/valuation` | 覆盖估值曲线。 |

### 5.3 情绪与预警

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/sentiment/overview` | 首页情绪概览和行业排行。 |
| `GET` | `/api/v1/sentiment/series` | 情绪时间序列，参数为 `targetType`, `targetId`, `bucket`, `range`。 |
| `GET` | `/api/v1/sentiment/events` | 情绪变化原因列表。 |
| `GET` | `/api/v1/alerts` | 当前用户预警配置。 |
| `POST` | `/api/v1/alerts` | 新建预警。 |
| `PATCH` | `/api/v1/alerts/:id` | 更新预警开关、阈值和通知渠道。 |
| `DELETE` | `/api/v1/alerts/:id` | 删除预警。 |
| `GET` | `/api/v1/alerts/triggers` | 预警触发历史。 |

### 5.4 搜索、AI 与后台管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/search` | 跨研报、新闻、公告、标的的统一搜索。 |
| `POST` | `/api/v1/ai/jobs` | 发起 AI 摘要、报告生成或情绪解释任务。 |
| `GET` | `/api/v1/ai/jobs/:id` | 查询 AI 任务状态与结果。 |
| `GET` | `/api/v1/admin/audit-logs` | 管理员查看审计日志。 |
| `GET` | `/api/v1/admin/review-tasks` | 人工审核任务列表。 |
| `POST` | `/api/v1/admin/review-tasks/:id/decision` | 审核通过、驳回或要求重生成。 |

## 6. 前端对接顺序

为降低风险，前端替换 `mockData` 时建议按页面价值和依赖复杂度分批进行。

1. **研报只读接口**：先上线 `GET /reports` 与 `GET /reports/:id`，替换 Research、Dashboard、ReportDetail 的静态研报数据。
2. **搜索接口**：把 Header 搜索从本地过滤改为后端检索，并统一支持分页和筛选。
3. **情绪概览接口**：替换 Sentiment 页面的静态情绪曲线和行业排行。
4. **预警配置接口**：让 Alerts 页支持真实新增、编辑、启停和删除。
5. **用户偏好接口**：Settings 页接入个人资料、通知偏好和订阅状态。
6. **AI 任务接口**：最后接入研报生成、摘要生成和审核流，避免早期过度复杂。

## 7. 关键业务流程

### 7.1 研报发布流程

```text
编辑创建草稿
  -> AI 生成摘要/正文/估值注释
  -> 自动合规检查
  -> 人工审核
  -> 发布 report version
  -> 写入搜索索引
  -> 通知关注用户
```

### 7.2 情绪计算流程

```text
采集新闻/公告/行情
  -> 去重与实体识别
  -> 情绪模型评分
  -> 聚合到行业/标的时间桶
  -> 计算突变与原因解释
  -> 触发符合条件的 alert
```

### 7.3 预警投递流程

```text
情绪分变化
  -> 查询匹配预警规则
  -> 冷却时间与去重判断
  -> 创建 trigger
  -> 投递站内信/邮件/Webhook
  -> 记录成功、失败和重试
```

## 8. 安全、合规与风控要求

- **权限控制**：免费用户只能查看非会员报告摘要，会员或机构用户可查看完整内容和估值数据。
- **金融内容免责声明**：报告详情、AI 生成内容和通知都应带有“非投资建议”声明。
- **AI 生成可追溯**：保存模型、提示词版本、输入摘要、输出和人工审核记录。
- **敏感操作审计**：报告发布、会员权限变更、订阅变更、提示词变更必须写审计日志。
- **数据隔离**：用户预警、关注列表、账单和偏好必须按 `user_id` 做访问控制。
- **限流与防刷**：登录、搜索、AI 任务创建、导出接口需要限流。
- **数据来源授权**：新闻、公告、行情和第三方数据必须记录授权来源和可展示范围。

## 9. 非功能指标

| 指标 | MVP 目标 | 成长期目标 |
| --- | --- | --- |
| API P95 延迟 | 研报列表 < 300ms，详情 < 500ms | 列表 < 200ms，详情 < 300ms |
| 可用性 | 99.5% | 99.9%+ |
| 搜索延迟 | < 800ms | < 300ms |
| 预警延迟 | 情绪入库后 3 分钟内 | 情绪入库后 30 秒内 |
| AI 任务可靠性 | 支持重试和失败可见 | 支持优先级、成本控制和多模型降级 |
| 审计留存 | 180 天 | 1-3 年，按客户合同配置 |

## 10. 里程碑计划

### M0：后台工程骨架（1 周）

- 初始化 `backend/` 工程、配置管理、日志、健康检查、OpenAPI 文档。
- 配置 PostgreSQL、Redis、迁移工具和本地 Docker Compose。
- 建立统一错误码、请求 ID、中间件、鉴权守卫。

### M1：研报与搜索 MVP（2 周）

- 完成 `reports`, `sectors`, `valuation_points`, `report_versions` 数据模型。
- 提供研报列表、详情、估值、发布接口。
- 前端 Research、Dashboard、ReportDetail 改接后端。
- 提供基础全文搜索和分页筛选。

### M2：用户、订阅与权限（2 周）

- 完成用户注册登录、会话刷新、资料和偏好接口。
- 增加会员可见性校验和订阅状态模型。
- 前端 Settings 接入真实用户资料和订阅信息。

### M3：情绪与预警（2-3 周）

- 建立情绪时间序列、事件解释和预警规则数据模型。
- 接入异步任务队列，完成阈值触发、去重、冷却和投递记录。
- 前端 Sentiment、Alerts 接入真实接口。

### M4：AI 工作流与审核（3-4 周）

- 接入 AI 任务队列、提示词模板版本、成本记录和审核任务。
- 支持 AI 生成研报草稿、摘要和情绪解释。
- 建立合规检查、人审发布和审计日志。

### M5：生产化与扩展（持续）

- 完善监控告警、压测、备份恢复、数据权限和多租户能力。
- 搜索从 PostgreSQL FTS 平滑迁移到 OpenSearch/Elasticsearch。
- 将高吞吐采集、AI 工作流、通知投递逐步拆分成独立服务。

## 11. MVP 验收清单

- 用户可登录并获取自己的订阅状态。
- Dashboard 能展示最新研报、重点行业和情绪摘要。
- Research 支持服务端搜索、分页、行业和影响筛选。
- ReportDetail 能展示完整研报、估值数据和会员权限状态。
- Sentiment 能展示至少一个行业或标的的真实时间序列。
- Alerts 能创建、启停、修改阈值，并记录触发历史。
- 所有写操作都有鉴权、参数校验、审计日志和错误响应。
- 关键接口有 OpenAPI 文档、单元测试和集成测试。

## 12. 推荐立即落地事项

1. 新建后台工程骨架，并把前端 `Report`、`ValuationPoint`、`SectorAlert` 类型抽象成 API DTO。
2. 用 PostgreSQL 建立研报、行业和估值三张核心表，导入当前 mock 数据作为种子数据。
3. 先实现只读研报接口，让前端完成从静态数据到 API 的第一步迁移。
4. 给所有接口增加请求 ID、结构化日志和统一错误响应，避免后续排障困难。
5. 在 AI 工作流上线前，先定义报告发布审核流程和合规免责声明，避免生成内容直接面向用户。
