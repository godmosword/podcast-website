-- 法務強化：保留家長同意的政策版本與伺服器收到時間。
-- 舊資料維持 NULL，代表該筆資料是在本欄位上線前建立，並不回填或推定同意版本。
-- 執行：npm run migrate -- 005_legal_consent_audit.sql

ALTER TABLE zone_wishes
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ;

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ;
