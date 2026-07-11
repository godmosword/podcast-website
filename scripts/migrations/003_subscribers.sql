-- 新集通知 email 訂閱名單（Neon Postgres，LIST-2）
-- 執行：psql "$DATABASE_URL" -f scripts/migrations/003_subscribers.sql

CREATE TABLE IF NOT EXISTS subscribers (
  id         BIGSERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  source     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email_lower
  ON subscribers (lower(email));
