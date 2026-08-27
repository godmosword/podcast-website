# 親子遊樂地圖 — 全國視角不放 cluster 地圖

> 寫於 2026-08-27，v2 縣市磚牆已上線之後。  
> 目的：把 `/for-parents/play-map/proto` 與全國 cluster 地圖的調查結論留下，避免之後重跑同一輪實驗。

全國層的入口是 **22 縣市磚牆**（`PlayMapCityWall`）。地圖元件保留，但作用域是「已選定縣市」或「使用者附近」，不是全台。

---

## 1. C1（z=8 交給 spatial grid）為何不成立

提案：全國未縮小範圍時，不要畫縣市 cluster，改把 z=8 交給既有的 `clusterPlaygroundsByZoom`（與縣市內 z9–12 同一套網格聚合）。

不行，有兩層原因。

### 1.1 格子沒有縣市語意，點下去也選不到縣

production 的 `SpatialClusterMarker`（`PlayMapLeaflet.tsx`）是給**縣市內**放大用的：

- `aria-label` 是「此區域有 N 個親子景點」，沒有縣市名
- click 只 `map.fitBounds` 該格的場館，**不**呼叫 `onSelectCity`
- 契約測試：`PlayMapLeaflet.test.tsx`「spatial cluster click 只聚焦 contained places，不開 Sheet 或選景點」

全國入口需要的是「選一個縣市」。Grid marker 做不到這件事；把它放在 z=8 只會變成「這附近有 N 個點，點了鏡頭靠近一點」，家長仍不知道進了哪一縣。

### 1.2 z=8 的格子本身跨縣

`clusterPlaygroundsByZoom` 的格寬是 `0.5 / 2 ** max(0, min(zoom, 12) - 9)` 度。  
z=8 時 `min(zoom,12)-9` 為負，被 clamp 成 0，格寬 **0.5°**（與 z=9 相同）。

以 2026-08-27 的 `listPlaygrounds()` 重跑 `clusterPlaygroundsByZoom(places, 8)`：

| | 數量 |
|---|---|
| 格子 | 12 |
| 格內超過一筆 | 9 |
| **格內超過一個縣市** | **9** |

9 格跨縣的內容（僅供核對，不是產品文案）：

| 格 | 場館數 | 縣市 |
|---|---|---|
| `spatial-45:240` | 9 | 高雄市／台南市 |
| `spatial-46:240` | 11 | 嘉義縣／嘉義市／台南市 |
| `spatial-47:240` | 7 | 彰化縣／嘉義縣／嘉義市／雲林縣 |
| `spatial-47:241` | 8 | 彰化縣／南投縣／雲林縣 |
| `spatial-48:241` | 11 | 彰化縣／苗栗縣／台中市 |
| `spatial-49:241` | 13 | 新竹市／新竹縣／苗栗縣 |
| `spatial-49:242` | 12 | 新竹縣／新北市／桃園市 |
| `spatial-50:242` | 12 | 新北市／桃園市 |
| `spatial-50:243` | 13 | 基隆市／新北市／台北市 |

沒有單一 `city` 可 commit。即使改 click 去「猜一個縣」，也會把嘉義市／縣、北北桃、竹竹苗黏在同一顆針上。

結論：C1 在互動契約與空間分割兩邊都不成立。Phase 0 已書面證偽；不要再拿 z=8 grid 當全國縣市入口。

---

## 2. z=8 縣市 cluster 的重疊實測

production 全國未縮小範圍走 `clusterPlaygroundsByCity`（算術質心）+ 44px 圓。  
proto 用與 production 相同的全國鏡頭投影（`nationalWebMercatorProjector`，固定 z=8）。

容器：桌機 split **600×512**（`PROTO_CONTAINER_PRESETS` 的 `desktop-split`）。  
15 個有資料的縣市，兩兩組合 **C(15, 2) = 105** 對。

**44px 圓相交：7／105 對。** 由近到遠：

| 對 | 圆心距 |
|---|---|
| 嘉義市 ↔ 嘉義縣 | **13.3px** |
| 台北市 ↔ 新北市 | **17.2px** |
| 新竹市 ↔ 新竹縣 | **21.9px** |
| 雲林縣 ↔ 嘉義縣 | 31.9px |
| 雲林縣 ↔ 嘉義市 | 33.9px |
| 桃園市 ↔ 新北市 | 43.0px |
| 台中市 ↔ 彰化縣 | 43.8px |

前三對圆心距小於 44px 直徑，標籤與觸控目標疊在一起。嘉義市／縣天生嵌套，質心再怎麼改（bbox 中心）也拆不開，proto 的 C2 是靠最長 104px 的決定性位移硬拉開——位移後針不再代表那個位置，不能當 production 全國地圖的解法。

重跑方式（proto 刪除後仍可用同一公式）：把 `clusterPlaygroundsByCity` 的質心投到 600×512、z=8 全國鏡頭，量 44px 圓是否相交。數字會隨 catalog 變，但「鄰近縣市對在 z=8 會疊」這件事不會因為多收幾個場館而消失。

---

## 3. 退役全國 cluster 地圖

v2 磚牆已經回答「哪一區有什麼」。全國 cluster 地圖若留著，會變成**第二套較差的縣市入口**，而且只出現在次要路徑（`view=map`、無 city、無定位）。

因此：

- **刪**只服務 `clusterMode === true`（`isNationwideUnscoped(city, hasUserLocation)`）的全國聚合：縣市 `ClusterMarker`、`clusterPlaygroundsByCity`、全國 `setView`、proto 路由
- **留**縣市內 z9–12 的 `clusterPlaygroundsByZoom`／`SpatialClusterMarker`、個別場館 marker、定位「附近」、`[placeId]`、`collections`
- **不改** `MapContainer` 的 `minZoom`（`TAIWAN_SOFT_MIN_ZOOM = 7`）於本次；使用者在縣市地圖上手動縮到全台，與系統預設全國視角是不同問題，另案處理

之後若再提「全國要不要放地圖」，先讀本檔。預設答案是不放；要推翻必須正面回答 §1 與 §2，而不是重做一輪 proto。
