# 解決 TODOS 三項：舊字幕開頭、只→隻、沒校對的新集提醒（PR-S2，2026-11-05）

## Context

PR-S1 留下的三項：

| 項目 | 查到的事實 |
|---|---|
| 舊字幕開頭缺口 | `ep-12`、`14`、`15`、`16`、`17` 少的是真的人聲。本機用 `-mc 0`、切 9 秒重轉，都轉得出主持人開場（`ep-17` 少 90 秒、`ep-14`、`15` 少 60 秒）。五集都已 `--mark`。 |
| 只→隻 | 不只是再處理的問題。OpenCC 字典把「是只」「有只」當量詞，「就是只有」「但是只要」「還是只能」第一次轉錄就會錯。同步每輪又對沒校對的字幕再轉一次，人工改回來也會被蓋掉（#296）。 |
| 沒校對的新集沒人提醒 | 每集只有一張待生圖 Issue，關掉就沒了；沒歸主題的集數在找故事頁任何主題下都不出現。 |

目標：五集開頭補齊、不動既有校對成果；轉出來不再有這種「隻」、人工改的字不被蓋掉；還有集數沒處理時，一直有一張彙整 Issue 看得到。

級別 **L3**（動 `scripts/sync-apple-podcast.ts` 與看門狗）：工程審（Codex）、對抗審（cursor-agent）、設計審（Opus，只看 Issue 文案與文件）。字幕內容走內容 SOP，中文校對依 Domain 用 Sonnet。不生圖、不付費、音檔不外送。

## 改動

### 1. 五集開頭補回（只往前加，不動既有句子）

- 用已轉好的本機草稿（整段 `-mc 0` 與切片互相對照），先簡轉繁、套開場格式。開場格式對齊已校對的集數：`我們一起出發去`／`車車遊樂園`／`嗨 我是 Bonbon`／`我是馬米`。
- Sonnet 校對只改新加的句子。聽不出來的句子（例如 `ep-15` 30 秒「嗓子并不止疼」）**寧可留空也不猜**，列給你聽。
- 只新增時間早於現有第一句的句子；既有句子逐字不變，用測試或 diff 確認。之後重新 `--mark`。
- `transcribe-coverage.test.ts` 拿掉 `KNOWN_OPENING_GAPS`，五集之後都要過門檻。
- 順手修 `ep-36` 那句「隻有」→「只有」。

### 2. 只→隻

- `scripts/lib/transcribe-core.ts`：OpenCC 之後多一步，只在前一字是「是／有」、後面接「有、是、要、能、會、想、剩、在」時把「隻」改回「只」。「一隻有翅膀的鳥」「那隻要去哪」不受影響。
- 同步與 backfill 的再處理只做過濾與人名修正，**不再跑 OpenCC**：`relocalizeSidecars` 拆成 `refilterSidecars`；`scripts/sync-apple-podcast.ts`、`scripts/transcribe-backfill.ts` 改用它。`npm run transcribe -- --convert` 維持完整簡轉繁，說明寫明給 Whisper 原始輸出用。
- 已 `--mark` 的跳過這條規則不變。

### 3. 彙整提醒 Issue

- 新增 `scripts/lib/content-reminder.ts`（判斷與內文是純函式，`gh` 可注入），`scripts/check-sync-fresh.ts` 每輪在 RSS 檢查前呼叫；出錯只記 warning，不影響看門狗本身。workflow yaml 不用改（已有 `issues: write`）。
- **待處理**：上架滿 7 天，字幕沒 `--mark` 或沒歸主題。不管該集的待生圖 Issue 開著沒。
- 全站只有一張（label `sync-alert`＋`content-pending`）：
  - 有待處理、沒開著的單 → 開一張，帶 mention。
  - 開著、清單變了 → 改內文，不留言（內文帶隱藏簽名比對，沒變不動）。
  - 清單空了 → 留言後關閉。
  - **有人手動關掉、還有待處理 → 7 天後再開**，等於關掉＝延後一週。
- 查 Issue 失敗就跳過這輪，不要當成沒單而重複開。
- 內文列每集的標題、日期、缺什麼（字幕校對／歸主題），沒歸主題的註明「找故事篩不到」，連到 `docs/EPISODE-WORKFLOW.md`。
- **找故事頁行為不變**：主題要讀字幕判斷，不用關鍵字猜，也不把未歸主題的集數塞進每個主題；靠提醒把它補上。

合併後看門狗的下一輪會開第一張，內容是 `ep-33`、`34`、`35`（都已滿 7 天且未校對）；`ep-36` 11 月 11 日起列入。

### 4. 文件

`docs/EPISODE-WORKFLOW.md` 加彙整 Issue 的行為，`docs/SUBTITLE-PROOFREAD.md`、`TODOS.md`（三項標完成）、`CHANGELOG.md` 同步；計畫複製到 `docs/plans/2026-11-05-subtitle-followups.md`。

## 測試（先寫、看它紅）

- `就是只有`、`但是只要`、`還有只有` 轉對；`一只小猫`、`他是只小猫`、`一只有翅膀的鸟`、`那只要去哪` 維持「隻」。
- 再處理：`它裡面就是只有平板而已`、`了解` 不被改；幻覺句仍被濾掉、`我是蹦蹦` 仍修成 `Bonbon`。
- `content-reminder`：7 天邊界、只缺校對／只缺主題／都缺；開單、改內文、沒變不動、清空關閉、手動關閉 7 天內不重開、滿 7 天重開、查 Issue 失敗不開單。
- 五集字幕：舊內容是新內容的尾段（逐字相同），新句子都早於舊的第一句。
- `sync-workflow-contract.test`：沿用「再處理跳過 `--mark`」，加上再處理不呼叫 OpenCC、`check-sync-fresh.ts` 會呼叫提醒。

## Verification

`NODE_OPTIONS=--no-experimental-webstorage caffeinate -i npm run check`、`npm run lint`、`npx vitest run scripts/check-agent-docs-contract.test.ts`、`npm run sync:validate`、`npm run verify:episodes`、`SYNC_ALERT_DRY_RUN=1 npx tsx scripts/check-sync-fresh.ts` 看提醒會開的單。三審通過後 commit 推 main、刪分支，確認 CI 綠燈與看門狗下一輪開出的那張。

## Out of scope

- `ep-33`～`36` 的校對與 `--mark`（會被新 Issue 列出）。
- 其他 OpenCC 誤轉（例如「钟」→「鍾」），校對時處理。
- 重新生成既有幕級 captions；這五集的場景與插圖不動。

## Risks／rollback

- **沒有人實際聽過補回的開頭**：Whisper 加文字校對，專名與童言可能有誤。站上字幕、逐字稿會立刻顯示；我會列出存疑的句子給你聽。
- 「是隻有翅膀的鳥」這類真量詞會被誤改成「只」，機率低，字幕本來就是校對前草稿。
- 看門狗每小時多一次 `gh` 查詢；失敗不影響原本功能。
- 三塊分開 commit，可單獨 revert。
