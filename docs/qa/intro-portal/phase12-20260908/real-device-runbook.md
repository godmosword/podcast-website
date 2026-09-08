# Phase 12 真機驗收 Runbook（待執行）

這份是**給有實體裝置的人照著跑**的腳本。本輪的自動化環境沒有 iPhone、Android、
adb／xcrun，也沒有 WebKit engine，因此下列每一項在 2026-09-08 都是 **NOT-RUN**。
照著做完之後，把結果填回 `device-matrix.md`（範本在本目錄）。

## 0. 前置

1. 部署一個可從手機連到的版本：Vercel preview，或本機 `npm run build && npm run start`
   後用同一個 Wi-Fi 連 `http://<電腦區網 IP>:3000`。
   - iOS Safari 對 `http://` 的 WebGL 沒有限制，但 **Web Inspector 需要 macOS**。
   - 若要量 FPS，Mac 是必要的（iOS）或 `chrome://inspect`（Android）。
2. 兩台裝置都先**充飽電並拔掉充電線**，關閉低耗電模式（另外單獨測一次開啟的情況）。
3. 記下裝置資訊（填進 device matrix）：型號、SoC、OS 版本、瀏覽器版本、螢幕點數、
   hardware DPR（`window.devicePixelRatio`）、網路、電量、開始時間。

## 1. 效能（High / Medium）

在 Web Inspector／remote devtools 的 console：

```js
// 目前的 runtime 量測（QualityManager 每 2 秒更新一次；擷取模式不會寫）
JSON.parse(document.querySelector('canvas').dataset.worldMetrics)
// → { fps, calls, triangles, geometries, textures, quality, dpr }
```

frame time 分佈（貼進 console，收 10 秒）：

```js
(async () => {
  const t = []; let stop = false; setTimeout(() => stop = true, 10000);
  const tick = (now) => { t.push(now); if (!stop) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  await new Promise(r => setTimeout(r, 10500));
  const d = t.slice(1).map((x, i) => x - t[i]).sort((a, b) => a - b);
  const q = p => d[Math.floor(p * d.length)];
  console.log({ frames: d.length, medianMs: q(.5), p10Ms: q(.1), p95Ms: q(.95), fps: 1000 / q(.5) });
})()
```

逐項記錄：quality tier、hardware DPR、render DPR（`canvas.width / canvas.getBoundingClientRect().width`）、
FPS、median／p10／p95 frame time。

判定：
- Medium（手機預設）**≥30 FPS** 才算 PASS；低於 38 FPS 時 QualityManager 會降級，要記錄降到哪一階。
- 降級後必須**穩定**：連續觀察 60 秒不得在 tier 之間來回跳。
- High（平板／桌機瀏覽器）接近 60 FPS。

時間軸正確性（不需要 devtools，用碼表）：
- 小紅從開始跑到停止約 **18 秒**（Phase 9 之後動畫吃真實時間，慢裝置不會拉長）。
- 摩天輪一圈約 **56 秒**。
- 停留 **24 秒**後次要動態進入休眠：畫面靜止、按鈕變成「繼續動態」。

## 2. 長時間與發熱

1. 停在 `/intro` **連續 2–5 分鐘**（不要鎖屏）。
2. 每分鐘重跑一次上面的 frame time 片段，記錄是否掉幀。
3. 手背貼機身背面判斷發熱（溫、燙、無感）；iOS 若出現效能節流通常伴隨明顯降幀。
4. 記錄電量下降百分比。

判定：掉幀 >30% 或明顯發燙 → FAIL，回報並考慮降低預設 tier。

## 3. Safari 專屬

