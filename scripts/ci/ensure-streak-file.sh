#!/usr/bin/env bash
# 連續失敗 streak 檔要在 cache save 前存在。沒有舊紀錄就從 0 開始。
set -euo pipefail

path="${SYNC_ALERT_STREAK_PATH:-.cache/sync-alert-streak.json}"
mkdir -p "$(dirname "$path")"
if [ ! -f "$path" ]; then
  printf '%s\n' '{"lastCategory":null,"consecutive":0}' > "$path"
fi
