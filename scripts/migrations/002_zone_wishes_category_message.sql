-- 許願表擴充：類型（島嶼許願 / 故事許願）與故事許願內容
-- 執行：psql "$DATABASE_URL" -f scripts/migrations/002_zone_wishes_category_message.sql
-- 可重複執行（IF NOT EXISTS）

ALTER TABLE zone_wishes
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'feature',
  ADD COLUMN IF NOT EXISTS message TEXT;
