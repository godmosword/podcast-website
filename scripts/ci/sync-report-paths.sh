#!/usr/bin/env bash
set -euo pipefail

echo "SYNC_REPORT_PATH=$RUNNER_TEMP/sync-run-report.json" >> "$GITHUB_ENV"
echo "SYNC_COMMIT_MSG_PATH=$RUNNER_TEMP/sync-commit-msg.txt" >> "$GITHUB_ENV"
echo "SYNC_ERROR_EXCERPT_PATH=$RUNNER_TEMP/sync-error-excerpt.txt" >> "$GITHUB_ENV"
echo "SYNC_ALERT_STREAK_PATH=${GITHUB_WORKSPACE:-$PWD}/.cache/sync-alert-streak.json" >> "$GITHUB_ENV"
mkdir -p "${GITHUB_WORKSPACE:-$PWD}/.cache"
