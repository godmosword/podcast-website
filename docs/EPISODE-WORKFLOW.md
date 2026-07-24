# 單集全幕插圖 Workflow（標準範本：ep-9、ep-10）

新集與 EP2–8 升級時**必須**與 ep-9／ep-10 同一套流程與產物，不得跳步。

## 黃金範本

| 集數 | 幕數 | 說明 |
|------|------|------|
| **ep-9** | 21 | 恐龍車多多刷牙 |
| **ep-10** | 20 | 粽子餐車端午 |

播放器行為：每幕一張插圖 + **幕級字幕**（`captions` 與 `pageCount` 同長），換圖時間對 `captionTimes`。

## 必備產物（全幕繪本，`pageCount > 1`）

| 產物 | 路徑 |
|------|------|
| 字幕側車 | `data/subtitles/<slug>.json` |
| 字幕校對標記 | `data/subtitles/_proofread/<slug>.json`（`--mark` 後） |
| 場景切分 | `data/scenes/<slug>.json` |
| 插圖 | `public/stories/<slug>/01.jpg` … `NN.jpg`（張數 = `pageCount`） |
| Metadata | `pageCount`、`captionTimes[]`、`captions[]`（長度皆 = 幕數） |

Metadata 寫入位置：

- **sync 新集（ep-7+）**：`data/apple-synced.json` + `data/apple-sync.defaults.json` overrides
- **手動集（ep-1–6）**：同上 overrides + `data/stories.ts`（`--approve` 自動同步）

執行時由 `data/content.ts` 合併 overrides。

### MVP sync 自動補齊的 catalog sidecar

新集寫入後會進入 `getStories()`，下列三檔必須有該 slug，否則 GHA `npm test` 會擋下 push（見 issue #46）：

| Sidecar | 路徑 | sync 行為 |
|---------|------|-----------|
| zone 對映 | `data/story-zones.ts` | 標題關鍵字推斷（恐龍→dino 等），缺則寫入 |
| 反思提問 | `data/reflection-prompts.ts` | 標題推導 MVP stub（`child` 問號結尾） |
| 修改時間 | `data/story-dates.ts` | `now` + `` `${sha7} sync Apple RSS MVP` `` |

只補缺 key、不覆寫人工條目。Phase 2（校對／生圖前）請覆寫反思文案並確認 zone。

## 標準步驟

```bash
# 0. GHA 或本機 sync 後為 MVP（pageCount=1、01.jpg、Whisper **草稿**字幕；
#    並自動補 story-zones／reflection-prompts／story-dates）

# 1. 字幕校對（**illustrate 前必做**，見 docs/SUBTITLE-PROOFREAD.md）
npm run proofread:subtitles -- <slug>          # lint
npm run proofread:subtitles -- <slug> --fix    # 自動修正品牌名
#    人工編輯 data/subtitles/<slug>.json
npm run proofread:subtitles -- <slug> --mark   # 通過後標記（illustrate 閘門）

# 2. 切場景（可先審、不生圖）
npm run illustrate -- <slug> --segment-only

# 3. 生圖 → staging + contact.html（需 OPENAI_API_KEY）
OPENAI_API_KEY=sk-... npm run illustrate -- <slug>
open public/.illustrate-staging/<slug>/contact.html

# 4. 審圖通過 → 上線
npm run illustrate -- <slug> --approve
#    → public/stories/<slug>/NN.jpg
#    → pageCount / captionTimes / captions

# 5. 驗證（對照 ep-9／ep-10）
npm run verify:episodes
npm run verify:browse-index

# 6. 建置與推送
npm run sync:apple && npm run build
git add public/stories/ data/scenes/ data/subtitles/ data/subtitles/_proofread/ \
  data/apple-synced.json data/apple-sync.defaults.json data/stories.ts data/characters.json
git commit -m "feat(stories): illustrate <slug> full scenes"
git push
npm run sync:notify   # 務必先 push 成功再跑；走 GHA 同一路徑補開／去重「待生圖」Issue（見 README「同步通知」）

# 7. （可選）匯出 YouTube 整集影片
npm run export:video -- <slug>
#    → export/video/<slug>/<slug>.mp4（原始逐句字幕 burn-in）
#    見 docs/VIDEO-EXPORT.md

# 8. （營運）SoundOn show notes 回鏈
#    於 SoundOn 後台該集 show notes 尾段貼官網連結（含 UTM），見 docs/metrics/README.md
#    lib/soundon-backlink.ts → soundOnStoryBacklinkLine(slug, title)
```

## 驗證

```bash
npm run verify:episodes              # error 才 exit 1，warn 列出待辦
npm run verify:episodes -- --strict  # warn 也視為失敗（approve 前最後把關）
npm run --silent verify:episodes -- --json  # 給 agent/evaluator 的純 JSON report
npm run --silent verify:episodes -- --json --strict  # 純 JSON，且 warn 也影響 exit code
npm run verify:browse-index          # 找車車／主題索引與目錄一致（warn 不擋 CI）
npm run check                        # test + verify + build，與 CI 同一套
```

- **全幕集**（`pageCount > 1`）：插圖數、scenes 幕數、subtitles、`captionTimes`、`captions` 必須與 `pageCount` 一致，否則 **error**。
- **MVP**（`pageCount = 1`）：至少 `01.jpg` + 字幕側車；一律列 **warn**（`illustrate-pending`，或已切場景未 approve 的 `illustrate-incomplete`），不會靜默通過。
- **Legacy**（ep-2–6 allowlist，6 頁 placeholder、無 scenes）：列 **warn**（`legacy-placeholder`），需依本 workflow 重做。allowlist 以外的多頁集缺 scenes 一律 **error**。

### CI 行為（每次 sync 一致）

GHA `sync-apple-podcast.yml` 在 `npm run sync:apple` 後**一律**跑 `npm run verify:episodes`：

| 結果 | 影響 |
|------|------|
| error | 擋下 commit/push，sync 失敗 |
| warn | 不擋 sync；寫入 Actions Job Summary，待生圖集數每次可見 |

## 與舊流程的差異

| 項目 | 舊（僅 MVP） | 標準（ep-9／ep-10） |
|------|----------------|---------------------|
| 插圖 | 1 張封面 | 每 15–20s 一幕 |
| 字幕 | 側車逐句 | 側車 + **每幕一句 `captions`** |
| 接線 | 可只有 `pageCount` | `pageCount` + `captionTimes` + `captions` |

## 相關文件

- [VIDEO-EXPORT.md](./VIDEO-EXPORT.md) — YouTube 整集 mp4 匯出（原始字幕 burn-in）
- [SUBTITLE-PROOFREAD.md](./SUBTITLE-PROOFREAD.md) — Whisper 草稿校對清單與 `--mark` 閘門
- [AGENT-WORKFLOW.md](./AGENT-WORKFLOW.md) — Meta 編排（`/agent-plan`、`/agent-action`）
- [AGENT-DOMAIN.md](./AGENT-DOMAIN.md) — 本專案 Bootstrap、紅線、驗證矩陣
- [README — illustrate](./README.md#每集劇情插圖自動生成npm-run-illustrate)
- [TODOS — Phase 3 生圖管線](./TODOS.md)
