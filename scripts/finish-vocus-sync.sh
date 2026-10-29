#!/usr/bin/env bash
# 方格子同步的提交與合併。
# lint、typecheck、test、font subset 都成功：先試著推 main；若 protect-main-web（GH013）
# 擋住，就開 PR、啟用 squash auto-merge，並等 quality／build-and-public-e2e／Vercel。
# 任一檢查失敗：仍開 PR，不啟用 auto-merge。
set -euo pipefail

: "${FONTS:?}"
: "${LINT:?}"
: "${TYPECHECK:?}"
: "${TEST:?}"
: "${GITHUB_RUN_ID:?}"
: "${GITHUB_REPOSITORY:?}"
: "${RUNNER_TEMP:?}"

report="${RUNNER_TEMP}/vocus-sync-report.json"
branch="sync/vocus-${GITHUB_RUN_ID}"

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git checkout -B "$branch"

git add data/parent-articles.ts
git add data/parent-travel-abroad-articles.ts
git add data/parent-article-series.ts
git add app/fonts/huninn-subset.woff2 app/fonts/gensen-rounded-tw-bold-subset.woff2
if compgen -G "public/parent-articles/*" >/dev/null; then
  git add public/parent-articles
fi

if [ -n "$(git diff --name-only)" ] || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  echo "::error::vocus sync 產生了未 stage 的檔案；請更新 finish-vocus-sync.sh 的 git add。"
  git status --porcelain
  exit 1
fi

if git diff --staged --quiet; then
  echo "沒有可提交的變更。"
  exit 0
fi

title_list="新文"
if [ -f "$report" ]; then
  title_list="$(jq -r '[.added[]?.title, .moved[]?.title] | map(select(. != null and . != "")) | if length == 0 then "新文" else map("「" + . + "」") | join("、") end' "$report")"
fi
commit_title="sync: 方格子${title_list}"
if [ "${#commit_title}" -gt 240 ]; then
  commit_title="$(printf '%s' "$commit_title" | cut -c1-240)…"
fi

git commit -m "$commit_title"

checks_ok=false
if [ "$FONTS" = "success" ] && [ "$LINT" = "success" ] && [ "$TYPECHECK" = "success" ] && [ "$TEST" = "success" ]; then
  checks_ok=true
fi
echo "checks fonts=${FONTS} lint=${LINT} typecheck=${TYPECHECK} test=${TEST} auto_merge=${checks_ok}"

if [ "$checks_ok" = true ]; then
  git fetch origin main
  if git rebase origin/main; then
    set +e
    push_output="$(git push origin HEAD:main 2>&1)"
    push_status=$?
    set -e
    printf '%s\n' "$push_output"
    if [ "$push_status" -eq 0 ]; then
      echo "已直接推上 main。"
      exit 0
    fi
    if ! printf '%s\n' "$push_output" | grep -Eq 'GH013|protected branch|required status check|Changes must be made through a pull request'; then
      echo "::error::推送到 main 失敗，且不是分支保護。"
      exit 1
    fi
    echo "::notice::main 受 protect-main-web 保護，改開 PR，等必要 checks 通過後 squash auto-merge。"
  else
    git rebase --abort || true
    echo "::error::rebase origin/main 失敗，改開 PR 且不自動合併。"
    checks_ok=false
  fi
fi

if git ls-remote --exit-code origin "refs/heads/${branch}" >/dev/null 2>&1; then
  git fetch origin "$branch"
  remote_sha="$(git rev-parse "refs/remotes/origin/${branch}")"
  git push --force-with-lease="refs/heads/${branch}:${remote_sha}" -u origin "$branch"
else
  git push -u origin "$branch"
fi

body="$(printf '%s\n' \
  "方格子新文同步。lint、typecheck、test、字型子集都成功才會合併；任一失敗則此 PR 保持開啟，不自動合併。" \
  "" \
  "checks：fonts=${FONTS} lint=${LINT} typecheck=${TYPECHECK} test=${TEST}" \
  "" \
  "Run：https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}")"

pr="$(gh pr list --base main --head "$branch" --state open --json url --jq '.[0].url // ""')"
if [ -z "$pr" ]; then
  pr="$(gh pr create --base main --head "$branch" --title "$commit_title" --body "$body")"
fi
echo "PR ${pr}"
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  printf '%s\n' "## 方格子同步" "- ${commit_title}" "- ${pr}" >>"$GITHUB_STEP_SUMMARY"
fi

if [ "$checks_ok" != true ]; then
  echo "::error::檢查未全過，PR 保持開啟、不合併：${pr}"
  exit 1
