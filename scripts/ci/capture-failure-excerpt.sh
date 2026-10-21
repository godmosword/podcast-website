#!/usr/bin/env bash
# 把這個 job 的 ##[error] 摘錄寫進 job output，讓後面的告警 job 讀得到。
set -euo pipefail

excerpt_file="${SYNC_ERROR_EXCERPT_PATH:-${RUNNER_TEMP:-/tmp}/sync-error-excerpt.txt}"
{
  echo "excerpt<<SYNC_EXCERPT_EOF"
  echo "##[error]${GITHUB_JOB:-sync} failed"
  if [ -f "$excerpt_file" ]; then
    cat "$excerpt_file"
  fi
  echo "SYNC_EXCERPT_EOF"
} >> "${GITHUB_OUTPUT:?}"
