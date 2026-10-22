#!/usr/bin/env bash
# 把工作區裡的同步產物 commit 到固定分支 sync/apple。
# force-with-lease 用 reset／checkout 腳本寫下的遠端 SHA。不在這個 job 裡等 CI。
# 本機 pre-push 視覺閘門不該在 CI 跑：HUSKY=0，而且 commit／push 都 --no-verify。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/ci/lib.sh"

export HUSKY=0
cd "$ROOT"

branch="${SYNC_BRANCH:-sync/apple}"
lease_file="${SYNC_BRANCH_LEASE_FILE:-${RUNNER_TEMP:-/tmp}/sync-branch-lease}"

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

# 只 stage data/ 與 public/stories/，不要把整個工作區一起加進去。
# porcelain 含已 stage 的列（例如 "M  data/…"），那些可以 commit。
# 第二欄不是空白，或第一欄是 ?，才是還沒 stage 的殘檔。
git add -- data public/stories
git add -u -- data public/stories

if [ -n "$(git status --porcelain=v1 --untracked-files=all | awk 'substr($0, 2, 1) != " " || substr($0, 1, 1) == "?" { print }')" ]; then
  sync_ci_error "sync 產生了 data/ 與 public/stories/ 以外的變更，或仍有未 stage 的檔案。"
  git status --porcelain=v1 --untracked-files=all
  exit 1
fi

if git diff --staged --quiet; then
  echo "No staged changes to commit."
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "landed_on_main=false" >> "$GITHUB_OUTPUT"
  fi
  exit 0
fi

msg="${SYNC_COMMIT_MSG_PATH:-${RUNNER_TEMP:-/tmp}/sync-commit-msg.txt}"
if [ ! -f "$msg" ]; then
  printf '%s\n' "sync: Apple Podcast 更新" > "$msg"
fi
git -c core.hooksPath=/dev/null commit --no-verify -F "$msg"

lease=""
if [ -f "$lease_file" ]; then
  lease="$(tr -d '[:space:]' < "$lease_file")"
fi
if [ -n "$lease" ]; then
  git -c core.hooksPath=/dev/null push --no-verify --force-with-lease="refs/heads/$branch:$lease" -u origin "$branch"
else
  git -c core.hooksPath=/dev/null push --no-verify -u origin "$branch"
fi

title="$(head -n 1 "$msg")"
pr="$(gh pr list --base main --head "$branch" --state open --json url --jq '.[0].url // ""')"
if [ -z "$pr" ]; then
  body="$(printf '%s\n\n%s\n' \
    "Apple sync 推上固定分支 ${branch}。個人倉的 GITHUB_TOKEN 不能直推 main（protect-main-web GH013）。這張 PR 設定 squash auto-merge，不等 CI 跑完。" \
    "Run：https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}")"
  pr="$(gh pr create --base main --head "$branch" --title "$title" --body "$body")"
else
  echo "::notice::沿用既有 sync PR ${pr}"
fi
printf '%s\n' "$pr" > "${RUNNER_TEMP:-/tmp}/sync-pr-url.txt"

merge_out="$(gh pr merge "$pr" --squash --auto 2>&1)" || {
  if printf '%s' "$merge_out" | grep -Eqi 'already|auto merge|auto-merge'; then
    echo "$merge_out"
  else
    sync_ci_error "設定 auto-merge 失敗：$pr"
    printf '%s\n' "$merge_out"
    exit 1
  fi
}

# GITHUB_TOKEN 開的 PR 不會觸發 pull_request。補一次 workflow_dispatch，然後離開。
# 看門狗負責盯還沒合入的 sync PR，以及 RSS 有、站上還沒有的集數。
gh workflow run ci.yml --ref "$branch" -f required_only=true
echo "::notice::已推 ${branch}、設定 auto-merge，並觸發 CI。這個 job 不等 checks。"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "landed_on_main=false" >> "$GITHUB_OUTPUT"
fi
