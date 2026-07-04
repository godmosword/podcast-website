# RESEARCH — 競品與設計研究筆記

本文件收錄影響「車車遊樂園」產品方向的外部研究與競品拆解，供 roadmap 決策參考。對應待辦見 [TODOS.md](./TODOS.md)。

---

## 2026-06-09｜Hey Clay App 架構拆解與適用性評估

來源：Hey Clay 官網 / Apple App Store / Fat Brain Toys / 零售頁  
關聯：phygital 內容類型、收藏養成、付費解鎖、線下手作引導

### Hey Clay 的架構本質

Hey Clay 是「實體玩具 + 數位引導」的 **phygital（虛實整合）** 模式，核心由四個元素組成：

1. **內容單元 = 一個角色 = 一組分步教學**。每個角色（小豬、馬、車）內含分步式 3D 互動教學，一次一個簡單形狀地引導捏塑。本質是「結構化的步驟序列資料」。
2. **內容解鎖機制（商業核心）**：買實體盒子 → 拿到一組 code → 在 App 輸入/掃描解鎖該套組；想要其他套組角色，透過 App 內購取得。
3. **輔助黏著功能**：5 個小遊戲、拍照分享作品、無第三方廣告。
4. **設計哲學**：把專業技能（球體、圓柱、五官、紋理）拆成幼兒能完成的微步驟，保證做得出成果，孩子在不知不覺中學會真技巧。

> 關鍵洞察：Hey Clay 的 App 不是內容本身，而是「引導孩子完成線下實體創作的數位說明書 + 解鎖收銀台」。真正的創作（捏塑）發生在螢幕外。

### 對車車遊樂園的適用性（分三層）

**第一層：商業架構（code 解鎖 + 收藏）→ 可借用，需改造**

- 我們是純數位、無實體商品，故實體 code 機制不能直接搬。
- 可借用底層概念：
  - **車車圖鑑（收藏養成）**：聽完一集 / 玩完一個實驗 → 解鎖一台車進車庫。比單純收藏故事更有養成感。
  - **解鎖機制改造**：用「完成度解鎖」（聽完 EP 解鎖該集的車）或「會員解鎖」（訂閱開放進階車款），呼應「收費綁進度而非註冊」的原則。

**第二層：內容架構（分步引導序列）→ 高度適用，最值得抄**

- Hey Clay 把「複雜創作」拆成「保證成功的微步驟序列」，與我們現有架構高度契合：
  - 現有 `Story` 型別已有 `captions[]` + `captionTimes[]`，即「分步時間序列」資料結構。
  - Hey Clay 的分步教學本質相同：`steps[]`，每步一張圖/動畫 + 一句引導。
- **結論：可用同一套資料模式新增「車車 DIY 手作教學」內容類型**（如何用色紙摺救護車、怎麼畫消防車），每步一張示意圖 + 一句語音引導，複用現有翻頁播放器 + 字幕同步機制，架構成本近乎為零。

**第三層：phygital 哲學 → 最大啟發**

- Hey Clay 用 App 當工具引導孩子「離開螢幕去動手做」，螢幕是手段非目的。
- 家長最怕螢幕時間、最愛「螢幕引導孩子動手做」——這是強力賣點，也呼應開放式、動手做的 STEM 最有效之研究。
- 車車版循環：聽垃圾車故事（線上）→ App 引導用回收物做一台垃圾車（線下）→ 拍照上傳進車庫圖鑑。這是純 podcast 競品（叮噹、信誼）做不到的差異化。

### 適用性評分

| Hey Clay 元素 | 適用度 | 怎麼用 |
|---|---|---|
| 分步引導序列資料結構 | ★★★★★ | 複用 captions/翻頁架構做「車車 DIY 教學」 |
| 收藏 / 圖鑑養成 | ★★★★☆ | 「車車圖鑑」靠收聽/完成解鎖，驅動回訪 |
| phygital 線下創作引導 | ★★★★☆ | 螢幕引導 → 動手做 → 拍照回傳，反螢幕時間賣點 |
| code 解鎖收銀台 | ★★☆☆☆ | 無實體商品，改成「完成度/會員解鎖」 |
| 拍照分享 | ★★★☆☆ | 可做，但兒童照片上傳的隱私合規要謹慎 |

### 行動建議（優先）

用現有「翻頁 + 字幕同步」架構，新增 `craft`（車車手作教學）內容類型：

- 與現有 `Story` 型別並存，複用 `StoryPlayer` 的翻頁與語音引導，幾乎不動核心播放器。
- 把產品從「聽故事網站」升級為「引導孩子動手做的 phygital 平台」。

### 風險 / 待確認

- 兒童照片上傳（拍照分享）涉隱私合規，需評估是否做、如何去識別化。
- 目前收藏/進度用 localStorage，若圖鑑要跨裝置，需處理兒童資料蒐集與同意。

---

## 2026-06-11｜逐步共作模式 — LEGO 說明書 × Hey Clay 的共同機制與本站轉譯

