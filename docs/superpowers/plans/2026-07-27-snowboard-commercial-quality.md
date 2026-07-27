# Snowboard 商業品質 P0–P4 實作紀錄

日期：2026-07-27

## 已交付

- P0 correctness：視覺網格與 HeightMap 共用座標函式並有 alignment smoke；加入 `FINISHING` 狀態、拱門結算、跌倒當下進度回溯 12m、debug finish host/build 防護。
- P1 gameplay：分數移入 Godot 遊戲端，加入 trick／combo／clean landing、難度、遊戲手把輸入與可驗證的 bridge score 欄位。
- P2 content：以 `CourseData` Resource 驅動糖霜雪峰、森林小徑、冰河夜滑；選單顯示鎖定狀態，完賽後解鎖下一條雪道。
- P3 integration：Snowboard 遷移到 `GameHost` + adapter + `SnowboardView`；設定由 host 注入，接上音量、減少動態效果、i18n、結算站、最佳分數與 v5 migration。
- P4 delivery：export 固定到 `public/snowboard/v2/`；HTML no-cache、runtime immutable；Service Worker 對 runtime 做 network-first／cache-first；補 bridge、course、source contract、a11y 與 E2E 契約。

## 驗收命令

```bash
npx tsc --noEmit
npm test -- --reporter=dot
npm run lint
~/godot-toolchain/Godot.app/Contents/MacOS/Godot --headless --path snowboard-game -- --smoke
./scripts/export-snowboard.sh
```

正式部署不應透過 query 觸發 debug finish 或 visual QA；請使用版本化 export wrapper 產生並 patch Web runtime。
