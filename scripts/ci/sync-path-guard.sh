#!/usr/bin/env bash
# sync bot 的 PR 只能改 data/ 與 public/stories/。
# 這兩個前綴必須與 scripts/lib/sync-outputs.ts 的 SYNC_OUTPUT_PREFIXES 一致。
# 人開的分支寫 sync_only=false 並成功離開，後面的 quality／build 照常跑。
# 測試可設 SYNC_PATH_GUARD_PATHS（換行分隔）略過 git diff。
#
# pull_request 的 job 會同時注入 GITHUB_HEAD_REF（PR 分支）和 GITHUB_REF_NAME
# （多半是 <號>/merge）。單元測試只覆寫其中一個時，另一個仍是 CI 環境的值。
# 只要任一個指向 sync/apple 或 sync/apple-*，就檢查路徑，不能被另一個放行。
set -euo pipefail

write_output() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf '%s\n' "$1" >> "$GITHUB_OUTPUT"
  fi
}

is_sync_branch() {
  case "$1" in
    sync/apple|sync/apple-*) return 0 ;;
    *) return 1 ;;
  esac
}

head_ref="${GITHUB_HEAD_REF:-}"
ref_name="${GITHUB_REF_NAME:-}"
ref_branch=""
case "${GITHUB_REF:-}" in
  refs/heads/*) ref_branch="${GITHUB_REF#refs/heads/}" ;;
esac

if ! is_sync_branch "$head_ref" && ! is_sync_branch "$ref_name" && ! is_sync_branch "$ref_branch"; then
  echo "path guard：${head_ref:-${ref_name:-${ref_branch:-local}}} 不是 sync 分支，略過。"
  write_output "sync_only=false"
  exit 0
fi

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
