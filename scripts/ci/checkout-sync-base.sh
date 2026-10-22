#!/usr/bin/env bash
# 字幕補齊：有未合入的 sync/apple 就接在它後面，避免蓋掉還沒進 main 的新集。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
lease_file="${SYNC_BRANCH_LEASE_FILE:-${RUNNER_TEMP:-/tmp}/sync-branch-lease}"
branch="${SYNC_BRANCH:-sync/apple}"

git fetch origin main
if git fetch origin "$branch"; then
  git rev-parse "refs/remotes/origin/$branch" > "$lease_file"
  git checkout -B "$branch" "refs/remotes/origin/$branch"
else
  : > "$lease_file"
  git checkout -B "$branch" origin/main
fi
