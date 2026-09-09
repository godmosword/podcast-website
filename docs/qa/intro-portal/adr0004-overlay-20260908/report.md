# 首頁 3D 覆蓋層與手機構圖修正（2026-09-08）

對應 [ADR-0004](../../adr/0004-intro-overlay-on-home.md)。使用者在 iPhone 實測後提的四件事：
3D 要當第一頁、手機場景被切邊、移除 Landing 的 Intro 入口膠囊、移除底列四格短標。

## 構圖：切掉的到底有多少

修正前（390×844）：`.stage` 是 `width:134%; right:-17%`，`.hero` 是 `overflow:hidden`，
相機再乘 `scale:1.15`。實際可見的世界寬只有 **8.0 世界單位**，而島本身寬 **11.34**——
**左右各約 1.68 單位、合計約 30% 的島寬在畫面外**。使用者看到的「場景被螢幕邊緣切割」
就是這個。

修正後：直式手機改成綁寬度（`fit: "width"`），`.stage` 滿版並用 `aspect-ratio` 綁高度，
相機平移改走自身的 right／up 軸。島的水平範圍是 **±0.924 NDC**，左右對稱且完整；
只有島的前緣在下沿微出血（−1.144 NDC），這是使用者選定的「水平完整、底部微出血」。

量測見 [`hero-framing.json`](./hero-framing.json)，六個 stage 尺寸全部 PASS。
斷言規則：地面幾何只准在下緣出血，其餘具名節點四邊都必須完整入鏡。

### CameraRig 的三個獨立缺陷（都會讓構圖「調不動」）

1. `useFrame` 每幀把 `camera.position.x/y` 寫成硬編碼的 `5/10.5`（手機）與 `7/10`（桌機），
   那是 `art-direction.ts` 的副本——**改 art-direction 不會反映到實機上**。
2. 斷點 `mobile` 是模組層 `const`，只在元件實例化時算一次。轉向或分割畫面時 `size` 變、
   effect 重跑，於是用**桌機 framing 配手機 size**。
3. zoom 公式本身是 contain-fit，`scale: 1.15` 把它變成刻意 overfill，而 `height: 9.8`
   在綁寬度的情況下完全沒有作用。

三個都修掉之後，`art-direction.ts` 才真的是構圖的單一來源。

### poster 與 canvas 的長寬比

`.poster img` 是 `object-fit: contain`（依影像長寬比留邊），相機依世界長寬比 fit，
兩者只有在 poster 長寬比等於 stage 長寬比時才吻合。舊的 mobile poster 是 615×490
（1.255），新 stage 是 2.0——交接必跳。現在三處共用 `HERO_STAGE_ASPECT`：
CSS 的 `.stage`、`scripts/render-hero-posters.mjs` 的擷取視窗、以及構圖 QA 腳本。
mobile poster 因此重出為 615×308。

## 覆蓋層

`/` 的 HTML 一字未改：Landing 全文、`PodcastSeries` JSON-LD、canonical `/` 全部在原位，
只是 DOM 前面多了一個 `position: fixed` 的兄弟節點。要不要顯示由 `<head>` 的同步 script
在首次繪製前決定，所以**沒有導航可以閃爍**——ADR-0003 量到的 23–431ms 時間窗在架構上
不存在。

方向刻意選「CSS 預設隱藏、script 決定打開」：無 JS 或 script 出錯時直接看到 Landing。
反向設計在那兩種情況下會把 Landing 鎖死，而 `app/globals.css` 的
`html:has([data-landing-root]){overflow:hidden}` 會讓那變成真正無法捲動的死頁。

閘門同時檢查 reduced motion／Save-Data／2G。這正是 ADR-0003 否決「加前置檢查」的那條
理由（「檢查都要在 client 跑，閃爍不會消失」）在同頁覆蓋層下**不成立**的地方：沒有導航了。

## 量測

| 項目 | 結果 |
|---|---|
| `/` 初始 JS（gzip） | 231,084 → 235,716 bytes，**+4,632 bytes** |
| `/` 上含 three.js／r3f 的 chunk | **0**（3D runtime 仍在 `next/dynamic` 後面） |
| Intro E2E | 65 passed / 0 failed（`--workers=1`） |
| smoke／a11y／public | 65 passed / 0 failed |
| 單元測試 | 1877 passed |
| 構圖 QA | 6 個 stage 尺寸全 PASS |

初始 JS 的增量來自覆蓋層本身必須 SSR（HeroWorld 的 markup 與元件、閘門、CSS），
這是這個決策要買的東西，不是意外。

## 需要人工目檢的視覺 baseline

以下 4 張的差異是**預期的**，但依專案規則必須人工目檢後才重錄：

| baseline | 差異 | 成因 |
|---|---|---|
| `home-390-light` | ratio 0.03 | 底列短標移除、向下箭頭改為可見 |
| `landing-segments-390-light` | ratio 0.03 | 同上 |
| `intro-390x844-poster` / `-ready` / `-greeting` | ratio 0.18 | 手機構圖修正 |

390 night 版本以 0.03 的較寬容差通過，並不代表沒有變化。
