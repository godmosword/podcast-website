-- 樂園地圖「通知我開幕」許願表（Neon Postgres）
-- 執行：psql "$DATABASE_URL" -f scripts/migrations/001_zone_wishes.sql

CREATE TABLE IF NOT EXISTS zone_wishes (
  id         BIGSERIAL PRIMARY KEY,
  zone_id    TEXT NOT NULL,
  email      TEXT,
  nickname   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_zone_wishes_zone_id ON zone_wishes (zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_wishes_created_at ON zone_wishes (created_at);
