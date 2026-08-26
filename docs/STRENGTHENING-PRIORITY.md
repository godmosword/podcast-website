# 加強優先序（2026-07-16）

> **唯一來源：** [TODOS.md](../TODOS.md) 現役隊列、兒童 UX 稽核、名單收集、P3 可靠／工程、營運現況缺口。  
> **定位：** 重排與串接既有 ID，不另開平行任務系統。完成項回填 TODOS（附 commit hash）。

## 總判斷

對齊兒童 UX 稽核：兒童主路徑 B+、親子互動 B、家長信任 A-。  
缺口是信任 polish、觸控補強、共讀覆蓋與 P3 可靠工程——不是再加遊戲或架構手術。

成長主戰場：A 平台收聽／訂閱 · B 短內容導流。官網＝可分享落地頁 + 訂閱轉換中心。

## 現役對照（主線）

| 序 | TODOS ID | 狀態 | 本輪要做 |
|----|----------|------|----------|
| 1 | UX-P0-1 家長閘門 | 待做（待決策） | 先擋 `/for-parents/dashboard`；算術題 + session |
| 2 | UX-P1-5 全站 e2e | ✅ 見本 commit | `/for-parents`、播放頁觸控；CI `e2e-child-path` |
| 3 | UX-P1-1、UX-P1-4 | 部分／待做 | StoryPlayer 定時、Landing 箭頭、進度條拇指（只改 CSS） |
| 4 | LIST-2 後續 | ✅ `289fbc4` | 文案對齊「只收名單、不寄新集上線信」；SubscribeForm e2e；ESP 另案 |
| 5 | P3 生圖佇列 + illustrationStatus 缺口 | ✅ `3a0176f` | `data/illustration-queue.json`；approve／本機 notify 寫入；Studio 只讀；不自動生圖 |
| 6 | P3 Playwright E2E CI | ✅ 見本 commit | `ci.yml` `e2e-child-path`；UX-P1-5 觸控；不動 Apple sync workflow |
| 7 | P3 錯誤／上線監控、ESLint CI | 待做 | 輕量 client error + uptime；eslint 非互動 CI |

## 並行（不擋主線）

- **UX-P1-3** 共讀 sidecar 擴至全集（內容營運，可分批）
- **LIST-1** LINE OA CTA（BLOCKED：等 `NEXT_PUBLIC_LINE_OA_URL`）
- **UX-P2-*** 擇機（儀表板文案、Dudu a11y、reflection source、car-adventure 4:3 封面、stories visual baseline）

## 待決策（實作前）

1. UX-P0-1：僅 dashboard，或含 GameKit 兒童模式開關？
2. UX-P1-3：一次全集 vs 每週 3 集？

預設：先做 dashboard-only（與 STEM-P3／稽核「先擋 dashboard」一致）。

## 建議 `/agent-action` 順序

1. UX-P0-1（決策後）
2. UX-P1-1／UX-P1-4
3. ~~LIST-2 文案誠實化 + SubscribeForm e2e~~ ✅ `289fbc4`（ESP／新集上線信另案）
4. ~~P3 `illustration-queue.json`~~ ✅ `3a0176f`（不自動生圖；不動 Apple sync 主脚本）
5. ~~P3 E2E CI~~ ✅ 見本 commit → 監控 → ESLint CI

## 驗證

依 [AGENT-DOMAIN.md](./AGENT-DOMAIN.md) 驗證矩陣；兒童 UX／播放器變更加 `npm run test:e2e`。視覺類不進 `npm run check`（見 TODOS 視覺化升級段）。

## 明確不做

見 TODOS：獨立逐字稿頁、地圖紅線、FROZEN pixel／kart、Wave C 大拆、CI 持有生圖 key、P1 驗證前付費牆。
