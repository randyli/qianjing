<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f9ec2d94-146f-4970-b620-6c9b5ec54740

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
## 后台服务规划

本项目当前以前端原型为主，MVP 后台服务规划见 [docs/backend-service-plan.md](docs/backend-service-plan.md)。规划已按轻量方案收敛：建议后续整理为 `frontend/` 与 `backend/` 两个顶层目录；数据库暂用 SQLite，暂不引入独立异步任务系统，必要任务先记录到 `jobs` 表。

