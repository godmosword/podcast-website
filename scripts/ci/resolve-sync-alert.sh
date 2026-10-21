#!/usr/bin/env bash
set -euo pipefail

export SYNC_ALERT_STREAK_PATH="${SYNC_ALERT_STREAK_PATH:-.cache/sync-alert-streak.json}"
npx tsx scripts/sync-alert.ts resolve --kind=sync-job-failure
