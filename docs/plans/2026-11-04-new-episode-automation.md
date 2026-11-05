# 新集上架流程補自動化（PR-S1，2026-11-04）

## Context

`docs/EPISODE-WORKFLOW.md`「已知缺口」的四件事，`ep-33`～`ep-36` 都實際出過問題，現在靠人記得：

| 缺口 | 發生過什麼 | 根因 |
|---|---|---|
| 封面 AVIF／WebP | `ep-33`～`36` 正式站播放頁破圖 | 同步不產生；`<picture>` 遇到 404 不退回 JPG |
| 主題 | 每出一集 main 的 CI `quality` 就紅 | 測試要求每集都有主題，同步不能寫手寫檔，PR 又不跑單元測試 |
| 字幕轉錄 | `ep-36` 只剩 42 句（本機 0 句），仍回報成功 | Whisper 重複幻覺被過濾掉，沒檢查結果夠不夠 |
| `sync/apple` 舊歷史 | #295 跟 main 衝突、卡住 | backfill 只看分支在不在，接在已 squash 的舊 commit 後面 |

目標：新集進來時 main 保持綠燈、播放頁不破圖、字幕壞了會失敗而不是假成功、PR 不卡。主題與校對仍要人判斷，但有提醒。

級別 **L3**（動 sync workflow）：工程審（Codex）、對抗審（cursor-agent，失敗備援 grok）、設計審（Opus，只看播放器退回與 Issue 文案）。不動全幕契約、不付費、不生圖。

## 改動

### 1. 封面現代格式自動產生
- `scripts/ci/generate-derived-assets.sh` 加一步，只處理 `public/stories/*/01.jpg` 缺 AVIF／WebP 的（沿用 `scripts/lib/lcp-image-optimize.ts` 的 `verifyModernSiblings`、`writeModernSiblings`）。`public/stories/` 已在同步白名單。不用整包 `optimize:lcp-images`：它也掃 `public/landing`，不在白名單。
- `scripts/lib/sync-validate.ts`：封面缺 AVIF／WebP 算 **error**，擋下同步（比照缺 blur，#251）。
- **播放器保險**（`components/StoryPlayer.tsx`）：現代格式載入失敗時，這一幕改用 JPG 重試，JPG 也失敗才顯示「插圖載入失敗」。舊瀏覽器快取、部署中的空窗都不會再破圖。

### 2. 主題不再讓 main 變紅
- `data/episode-themes.test.ts`：表裡每一列都要對得上故事、主題是七個之一；**沒在表裡的只允許字幕還沒 `--mark` 的集數**。`--mark` 過的集數缺主題仍然紅。
- `scripts/lib/episode-workflow.ts`：缺主題列 warn（`theme-pending`），會進 `verify:episodes` 與同步的 Job Summary；`--strict` 時擋（approve 前把關）。
- 缺主題時站上行為不變：`episodeFinderTheme` 回空字串，篩主題時不出現，全部清單照常。
- `scripts/sync-alert.ts`：「待生圖」Issue 內文加一句待辦：歸主題、字幕校對，連到 `docs/EPISODE-WORKFLOW.md`。

### 3. 字幕壞了要失敗、能自救
- `scripts/lib/transcribe-core.ts` 新增純函式 `subtitleCoverageProblem(cues, durationSec)`：第一句 ≤ 30 秒、最大空白 ≤ 60 秒、最後一句離結尾 ≤ 60 秒；門檻先用現有 35 集字幕驗過不誤判。
- `transcribeAudio` 流程：照現在跑 → 覆蓋不足就加 `-mc 0` 重跑 → 開頭還空就把前 30 秒切成每段 9 秒補轉 → 還是不足就 **throw**。
- throw 走 backfill 既有失敗計數，滿 3 次開 Issue。本機 `npm run transcribe` 也會失敗，不再印「✓ 0 句」。音檔仍只在本機與 CI，不外送。

### 4. backfill 不再接舊歷史
- `scripts/ci/checkout-sync-base.sh`：用 `gh pr list --head sync/apple --state open` 判斷，**有開著的 PR 才接在分支後面**，否則從 `origin/main` 開始；lease 仍記遠端 SHA，推的時候照樣 force-with-lease。
- `.github/workflows/transcribe-backfill.yml`：這一步給 `GH_TOKEN`。
- 不改 `delete_branch_on_merge` 這個 repo 設定，也不刪分支。

### 5. 文件
`docs/EPISODE-WORKFLOW.md` 總覽第 3 步改成自動、第 4 步與已知缺口改寫；README 同步段落、TODOS、CHANGELOG 同步更新；計畫複製到 `docs/plans/2026-11-04-new-episode-automation.md`。

## 測試（先寫、看它紅）

- `subtitleCoverageProblem`：`ep-36` 壞掉那份（第一句 330 秒）與空字幕都抓得到；重跑流程用假的 whisper 測「第一次不足 → `-mc 0` → 補開頭 → 還不足就 throw」。
- 現有 35 集字幕掃一次都不誤判。
- `sync-validate.test`：封面缺 AVIF 是 error。
- `episode-workflow.test`、`episode-themes.test`：未校對缺主題是 warn、`--mark` 後缺主題紅。
- `sync-workflow-contract.test`：`checkout-sync-base.sh` 看開著的 PR、workflow 有 `GH_TOKEN`；shell 邏輯用假 `gh`、假 remote 測兩條路徑。
- e2e：路由攔截 `01.avif` 回 404，播放頁顯示 JPG（`naturalWidth > 0`）、沒有「插圖載入失敗」；JPG 也 404 才顯示。

## Verification

`NODE_OPTIONS=--no-experimental-webstorage npm run check`、`npm run lint`、`npx vitest run scripts/check-agent-docs-contract.test.ts`、`npm run sync:validate`、`npm run build` 後跑播放器 e2e。真正走過一輪要等下一集上架，文件會寫明下次要看哪幾項。三審通過後 commit 推 main、刪分支。

## Out of scope

- 歸主題與字幕校對的判斷本身（要人）。
- 其他字幕的校對；`ep-33`～`36` 的 stub 改寫與生圖。
- 手動刪 `sync/apple`（下次同步會重設）。

## Risks／rollback

- 同步多了圖片編碼，job 會多幾秒；只處理缺檔的集數。
- 覆蓋率門檻太嚴會把正常字幕判失敗：先用 35 集驗，失敗也不擋上架，只是字幕晚到並開 Issue。
- 主題測試放寬：靠 `--mark` 後必須有主題與 `theme-pending` warn 守住，不會被遺忘太久。
- 改動按區塊分 commit，可單獨 revert。
