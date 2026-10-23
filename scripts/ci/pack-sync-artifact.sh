#!/usr/bin/env bash
# 只打包這次同步改到的白名單路徑（scripts/ci/sync-output-paths.txt），外加 report／commit message。
# 不要把整個音檔庫再傳一遍。寫到白名單以外就在這裡失敗，不會被靜默丟掉。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/ci/lib.sh"
dest="${SYNC_ARTIFACT_DIR:-${RUNNER_TEMP:-/tmp}/sync-artifact}"
tgz="${SYNC_ARTIFACT_TGZ:-${RUNNER_TEMP:-/tmp}/sync-outputs.tgz}"

rm -rf "$dest"
mkdir -p "$dest/files"
cd "$ROOT"

sync_stage_outputs

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
