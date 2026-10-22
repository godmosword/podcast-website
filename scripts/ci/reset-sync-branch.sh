#!/usr/bin/env bash
# 同步 commit：把固定分支 sync/apple 重設到 origin/main，並記住遠端 SHA 給 force-with-lease。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
lease_file="${SYNC_BRANCH_LEASE_FILE:-${RUNNER_TEMP:-/tmp}/sync-branch-lease}"
branch="${SYNC_BRANCH:-sync/apple}"

git fetch origin main
if git fetch origin "$branch"; then
  git rev-parse "refs/remotes/origin/$branch" > "$lease_file"
else
  : > "$lease_file"
fi
git checkout -B "$branch" origin/main
