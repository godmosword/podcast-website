# Playground／合輯 Baseline（A0）

> **單一真相：** 現算 `lib/playground-baseline.ts` 的 `computePlaygroundBaseline()`。  
> **鎖定：** `lib/playground-baseline.test.ts`。數字變了就改測試，不要抄 CHANGELOG、舊 Wave 備註或聊天紀錄。  
> Production 合輯 registry 是 `lib/playground-collections.ts` 的 `COLLECTION_DEFINITIONS`，**沒有** `data/play-map.ts` / `PLAY_MAP_COLLECTIONS`。

本檔只做對帳。**不要**改 `data/playgrounds.ts`、不要增刪合輯、不要改門檻。

## Status 語意

Schema **沒有** `open` / `closed`。

| 資料值 | 意思 |
|---|---|
| `status` 省略 | 營業中（baseline 稱 operating / active） |
| `status: "temporarily-closed"` | 休園／整修中（目前 1 筆：`ty-puhsin` 埔心牧場） |

合輯 `activeCount`、覆蓋 headline、nearby 都排除 `temporarily-closed`。`filterPlaygrounds()` 本身**不**排除休園；Play Map 列表仍看得到休園標記。

## Global

| 項目 | 值 |
|---|---|
| total | 96 |
| operating | 95 |
| temporarilyClosed | 1 |
| cities | 15 |
| districts（有填 district） | 66 |
| free / paid（operating） | 55 / 40 |
| indoor / outdoor（operating） | 32 / 63 |

類型（含休園）：公園 41、博物館 29、其他 10、主題樂園 7、動物園 4、農場 4、室內樂園 1。

驗證：`operating + temporarilyClosed === total`、`free + paid === operating`、`indoor + outdoor === operating`。

## Per-city

欄位皆為 **total / operating / freeActive / indoorActive**。

| 縣市 | total | operating | free | indoor | city collection |
|---|---:|---:|---:|---:|---|
| 基隆市 | 5 | 5 | 3 | 1 | launched `keelung` |
| 台北市 | 8 | 8 | 3 | 3 | launched `taipei` |
| 新北市 | 8 | 8 | 5 | 3 | launched `new-taipei` |
| 桃園市 | 9 | 8 | 5 | 4 | launched `taoyuan`（含 1 筆休園） |
| 新竹市 | 8 | 8 | 6 | 1 | launched `hsinchu-city` |
| 新竹縣 | 8 | 8 | 5 | 1 | launched `hsinchu-county` |
| 苗栗縣 | 5 | 5 | 3 | 0 | launched `miaoli` |
| 台中市 | 8 | 8 | 6 | 1 | launched `taichung` |
| 彰化縣 | 5 | 5 | 5 | 0 | launched `changhua` |
| 南投縣 | 5 | 5 | 2 | 2 | launched `nantou` |
| 雲林縣 | 5 | 5 | 3 | 1 | launched `yunlin` |
| 嘉義市 | 4 | 4 | 1 | 4 | **未上線**（無 definition） |
| 嘉義縣 | 5 | 5 | 2 | 5 | launched `chiayi-county` |
| 台南市 | 7 | 7 | 2 | 3 | launched `tainan` |
| 高雄市 | 6 | 6 | 4 | 3 | launched `kaohsiung` |

`sum(city.*) === global.*`。舊 Phase 0 表（基隆 2、台北 9、新北 10、嘉義縣 6／indoor 1）已過期。

## Launch registry（19）

門檻：`activeCount >= 5`（`MIN_INDEXABLE_COLLECTION_SIZE`）。低於門檻的合輯**不會**進 registry。

CITY（14）:

- keelung
- taipei
- new-taipei
- taoyuan
- hsinchu-city
- hsinchu-county
- miaoli
- taichung
- changhua
- nantou
- yunlin
- chiayi-county
- tainan
- kaohsiung

FREE（5）:

- new-taipei-free
- taoyuan-free
- hsinchu-city-free
- hsinchu-county-free
- taichung-free

INDOOR（0）:

- （無）

TOTAL = 19

未 launch 的 city candidate 只有 **嘉義市**（`chiayi-city` 只是對帳 slug，不是 route）。

舊報告把台北免費、南投免費當成已上線——**錯**。那兩組不在 registry；`taipei-free` 現 3 筆、`nantou-free` 現 2 筆。

## 已解的四個矛盾

**A.** 15 cities 與 14 city collections 可以同時成立：資料有 15 縣市，registry 只有 14 個 city family。舊數字「14 city collections」對；「基隆未上線」錯。

**B.** 基隆有 definition、已 launch（5 筆達標）。嘉義市沒有 definition、未 launch（4 筆）。真正未 launch city candidate = 1。