| 檢查 | 做法 | 期望 |
|---|---|---|
| safe-area | 直向 + 橫向，看瀏海／Home indicator 區 | 「略過動畫」與 CTA 不被遮 |
| 100svh | 上下滑動讓工具列展開／收合 | 版面不跳、出口不被切掉 |
| 旋轉 | 直↔橫各三次 | 只有一個 canvas、構圖重算、無水平捲動 |
| Back / Forward | 進站後按返回、再前進 | 回到進 Intro 之前的頁；焦點不被搶 |
| BFCache | 進 Landing → 前往 `/stories` → 返回 | 頁面還原、不重播 Intro、無白畫面 |
| WebGL resume | 切到別的 app 30 秒再回來 | 場景恢復；不重播問候、不跳位 |
| focus handoff | 用鍵盤（外接）或 VoiceOver 進站 | focus 落在 main，畫面不捲動 |
| Enter transition | 點「進入車車遊樂園」 | 立即有回饋；不卡住 |
| poster loading | 首次冷載入 | 先看到 poster，再換成 3D |
| 水平捲動 | 每個尺寸左右滑 | 沒有水平捲動 |

## 4. 視覺 QA（每個尺寸各拍 poster／ready／landing）

尺寸：320、360、375、390、414、430、短橫向、平板（若有）。

- poster → live 沒有明顯跳位或亮度／色溫跳變。
- 小紅可辨識（眼睛、笑臉、車頭線）。
- acknowledge 看得懂但不誇張。
- Story House 沒有被錯誤裁切；前庭關係清楚。
- 摩天輪吊艙在任何角度都朝上。
- 世界有延伸感（底座在兩端出框），不像中央漂浮的產品模型。
- CTA 永遠清楚可點。

## 5. VoiceOver（iPhone Safari）

開啟 設定 → 輔助使用 → VoiceOver。逐項朗讀並記錄：

1. 頁面標題（分頁標題應為「走進車車遊樂園」）。
2. h1「車車遊樂園」。
3. 短句「故事，就從這裡出發。」
4. 「進入車車遊樂園」是連結。
5. 「暫停動態／繼續動態」是按鈕，且狀態名稱與畫面一致。
6. 右滑順序：跳到主內容 → h1 → 短句 → 進入 → 暫停 → 略過動畫。
7. 進 Landing 後焦點落在主內容，不會念回 Intro。
8. 返回 Intro 時不重播、不搶焦點。
9. 開啟「減少動態」後：沒有 canvas、沒有暫停按鈕、進入仍立即可用。

**canvas 不得產生任何朗讀**（模型、群組、數字都不該被念到）。

## 6. TalkBack（Android Chrome）

同 §5 的等價檢查。若沒有 Android 裝置 → NOT-RUN，**不得以 axe 或 Chromium 代替**。

## 7. Dynamic Type / Zoom（iOS）

1. 設定 → 螢幕顯示與亮度 → 文字大小，調到最大。
2. 再到 輔助使用 → 顯示與文字大小 → 放大文字，開啟「更大的輔助使用字級」並拉到最大。
3. 直向與橫向各看一次。

期望：CTA 不被遮、無水平捲動、重要場景不被完全推出畫面、Enter 仍 ≥44×44、暫停仍可操作。

## 8. 網路

| 條件 | 做法 | 期望 |
|---|---|---|
| 正常 Wi-Fi | — | poster 先到，之後才載 3D |
| 慢速 | iOS Network Link Conditioner（需開發者模式）或 Android devtools 節流 | poster 先到、Enter 不等 3D |
| 離線 | 飛航模式後重新整理 | 保留 poster 與出口 |
| Save-Data | Android Chrome「精簡模式」／iOS 低數據模式 | 不下載模型，停在 poster |
| GLB 失敗 | devtools 封鎖 `*.glb` | 回 poster，無重試風暴（≤4 次請求） |

## 9. Phase 9 轉場觀感

- 點 Enter 後**立即**有回饋。
- WebGL 在按下當下停止，畫面不應有「凍住」的錯覺（覆蓋層應該蓋住）。
- CSS `scale(1.065)` 推近不突兀。
- 360ms 不覺得拖；路由早就緒時提前結束也自然。
- 減少動態下完全沒有轉場。

**如果真機體感正常，不要為了播滿 360ms 去延遲導航。**

## 10. 回填

把每台裝置的結果寫進 `device-matrix.md`，每項標 PASS / FAIL / PARTIAL / NOT-RUN，
並附：screenshot、短影片、frame-time JSON、VoiceOver 筆記。發現回歸時先回報，不要直接改
Blender／GLB／art direction／時間軸／路由架構。