fi

sha="$(git rev-parse HEAD)"
list_out="$(gh run list --workflow=ci.yml --branch="$branch" --event=workflow_dispatch --limit=20 --json databaseId,headSha,createdAt)"
existing_ids="$(printf '%s' "$list_out" | jq -r --arg sha "$sha" '[.[] | select(.headSha == $sha) | .databaseId | tostring] | join(",")')"
gh pr merge "$pr" --squash --auto
gh workflow run ci.yml --ref "$branch" -f required_only=true

ci_run_id=""
for _wait_i in $(seq 1 12); do
  list_out="$(gh run list --workflow=ci.yml --branch="$branch" --event=workflow_dispatch --limit=20 --json databaseId,headSha,createdAt)"
  ci_run_id="$(printf '%s' "$list_out" | jq -r --arg sha "$sha" --arg ids "$existing_ids" '($ids | split(",") | map(select(length > 0))) as $old | [.[] | select(.headSha == $sha) | select((.databaseId | tostring) as $id | ($old | index($id) | not))] | sort_by(.createdAt) | last | .databaseId // empty')"
  if [ -n "$ci_run_id" ] && [ "$ci_run_id" != "null" ]; then
    break
  fi
  sleep 5
done

if [ -z "${ci_run_id}" ] || [ "$ci_run_id" = "null" ]; then
  echo "::notice::auto-merge 已開啟，但還沒看到 CI run。ruleset 仍要等 quality、build-and-public-e2e、Vercel：${pr}"
  exit 0
fi

quality_mirrored=false
build_mirrored=false
for i in $(seq 1 80); do
  state="$(gh pr view "$pr" --json state --jq .state)"
  if [ "$state" = "MERGED" ]; then
    echo "PR 已合併：${pr}"
    exit 0
  fi
  if [ "$state" = "CLOSED" ]; then
    echo "::error::PR 未合併就被關閉：${pr}"
    exit 1
  fi
  jobs_out="$(gh run view "$ci_run_id" --json jobs)"
  quality_conc="$(printf '%s' "$jobs_out" | jq -r '(.jobs[] | select(.name == "quality") | .conclusion // .status // "pending") // "pending"')"
  build_conc="$(printf '%s' "$jobs_out" | jq -r '(.jobs[] | select(.name == "build-and-public-e2e") | .conclusion // .status // "pending") // "pending"')"
  case "$quality_conc" in
    failure|cancelled)
      gh pr merge "$pr" --disable-auto || true
      echo "::error::CI quality 失敗，已關閉 auto-merge，PR 保持開啟：${pr}"
      exit 1
      ;;
  esac
  case "$build_conc" in
    failure|cancelled)
      gh pr merge "$pr" --disable-auto || true
      echo "::error::CI build-and-public-e2e 失敗，已關閉 auto-merge，PR 保持開啟：${pr}"
      exit 1
      ;;
  esac
  if [ "$quality_conc" = "success" ] && [ "$quality_mirrored" != true ]; then
    gh api "repos/${GITHUB_REPOSITORY}/statuses/${sha}" \
      -f state=success \
      -f context=quality \
      -f description="mirror workflow_dispatch quality" \
      -f target_url="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${ci_run_id}" >/dev/null
    quality_mirrored=true
  fi
  if [ "$build_conc" = "success" ] && [ "$build_mirrored" != true ]; then
    gh api "repos/${GITHUB_REPOSITORY}/statuses/${sha}" \
      -f state=success \
      -f context=build-and-public-e2e \
      -f description="mirror workflow_dispatch build-and-public-e2e" \
      -f target_url="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${ci_run_id}" >/dev/null
    build_mirrored=true
  fi
  status_out="$(gh api "repos/${GITHUB_REPOSITORY}/commits/${sha}/status")"
  vercel_state="$(printf '%s' "$status_out" | jq -r '[.statuses[]? | select(.context == "Vercel")] | sort_by(.updated_at) | last | .state // empty')"
  if [ "$vercel_state" = "failure" ] || [ "$vercel_state" = "error" ]; then
    gh pr merge "$pr" --disable-auto || true
    echo "::error::Vercel 失敗，已關閉 auto-merge，PR 保持開啟：${pr}"
    exit 1
  fi
  echo "等待 ruleset（${i}/80）：quality=${quality_conc} build-and-public-e2e=${build_conc} Vercel=${vercel_state:-pending}"
  sleep 20
done

echo "::notice::auto-merge 仍開著，等 quality、build-and-public-e2e、Vercel 通過後會 squash 合併：${pr}"
exit 0
