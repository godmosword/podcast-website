#!/usr/bin/env bash
# 把 pack-sync-artifact.sh 的內容蓋回工作區。給 validate 與 commit job 用。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
tgz="${1:-${SYNC_ARTIFACT_TGZ:-${RUNNER_TEMP:-/tmp}/sync-outputs.tgz}}"
unpack="$(mktemp -d)"

tar -xzf "$tgz" -C "$unpack"
if [ -d "$unpack/files" ]; then
  cp -a "$unpack/files/." "$ROOT/"
fi
if [ -f "$unpack/deleted.txt" ]; then
  while IFS= read -r file; do
    [ -n "$file" ] || continue
    rm -f "$ROOT/$file"
  done < "$unpack/deleted.txt"
fi
if [ -n "${SYNC_REPORT_PATH:-}" ] && [ -f "$unpack/sync-run-report.json" ]; then
  mkdir -p "$(dirname "$SYNC_REPORT_PATH")"
  cp "$unpack/sync-run-report.json" "$SYNC_REPORT_PATH"
fi
if [ -n "${SYNC_COMMIT_MSG_PATH:-}" ] && [ -f "$unpack/sync-commit-msg.txt" ]; then
  mkdir -p "$(dirname "$SYNC_COMMIT_MSG_PATH")"
  cp "$unpack/sync-commit-msg.txt" "$SYNC_COMMIT_MSG_PATH"
fi
rm -rf "$unpack"
