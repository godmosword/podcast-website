#!/usr/bin/env bash
# 把同步產物 commit 並推上 main。撞 protect-main-web GH013 時改開 sync/apple-<run> PR。
# 本機 pre-push 視覺閘門不該在 CI 跑：HUSKY=0，而且 commit／push 都 --no-verify。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/ci/lib.sh"

export HUSKY=0
cd "$ROOT"

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

# 只 stage data/ 與 public/stories/，不要把整個工作區一起加進去。
git add -- data public/stories
git add -u -- data public/stories

if [ -n "$(git status --porcelain)" ]; then
  sync_ci_error "sync 產生了 data/ 與 public/stories/ 以外的變更，或仍有未 stage 的檔案。"
  git status --porcelain
  exit 1
fi

if git diff --staged --quiet; then
  echo "No staged changes to commit."
  exit 0
fi

git -c core.hooksPath=/dev/null commit --no-verify -F "$SYNC_COMMIT_MSG_PATH"

# main 在本 run 期間可能被人為 push 推進。sync 只動 data/ 與 public/stories/，rebase 重試即可。
# 個人倉的 GITHUB_TOKEN 會撞 protect-main-web GH013；那不是 non-fast-forward，改開 PR。
open_sync_pr() {
  local branch="sync/apple-${GITHUB_RUN_ID}"
  echo "::notice::protect-main-web GH013：改開 PR ${branch}"
  git checkout -B "$branch"
  if git ls-remote --exit-code origin "refs/heads/$branch" >/dev/null 2>&1; then
    git fetch origin "$branch"
    local remote_branch_sha
    remote_branch_sha=$(git rev-parse "refs/remotes/origin/$branch")
    git -c core.hooksPath=/dev/null push --no-verify --force-with-lease="refs/heads/$branch:$remote_branch_sha" -u origin "$branch"
  else
    git -c core.hooksPath=/dev/null push --no-verify -u origin "$branch"
  fi
  local title
  title=$(head -n 1 "$SYNC_COMMIT_MSG_PATH")
  local pr
  pr=$(gh pr list --base main --head "$branch" --state open --json url --jq '.[0].url // ""')
  if [ -z "$pr" ]; then
    local body
    body=$(printf '%s\n\n%s\n' \
      "Apple sync 因 protect-main-web GH013（required status checks）無法直推 main。個人倉不能把 GitHub Actions Integration 加進 ruleset bypass。此 PR 等 quality／build-and-public-e2e／Vercel 通過後 squash auto-merge。" \
      "Run：https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}")
    pr=$(gh pr create --base main --head "$branch" --title "$title" --body "$body")
  else
    echo "::notice::沿用既有 sync PR ${pr}"
  fi
  printf '%s\n' "$pr" > "$RUNNER_TEMP/sync-pr-url.txt"

  local sha ci_run_id existing_ids list_out wait_i
  sha=$(git rev-parse HEAD)
  list_out=$(gh run list --workflow=ci.yml --branch="$branch" --event=workflow_dispatch --limit=20 --json databaseId,headSha,createdAt 2>&1) || {
    sync_ci_error "gh run list 失敗（branch=${branch}）"
    echo "$list_out"
    return 1
  }
  existing_ids=$(printf '%s' "$list_out" | jq -r --arg sha "$sha" '[.[] | select(.headSha == $sha) | .databaseId | tostring] | join(",")')
  gh workflow run ci.yml --ref "$branch" -f required_only=true
  gh pr merge "$pr" --squash --auto
  ci_run_id=""
  for wait_i in $(seq 1 12); do
    list_out=$(gh run list --workflow=ci.yml --branch="$branch" --event=workflow_dispatch --limit=20 --json databaseId,headSha,createdAt 2>&1) || {
      sync_ci_error "gh run list 失敗（branch=${branch}）"
      echo "$list_out"
      return 1
    }
    ci_run_id=$(printf '%s' "$list_out" | jq -r --arg sha "$sha" --arg ids "$existing_ids" '($ids | split(",") | map(select(length > 0))) as $old | [.[] | select(.headSha == $sha) | select((.databaseId | tostring) as $id | ($old | index($id) | not))] | sort_by(.createdAt) | last | .databaseId // empty')
    if [ -n "$ci_run_id" ] && [ "$ci_run_id" != "null" ]; then
      break
    fi
    sleep 5
  done
  if [ -z "$ci_run_id" ] || [ "$ci_run_id" = "null" ]; then
    sync_ci_error "找不到 workflow_dispatch CI run（branch=${branch} sha=${sha}）"
    return 1
  fi
  echo "::notice::GH013 waiter 觀測 CI run ${ci_run_id}（sha=${sha}）"
  local i state jobs_out quality_conc build_conc status_out vercel_state
  local quality_ok build_ok vercel_ok quality_mirrored build_mirrored
  quality_mirrored=false
  build_mirrored=false
  for i in $(seq 1 80); do
    state=$(gh pr view "$pr" --json state --jq .state 2>&1) || {
      sync_ci_error "gh pr view 失敗（pr=${pr}）"
      echo "$state"
      return 1
    }
    if [ "$state" = "MERGED" ]; then
      return 0
    fi
    if [ "$state" = "CLOSED" ]; then
      sync_ci_error "sync PR 未合併就被關閉：$pr"
      return 1
    fi
    jobs_out=$(gh run view "$ci_run_id" --json jobs 2>&1) || {
      sync_ci_error "gh run view 失敗（run=${ci_run_id}）"
      echo "$jobs_out"
      return 1
    }
    quality_conc=$(printf '%s' "$jobs_out" | jq -r '(.jobs[] | select(.name == "quality") | .conclusion // .status // "pending") // "pending"')
    build_conc=$(printf '%s' "$jobs_out" | jq -r '(.jobs[] | select(.name == "build-and-public-e2e") | .conclusion // .status // "pending") // "pending"')
    case "$quality_conc" in
      failure|cancelled)
        sync_ci_error "CI job 失敗：quality（conclusion=${quality_conc}）"
        return 1
        ;;
    esac
    case "$build_conc" in
      failure|cancelled)
        sync_ci_error "CI job 失敗：build-and-public-e2e（conclusion=${build_conc}）"
        return 1
        ;;
    esac
    quality_ok=false
    build_ok=false
    if [ "$quality_conc" = "success" ]; then
      quality_ok=true
    fi
    if [ "$build_conc" = "success" ]; then
      build_ok=true
    fi
    status_out=$(gh api "repos/${GITHUB_REPOSITORY}/commits/${sha}/status" 2>&1) || {
      sync_ci_error "commit status API 失敗（sha=${sha}）"
      echo "$status_out"
      return 1
    }
    vercel_state=$(printf '%s' "$status_out" | jq -r '[.statuses[]? | select(.context == "Vercel")] | sort_by(.updated_at) | last | .state // empty')
    vercel_ok=false
    if [ -z "$vercel_state" ]; then
      vercel_state="pending"
    elif [ "$vercel_state" = "failure" ] || [ "$vercel_state" = "error" ]; then
      sync_ci_error "Vercel commit status 失敗（state=${vercel_state}）"
      return 1
    elif [ "$vercel_state" = "success" ]; then
      vercel_ok=true
    fi
    if [ "$quality_ok" = true ] && [ "$quality_mirrored" != true ]; then
      gh api "repos/${GITHUB_REPOSITORY}/statuses/${sha}" -f state=success -f context=quality -f description="mirror workflow_dispatch quality" -f target_url="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${ci_run_id}" >/dev/null || {
        sync_ci_error "寫入 quality commit status 失敗（sha=${sha}）"
        return 1
      }
      quality_mirrored=true
      echo "::notice::已鏡射 quality 為 commit status（ruleset context）"
    fi
    if [ "$build_ok" = true ] && [ "$build_mirrored" != true ]; then
      gh api "repos/${GITHUB_REPOSITORY}/statuses/${sha}" -f state=success -f context=build-and-public-e2e -f description="mirror workflow_dispatch build-and-public-e2e" -f target_url="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${ci_run_id}" >/dev/null || {
        sync_ci_error "寫入 build-and-public-e2e commit status 失敗（sha=${sha}）"
        return 1
      }
      build_mirrored=true
      echo "::notice::已鏡射 build-and-public-e2e 為 commit status（ruleset context）"
    fi
    if [ "$quality_ok" = true ] && [ "$build_ok" = true ] && [ "$vercel_ok" = true ]; then
      echo "::notice::quality、build-and-public-e2e、Vercel 皆成功，等待 auto-merge（${i}/80）"
    else
      echo "::notice::等待 checks（${i}/80）：quality=${quality_conc} build-and-public-e2e=${build_conc} Vercel=${vercel_state}"
    fi
    sleep 15
  done
  printf '%s\n' "pending-merge" > "$RUNNER_TEMP/sync-alert-skip"
  echo "::notice::sync PR 已設定 auto-merge，checks 尚未完成，這次不開失敗 Issue。"
  sync_ci_error "等待 sync PR merge 逾時：$pr（run=${ci_run_id} sha=${sha}）"
  return 1
}

for attempt in 1 2 3; do
  set +e
  push_output=$(git -c core.hooksPath=/dev/null push --no-verify 2>&1)
  push_status=$?
  set -e
  echo "$push_output"
  if [ "$push_status" -eq 0 ]; then
    exit 0
  fi
  if echo "$push_output" | grep -q "GH013"; then
    open_sync_pr
    exit $?
  fi
  echo "push 被拒（remote 有新 commit），rebase 後重試（$attempt/3）"
  git pull --rebase origin main
done
git -c core.hooksPath=/dev/null push --no-verify
