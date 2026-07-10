# GEO Baseline — 2026-07-10

> 對照 [`geo-checklist.md`](../geo-checklist.md)。本輪變更（W27-1、REUSE-2 等）**需部署後**再跑 production 抽查與 AI prompt 實測。

## 自動驗證（本機 CI 等價）

| 項目 | 結果 | 備註 |
|------|------|------|
| `npm test` | ✅ 509 passed | 含 `for-parents`、`parent-guides`、`geo-content-contract` |
| `npm run verify:episodes` | ✅ 全部通過 | 字幕 sidecar：`data/subtitles/<slug>.json`；校對標記：`data/subtitles/_proofread/<slug>.json` |
| `npm run build` | ✅ | SSG 單集／主題／車種 |
| `npx tsc --noEmit` | ✅ | |

## 程式抽查（本輪實作）

| 項目 | 結果 |
|------|------|
| `/for-parents` 無「待確認」 | ✅ `lib/for-parents.test.ts` |
| `parentGuide` ep-1／ep-5 | ✅ `data/parent-guides.test.ts` |
| 全集 `ageRange` 預設 | ✅ `enrichStory` →「約 3–7 歲」 |

## Production（部署後人工填寫）

- Production URL：`https://podcast-website-mu.vercel.app`
- [ ] `curl` robots / llms / llms-full / sitemap → 200
- [ ] `/for-parents` HTML grep「待確認」= 0
- [ ] Rich Results：`/for-parents`、1× topic、1× vehicle
- [ ] AI prompt 五則（§4 checklist）— 需人工

## REUSE-1 結論

字幕**內容**讀取路徑為 `data/subtitles/<slug>.json`（`subtitleSidecarPath`）；`_proofread/` 存放 **--mark 校對標記**，非平行字幕檔。backfill／illustrate 已透過同一路徑讀取；無需改為讀 `_proofread/` 正文。

## 下一次追蹤

- 部署本輪 commit 後 7 日內補 AI 引用 baseline
- 新集上架：proofread → mark → backfill captions
