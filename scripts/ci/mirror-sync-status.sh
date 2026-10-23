#!/usr/bin/env bash
# 把 workflow_dispatch CI 的結果寫成同名 commit status，給 sync PR 的 required check 看。
#
# 為什麼要這樣：GITHUB_TOKEN 開的 sync PR 不會觸發 pull_request，只能靠
# commit-and-push-sync.sh 補一次 workflow_dispatch。那種 run 的 check run 不會掛到 PR 上，
# protect-main-web 要的 quality／build-and-public-e2e 就永遠等不到，auto-merge 卡死（#257）。
# 同步 job 本身不等 CI（見 sync-workflow-contract），所以鏡射放在 CI 自己的最後一步。
#
# 只寫 success／failure。cancelled、skipped 不寫：不能當成通過，等下一次 CI。
set -euo pipefail

sha="${GITHUB_SHA:?}"
repo="${GITHUB_REPOSITORY:?}"
run_url="${GITHUB_SERVER_URL:-https://github.com}/${repo}/actions/runs/${GITHUB_RUN_ID:?}"

mirror() {
  local context="$1"
  local result="$2"
  local state
  case "$result" in
    success) state=success ;;
    failure) state=failure ;;
    *)
      echo "::notice::${context}=${result:-unknown}，不寫 commit status。"
      return 0
      ;;
  esac
  gh api "repos/${repo}/statuses/${sha}" \
    -f state="$state" \
    -f context="$context" \
    -f description="mirror workflow_dispatch ${context}" \
    -f target_url="$run_url" >/dev/null
  echo "::notice::已把 ${context}=${state} 寫成 commit status（${sha:0:8}）。"
}

mirror quality "${QUALITY_RESULT:-}"
mirror build-and-public-e2e "${BUILD_RESULT:-}"
mirror sync-validate "${SYNC_VALIDATE_RESULT:-}"
