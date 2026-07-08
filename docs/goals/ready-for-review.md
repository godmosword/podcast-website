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

## 前置檢查（開工前先做，任一項不符就停止回報，不要開始管線）

```bash
test -f scripts/verify-episodes.ts || echo "MISSING: verify-episodes.ts"
test -f scripts/proofread-subtitles.ts || echo "MISSING: proofread-subtitles.ts"
test -f scripts/illustrate.ts || echo "MISSING: illustrate.ts"
grep -q OPENAI .env.local || echo "MISSING: OPENAI key in .env.local"
# verify 工具本身可用且輸出格式正確（Goal 全程依賴它，先驗它）
npm run --silent verify:episodes -- --json \
  | jq -e 'has("errors") and has("warnings") and has("passed")' > /dev/null \
  || echo "BROKEN: verify:episodes --json 輸出不是預期格式"
```

## 執行管線（依序，已完成的步驟直接跳過）

1. 字幕：若 `data/subtitles/{EPISODE_SLUG}.json` 不存在 → `npm run transcribe -- {EPISODE_SLUG}`
2. 校對：`npm run proofread:subtitles -- {EPISODE_SLUG}`；有 lint 問題先 `--fix` 或依規則手動修
   `data/subtitles/{EPISODE_SLUG}.json`，全部通過後 `npm run proofread:subtitles -- {EPISODE_SLUG} --mark`。
   禁止使用 `--mark --force`（那等於跳過待人工項，違反紅線）。
3. 插圖：`npm run illustrate -- {EPISODE_SLUG}`（會切場景、生定裝照與全幕插圖到 staging，並產生 contact sheet）。
   個別場景若生成失敗，可用 `npm run illustrate -- {EPISODE_SLUG} --scene N` 重試該幕，最多重試 2 次。
4. 驗證：跑下方「自我驗證」腳本，全部通過才進下一步。
5. 審核摘要：寫 `public/.illustrate-staging/{EPISODE_SLUG}/review-summary.md`（格式見下方規格）。

## 停止條件（全部為 true 才算完成）

1. `data/subtitles/{EPISODE_SLUG}.json` 存在且為合法 JSON
2. `data/subtitles/_proofread/{EPISODE_SLUG}.json` 存在（proofread mark，且不是用 --force 產生的）
3. `data/scenes/{EPISODE_SLUG}.json` 存在且為合法 JSON
4. staging 完整性（下方腳本逐項檢查）：
   - `public/.illustrate-staging/{EPISODE_SLUG}/` 存在
   - `NN.jpg` 數量 == `data/scenes/{EPISODE_SLUG}.json` 的 `.scenes | length`
   - 每張 `NN.jpg` 檔案大小 > 50KB（防空檔/截斷檔）
   - `contact.html` 存在且非空
   - `newCharacters` 裡的每個角色都有對應定裝照 `_char-<名>.jpg`
5. verify 報告中 `errors[]` 沒有任何 `slug == {EPISODE_SLUG}` 的項目
6. verify 報告中 `warnings[]` 也沒有 `slug == {EPISODE_SLUG}` 的項目（單集版 strict；
   其他集的 warnings 不算在內，全站 `strict_passed` 不作為本 Goal 的門檻）
7. `review-summary.md` 已產生且符合下方規格
8. 本次 Goal 期間的所有檔案寫入僅限：`data/subtitles/`、`data/subtitles/_proofread/`、
   `data/scenes/`、`public/.illustrate-staging/{EPISODE_SLUG}/`

## 自我驗證（條件 4/5/6 的可執行腳本；輸出任何 FAIL 即未完成）

