#!/usr/bin/env bash
# 只打包這次同步改到的 data/ 與 public/stories/，外加 report／commit message。
# 不要把整個音檔庫再傳一遍。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
dest="${SYNC_ARTIFACT_DIR:-${RUNNER_TEMP:-/tmp}/sync-artifact}"
tgz="${SYNC_ARTIFACT_TGZ:-${RUNNER_TEMP:-/tmp}/sync-outputs.tgz}"

rm -rf "$dest"
mkdir -p "$dest/files"
cd "$ROOT"

git add -- data public/stories
git add -u -- data public/stories

git diff --cached --name-only -z | while IFS= read -r -d '' file; do
  if [ -f "$file" ]; then
    mkdir -p "$dest/files/$(dirname "$file")"
    cp "$file" "$dest/files/$file"
  else
    printf '%s\n' "$file" >> "$dest/deleted.txt"
  fi
done

if [ -n "${SYNC_REPORT_PATH:-}" ] && [ -f "$SYNC_REPORT_PATH" ]; then
  cp "$SYNC_REPORT_PATH" "$dest/sync-run-report.json"
fi
if [ -n "${SYNC_COMMIT_MSG_PATH:-}" ] && [ -f "$SYNC_COMMIT_MSG_PATH" ]; then
  cp "$SYNC_COMMIT_MSG_PATH" "$dest/sync-commit-msg.txt"
fi

tar -C "$dest" -czf "$tgz" .
echo "packed $tgz"