**C.** 「4 個全室內館」是 **嘉義市**（4/4 indoor）。嘉義縣是 **5/5 indoor**；`chiayi-county-indoor` 與 parent city 完全相同，所以沒有上線。舊 audit 把市／縣 label 寫反，且縣的 6／indoor 1 已過期。

**D.** global indoor 32 = sum(city indoorActive) 32。global free 55 = sum(city freeActive) 55。MATCH。

## Threshold contract

- 最小值：**5**
- 計 **active**（排除 `temporarily-closed`），不是 matching total
- 作用點：`isCollectionIndexable`、`validateCollectionDefinitions`、collection 靜態頁、sitemap（sitemap 列出的已是通過驗證的 registry）
- Play Map 篩選列表**不受**這個門檻限制

## Exact duplicates（未上線候選）

Launched duplicates: `[]`

若拿去上線會撞 duplicate guard 的（節錄）：

- `changhua` vs `changhua-free` — 5 筆全免費
- `chiayi-county` vs `chiayi-county-indoor` vs `chiayi-county-rainy-day` — 5 筆全室內
- `chiayi-city` vs `chiayi-city-indoor` vs `chiayi-city-rainy-day` — 4 筆全室內
- 多數縣市 `*-indoor` vs `*-rainy-day` 相同（雨天定義 ⊇ indoor，且沒有額外「雨天備案」戶外場）

完整 pair 由 `candidateExactDuplicates` 現算。不要為 duplicate 開後門。

## Near-threshold（高意圖）

| slug | CURRENT ACTIVE | SHORT OF 5 | PARENT ACTIVE | OVERLAP | EXACT DUPLICATE? |
|---|---:|---:|---:|---:|---|
| taoyuan-indoor | 4 | 1 | 8 | 4 | no |
| kaohsiung-free | 4 | 1 | 6 | 4 | no |
| chiayi-city | 4 | 1 | 4 | 4 | no（但 indoor/rainy 會跟它重複） |
| taipei-free | 3 | 2 | 8 | 3 | no |
| taipei-indoor | 3 | 2 | 8 | 3 | no |
| new-taipei-indoor | 3 | 2 | 8 | 3 | no |
| tainan-indoor | 3 | 2 | 7 | 3 | no |
| kaohsiung-indoor | 3 | 2 | 6 | 3 | no |

真正只差 1、且不是 parent duplicate：`taoyuan-indoor`、`kaohsiung-free`、`chiayi-city`。  
`chiayi-city-indoor` 也是 4，但是 city 的 exact duplicate，不能當獨立合輯解鎖。

本批**不推薦新場地名稱**。

## Optional fields（RAW vs 品質債）

| 欄位 | present | missing | likely debt | 說明 |
|---|---:|---:|---:|---|
| officialUrl | 49 | 47 | 0 | 免費公園缺官網可以；active paid 缺 officialUrl = 0 |
| feeNote | 42 | 54 | 0 | 免費場沒票價說明合理；A1 已補 9 筆 active paid feeNote |
| coverageNote | 22 | 74 | 0 | 選填誠實聲明；有 `status` 時才必填 |
| mapsQuery | 10 | 86 | 0 | 搜尋不穩才填 |
| relatedEpisodes | 0 | 96 | 0 | 產品缺口，不是 schema 必填 |
| placeId | 0 | 96 | 0 | 地圖不用 Google Place ID |

sources：1 筆 22、≥2 筆 74、有官方 39、有政府 93、editorial-only 0。
lastVerified：多數仍 2026-08-09～2026-08-16；A1 逐筆查證的 10 筆為 2026-08-19。

## Paid fee clarity

- active paid = 40
- paid + feeNote = 40
- paid without feeNote = 0
- paid + officialUrl = 40
- paid without officialUrl = 0

## Tips debt

- exact count = 14（`FACILITY_LIST_TAIL_PATTERN`）
- A2／A3／A4 共改 42 筆；剩餘 14 筆多為低決策價值的免費公園，或需事實查證
- 編輯清理至此停止（不自動開 A5）；下一階段 B1 嘉義市 diversity

## relatedEpisodes

- schema：`relatedEpisodes?: string[]`（故事 slug，如 `ep-23`）
- records with relatedEpisodes = 0
- total links = 0

不要在 A0 填資料。

## 下一步（尚未執行）

B1 嘉義市 diversity → B2 桃園 indoor → B3 高雄 free → relatedEpisodes pilot。
（tips 設施列舉尾句：STOP EDITORIAL CLEANUP，剩餘 14 筆不自動開 A5。）
