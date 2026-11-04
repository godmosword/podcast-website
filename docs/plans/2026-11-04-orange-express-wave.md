# 小橘特快車：揮手的朋友改成「點朋友」（PR-K1，2026-11-04）

## Context

沿途四種事件裡，平交道和揮手的朋友都是按喇叭，孩子分不出差別（TODOS「平交道與揮手玩法區分」）。使用者選先做這項，先前提的方向是「揮手改成點前窗裡的朋友」。

**實作方式要調整**：前窗裡的朋友不能直接當點擊目標。量過：開「快」時車速約 88 公尺／秒，提示後 4 秒多朋友都在遠處（390×844 前窗上不到 46px 高），最後 30 公尺到走出畫面只有約 0.3 秒。孩子點不到。

所以點擊目標改成**前窗左下角一張固定不動的朋友卡**：跟停好時的月台朋友卡同一個位置與語彙，提示出現時滑進來、朋友在揮手；路旁畫的朋友照舊。點卡片就是跟朋友揮手。

級別 L2＋UI 風險：Codex 工程審＋Opus 設計審。不生圖、不動存檔形狀。

## 規則

- **揮手的朋友**：提示後到 `until`（事件點後一小段，沿用 `WAVE_AFTER`）點朋友卡，記「做到」。按喇叭只是喇叭聲，不算做到、也不扣分；沒點到照舊記「遇到」、不扣星。
- **平交道**：維持按喇叭。
- **鍵盤**：揮手提示掛著時，空白鍵（`action`）算跟朋友揮手（風景段本來就沒有門可開）。卡片本身是 `<button>`，有讀屏名稱。

## 改動

1. **邏輯**
   - `lib/games/orange-express/types.ts`：`RunAction` 加 `{ type: "wave" }`。
   - `lib/games/orange-express/events.ts`：`honkEvent` 只剩平交道；新增 `waveEvent(state)`；`EventCue` 加 `"wave"`；更新檔頭註解。
   - `lib/games/orange-express/reducer.ts`：`step` 接 `wave`。
   - `lib/games/orange-express/next-action.ts`：`NextControl` 加 `"wave"`，`forEvent` 的 wave 指向朋友卡。
   - `lib/games/orange-express/novice.ts`：照亮的做時送 `wave`。
2. **畫面**
   - 新元件 `components/games/OrangeExpressWaveFriend.tsx`：SVG 朋友（顏色跟 `windshield-events.ts` 的 `drawWave` 同一組 SHIRT／SKIN／HAIR／INK）舉手揮；做到時兩手舉高、冒愛心（沿用月台卡的 `RiderHeart` 語彙），停留到事件回應結束。
   - `components/games/OrangeExpressWindshield.tsx`：提示掛著或剛做到時放卡片（任務卡在時不放）；`next.control === "wave"` 時加 `data-next` 與共用手指 `OrangeExpressNextHand`。
   - `components/games/OrangeExpressView.tsx`：新增 `waveBack`（比照 `pointCheck`，輸入暫停時不動作）；`onAction` 的 `action` 在揮手提示掛著時改走 `waveBack`。
   - `components/games/orange-express.module.css`：卡片至少 72px（矮手機至少 60px，仍符合 48px 下限）；滑入動畫；減少動態只顯示不滑。跟指差鈕、開心小橘（都在右下）不重疊。駕駛台照既有 `data-focus` 淡下來。
3. **文案**（`lib/games/orange-express/copy.ts`）
   - 提示：「有朋友在揮手，點朋友」（矮手機一行放得下）
   - 做到：「揮揮手！朋友好開心」
   - 下趟小目標：「朋友揮手時點一下」
4. **文件**：CHANGELOG、TODOS、`docs/SHINKANSEN-SIM-DESIGN.md` 第 42 節，計畫複製到 `docs/plans/2026-11-04-orange-express-wave.md`。

## 測試（先寫、看它紅）

- `events.test.ts`：點朋友在提示後到 `until` 都算；按喇叭不算；提示前、過了 `until` 不算；平交道仍要喇叭。
- `next-action.test.ts`：揮手提示掛著時亮朋友卡，不亮喇叭。
- `novice.test.ts`：照亮的做，五件事件照樣都做到。
- `events-copy.test.ts`、`journal`：新文案、小目標；禁詞掃描。
- e2e（`e2e/orange-express.spec.ts`）：
  - 點卡片做到、小橘開心、卡片換成做到的樣子。
  - 按喇叭不算做到；空白鍵算。
  - 沒點照樣過去記「遇到」。
  - 手指只有一個（`litControls` 要把朋友卡算進去）。
  - 390×844、375×553、寬不到 360px 的手機、844×390：卡片至少 48px、不蓋指差鈕與小橘、整頁不捲動。
  - axe 無障礙檢查、減少動態。
- 視覺基準：先不帶 `PW_REUSE_SERVER` 重 build `.next-visual`，重錄揮手日夜兩張、新增矮手機與做到的樣子，逐張目檢，只有雜訊的還原。

## Verification

`NODE_OPTIONS=--no-experimental-webstorage npm run check`、`npm run lint`、`npm run build` 後 `PW_REUSE_SERVER=1 caffeinate -i npx playwright test e2e/orange-express.spec.ts`，視覺基準如上；Codex＋Opus 審查；先同步 main（落後一個 `chore: sync Apple Podcasts`），開分支做，通過後 commit 推 main 並刪分支。

## Out of scope

- 其他事件玩法不動；孩子試玩後再看卡片位置與時長要不要調。

## Risks／rollback

- 單一 PR 可 revert。舊存檔的 `wave` 小目標與見聞章名稱不變，只改顯示的字。
- 習慣按喇叭的孩子這次不會做到：手指與語音都指向朋友卡，也不扣星；等試玩確認。
