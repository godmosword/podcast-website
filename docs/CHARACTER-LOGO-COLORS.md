# 角色 Logo — 家族色票

> 權威：OKLCH。hex 僅供實作與生圖 prompt 參考。  
> 角色實例見 [`data/character-logos.json`](../data/character-logos.json)。  
> 造型與對比規則見 [`CHARACTER-LOGO-SPEC.md`](./CHARACTER-LOGO-SPEC.md)。

這七個背景色**不是**站內 chrome token（`--c-pink` 等），也**不是**親子地圖七類型或 Game Kit 調色盤。它們只服務 logo 畫布。

## 家族背景

| 家族 key | 中文名 | OKLCH | hex 參考 |
|---|---|---|---|
| `rescue` | 緊急救援 | `L 0.28 C 0.06 H 250` | `#1B2A44` |
| `construction` | 工程建設 | `L 0.45 C 0.08 H 70` | `#714D1D` |
| `speed` | 速度競賽 | `L 0.42 C 0.09 H 30` | `#76382E` |
| `transit` | 大眾運輸 | `L 0.45 C 0.09 H 235` | `#0F5C80` |
| `joy` | 生活歡樂 | `L 0.95 C 0.04 H 85` | `#F7EEDC` |
| `fantasy` | 奇幻夥伴 | `L 0.44 C 0.07 H 150` | `#345D3E` |
| `people` | 人與夥伴 | `L 0.52 C 0.10 H 320` | `#8A5C82` |

程式常數：`data/character-logos.ts` 的 `LOGO_FAMILIES`。

## 每角色三語意色

每個角色**恰好**三個語意色：

1. `ipColorPrimary` — 剪影主體（車身／軀幹）
2. `ipColorSecondary` — **一塊**大面積連續區（車窗帶、車頂、腹部、面罩、臉面）
3. 家族背景 — 上表，整片畫布 edge-to-edge

禁止第四色（含輪框、燈、腮紅、編號）。成對零件與識別特徵必須畫進這兩個 IP 色之一。

## 取樣與避開色相

- 兩個 IP 基色從 `public/characters/<定裝照>.jpg` 取樣。
- **必須避開自己家族背景的色相＋明度帶**，否則剪影溶進背景。消防車不能在深藏青上還是深藏青；藍色小巴士不能在 `transit` 藍灰上還是中明度藍。
- 若取樣色對背景對比不足：**保留背景色，先調 IP 色**（沿取樣色相推明度，見 SPEC「對比不夠時怎麼調」）。
- 第二 IP 色必須是一塊大面積連續區域，不可散成裝飾小點。

## 對比

| 對象 | 最低比 | 量測 |
|---|---|---|
| 剪影主體（通常是 primary）對家族背景 | 軌道 1：≥ 3.6:1 且 margin ≥ 0.2；或軌道 2：≥ 2.8:1 且色相距離 ≥ 60° 且 primary 彩度 ≥ 0.12 | WCAG 相對亮度 **或** OKLCH 色相分離。軌道 2 只給高彩度識別色 |
| 臉部小標記（眼、嘴）對其下方表面 | ≥ 5.0:1 | 同上。眼睛落在兩個 IP 色中較亮的那塊（車窗／臉面／腹部）。兩軌都要 |
| 背景本身 | 視覺全平 | 整片 OKLCH 亮度變化 ≤ 0.02、彩度變化 ≤ 0.01。禁止暈影、聚光、方向性漸層 |

## 背景偏差容忍（產圖驗收）

整片背景相對本表權威值：

- 亮度 |ΔL| ≤ 0.02
- 彩度 |ΔC| ≤ 0.01
- 色相偏移不另開寬限；明顯偏色即拒

## 與站內色票的邊界

| 系統 | 用途 | 可否借用家族色 |
|---|---|---|
| `DESIGN.md` / `app/globals.css` | 頁面 chrome | 否 |
| `CLAY_STYLE_PREFIX` | 定裝照／劇情插畫 | 否。logo 禁止黏土風 |
| 親子地圖七類型 | 場館 plate／地圖針 | 否。分類不同 |
| `docs/GAMEKIT-ART-BIBLE.md` | 遊戲 sprite | 否 |
| `data/episode-colors.ts` | 單集 accent | 否 |
