-- LIST-2 double opt-in：既有名單標記為 legacy，不在未重新確認前寄送通知。
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS confirmation_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_subscribers_status
  ON subscribers (status);

CREATE INDEX IF NOT EXISTS idx_subscribers_confirmation_token
  ON subscribers (confirmation_token_hash)
  WHERE confirmation_token_hash IS NOT NULL;
