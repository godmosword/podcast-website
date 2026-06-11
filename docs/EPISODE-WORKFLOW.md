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
| 場景切分 | `data/scenes/<slug>.json` |
| 插圖 | `public/stories/<slug>/01.jpg` … `NN.jpg`（張數 = `pageCount`） |
| Metadata | `pageCount`、`captionTimes[]`、`captions[]`（長度皆 = 幕數） |

Metadata 寫入位置：

- **sync 新集（ep-7+）**：`data/apple-synced.json` + `data/apple-sync.defaults.json` overrides
- **手動集（ep-1–6）**：同上 overrides + `data/stories.ts`（`--approve` 自動同步）

執行時由 `data/content.ts` 合併 overrides。

## 標準步驟

```bash
# 0. GHA 或本機 sync 後為 MVP（pageCount=1、01.jpg、字幕草稿）

# 1. 校對字幕
#    編輯 data/subtitles/<slug>.json（Bonbon／馬米等人名）

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

# 6. 建置與推送
npm run sync:apple && npm run build
git add public/stories/ data/scenes/ data/subtitles/ data/apple-synced.json \
  data/apple-sync.defaults.json data/stories.ts data/characters.json
git commit -m "feat(stories): illustrate <slug> full scenes"
git push
```

## 驗證

```bash
npm run verify:episodes              # error 才 exit 1，warn 列出待辦
npm run verify:episodes -- --strict  # warn 也視為失敗（approve 前最後把關）
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

- [README — illustrate](./README.md#每集劇情插圖自動生成npm-run-illustrate)
- [TODOS — Phase 3 生圖管線](./TODOS.md)
