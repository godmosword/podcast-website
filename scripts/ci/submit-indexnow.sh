#!/usr/bin/env bash
# IndexNow 在 push 之後才送。失敗由 submit-indexnow.ts 自己吞掉並寫 Job Summary。
set -euo pipefail

sleep "${INDEXNOW_WAIT_SECONDS:-120}"
npx tsx scripts/submit-indexnow.ts
