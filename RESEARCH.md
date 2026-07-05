# RESEARCH — 競品與設計研究筆記

本文件收錄影響「車車遊樂園」產品方向的外部研究與競品拆解，供產品判斷參考。對應待辦見 [TODOS.md](./TODOS.md)。

---

## 2026-07-05｜熱門 podcast 平台網站對標與本站開發方向

來源：Apple Podcasts 官網／Apple Podcasts for Creators／Spotify for Creators support／Pocket Casts Blog／YouTube Blog／Podcast.co／Podbean
關聯：單集頁 GEO、逐字稿／章節、YouTube 上架 SOP、低壓互動原則

### 對標樣本與核心訊號

| 平台 / 類型 | 觀察到的主打能力 | 對本站的啟發 |
|---|---|---|
| **Apple Podcasts** | 官網主軸是「listen / watch / read」：video、transcripts、章節探索、點文字跳播、播放速度與 Enhance Dialogue、訂閱與跨裝置／車載情境。來源：[Apple Podcasts](https://www.apple.com/apple-podcasts/)、[Transcripts on Apple Podcasts](https://podcasters.apple.com/support/5316-transcripts-on-apple-podcasts) | podcast 平台正在把音訊變成「可閱讀、可搜尋、可跳轉」的內容資產。本站已有 VTT/RSS transcript 與故事大綱，下一步應補公開逐字稿頁、章節深連結、片段分享。 |
| **Spotify** | 支援自動逐字稿；聽眾可在 Now Playing 與 episode pages 看 transcript。Chapters 可讓聽眾從特定段落開始，也能由 transcript 產生。來源：[Managing episode transcripts](https://support.spotify.com/us/creators/article/managing-episode-transcripts-on-spotify/)、[Episode chapters](https://support.spotify.com/us/creators/article/episode-chapters/) | transcript + chapter 是平台級基本盤。本站應補公開但低調的逐字稿頁與章節深連結；互動仍維持 optional、parent-gated、低壓。 |
| **Pocket Casts** | Web Player 開放給所有人免登入播放；登入後才解鎖跨裝置播放進度、queue、subscriptions/preferences。也強調 open access、播放控制與使用者自主管理。來源：[Pocket Casts Web Player](https://blog.pocketcasts.com/2025/03/11/webplayer/) | 本站不必搶做通用播放器；應保留免登入、直接可用。若做續播／收藏，先走本機 localStorage；跨裝置同步需等家長資料策略成熟後再評估。 |
| **YouTube Podcasts / Creator guidance** | YouTube 將 podcast 視為長內容支柱，建議用縮圖、chapters、詳細描述、搜尋關鍵字與「shoulder content」拆出短內容。來源：[YouTube Blog podcast content strategy](https://blog.youtube/creator-and-artist-stories/the-definitive-guide-to-creating-engaging-podcast-content/) | 既有 `export:video` 已完成整集匯出；研究結論降級為上架 SOP 補強：description、章節 timestamps、縮圖規格、官網回鏈。 |
| **Podcast.co / Podbean（hosting/growth 工具）** | Podcast.co 把 podcast pages、web players、transcripts、video soundbites、analytics 放在「growth-focused tools」。Podbean 主打分發到 Apple/Spotify、podcast website、AI show notes / chapter markers / transcripts、IAB analytics、跨平台統計與 audiograms。來源：[Podcast.co product](https://www.podcast.co/product)、[Podbean](https://www.podbean.com/) | 成長工具的共識是「分發 + 可嵌入頁 + transcript + soundbite + analytics」。本輪只採納 transcript / chapter / YouTube 上架 SOP，其他營運漏斗不列近期開發方向。 |

### 本站現況對照

已具備：

- `StoryPlayer` 看圖聽故事、字幕、睡前 timer、localStorage 續播。
- 單集頁有 answer-first 摘要、大綱、角色、FAQ、平台 CTA、分享鈕。
- RSS 已輸出 `podcast:transcript` VTT；`/story/[slug]/transcript.vtt` 可供平台讀取。
- `/topic`、`/vehicles`、`/characters`、`/stories` 提供基本發現入口。
- `export:video` 可產生 16:9 整集影片；Studio 有平台後台捷徑與站內 platform click 事件。

主要缺口：

- **逐字稿仍是機器／平台可讀，不是家長與搜尋引擎友善的公開內容頁。**
- **章節與片段不可分享**：無 `#t=` 或 chapter anchor，也沒有「從這裡開始聽」的單集頁深連結。
- **YouTube 上架 SOP 可補強**：有 video export，但 description、章節、縮圖規格、官網回鏈仍需固定模板。
- **互動需要克制**：平台社群互動不適合直接搬到孩子端；本站只保留低壓、可選、家長安心的互動原則。

### 開發方向建議

#### 1. Open-Web Episode Hub（唯一 P0）

把單集頁做成比平台頁更適合搜尋、分享與家長決策的公開 hub：

- 每集新增獨立逐字稿頁 `/story/[slug]/transcript`，單集頁只放低調入口，不讓長篇文字影響觀感。
- 保留 VTT 供 RSS／平台使用；公開頁需標示字幕為親子共讀輔助，不保證逐字完全一致。
- 從 `captionTimes` / subtitles 產生章節錨點：`/story/ep-17?t=123` 或 `#chapter-03`，支援「從這裡開始聽」。
- 在章節／逐字稿旁提供輕量分享：複製段落連結、LINE 分享該段摘要。

#### 2. YouTube 整集上架 SOP 補強

既有 `export:video` 已能產生 16:9 整集影片；本研究只保留 SOP 補強：

- 由匯出 manifest 或輔助腳本產生可貼到 YouTube Studio 的 description 模板。
- description 包含官網單集頁、Apple／Spotify／YouTube playlist 連結、AI 插圖與兒童向設定提醒。
- 產生章節 timestamps 與短標題，供 YouTube description 使用。
- 補縮圖規格：可沿用 `01.jpg` 或另做 16:9 模板；不新增獨立短影音方向。

#### 3. Child-Native / Low-Pressure 產品原則

此段不是開發項，而是後續功能去留的判斷基準：

- 主要體驗維持看圖聽故事、逐頁字幕、免登入、低壓結尾、家長安心條。
- 互動都應可選，不打斷收聽、不要求孩子回答、不製造連續壓力。
- 開放式探索優先於關卡式任務；不把分數、排名、倒數計時放進學齡前主流程。
- 官網定位是每集可分享落地頁 + 訂閱轉換中心 + 看圖差異化體驗；平台播放仍導向 Spotify / Apple / YouTube。

### 建議優先序

| 優先 | 方向 | 原因 | 依賴 |
|---|---|---|---|
| P0 | Open-Web Episode Hub | 最貼近現有資料與 SEO/GEO；能立刻放大單集頁價值 | captions/subtitles、story metadata |
| P1 | YouTube 整集上架 SOP 補強 | 不重做 `export:video`，只補營運可直接使用的描述、章節與縮圖規格 | VIDEO-EXPORT、字幕、故事 metadata |
| 原則 | Child-Native / Low-Pressure | 作為功能去留準則，不列為獨立開發項 | DESIGN.md、家長信任決策 |

### 收斂後結論

本輪只保留一個近期產品開發主線：**Open-Web Episode Hub**。YouTube 只做既有整集匯出 workflow 的 SOP 補強；其他構想移出近期開發方向，避免分散 podcast 官網主戰場。

---

## 2026-06-09｜Hey Clay App 架構拆解與適用性評估

來源：Hey Clay 官網 / Apple App Store / Fat Brain Toys / 零售頁
關聯：phygital 內容類型、收藏養成、付費解鎖、線下手作引導

### Hey Clay 的架構本質

Hey Clay 是「實體玩具 + 數位引導」的 **phygital（虛實整合）** 模式，核心由四個元素組成：

1. **內容單元 = 一個角色 = 一組分步教學**。每個角色（小豬、馬、車）內含分步式 3D 互動教學，一次一個簡單形狀地引導捏塑。本質是「結構化的步驟序列資料」。
2. **內容解鎖機制（商業核心）**：買實體盒子 → 拿到一組 code → 在 App 輸入/掃描解鎖該套組；想要其他套組角色，透過 App 內購取得。
3. **輔助黏著功能**：5 個小遊戲、作品展示、無第三方廣告。
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
- **結論：同一套資料模式理論上可支援「車車 DIY 手作教學」內容類型**（如何用色紙摺救護車、怎麼畫消防車），每步一張示意圖 + 一句語音引導，複用現有翻頁播放器 + 字幕同步機制。本輪僅保留為研究洞察，不列近期開發方向。

**第三層：phygital 哲學 → 最大啟發**

- Hey Clay 用 App 當工具引導孩子「離開螢幕去動手做」，螢幕是手段非目的。
- 家長最怕螢幕時間、最愛「螢幕引導孩子動手做」——這是強力賣點，也呼應開放式、動手做的 STEM 最有效之研究。
- 車車版循環可作為遠期靈感：聽垃圾車故事（線上）→ 家中用回收物做一台垃圾車（線下）→ 家長自行保存作品。這是純 podcast 競品（叮噹、信誼）做不到的差異化。

### 適用性評分

| Hey Clay 元素 | 適用度 | 怎麼用 |
|---|---|---|
| 分步引導序列資料結構 | ★★★★★ | 複用 captions/翻頁架構做「車車 DIY 教學」 |
| 收藏 / 圖鑑養成 | ★★☆☆☆ | 僅作遠期參考；近期不把孩子端進度做成主飛輪 |
| phygital 線下創作引導 | ★★★★☆ | 螢幕引導 → 動手做，反螢幕時間賣點 |
| code 解鎖收銀台 | ★☆☆☆☆ | 不採用；僅作商業模式反例 |
| 作品展示 | ★☆☆☆☆ | 只作研究參考；近期不做站內作品提交或社群展示 |

### 保留為研究洞察

現有「翻頁 + 字幕同步」架構理論上可承接分步手作教學，但本輪不把 `craft` 列為近期開發方向：

- 可保留「一步一動作」「自定節奏」「材料低門檻」作為日後設計參考。
- 不新增 `craft` 型別、不做完成獎勵、不做站內作品提交。
- 官網近期主線仍是單集公開內容 hub 與平台訂閱轉換。

### 風險 / 待確認

- 若日後導入任何個資、帳號、作品提交或跨裝置同步，需先完成家長同意、資料最小化與刪除流程設計。
- 手作教學若重新啟動，需先驗證插畫產能與家長實際使用意願。

---

## 2026-06-11｜逐步共作模式 — LEGO 說明書 × Hey Clay 的共同機制與本站轉譯

來源：延展 [2026-06-09 Hey Clay 架構拆解](#2026-06-09hey-clay-app-架構拆解與適用性評估)；LEGO 官方建築／Creator 系列說明書設計慣例；幼兒工作記憶與執行功能研究（3–7 歲單步負荷顯著低於多步串聯）
關聯：`StoryPlayer`（翻頁／字幕同步）、`captions[]`／`captionTimes[]`、低壓自定節奏、線下動手做研究

> **與 Hey Clay 研究的關係：** [2026-06-09 節](#2026-06-09hey-clay-app-架構拆解與適用性評估)已整理「分步 `steps[]` + phygital 引導」與本站 `StoryPlayer` 架構的相容性。本節不再延伸商業改造或近期開發，而聚焦 **「為什麼分步有效」** 的共通認知機制，作為日後判斷是否重啟手作方向的產品原則。

### 核心洞察：同一套「拆步引擎」

LEGO 紙本說明書與 Hey Clay 的 3D 分步教學，表面媒材不同（靜態圖 vs 動畫、積木 vs 黏土），**本質相同**：把孩子一個人做不出來的成品，拆成一串「這一步你一定做得到」的微動作；每完成一步就給一次可感知的進展感，而非等到最後才驗收成敗。

這與 [Hey Clay 第二層結論](#對車車遊樂園的適用性分三層)（複雜創作 → 保證成功的微步驟序列）一致，但 LEGO 額外證明了一點：**即使沒有 App、沒有訂閱，只要拆步夠細，純說明書也能撐起長期使用。** 對本站來說，重點不是立刻做手作內容，而是保留「拆步夠細、孩子自己掌控節奏」這個研究洞察。

### 四條有效機制（3–7 歲認知依據）

| # | 機制 | 說明 | 3–7 歲認知依據 |
|---|------|------|----------------|
| ① | **一步一動作** | 每頁／每步只要求一個可命名動作（摺、貼、剪一刀），禁止「同時摺好並對齊兩角」這類複合指令。 | **工作記憶上限**：學齡前至低年級同時維持 1–2 個空間關係已吃力；多動作一步會超出負荷，錯誤率陡升。 |
| ② | **差異高亮** | 只標示「相對上一步新增了什麼」：LEGO 用新增零件的彩色標示與箭頭，免依賴閱讀。 | **前閱讀期友善**：識字前孩子靠圖示差異比對學習；減少語言解碼負擔，注意力留在手部動作。 |
| ③ | **自定節奏** | 翻頁權在孩子手上；可重聽、可暫停、可回上一頁對照。優於單向影片播放。 | **執行功能仍在發展**：需要反覆確認「我做對了嗎」；被影片時間軸拖著走易產生跟不上的焦慮。 |
| ④ | **錯了能救** | 單步粒度小 → 錯誤局部化，可退回一步重做，不會讓前面十分鐘白費。 | **挫敗耐受低**：幼兒對「全盤重來」的放棄閾值極低；LEGO／Hey Clay 皆靠細步降低沉没成本。 |

Hey Clay 的 3D 旋轉與 LEGO 的零件袋編號，都是為 ②③ 服務的實作變體；craft 不必複製 3D，但必須保留 **「只看差異、自己翻頁」** 這兩項核心。

### 對本站的研究轉譯

本段只保留認知與設計原則，不列近期開發任務：

- **StoryPlayer 翻頁 + 語音 + 字幕同步** 與 self-paced 教學邏輯相容；若未來重啟手作方向，可沿用「逐步、可暫停、可回看」的互動節奏。
- **敘事動機** 是本站潛在優勢：孩子做的是剛聽過的角色，而不是無名模型；但是否產品化需另行驗證。
- **步驟顆粒度** 應維持每步一個動作，避免 3–7 歲工作記憶超載。
- **差異高亮** 比完整重畫更適合前閱讀期孩子：只標示「相對上一步新增了什麼」。
- **自查點** 應是「看起來像這樣了嗎？」的自我對照，不做評分。
- **材料低門檻** 是必要條件：如果未來做手作，應以家用材料為主，避免形成專用材料依賴。

---

## 2026-06-11｜前端吸引力功能 Cursor-Ready Prompts（FE-01〜FE-08）

> 適用 repo：Next.js 15（App Router、SSG）、TypeScript、`components/games/`、`app/games/[slug]/page.tsx`、`hooks/useReducedMotion.ts`、progress store。
> TODOS 紀律：每個 prompt 完成後必須更新 `TODOS.md`，標註對應 commit hash，格式：`- [x] FE-XX <任務名> (commit: <hash>)`。
> 通用約束（每個 prompt 都適用）：
> - 全部元件 SSR-safe，`window` / `AudioContext` 一律在 `useEffect` 或動態 import 內存取。
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

### 建議實作順序與依賴

```
FE-01 Mascot ──┬──> FE-03 ParkMap ──> FE-07 睡前模式(夜景)
FE-02 音效  ──┘         │
                        └──> FE-04 車庫圖鑑
FE-06 家長閘門 ──> FE-05 家長儀表板 ──> FE-07 / FE-08 設定整合
```

| 順位 | 任務 | 理由 |
|---|---|---|
| 1 | FE-01 + FE-02 | 孩子留存的根本，且是其他任務的依賴 |
| 2 | FE-06 | 小而快，FE-05 的前置 |
| 3 | FE-03 | 首頁改版，體驗躍升最大 |
| 4 | FE-04 | 回訪鉤子 |
| 5 | FE-05 | 家長轉換（WAF 北極星） |
| 6 | FE-07 → FE-08 | 加分項 |
