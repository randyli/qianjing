export const config = {
  port: Number(process.env.API_PORT ?? process.env.PORT ?? 4000),
  host: process.env.API_HOST ?? '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL ?? 'backend/data/qianjing.sqlite',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-me',
  demoUserEmail: process.env.DEMO_USER_EMAIL ?? 'demo@example.com',
  demoUserPassword: process.env.DEMO_USER_PASSWORD ?? 'password',
};
