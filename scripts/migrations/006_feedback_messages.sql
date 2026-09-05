-- 站內留言牆（Neon Postgres）：先審後發，email 必填但永不公開。
-- 執行：npm run migrate -- 006_feedback_messages.sql
-- 可重複執行（IF NOT EXISTS）
--
-- status：pending（待審，INSERT 預設）→ published（上牆）→ hidden（撤下但保留統計）
-- kind：general（想說的話，INSERT 預設）／story_request（想聽的故事）
-- needs_review：伺服器端 PII 規則命中（電話／email／學校等關鍵字）時為 true，
--   僅供後台審核提示，不自動拒絕，仍維持 pending。
-- consent_version／consented_at：家長同意的政策版本與伺服器收到時間，皆由 server 寫入。

CREATE TABLE IF NOT EXISTS feedback_messages (
  id              BIGSERIAL PRIMARY KEY,
  nickname        TEXT NOT NULL,
  email           TEXT NOT NULL,
  message         TEXT NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'general',
  status          TEXT NOT NULL DEFAULT 'pending',
  needs_review    BOOLEAN NOT NULL DEFAULT false,
  consent_version TEXT NOT NULL,
  consented_at    TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 公開牆只讀 status = 'published' 並依時間倒序，後台審核讀 pending。
CREATE INDEX IF NOT EXISTS idx_feedback_messages_status_created_at
  ON feedback_messages (status, created_at DESC);

-- 同一 email 的送出頻率與後台查詢用。
CREATE INDEX IF NOT EXISTS idx_feedback_messages_email
  ON feedback_messages (email);
