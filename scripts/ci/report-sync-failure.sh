#!/usr/bin/env bash
set -euo pipefail

if [ -f "${RUNNER_TEMP:-}/sync-alert-skip" ]; then
  echo "略過同步失敗發報：$(cat "$RUNNER_TEMP/sync-alert-skip")"
  exit 0
fi

if [ -f "${RUNNER_TEMP:-}/sync-failure-context.txt" ]; then
  SYNC_FAILURE_CONTEXT="$(cat "$RUNNER_TEMP/sync-failure-context.txt")"
  export SYNC_FAILURE_CONTEXT
fi

if [ -f "${RUNNER_TEMP:-}/sync-pr-url.txt" ]; then
  SYNC_PR_URL="$(cat "$RUNNER_TEMP/sync-pr-url.txt")"
  export SYNC_PR_URL
fi

excerpt="${SYNC_ERROR_EXCERPT_PATH:-${RUNNER_TEMP:-}/sync-error-excerpt.txt}"
if [ -n "$excerpt" ] && [ -f "$excerpt" ]; then
  export SYNC_ERROR_EXCERPT_PATH="$excerpt"
fi

export SYNC_ALERT_STREAK_PATH="${SYNC_ALERT_STREAK_PATH:-.cache/sync-alert-streak.json}"
npx tsx scripts/sync-alert.ts failure --kind=sync-job-failure
