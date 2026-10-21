#!/usr/bin/env bash
# npm ci 失敗時改 npm install --no-save，避免過期 lockfile 讓 sync／看門狗停擺。
# 安裝完把 package.json／lock 還原，避免這次 fallback 被當成同步產物 commit。
set -euo pipefail

if npm ci; then
  exit 0
fi

echo "::warning::npm ci 失敗，改跑 npm install --no-save（lockfile 可能過期）。同步不會因此停擺。"
npm install --no-save
git checkout -- package.json package-lock.json 2>/dev/null || true
