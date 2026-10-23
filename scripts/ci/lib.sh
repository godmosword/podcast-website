#!/usr/bin/env bash
# 同步 workflow 共用：把失敗寫成 ::error::、##[error] 摘錄，以及給告警用的原因檔。
sync_ci_error() {
  local msg="$1"
  echo "::error::$msg"
  local dest="${SYNC_ERROR_EXCERPT_PATH:-${RUNNER_TEMP:-/tmp}/sync-error-excerpt.txt}"
  mkdir -p "$(dirname "$dest")"
  printf '##[error]%s\n' "$msg" >> "$dest"
  if [ -n "${RUNNER_TEMP:-}" ]; then
    printf '%s\n' "$msg" > "$RUNNER_TEMP/sync-failure-context.txt"
  fi
}

# 印出 sync-output-paths.txt 的白名單，一行一個，去掉註解與空行。
sync_output_paths() {
  local list
  list="$(dirname "${BASH_SOURCE[0]}")/sync-output-paths.txt"
  sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' "$list" | grep -v -e '^#' -e '^$'
}

# 從 stdin 讀路徑（一行一個），印出不在白名單裡的。
# 結尾是 / 的是目錄前綴，其餘要一字不差（同 scripts/lib/sync-outputs.ts 的 isSyncOutputPath）。
sync_paths_outside_allowlist() {
  SYNC_ALLOWED="$(sync_output_paths)" awk '
    BEGIN { n = split(ENVIRON["SYNC_ALLOWED"], allowed, "\n") }
    NF == 0 { next }
    {
      for (i = 1; i <= n; i++) {
        entry = allowed[i]
        if (entry == "") continue
        if (substr(entry, length(entry)) == "/") {
          if (index($0, entry) == 1) next
        } else if ($0 == entry) {
          next
        }
      }
      print
    }
  '
}

# 只 stage 白名單裡的路徑（在呼叫端的 cwd，也就是 repo 根目錄）。
# 還有沒 stage 的變更或新檔，就是同步寫到了白名單以外，直接失敗，不要靜默丟掉或推上去。
# porcelain 含已 stage 的列（例如 "M  data/…"），那些另外檢查：
# 第二欄不是空白，或第一欄是 ?，才是還沒 stage 的殘檔。
sync_stage_outputs() {
  local entry
  local -a present=()
  while IFS= read -r entry; do
    # git add 遇到不存在、也沒被追蹤的路徑會整個失敗，所以先濾掉。
    if [ -e "$entry" ] || [ -n "$(git ls-files -- "$entry")" ]; then
      present+=("$entry")
    fi
  done < <(sync_output_paths)

  if [ "${#present[@]}" -gt 0 ]; then
    git add -- "${present[@]}"
    git add -u -- "${present[@]}"
  fi

  local leftover
  leftover="$(git status --porcelain=v1 --untracked-files=all | awk 'substr($0, 2, 1) != " " || substr($0, 1, 1) == "?" { print }')"
  # 先前步驟已經 stage 的變更也要在白名單內（例如被 git rm 的手寫檔）。--no-renames 讓改名的舊路徑也列出來。
  local staged_outside
  staged_outside="$(git diff --cached --name-only --no-renames | sync_paths_outside_allowlist)"
  if [ -n "$leftover" ] || [ -n "$staged_outside" ]; then
    sync_ci_error "sync 寫到了白名單（scripts/ci/sync-output-paths.txt）以外的檔案。是新的同步產物就補進清單；不是就修同步腳本。"
    printf '%s\n' "$leftover" "$staged_outside" | grep -v '^$' || true
    return 1
  fi
}
