#!/usr/bin/env bash
# 同步 workflow 共用：把失敗寫成 ::error::、##[error] 摘錄，以及給告警用的原因檔。
sync_ci_error() {
  local msg="$1"
  echo "::error::$msg"
  local dest="${SYNC_ERROR_EXCERPT_PATH:-${RUNNER_TEMP:-/tmp}/sync-error-excerpt.txt}"
  mkdir -p "$(dirname "$dest")"
  printf '##[error]%s\n' "$msg" >> "$dest"
  if [ -n "${RUNNER_TEMP:-}" ]; then
    printf '%s\n' "$msg" > "$RUNNER_TEMP/sync-failure-context.txt"
  fi
}
