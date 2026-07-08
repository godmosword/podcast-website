# Goal：單集 ready-for-review（Loop A）

> 用法：換集時只改「參數」段的 `EPISODE_SLUG`，然後把本檔全文貼給新的 Claude Code session 執行。
> 完成後 agent 會停止並輸出審核總結；人工審核（contact.html）與 `--approve` 發佈屬 Loop B，不在本 Goal 範圍。

---

/goal 把單集 podcast 處理到「ready-for-review」狀態後停止並通知我人工審核。

## 參數

- EPISODE_SLUG: ep-11   （換集時只改這一行）

## 目標描述

針對 {EPISODE_SLUG}，完成所有機器可驗證的產製步驟（字幕 → 校對標記 → 場景切分 → 插圖生成到 staging → 驗證），
產出人工審核所需的素材與摘要，然後停止。**絕對不進行發佈（--approve）**，那是人工審核後的下一步。

## 執行管線（依序，已完成的步驟直接跳過）

1. 字幕：若 `data/subtitles/{EPISODE_SLUG}.json` 不存在 → `npm run transcribe -- {EPISODE_SLUG}`
2. 校對：`npm run proofread:subtitles -- {EPISODE_SLUG}`；有 lint 問題先 `--fix` 或依規則手動修
   `data/subtitles/{EPISODE_SLUG}.json`，全部通過後 `npm run proofread:subtitles -- {EPISODE_SLUG} --mark`。
   禁止使用 `--mark --force`（那等於跳過待人工項，違反紅線）。
3. 插圖：`npm run illustrate -- {EPISODE_SLUG}`（會切場景、生定裝照與全幕插圖到 staging，並產生 contact sheet）。
   個別場景若生成失敗，可用 `npm run illustrate -- {EPISODE_SLUG} --scene N` 重試該幕，最多重試 2 次。
4. 驗證：`npm run verify:episodes -- --json`，從 JSON 報告過濾出 slug == {EPISODE_SLUG} 的 issues。
5. 審核摘要：寫 `public/.illustrate-staging/{EPISODE_SLUG}/review-summary.md`（內容見下）。

## 停止條件（全部為 true 才算完成）

1. `data/subtitles/{EPISODE_SLUG}.json` 存在且為合法 JSON
2. `data/subtitles/_proofread/{EPISODE_SLUG}.json` 存在（proofread mark，且不是用 --force 產生的）
3. `data/scenes/{EPISODE_SLUG}.json` 存在且為合法 JSON
4. `public/.illustrate-staging/{EPISODE_SLUG}/` 存在，且每一幕都有對應的 `NN.jpg`，並有 `contact.html`
5. `npm run verify:episodes -- --json` 的報告中，`errors[]` 內沒有任何 `slug == {EPISODE_SLUG}` 的項目
6. 同一份報告中，`warnings[]` 內也沒有 `slug == {EPISODE_SLUG}` 的項目（單集版 strict；
   其他集的 warnings 不算在內，全站 `strict_passed` 不作為本 Goal 的門檻）
7. `public/.illustrate-staging/{EPISODE_SLUG}/review-summary.md` 已產生，包含：
   contact sheet 路徑、幕數與各幕標題、出場角色（標註哪些是新角色需核對定裝）、
   verify 結果摘要、以及「審核通過後的下一步指令」
8. 本次 Goal 期間的所有檔案寫入僅限：`data/subtitles/`、`data/subtitles/_proofread/`、
   `data/scenes/`、`public/.illustrate-staging/{EPISODE_SLUG}/`

條件 5/6 的自我驗證指令（結果必須為 `0`）：

```bash
npm run --silent verify:episodes -- --json | jq '[.errors[],.warnings[] | select(.slug=="{EPISODE_SLUG}")] | length'
```

## 紅線（違反任一條就立即停止並回報，不得繞過）

- 禁止執行 `npm run illustrate -- {EPISODE_SLUG} --approve`（發佈是人工審核後的事）
- 禁止 `--mark --force`
- 禁止寫入或覆蓋 `public/stories/` 底下任何已發佈資產（含 Apple 原始 01.jpg 封面）
- 禁止修改 `data/content.ts`、角色名冊等發佈階段才更新的檔案
- 禁止 git commit / push（產出留在工作區給人工審核）
- illustrate 前若 proofread mark 不存在，讓腳本自然擋下並回頭補校對，不得手動偽造 mark 檔

## 失敗處理

- 任何步驟連續失敗 2 次（同樣錯誤）→ 停止，輸出：卡在哪一步、完整錯誤訊息、已完成/未完成的停止條件清單、建議的人工處置
- 缺 API key、音檔不存在、RSS 沒有該集等環境問題 → 不要嘗試 workaround，直接停止回報
- 生圖屬付費 API：單幕重試上限 2 次，全集 illustrate 完整重跑上限 1 次，超過即停止回報

## 完成時輸出（最後一則訊息必須包含）

1. 「✅ {EPISODE_SLUG} 已 ready-for-review」
2. 八項停止條件的逐條核對結果
3. 人工審核入口：`open public/.illustrate-staging/{EPISODE_SLUG}/contact.html`
4. 審核通過後的建議指令：
   - `npm run verify:episodes -- --strict --json`（發佈前最後把關）
   - `npm run illustrate -- {EPISODE_SLUG} --approve`
   - 之後再 commit（feat(stories): illustrate {EPISODE_SLUG} full scenes 等慣例格式）
