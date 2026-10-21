#!/usr/bin/env bash
# sync bot 的 PR 只能改 data/ 與 public/stories/。
# 這兩個前綴必須與 scripts/lib/sync-outputs.ts 的 SYNC_OUTPUT_PREFIXES 一致。
# 人開的分支寫 sync_only=false 並成功離開，後面的 quality／build 照常跑。
# 測試可設 SYNC_PATH_GUARD_PATHS（換行分隔）略過 git diff。
set -euo pipefail

branch="${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}"

write_output() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf '%s\n' "$1" >> "$GITHUB_OUTPUT"
  fi
}

case "$branch" in
  sync/apple|sync/apple-*) ;;
  *)
    echo "path guard：${branch:-local} 不是 sync 分支，略過。"
    write_output "sync_only=false"
    exit 0
    ;;
esac

if [ -n "${SYNC_PATH_GUARD_PATHS:-}" ]; then
  list="$SYNC_PATH_GUARD_PATHS"
else
  base="${GITHUB_BASE_REF:-main}"
  git fetch origin "$base"
  list="$(git diff --name-only "origin/${base}...HEAD")"
fi

outside="$(printf '%s\n' "$list" | awk '
  NF == 0 { next }
  index($0, "data/") == 1 { next }
  index($0, "public/stories/") == 1 { next }
  { print }
')"

if [ -n "$outside" ]; then
  echo "::error::sync PR 改到 data/ 與 public/stories/ 以外"
  printf '%s\n' "$outside" | while IFS= read -r line; do
    [ -n "$line" ] || continue
    echo "::error::$line"
  done
  write_output "sync_only=false"
  exit 1
fi

echo "path guard：sync 分支只動到 data/ 與 public/stories/。"
write_output "sync_only=true"
