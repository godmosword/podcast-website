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
npm run verify:episodes
```

- **全幕集**（`pageCount > 1`）：插圖數、scenes、subtitles、`captionTimes`、`captions` 必須一致。
- **MVP**（`pageCount = 1`）：至少 `01.jpg` + 字幕側車；待跑 illustrate。
- **Legacy**（ep-2–6 現為 6 頁 placeholder、無 scenes）：`verify:episodes` 會報錯，需依本 workflow 重做。

## 與舊流程的差異

| 項目 | 舊（僅 MVP） | 標準（ep-9／ep-10） |
|------|----------------|---------------------|
| 插圖 | 1 張封面 | 每 15–20s 一幕 |
| 字幕 | 側車逐句 | 側車 + **每幕一句 `captions`** |
| 接線 | 可只有 `pageCount` | `pageCount` + `captionTimes` + `captions` |

## 相關文件

- [README — illustrate](./README.md#每集劇情插圖自動生成npm-run-illustrate)
- [TODOS — Phase 3 生圖管線](./TODOS.md)
