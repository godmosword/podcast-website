#!/usr/bin/env bash
# 字幕轉錄要 20 分鐘，開始時開著的 sync PR 可能中途就合併了。這時 HEAD 還停在已 squash 進 main 的舊 commit，
# 直接推會開出跟 main 衝突、自動合併卡住的 PR（#295）。推之前再看一次，把工作區的改動搬到 main 上。
# 搬不過去（衝突）就讓 job 失敗：遠端沒被動，下一輪從 main 重轉。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
branch="${SYNC_BRANCH:-sync/apple}"

if [ -z "$(git status --porcelain)" ]; then
  exit 0
fi

git fetch origin main
if [ -z "$(git rev-list origin/main..HEAD)" ]; then
  exit 0
fi

open_prs="$(gh pr list --base main --head "$branch" --state open --json number --jq 'length')"
if [ "$open_prs" != "0" ]; then
  exit 0
fi

echo "::notice::$branch 的 PR 在轉錄途中合併了，把字幕改動搬到 origin/main。"
git -c user.name=ci -c user.email=ci@example.invalid stash push --include-untracked --quiet
git checkout -B "$branch" origin/main
git stash pop --quiet