來源：延展 [2026-06-09 Hey Clay 架構拆解](#2026-06-09hey-clay-app-架構拆解與適用性評估)；LEGO 官方建築／Creator 系列說明書設計慣例；幼兒工作記憶與執行功能研究（3–7 歲單步負荷顯著低於多步串聯）  
關聯：STEM-P2 `craft` 內容類型、[TODOS — 車車 DIY](./TODOS.md#車車-diy手作教學craft-內容類型)、[ADR-0002 星星經濟帳本](./docs/adr/0002-star-economy-ledger.md)

> **與 Hey Clay 研究的關係：** [2026-06-09 節](#2026-06-09hey-clay-app-架構拆解與適用性評估)已論證「分步 `steps[]` + phygital 引導」與本站 `StoryPlayer` 架構契合、以及 code 解鎖需改為完成度解鎖。本節不再重述商業改造，而聚焦 **「為什麼分步有效」** 的共通認知機制，並轉譯為 `craft` player 可驗收的設計規格與 pilot 計畫。

### 核心洞察：同一套「拆步引擎」

LEGO 紙本說明書與 Hey Clay 的 3D 分步教學，表面媒材不同（靜態圖 vs 動畫、積木 vs 黏土），**本質相同**：把孩子一個人做不出來的成品，拆成一串「這一步你一定做得到」的微動作；每完成一步就給一次可感知的進展感，而非等到最後才驗收成敗。

這與 [Hey Clay 第二層結論](#對車車遊樂園的適用性分三層)（複雜創作 → 保證成功的微步驟序列）一致，但 LEGO 額外證明了一點：**即使沒有 App、沒有訂閱，只要拆步夠細，純說明書也能撐起數十年的產品飛輪。** 本站 craft 的任務不是發明新教法，而是把這套已被驗證的「拆步引擎」接到既有故事 IP 與播放架構上。

### 四條有效機制（3–7 歲認知依據）

| # | 機制 | 說明 | 3–7 歲認知依據 |
|---|------|------|----------------|
| ① | **一步一動作** | 每頁／每步只要求一個可命名動作（摺、貼、剪一刀），禁止「同時摺好並對齊兩角」這類複合指令。 | **工作記憶上限**：學齡前至低年級同時維持 1–2 個空間關係已吃力；多動作一步會超出負荷，錯誤率陡升。 |
| ② | **差異高亮** | 只標示「相對上一步新增了什麼」：LEGO 用新增零件的彩色標示與箭頭，免依賴閱讀。 | **前閱讀期友善**：識字前孩子靠圖示差異比對學習；減少語言解碼負擔，注意力留在手部動作。 |
| ③ | **自定節奏** | 翻頁權在孩子手上；可重聽、可暫停、可回上一頁對照。優於單向影片播放。 | **執行功能仍在發展**：需要反覆確認「我做對了嗎」；被影片時間軸拖著走易產生跟不上的焦慮。 |
| ④ | **錯了能救** | 單步粒度小 → 錯誤局部化，可退回一步重做，不會讓前面十分鐘白費。 | **挫敗耐受低**：幼兒對「全盤重來」的放棄閾值極低；LEGO／Hey Clay 皆靠細步降低沉没成本。 |

Hey Clay 的 3D 旋轉與 LEGO 的零件袋編號，都是為 ②③ 服務的實作變體；craft 不必複製 3D，但必須保留 **「只看差異、自己翻頁」** 這兩項核心。

### 本站的兩個不公平優勢

在 [Hey Clay 分步引導評分 ★★★★★](#適用性評分) 的基礎上，車車遊樂園還有兩項對手難以複製的結構優勢：

1. **StoryPlayer 翻頁 + 語音 + 字幕同步，原生就是 self-paced 教學播放器。** 同一套 `captions[]`／`captionTimes[]` 時間軸可驅動故事與 craft，無需另建教學 App。語音引導讓 **識字前的孩子可獨立跟做**，降低「家長必須在旁朗讀說明書」的門檻——這是 LEGO 紙本與多數 DIY 影片的共同痛點。
2. **敘事動機：** 孩子捏／摺的是 **剛聽完故事的角色**（例如 EP-9 的恐龍車多多），不是無名黏土球或通用積木模型。動機來自「我想擁有故事裡那台車」，而非「完成第 7 號套組」。這與 podcast 每集更新節奏天然對齊，形成 [Hey Clay 尚未具備的內容飛輪](#與-hey-clay-的差異化)（見下表）。

### Craft player 設計規格（機制 → 實作對應）

| 機制 | 實作對應 |
|------|----------|
| **步驟顆粒度** | 每步 **一動詞**（摺／貼／剪／翻）；全篇 **8–12 步**。語音每步 **一句話**，可單步重播（複用 StoryPlayer 逐句字幕）。 |
| **差異高亮** | 生圖管線規格：**上一步成品半透明底圖 + 本步新增部位實色高亮**（對齊 LEGO「只標新增零件」）。避免每步全圖重畫造成找差異負擔。 |
| **自查點** | 每 **3–4 步** 插入一頁「看起來像這樣了嗎？」（無對錯評分，僅自我對照）。**進度寫入 progress store**，可中斷續做（延續 [Hey Clay 風險節](#風險--待確認) 的 localStorage 策略，暫不做跨裝置兒童帳號）。 |
| **完成儀式** | 最後一步後：`grantStars`（`source: "craft:{slug}"`，冪等帳目，見 ADR-0002）+ 解鎖該集 **角色貼紙**。不依賴拍照上傳——[隱私決策仍待定](#風險--待確認)，先以「我完成了」按鈕 + 家長可選見證即可。 |
| **材料頁置首** | 第 0 頁給 **家長**：材料清單、安全提示、預估時間。**限家用材料**（色紙／紙箱／剪刀／白膠），與 Hey Clay **專用黏土 + 實體盒** 的門檻刻意相反，呼應 [phygital 第三層哲學](#對車車遊樂園的適用性分三層)「螢幕引導、家裡就能做」。 |

### 與 Hey Clay 的差異化

| 維度 | Hey Clay | 車車遊樂園 craft |
|------|----------|------------------|
| **內容飛輪** | 一盒一組角色，買完即靜態；新內容靠持續出盒 + App 內購 | **訂閱 podcast + 每集可掛新 craft**；聽完即想做，更新節奏與故事同步 |
| **材料門檻** | 專用黏土、品牌模具感強；未買盒則教學無意義 | **零專用材料**；家裡色紙紙箱即可開工 |
| **變現位置** | 實體盒 + App 內 code／IAP 解鎖角色 | **訂閱解鎖進階 craft／圖鑑**（完成度驅動，見 STEM-P4）；數位進度綁收聽與手作完成 |
| **周邊實體** | 商業核心 | **R4 後可選**：訂閱者黏土包等周邊，非 MVP 必要；避免回到 Hey Clay 材料鎖定 |

周邊黏土包若要做，定位是 **加值禮品** 而非解鎖前提，以免複製對手的材料門檻。

### Pilot 計畫：EP-9 恐龍車多多色紙摺紙

**目標：** 用一集跑通 **Craft 型別 → 步驟播放 → 完成給星** 全鏈，驗證設計規格而非一次量產內容庫。

| 項目 | 內容 |
|------|------|
| **題材** | EP-9 恐龍車多多 — 色紙摺紙（材料：色紙、白膠、安全剪刀） |
| **技術鏈** | `craft` 資料型別 → StoryPlayer 翻頁播放 → 完成觸發 `grantStars`（`craft:ep-9`）+ 貼紙 |
| **實測訊號 1 — 卡步** | 哪一步停留最久／回上一頁最多次？→ 調整顆粒度（是否需再拆步） |
| **實測訊號 2 — 動機** | 完成後是否 **主動要求做第二台**（同集或他集）？→ 驗證敘事動機是否成立 |
| **通過標準** | 兩訊號達可接受閾值（團隊定性 + 簡易本機事件）→ 才進入 STEM-P2 量產排程 |

Pilot 刻意選與故事強綁定的角色，以放大「不公平優勢 ②」；不通過則先改步驟與插畫，不擴充型別系統。

### 關聯條目

| 文件 | 條目 |
|------|------|
| [TODOS.md](./TODOS.md) | [STEM-P2 — 車車 DIY（`craft` 內容類型）](./TODOS.md#車車-diy手作教學craft-內容類型)、[Phygital 故事延伸](./TODOS.md#phygital-故事延伸聽完--線下手作)、[STEM-P3 車車圖鑑養成](./TODOS.md#車車圖鑑養成完成度解鎖) |
| [docs/adr/0002-star-economy-ledger.md](./docs/adr/0002-star-economy-ledger.md) | craft 完成儀式的 `grantStars` 冪等帳目（`source: "craft:{slug}"`） |

### 風險 / 待確認

- 差異高亮插畫需建立 **生圖／後製 SOP**，否則美術產能成瓶頸（Pilot 先用手繪或模板驗證流程）。
- 「看起來像這樣了嗎？」自查頁若設計成評分，會違反 STEM 不計分原則；維持 **自我對照、無對錯**。
- 完成儀式暫不做拍照；若日後加分享，須先解決 [2026-06-09 隱私待確認](#風險--待確認) 事項。

---

## 2026-06-09｜四款小遊戲精進方案（對標可市售 pixel game）

> **2026-06 現況：** canon 四款為 `car-adventure`、`block-drop`、`kart`、`pirate-kart`。**已移除** `car-star`、`car-mission`。下列精進方案 ❄️ FROZEN，僅供歷史對照。

涵蓋四款（canon）：① 車車大冒險（`car-adventure`）② 繽紛方塊（`block-drop`）③ 車車卡丁車（`kart`）④ 海盜卡丁車大賽（`pirate-kart`）。

### 2026-07-04｜TODO 歸檔補記

TODO 主檔只保留「❄️ FROZEN — 待 STEM-P1 Gate 之後｜四款 pixel 精進」的執行狀態；市售級品質門檻、Game Kit 四層、資產工具與驗收表集中保存在本研究段。現況元件對照：`BlockDropGame`、`CarPlatformer`、`/games/kart`、`/games/pirate-kart`；資料目錄為 `data/games.ts`。

**與 STEM 路線關係：** 精進版屬「遊樂園經典區」商業級升級；新 STEM 沙盒仍守無計時、無排行榜。若日後解凍，每款預設採兒童模式，挑戰模式需明確可選。

**目前 Game Kit 四層：** `lib/gamekit/react/`（hooks、觸控、暫停）、`lib/gamekit/runtime/`（loop、輸入、像素渲染、音訊、juice）、`lib/gamekit/progress/`（存檔、設定、獎牌、session）、`lib/gamekit/games/`（遊戲專屬關卡與 iframe bridge）。

### 0. 市售 pixel game 品質門檻

把「原型」和「能上架賣（Steam/itch/行動/精緻網頁）」分開的，不是某個玩法，而是這條品質基準線。任一款要稱得上市售級，須全數達成：

- **像素完美渲染**：固定低內部解析度 → 最近鄰整數倍放大（`image-rendering: pixelated`），60fps 鎖定。
- **一致美術語言**：單一主調色盤、統一描邊與光源方向、統一點陣字（HUD/選單）。
- **精靈動畫**：角色至少有 待機/移動/動作(跳或攻擊)/受傷 多態；物件（金幣、旗子、敵人）會動。
- **音樂＋音效＋混音**：每款有循環 BGM、關鍵動作有 SFX、有音量/靜音設定（含自動播放政策處理）。
- **打擊感（juice）**：關鍵動作有粒子、畫面震動、頓幀、緩動、squash & stretch、彈出數字。
- **完整外框**：標題畫面、暫停選單、設定、存檔、勝負流程、轉場。
- **元系統**：高分/獎牌（三星制）、解鎖、進度保存、成就。
- **多輸入**：鍵盤＋觸控＋手把（Gamepad API）。
- **可及性與在地化**：reduced-motion、色盲友善配色、難度調節、zh-TW 現行 / en 可擴充。
- **工程品質**：固定時間步進＋插值、物件池（無 GC 卡頓）、資產預載＋載入畫面、Lighthouse 無障礙 ≥95、零 console 錯誤。

> 現況四款大多停在「形狀／emoji／canvas 畫圖＋inline style」階段，玩法骨架可用，但上面這條線幾乎都還沒跨。與 STEM「不計時不競爭」的張力見 [TODOS — 產品決策](./TODOS.md#產品決策現有遊樂園-vs-stem不計時不競爭)；精進版可採**雙模式**（兒童／挑戰）分層。

### 1. 最高槓桿：共用基底「車車故事屋 Game Kit」（`lib/gamekit`）

**先做這層，四款一起升級。** 九大模組：

1. **`kit/renderer`**：每款固定內部解析度（方塊 200×360、橫向 320×180 等），offscreen → 整數倍 nearest-neighbor 放大；相機次像素取整。
2. **`kit/sprite`** + **`kit/tilemap`**：sprite sheet、幀計時、autotiling。
3. **`kit/style`**：32 色主調色盤、點陣字、共用 UI（按鈕/面板/轉場）。
4. **`kit/audio`**：BGM 循環 + SFX + 混音器（延續現有 `useGameAudio`／`lib/sfx.ts` 精神）。
5. **`kit/juice`**：粒子池、screen shake、hitstop、tween、squash&stretch、彈字。
6. **`kit/save` + `kit/meta`**：localStorage 玩家檔、高分/三星/跨遊戲星星經濟。
7. **`kit/input`**：鍵盤／觸控／手把 → 統一 action。
8. **`kit/scene`**：title → menu → play → pause → result。
9. **`kit/loop`**：固定時間步進（1/120s）＋渲染插值。

**技術取捨**：純 Canvas + 自建 kit（可控）；可選 **kontra.js**（~12kb）當底層；大型才考慮 Phaser。

### 2. 跨遊戲 IP 黏合

- 共用車輛角色卡司（小黃＋警車／貨車／賽車／巴士…），四款同一批像素精靈。
- 共用星星經濟 →「車庫」解鎖跨遊戲被動。
- `/games` 改主機選單／世界地圖風（星數、最佳、解鎖進度）。
- 與 podcast 綁定貼紙簿（聽集＋玩遊戲蒐集）。

### 3. 各款精進摘要

| 遊戲 | 對標方向 | 工時 | 重點 |
|------|----------|------|------|
| ① 車車大冒險 | Celeste 手感 + Shovel Knight 關卡 | **大** | Tiled 關卡管線、6–10 關、檢查點、boss ❄️ |
| ② 繽紛方塊 | Tetris Effect 音畫一體（原創） | 中 | 像素皮膚、多模式、兒童模式、消行 juice ❄️ |
| ③ 車車卡丁車 | Arcade 卡丁 | 中 | 漂移、賽道、觸控 ❄️ |
| ④ 海盜卡丁車 | 16-bit 賽車 | 中 | 關卡、道具 ❄️ |

各款完整玩法／美術／元系統細節見 [TODOS — 遊樂園精進](./TODOS.md#遊樂園精進game-kit--市售-pixel-品質)。

### 4. 八階段路線圖（相依序）

| Phase | 主題 | ROI |
|-------|------|-----|
| 0 | 方向定錨：解析度、調色盤、kit vs kontra | 基礎 |
| 1 | 渲染管線＋設計系統全面套用 | **視覺最高** |
| 2 | 各款 sprite/tileset/動畫 | 美術瓶頸 |
| 3 | BGM + SFX + 混音 | 聽感 |
| 4 | juice 工具組套用 | 手感 |
| 5 | 內容深度（關卡/模式/Tiled） | 可玩性 |
| 6 | 元系統（存檔/星星/hub/貼紙） | 留存 |
| 7 | 外框（標題/設定/手把/a11y） | 完整度 |
| 8 | 效能 QA（固定步進/池/預載） | 穩定 |

**起手式**：Phase 0 + 1 — 四款同時「像素＋統一字體＋調色盤」。

### 5. 資產與工具

Aseprite、Kenney CC0 佔位、Tiled → JSON、jsfxr/sfxr、BeepBox/FamiStudio BGM、pixel TTF 或 bitmap font。

### 6. 瓶頸與取捨

- **美術**是最大門檻 → 先用 CC0 跑通管線再換原創。
- **年齡衝突**：大冒險/方塊偏大齡 → 兒童模式、不會輸。
- **範疇**：四款全商業級 = 數月；分款分階段出貨。
- **IP**：對標標題僅作品質參考，全程原創。

### 7. 市售級驗收檢查表（每款）

- [ ] 60fps、像素完美整數放大
- [ ] 統一調色盤＋點陣字＋UI
- [ ] 角色與物件多態精靈
- [ ] BGM＋SFX＋音量/靜音
- [ ] 粒子/震動/頓幀
- [ ] 標題/暫停/設定/存檔/勝負/轉場
- [ ] 三星＋解鎖＋進度保存
- [ ] 鍵盤＋觸控＋手把
- [ ] reduced-motion＋色盲友善＋難度
- [ ] 預載＋零 console 錯誤；Lighthouse a11y ≥95

---

## 2026-06-11｜前端吸引力功能 Cursor-Ready Prompts（FE-01〜FE-09）

> 適用 repo：Next.js 15（App Router、SSG）、TypeScript、`components/games/`、`app/games/[slug]/page.tsx`、`hooks/useReducedMotion.ts`、progress store。
> TODOS 紀律：每個 prompt 完成後必須更新 `TODOS.md`，標註對應 commit hash，格式：`- [x] FE-XX <任務名> (commit: <hash>)`。
> 通用約束（每個 prompt 都適用）：
> - 全部元件 SSR-safe，`window` / `AudioContext` / 感應器 API 一律在 `useEffect` 或動態 import 內存取。
> - 一律尊重 `useReducedMotion`：reduced motion 時動畫改為淡入淡出或直接靜止。
> - 觸控目標最小 64×64px。
> - 不引入第三方追蹤、不開外部連結（兒童安全紅線）。
> - 新增字串集中於既有 i18n / 文案常數檔，全部 zh-TW。

### FE-01 主角車車角色 IP 系統（最高優先）

```
你是車車遊樂園的資深前端工程師。請建立「主角車車」吉祥物系統,作為全站情感連結核心。

## 目標
建立一個可復用的 <Mascot /> 元件系統,讓主角車車出現在首頁、故事頁、遊戲結算頁,具備表情、idle 動畫與語音問候。

## 範圍
1. `components/mascot/Mascot.tsx`
   - Props: `expression: 'happy' | 'excited' | 'sleepy' | 'thinking' | 'cheering'`、`size: 'sm' | 'md' | 'lg'`、`animated?: boolean`
   - 以 inline SVG 實作(不用點陣圖),車身、車窗眼睛、輪子分層,方便逐層動畫。
2. Idle 動畫(CSS keyframes 或 Framer Motion 皆可,但全站擇一,沿用 repo 現有方案):
   - 每 4–6 秒隨機眨眼(車窗眼睛)
   - 車身輕微上下浮動(±3px,2.5s ease-in-out 循環)
   - 被點擊時:squash & stretch(scaleY 0.85 → 1.05 → 1)+ 喇叭音效 hook(音效播放接 FE-02 的 useSfx,若 FE-02 未完成先留 TODO stub)
3. `components/mascot/MascotGreeting.tsx`
   - 依時段顯示問候氣泡(早安/午安/晚安 + 隨機鼓勵語,文案至少 8 句,存於常數檔)
   - 氣泡出現動畫:scale + fade,300ms
4. `lib/mascot/expressions.ts`:表情與場景對應表(首頁=happy、遊戲勝利=cheering、睡前模式=sleepy 等),供其他功能查表使用。

## 非範圍
- 不做語音合成,問候僅文字氣泡。
- 不做多角色,只做一台主角車。

## 驗收標準
- [ ] 首頁渲染 Mascot,idle 動畫運作,點擊有 squash & stretch。
- [ ] `prefers-reduced-motion` 時所有動畫停止,僅保留靜態表情切換。
- [ ] SSG build 通過,無 hydration warning。
- [ ] 5 種表情皆有 Storybook story 或 `/dev/mascot` 預覽頁(擇一,依 repo 慣例)。
- [ ] Lighthouse a11y:SVG 有 role="img" 與 aria-label="車車"。
- [ ] TODOS.md 更新並附 commit hash。
```

### FE-02 全站音效與微互動回饋系統

```
你是車車遊樂園的資深前端工程師。請建立全站統一的音效與微互動系統。對學齡前使用者,點擊音效是核心 UX 而非裝飾。

## 目標
一個 `useSfx` hook + `<TactileButton />` 元件,讓全站按鈕都有「按下會彈 + 有聲音」的一致回饋。

## 範圍
1. `hooks/useSfx.ts`
   - 以 Web Audio API 實作(單一 AudioContext,lazy init 於首次使用者互動,符合 autoplay policy)
   - 音效集:`tap`(短促 pop)、`success`(上行三音)、`error`(柔和低音,不刺耳)、`collect`(叮)、`horn`(喇叭,給 Mascot)
   - 音效以程式合成(OscillatorNode + GainNode envelope)為預設,避免載入音檔;預留 `audioSpriteUrl` 選項供日後換真實音檔。
   - 全域靜音開關,狀態存 progress store,家長設定頁可關閉。
2. `components/ui/TactileButton.tsx`
   - 按下:scale 0.92 + 觸覺回饋(`navigator.vibrate?.(10)`,feature-detect)
   - 放開:彈回 overshoot(scale 1.04 → 1)
   - 自動播 `tap` 音效;`sfx` prop 可覆寫或設 null 關閉
   - 最小尺寸 64×64px,focus-visible 有明顯外框(沿用 contrast tokens)
3. 替換現有四個遊戲(car-adventure、block-drop、kart、pirate-kart)入口按鈕與返回按鈕為 TactileButton,行為不變。

## 驗收標準
- [ ] iOS Safari 實機(或模擬)首次點擊即有聲音,無 autoplay 報錯。
- [ ] 靜音開關生效且跨頁面持久化。
- [ ] reduced motion 時按鈕不縮放,僅透明度回饋;音效不受影響。
- [ ] 四個遊戲入口按鈕已替換,既有 E2E / 手動流程不壞。
- [ ] SSG build 通過,AudioContext 不在 server 端建立。
- [ ] TODOS.md 更新並附 commit hash。
```

### FE-03 場景式首頁「遊樂園地圖」

```
你是車車遊樂園的資深前端工程師。請把首頁從列表式改為「遊樂園地圖」場景式導航:孩子用逛的方式探索內容。

## 目標
一張可水平/輕微縱向平移的 SVG 遊樂園場景,故事區、遊戲區、圖鑑車庫是地圖上的建築物,點擊建築進入對應頁面。

## 範圍
1. `components/home/ParkMap.tsx`
   - 一張 viewBox 約 1600×900 的分層 SVG 場景:天空(漸層+雲)、遠景山丘、四棟建築(故事屋、遊戲場、車庫圖鑑、設定小屋)
   - 建築 = 巨大可點擊熱區(整棟建築都是按鈕,不是小 icon),hover/按下有 scale + 發光
   - Mascot(FE-01)停在地圖入口處,有 MascotGreeting 氣泡
2. 平移互動:
   - 手機:單指拖曳平移,慣性滑動(可用 CSS scroll-snap 容器包 SVG,或 pointer events 手寫,選實作簡單者)
   - 桌機:左右箭頭按鈕 + 拖曳
   - 邊界 clamp,不可滑出場景
3. 視差:雲與遠景山丘以 0.3–0.5 倍速跟隨平移(transform,GPU-friendly,不觸發 layout)
4. 漸進增強:無 JS / reduced-motion 時退化為靜態整張地圖縮放置中,四個建築仍可點。
5. 路由不變:建築連到既有 `/stories`、`/games`、圖鑑頁(FE-04 完成前先連 progress 頁)、家長設定(需通過 FE-06 家長閘門)。

## 非範圍
- 不做日夜循環(留給 FE-07 睡前模式)。
- 不做地圖內小遊戲。

## 驗收標準
- [ ] 375px 寬手機可流暢拖曳,無水平捲軸外漏(body 不滾動)。
- [ ] 四個建築鍵盤可聚焦(tabindex 順序合理)、Enter 可進入,各有 aria-label。
- [ ] 視差僅用 transform,Chrome DevTools Performance 無 layout thrash。
- [ ] reduced motion / 無 JS 退化版可用。
- [ ] LCP < 2s(SVG inline 或 priority 載入,無大型點陣圖)。
- [ ] TODOS.md 更新並附 commit hash。
```

### FE-04 車庫圖鑑：進度收集可視化

```
你是車車遊樂園的資深前端工程師。請把抽象進度改為具象收集:「車庫裡的車變多了」。

## 目標
一個 `/garage` 圖鑑頁:孩子完成故事/遊戲里程碑會解鎖新車車,陳列在車庫裡。

## 範圍
1. 資料層:`lib/garage/collection.ts`
   - 定義 12 台可收集車車(id、名稱、SVG 元件、解鎖條件),解鎖條件對接既有 progress store 事件(例:聽完 3 集故事、kart 完成一局、連續 3 天造訪)
   - 解鎖判定為純函式 `getUnlocked(progress): CarId[]`,可單元測試
2. `app/garage/page.tsx` + `components/garage/GarageGrid.tsx`
   - 已解鎖:彩色車車 + 名稱;未解鎖:剪影 + 「?」,點擊剪影顯示解鎖提示(「再聽 2 個故事就能遇見它!」,提示文案由條件自動生成)
   - 新解鎖瞬間:`<UnlockCelebration />` 全螢幕慶祝(車車開進車庫動畫 + 彩帶 + FE-02 `collect` 音效),celebration 已看過的旗標存 progress store,不重複播
3. 入口:ParkMap 車庫建築(FE-03)上顯示徽章「已收集 n/12」。

## 驗收標準
- [ ] `getUnlocked` 有單元測試覆蓋全部 12 條件(含邊界)。
- [ ] 解鎖狀態重新整理後持久(沿用 progress store 既有持久化方式)。
- [ ] 慶祝動畫只播一次;reduced motion 時改為靜態恭喜卡。
- [ ] 未解鎖提示不出現負面字眼(無「失敗」「還差很多」)。
- [ ] SSG build 通過。
- [ ] TODOS.md 更新並附 commit hash。
```

### FE-05 家長儀表板

```
你是車車遊樂園的資深前端工程師。請建立家長儀表板,把孩子的使用轉成家長能看懂的「成長證據」,並展示 SEL 主題覆蓋(本站差異化重點)。

## 目標
`/parents/dashboard` 頁面,位於家長閘門(FE-06)之後,呈現本週使用摘要與 SEL 主題覆蓋。

## 範圍
1. 資料聚合:`lib/parents/weeklyStats.ts`
   - 從 progress store 既有事件推導:本週聽過的故事(標題清單)、遊戲次數與總時長、連續使用天數、圖鑑收集進度
   - SEL 主題覆蓋:每集故事 metadata 需有 `selThemes: string[]`(情緒認知、同理心、合作、堅持、自我調節…);若現有故事 metadata 缺此欄位,先補 schema 與至少現有全部故事的標註(內容用合理推測值並在 PR 描述列出待人工確認清單)
2. UI:`components/parents/`
   - 風格切換:家長區用沉穩配色(沿用 contrast tokens 的中性色階),不用兒童區的高飽和
   - 區塊:本週摘要卡、SEL 主題覆蓋(以雷達圖或標籤雲擇一,純 SVG 自繪,不引入 chart 函式庫)、最近聽的故事清單、收集進度
   - 設定區:音效開關(FE-02)、睡前模式時段(FE-07 預留)、每日時間上限(本期僅存值,強制執行留 TODO)
3. 空狀態:資料不足一週時顯示友善引導,不顯示空圖表。

## 驗收標準
- [ ] 所有統計為純函式 + 單元測試,無時區 bug(以使用者本地時區計週,週一起算)。
- [ ] 不向任何外部服務送資料(全部本地計算)。
- [ ] SEL 覆蓋圖在零資料、單一主題、全主題三種狀態都正常。
- [ ] 手機 375px 寬排版不破。
- [ ] TODOS.md 更新並附 commit hash。
```

### FE-06 家長閘門（Parental Gate）

```
你是車車遊樂園的資深前端工程師。請實作家長閘門,阻擋兒童誤入設定/家長區,並作為對家長的信任展示。

## 目標
可復用 `<ParentalGate />`,包住 `/parents/*` 與設定頁。

## 範圍
1. `components/parents/ParentalGate.tsx`
   - 驗證方式:隨機兩位數加法(如「23 + 45 = ?」),數字鍵盤輸入;答錯換題,連錯 3 次冷卻 30 秒
   - 通過後 sessionStorage 記 15 分鐘有效,期間免再驗
   - 文案明確告知孩子「這裡是爸爸媽媽的區域」+ Mascot sleepy 表情
2. 路由整合:`app/parents/layout.tsx` 以 client gate 包裹;直接輸入網址也會被擋。
3. 信任文案區塊:閘門頁下方加「我們的承諾」三條(無廣告、無外部連結、不收集個資),家長看得到。

## 驗收標準
- [ ] 兒童區任何路徑點不進家長區而不經閘門(含深層連結)。
- [ ] 冷卻機制生效,重新整理不可繞過(冷卻截止時間存 sessionStorage)。
- [ ] 數字鍵盤可鍵盤操作、可觸控,目標 ≥64px。
- [ ] 15 分鐘時效正確,過期重新驗證。
- [ ] TODOS.md 更新並附 commit hash。
```

### FE-07 睡前模式（Bedtime Mode）

```
你是車車遊樂園的資深前端工程師。請實作睡前模式:晚上自動切換為暗色舒緩介面與舒緩內容優先。

## 目標
依家長設定時段(預設 19:30–06:30)全站進入睡前狀態。

## 範圍
1. `hooks/useBedtimeMode.ts`
   - 讀取家長設定時段(FE-05 設定區的值;無設定用預設),回傳 `{ isBedtime, minutesToBedtime }`
   - 純 client 判定,SSR 一律回傳非睡前,client mount 後校正(避免 hydration mismatch,以 CSS class 切換而非條件渲染整頁)
2. 視覺:`data-bedtime="true"` 掛在 <html>,以 CSS variables 覆寫:
   - 背景轉深藍夜空、降低全站飽和度與亮度(沿用 token 系統新增 bedtime 變體)
   - ParkMap 天空轉夜景(星星 + 月亮,雲變深色),Mascot 自動切 sleepy 表情(FE-01 對應表)
3. 行為:
   - 故事列表優先排序「舒緩」標籤內容(故事 metadata 加 `mood: 'energetic' | 'calm'`)
   - FE-02 音效全域音量降至 40%
   - 睡前 15 分鐘:畫面角落出現月亮提示「車車要睡覺囉」
4. 家長可在儀表板關閉此功能。

## 驗收標準
- [ ] 跨午夜時段(19:30–06:30)判定正確,含 23:59→00:00 邊界單元測試。
- [ ] 無 hydration warning(SSR/CSR 一致策略驗證)。
- [ ] 暗色變體通過對比度檢查(文字 ≥ 4.5:1)。
- [ ] 關閉功能後立即還原,無需重新整理。
- [ ] TODOS.md 更新並附 commit hash。
```

### FE-08 PWA 離線快取

```
你是車車遊樂園的資深前端工程師。請加上 PWA 離線能力:家長常在車上、飛機上給孩子使用。

## 目標
安裝到主畫面後,已造訪過的頁面、已聽過的故事音檔可離線使用。

## 範圍
1. PWA 基礎:`manifest.webmanifest`(名稱、theme color、maskable icons 192/512,用 Mascot SVG 轉出)、`app/` metadata 掛接。
2. Service Worker(用 Serwist 或 next-pwa,選與 Next.js 15 App Router 相容度最佳者,在 PR 說明選型理由):
   - App shell + 靜態資產:stale-while-revalidate
   - 故事音檔:CacheFirst + 明確上限(最多 20 集或 200MB,LRU 淘汰)
   - 離線 fallback 頁:Mascot thinking 表情 +「沒有網路也可以玩已下載的內容」+ 列出可離線項目
3. UI:故事卡片顯示「可離線」徽章;家長儀表板顯示快取用量與「清除下載」按鈕。
4. 更新策略:新版部署後 SW skipWaiting + 提示重新整理(避免孩子卡舊版)。

## 驗收標準
- [ ] Lighthouse PWA installable 通過。
- [ ] 飛航模式下:已造訪首頁/已聽故事可正常開啟播放;未快取頁顯示 fallback。
- [ ] 快取上限與淘汰可驗證(DevTools 手動驗證步驟寫進 PR)。
- [ ] SW 不快取家長儀表板統計(避免陳舊資料)。
- [ ] TODOS.md 更新並附 commit hash。
```

### FE-09 多模態互動小工具（進階，選做）

```
你是車車遊樂園的資深前端工程師。請建立多模態互動 hooks,供故事熱點(STEM-P1)與遊戲使用。

## 目標
三個漸進增強的互動 hooks,全部 feature-detect、全部有觸控 fallback。

## 範圍
1. `hooks/useBlowDetection.ts`(吹氣):
   - getUserMedia 麥克風 → AnalyserNode 偵測持續低頻能量尖峰
   - 需家長閘門後的設定頁明確開啟才啟用(預設關閉,麥克風權限敏感);未開啟時 fallback = 快速連點
2. `hooks/useShake.ts`(搖晃):DeviceMotion,iOS 需 permission request 流程;fallback = 長按
3. `hooks/useScribble.ts`(塗鴉):pointer events 畫布軌跡,回傳覆蓋率 %,給「擦亮車車」類互動
4. Demo:`/dev/interactions` 內部頁,三個 hook 各一個示範(吹熄蠟燭、搖蘋果樹、擦亮車車),接 FE-02 音效。

## 驗收標準
- [ ] 三個 hook 在不支援的環境(桌機無麥克風、無陀螺儀)自動走 fallback,功能等價。
- [ ] 麥克風串流在元件 unmount 時確實釋放(無紅點殘留)。
- [ ] 不錄音、不上傳任何音訊資料(僅本地能量分析),在程式註解與 PR 明示。
- [ ] SSG build 通過,所有感應器 API 僅 client 端。
- [ ] TODOS.md 更新並附 commit hash。
```

### 建議實作順序與依賴

```
FE-01 Mascot ──┬──> FE-03 ParkMap ──> FE-07 睡前模式(夜景)
FE-02 音效  ──┘         │
                        └──> FE-04 車庫圖鑑
FE-06 家長閘門 ──> FE-05 家長儀表板 ──> FE-07 / FE-08 設定整合
FE-09 多模態(獨立,接 STEM-P1)
```

| 順位 | 任務 | 理由 |
|---|---|---|
| 1 | FE-01 + FE-02 | 孩子留存的根本，且是其他任務的依賴 |
| 2 | FE-06 | 小而快，FE-05 的前置 |
| 3 | FE-03 | 首頁改版，體驗躍升最大 |
| 4 | FE-04 | 回訪鉤子 |
| 5 | FE-05 | 家長轉換（WAF 北極星） |
| 6 | FE-07 → FE-08 | 加分項 |
| 7 | FE-09 | 選做，配合 STEM-P1 排程 |
