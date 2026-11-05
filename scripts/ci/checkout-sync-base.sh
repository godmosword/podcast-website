#!/usr/bin/env bash
# 字幕補齊：有未合入的 sync PR 就接在 sync/apple 後面，避免蓋掉還沒進 main 的新集。
# 分支合併後不會刪，所以要看有沒有開著的 PR，不能只看分支在不在：
# 接在已 squash 進 main 的舊 commit 後面，PR 會跟 main 衝突、自動合併卡住（#295）。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
lease_file="${SYNC_BRANCH_LEASE_FILE:-${RUNNER_TEMP:-/tmp}/sync-branch-lease}"
branch="${SYNC_BRANCH:-sync/apple}"

git fetch origin main
if git fetch origin "$branch"; then
  git rev-parse "refs/remotes/origin/$branch" > "$lease_file"
  # gh 失敗就讓 job 失敗（set -e），不猜基底。
  open_prs="$(gh pr list --base main --head "$branch" --state open --json number --jq 'length')"
  if [ "$open_prs" = "0" ]; then
    git checkout -B "$branch" origin/main
  else
    git checkout -B "$branch" "refs/remotes/origin/$branch"
  fi
else
  : > "$lease_file"
  git checkout -B "$branch" origin/main
fi