```bash
SLUG={EPISODE_SLUG}
DIR="public/.illustrate-staging/$SLUG"

# verify 報告：先存檔再解析，跑失敗或格式錯都要能分辨
REPORT="$(npm run --silent verify:episodes -- --json)" \
  || { echo "FAIL: verify:episodes 執行失敗（exit != 0 且非單純驗證不過時，檢查錯誤訊息）"; }
echo "$REPORT" | jq -e . > /dev/null 2>&1 \
  || echo "FAIL: verify 輸出不是合法 JSON"
ISSUES=$(echo "$REPORT" | jq "[.errors[]?, .warnings[]? | select(.slug==\"$SLUG\")] | length")
[ "$ISSUES" = "0" ] || { echo "FAIL: $SLUG 有 $ISSUES 個 error/warning："; \
  echo "$REPORT" | jq "[.errors[]?, .warnings[]? | select(.slug==\"$SLUG\")]"; }

# staging 完整性
SCENES=$(jq '.scenes | length' "data/scenes/$SLUG.json")
IMGS=$(ls "$DIR"/[0-9][0-9].jpg 2>/dev/null | wc -l | tr -d ' ')
[ "$IMGS" = "$SCENES" ] || echo "FAIL: 幕數 $SCENES ≠ staging 圖數 $IMGS"
find "$DIR" -maxdepth 1 -name '[0-9][0-9].jpg' -size -50k \
  | grep . && echo "FAIL: 上列圖檔小於 50KB（疑似空檔/截斷）"
[ -s "$DIR/contact.html" ] || echo "FAIL: contact.html 不存在或為空"
jq -r '.newCharacters[]?' "data/scenes/$SLUG.json" | while read -r NAME; do
  [ -f "$DIR/_char-$NAME.jpg" ] || echo "FAIL: 新角色 $NAME 缺定裝照 _char-$NAME.jpg"
done
echo "自我驗證結束（無 FAIL 即通過）"
```

## review-summary.md 規格（缺任一節即條件 7 不成立）

1. **標頭**：slug、產生日期、幕數、音檔長度、字幕段數、proofread mark 日期與是否 --force
2. **一鍵開啟**：`open public/.illustrate-staging/{EPISODE_SLUG}/contact.html`（放最前面，審核第一步）
3. **幕次表**：每幕一列 — 幕號、對應圖檔名、標題（summary 摘要）、出場角色、是否 keepCover
4. **審核重點 checklist**（給人工審核逐項打勾用）：
   - [ ] 角色 on-model（對照定裝照，無「同角色長兩張臉」）
   - [ ] 同一幕沒有重複出現同一角色（例：兩個暖暖老師）
   - [ ] 無 AI 瑕疵：多手指、文字亂碼、肢體異常
   - [ ] 新角色定裝照可接受（若 newCharacters 非空；為空則寫「本集無新角色」）
   - [ ] keepCover 首幕正確（未被生成圖覆蓋 Apple 原始封面）
   - [ ] 抽查 2–3 幕：圖的內容和該時段字幕對得上
5. **異常備註**：生成過程中重試過哪些幕、有哪些 agent 覺得偏弱建議重點看的圖；沒有就寫「無」
6. **審核通過後的下一步**（可直接複製的指令區塊，見完成訊息第 4 點）

## 紅線（違反任一條就立即停止並回報，不得繞過）

- 禁止執行 `npm run illustrate -- {EPISODE_SLUG} --approve`（發佈是人工審核後的事）
- 禁止 `--mark --force`
- 禁止寫入或覆蓋 `public/stories/` 底下任何已發佈資產（含 Apple 原始 01.jpg 封面）
- 禁止修改 `data/content.ts`、角色名冊等發佈階段才更新的檔案
- 禁止 git commit / push（產出留在工作區給人工審核）
- illustrate 前若 proofread mark 不存在，讓腳本自然擋下並回頭補校對，不得手動偽造 mark 檔

## 失敗處理

- 前置檢查任一項不符 → 直接停止回報，不開始管線
- 任何步驟連續失敗 2 次（同樣錯誤）→ 停止，輸出：卡在哪一步、完整錯誤訊息、已完成/未完成的停止條件清單、建議的人工處置
- 缺 API key、音檔不存在、RSS 沒有該集等環境問題 → 不要嘗試 workaround，直接停止回報
- 生圖屬付費 API：單幕重試上限 2 次，全集 illustrate 完整重跑上限 1 次，超過即停止回報

## 完成時輸出（最後一則訊息必須依此格式）

1. 第一行：「✅ {EPISODE_SLUG} 已 ready-for-review，等你審核」
2. 八項停止條件的逐條核對結果（✅/❌ + 一句話證據）
3. 30 秒審核指南：先開 contact sheet 掃一遍 → 對照 review-summary.md 的 checklist → 重點看「異常備註」點名的幕
4. 可直接複製的指令區塊：

   ```bash
   # 開始審核
   open public/.illustrate-staging/{EPISODE_SLUG}/contact.html

   # 某幕不滿意，重抽第 N 幕後再看
   npm run illustrate -- {EPISODE_SLUG} --scene N

   # 全部滿意 → 發佈三步
   npm run verify:episodes -- --strict --json
   npm run illustrate -- {EPISODE_SLUG} --approve
   git add -A && git commit -m "feat(stories): illustrate {EPISODE_SLUG} full scenes"
   ```
