# 英文站內重創音訊 Pilot 規格 v1.1

> 版本：spec v1.1  
> 日期：2026-10-17（Asia/Taipei）  
> 前版：spec v1（同日；見文末變更紀錄）  
> 狀態：**規格文件。Pilot 集數沿用 EP4。尚未核准付費語音生成，尚未核准改 repo 程式或上線。**  
> 範圍：網站限定（website only）、預先生成（pre-generated）、人工核准後才可發布、**不進 RSS / Podcast feed**  
> 性質：模型讀完整集華語內容後，為 3–7 歲兒童**獨立重創作**英文故事；**不是逐字翻譯、不是逐句翻譯**  
> 流程：[WORKFLOW.md](./WORKFLOW.md)。關卡表：[templates/](./templates/)

## 結論

EP4《守信用的鈴鈴清潔車》仍是這一集 pilot 的選定集。節拍 B1–B15、十條不可改事實、禁止改動、角色 canon、聲音倫理、詞彙表、CEFR Pre-A1–A1 句長規則、Gate 1／Gate 2、成本估計與停止規則，沿用 spec v1，並在本檔保留全文。

v1.1 只改四件事：JSON 每行補上發音覆寫欄 `tts_text`；英文角色名與站名改列在下方〈未定案〉，本檔不代 Kaiyi 決定；提案路徑對過 repo 現況，對不上的地方同樣列為未定案；文末留下 v1 → v1.1 變更紀錄。

本檔不生成腳本、不呼叫 TTS、不新增音檔、不改 `data/` 與 `public/`、不改 UI、不加依賴、不付費。插圖只在原站既有頁面內重用，不外拷。

## 未定案（OPEN DECISIONS）

以下項目**沒有在 v1.1 定案**。草稿可以暫用 spec v1 的 PROPOSED 拼法（prompt 要求原樣抄寫、不得自創變體），Gate 1 通過前不得進 TTS。Kaiyi 若要在起草前先鎖名字，依 [WORKFLOW.md](./WORKFLOW.md) 步驟 0 停下來即可。

### OD-1 英文角色名與站名

命名原則仍是：好念、好辨、定案後全系列沿用。下表是 v1 的提案，不是決議。

| 角色 | v1 提案（未定案） | v1 備案（未定案） | 本輪要 Kaiyi 看的點 |
|---|---|---|---|
| 鈴鈴清潔車 | Lingling the Street Sweeper | Ling-Ling | 場景英文 prompt 已用 Lingling。穩定 id 是 `ling-ling` |
| 小紅賽車 | Ruby the Little Race Car | Xiao Hong（拼音） | Ruby 會和中文品牌拆開。見下方 canon 摘記 |
| 安安救護車 | Andy the Ambulance | An-An | Andy 通常是男孩名，和 repo 已落地的寫法不一定合。見下方 canon 摘記 |
| 黃色計程車 | Sunny the Taxi | the yellow taxi（不具名） | 本集只一句。別名裡已有「阿樂」。id 是 `huang-ji-cheng` |
| 東東挖土機 | Dongdong the Excavator（僅旁白名單） | — | 本集無對白。id 是 `dong-dong` |
| 警車 | the Police Car（不具名） | — | 本集字幕只稱「警車」。不得借 ep-12 的「亮亮」 |
| 馬米 | Mami | — | `characters.json` 與 id `mami` 已是這個拼法。聲音見 §4.3，pilot 不克隆 |
| Bonbon | Bonbon | — | 拼法已是英文。**聲音嚴禁克隆**，見 §4.3 |
| 維修廠叔叔 | Mr. Fix，或 the Repair Uncle | Uncle Fix | 中文 canon 無姓名。英文功能稱呼須等 Gate 1，且不得回寫中文 canon |
| 站名「車車遊樂園」 | CheChe Playground | — | 定案後才鎖進 Glossary |

**小紅與「Ruby」。** 口播字幕用「她」：`data/subtitles/ep-23.json`「她開心的問爸爸」；`data/subtitles/ep-34.json`「她就很容易氣撲撲」。場景英文寫的是 Xiao Hong、Xiaohong、little red race car（例如 `data/scenes/ep-16.json`、`data/scenes/ep-12.json`）。`data/characters.ts` 的穩定 id 是 `xiao-hong`。Repo 裡沒有 Ruby。把小紅改成 Ruby，英文版會和中文名、既有場景用名、id 分開。沿用拼音是未定案的備案，不是本檔的決定。

**安安與「Andy」。** `data/characters.json` 沒有性別欄位。穩定 id 是 `data/characters.ts` 的 `an-an`。場景英文已經寫成 An An（`data/scenes/ep-4.json`、`data/scenes/ep-6.json`）與 An-An（`data/scenes/ep-16.json`），並用 it，例如 `data/scenes/ep-6.json` 的 “showing its red cross”、“leans its whole body”。口播字幕用「他」：`data/subtitles/ep-6.json`「他開啟車燈準備出任務」「他心想我是救護車」；`data/subtitles/ep-16.json`「他呢 停在角落旁邊」。同一套字幕「他」也用來指鈴鈴（`data/subtitles/ep-4.json`「也打溼了他的音樂喇叭」），而 `data/stories.ts` EP4 摘要寫「她仍努力提醒」，`data/scenes/ep-4.json` 對鈴鈴用 her。口播「他」因此不能單獨當成安安的性別鎖定。Andy 在英語裡通常是男孩名；repo 沒有這個英文名。定案前不要把 speaker id `andy` 或名字 Andy 寫成已鎖定。

**Speaker id 與角色 id 不一致，一併未定案。** §7 schema 的 speaker 列舉仍是 v1 的 `narrator | lingling | ruby | andy | sunny | mr_fix | bonbon`，方便草稿沿用提案。`data/characters.ts` 已有的 id 是 `ling-ling`、`xiao-hong`、`an-an`、`huang-ji-cheng`、`mami`、`bong-bong`。Gate 1 鎖定英文名時，要同時決定 speaker 列舉要不要改成這些 id。v1.1 不改列舉，避免在名字還沒定時先改一版 schema。

### OD-2 檔案路徑與 repo 慣例

v1 建議的兩條路徑對過 2026-10-17 的 `main`（`31b88654445ee1f46a01c55eaa17a257adc8c8b2`）。本檔不新建這些檔案。

| v1 提案 | repo 現況 | 未定案要決定的事 |
|---|---|---|
| `public/stories/ep-4/audio-en.mp3` | 該集音檔是 `public/stories/ep-4/audio.mp3`。`data/stories.ts` 的 `audio` 欄位是字串 `"audio.mp3"`。`lib/story-utils.ts` 的 `storyAudioPath(slug, filename)`／`storyAudioUrl` 可以用任意檔名組出 `/stories/<slug>/<filename>`。`lib/feed.ts` 的 RSS enclosure 用的就是 `story.audio` 這一個檔。`scripts/transcribe.ts`、`scripts/generate-audio-lengths.ts` 只認 `audio.mp3` | 兄弟檔名和目錄慣例對得上，也不會單靠檔名進 feed。尚未決定的是：是否就用 `audio-en.mp3`，以及用什麼欄位／檢查保證英文檔永遠不寫進 `story.audio`。覆蓋 `audio.mp3` 不在選項裡 |
| `data/en/ep-4.json` | 沒有 `data/en/`。側車是 `data/<種類>/<slug>.json`，例如 `data/subtitles/ep-4.json`、`data/scenes/ep-4.json`。EP1–6 的集數 metadata 在 `data/stories.ts`，由 `data/content.ts` 合併 | 決定實作時用 v1 的 `data/en/ep-4.json`，還是新增一種側車目錄（形狀對齊 `data/subtitles/<slug>.json`）。定案版腳本在那之前不寫進 `data/` |
| 逐行 take：`ep-4_en/S{scene}L{line}_{speaker}_take{n}.wav` | repo 沒有這個目錄 | 工作檔放哪、Gate 2 通過前不進 `public/stories/`。本檔不指定新目錄 |

### OD-3 沿用 v1、仍等 Gate 1 或另案的項目

這些在 v1 已標成提案或估計，v1.1 維持未定案：英文標題示例 “Lingling Keeps Her Promise”；「大雨」用 heavy rain 或 big rain；「出任務」用 go to work；「音樂喇叭」用 speaker；播放器 toggle 與 AI 標示文案；擴充順序建議 EP8 → EP5 → EP3；盲聽怎麼找到孩子（見 WORKFLOW，本檔不選一種）。

---

## 0. 資料來源與驗證方法（Evidence）

本規格不是憑印象選集。v1 直接檢查實際專案資產後撰寫；v1.1 於同一 commit 再對過角色 id、代名詞與路徑（見上方未定案）。

- 來源 repo：`godmosword/podcast-website`
- v1 檢查方式：shallow clone 到本機暫存區唯讀檢查（`/tmp/pw-en`，僅供該次驗證）
- 本檔對齊的 `main`：`31b88654445ee1f46a01c55eaa17a257adc8c8b2`（2026-10-17T07:57:30+08:00）。v1.1 撰寫時 `git fetch origin main` 後，本地與 `origin/main` 都是這個 commit
- 主要資產：
  - `data/stories.ts`（EP1–6 手動資料，含標題、duration、summary、captions、captionTimes）
  - `data/apple-synced.json`（EP7 之後集數的標題、duration、summary 等；v1 檢查共 28 筆，整庫共 EP1–EP34）
  - `data/subtitles/ep-N.json`（每集字幕，格式為 `[{ "t": 秒數, "text": "..." }]`）
  - `data/scenes/ep-N.json`（每集場景切分，含 start/end、summary、characters、prompt）
  - `data/characters.json`（角色 canon、aliases、vehicle、英文 desc、firstSeen/alsoIn）
  - `data/characters.ts`（穩定 id：`ling-ling`、`an-an`、`xiao-hong`、`mami`、`bong-bong` 等）
  - `data/audio-lengths.json`
  - `public/stories/ep-N/audio.mp3`（v1 以 ffprobe 實測秒數交叉驗證）
- 插圖紅線：repo 內 `public/stories/ep-N/*.jpg|webp|avif` 與角色圖僅供原站既有用途。**本 pilot 不複製、不搬運、不上傳插圖到任何外部網站或外部生成服務。** 英文版在原站內如何重用既有頁面圖，屬原站內部前端實作，仍須遵守 [STYLE-BIBLE.md](../STYLE-BIBLE.md) 與 [VISUAL-ACCEPTANCE.md](../VISUAL-ACCEPTANCE.md)（圖內文字只有小紅車身的「2」這一個例外）。本規格不授權外拷，也不授權本階段改圖。

### 0.1 重要資產限制

1. **字幕沒有 speaker 欄位。** `data/subtitles/ep-*.json` 只有 `t` 與 `text`，沒有說話者標記、沒有情緒欄位。因此「誰在說話」必須由旁白敘述、對話語境、`data/scenes/*.json` 的 characters 與人工判讀共同推定。這正是 Gate 1 必須人工確認的原因。
2. **EP4 時間軸有小差異，必須記錄：**
   - `data/stories.ts` 標示 EP4 duration `4:21`
   - ffprobe 實測 `public/stories/ep-4/audio.mp3` = **260.86 秒（約 4:21）**
   - `data/scenes/ep-4.json` 的 `audioDuration` = **253 秒**
   - 字幕最後一句 `t=247.9`（「拜拜」）
   - 解讀：場景切分止於 253 秒，音檔實際 260.9 秒，尾段約 8–13 秒可能為結尾音樂／靜默／淡出。重創作時**不得把 253 秒誤當成音檔總長**。混音長度以最終英文旁白＋音樂編排為準，不要求與中文版等長。
3. **不是每集都有 scenes 檔。** v1 檢查：EP25、26、27、31、33、34 無 `data/scenes/ep-N.json`（subtitles 與 audio 仍在）。這不影響 EP4（scenes 完整）。擴充集數時必須先補齊或人工切場景。

---

## 1. Pilot 集數選擇 + 證據

### 1.1 結論

**Pilot 選 EP4《守信用的鈴鈴清潔車》。** v1 以實際資產驗證「最短／最簡單」成立，v1.1 沿用，不重選。

### 1.2 量化證據（v1 實際量測）

量測口徑：

- 時長：ffprobe 實測 `public/stories/ep-N/audio.mp3` 秒數，並與 `data/stories.ts` / `data/apple-synced.json` 的 duration 字串交叉核對。
- 字幕句數／字元數：直接計算 `data/subtitles/ep-N.json` 的陣列長度與 `text` 總字元數。字元數比句數更能反映內容量，因為各集字幕切句粒度不完全一致。
- 場景數：`data/scenes/ep-N.json` 的 `scenes` 陣列長度（無 scenes 檔者標示缺失）。

| 集數 | 標示時長 | ffprobe 實測 | 字幕句數 | 字幕總字元 | 場景數 | 備註 |
|---|---:|---:|---:|---:|---:|---|
| **EP4《守信用的鈴鈴清潔車》** | **4:21** | **260.9 秒（全庫最短）** | 124 | **855（全庫最少）** | 14 | 主題：守信用 |
| EP8《怪獸卡車輕輕開》 | 4:54 | 293.8 秒（第二短） | 134 | 894（第二少） | 13 | 主題：顧及別人感受，較抽象 |
| EP7《高鐵小橘晚到了》 | 5:01 | 300.8 秒 | 130 | 983 | 15 | 含高鐵／捷運、延遲應變，詞彙較專門 |
| EP5《東東挖土機的勇氣任務》 | 5:21 | 320.2 秒 | 117 | 895 | 16 | 句數少但總字元與時長都多於 EP4 |
| EP21（自動駕駛計程車知知相關集） | 5:22 | 321.3 秒 | 132 | 1,082 | 18 | 科技詞彙多，不適合當第一集 |
| EP12（警車與巴士合作任務） | 5:35 | 334.3 秒 | 107（句數最少） | 987 | 15 | 句數少是切句較粗；內容含送孕婦到醫院，情境複雜度高 |
| EP3《小紅賽車不是第一名也沒關係》 | 5:50 | 349.4 秒 | 145 | 1,141 | 19 | 情緒轉折多、比賽場面角色多 |
| EP6《安安救護車｜勇敢說出我需要幫忙》 | 5:48 | 347.3 秒 | 126 | 1,167 | 20 | 救援受困情節、角色多 |
| EP33《神奇的油漆車》 | 6:00 | 359.7 秒 | 110 | 992 | **缺 scenes 檔** | episode pack 不完整，不適合 pilot |
| EP34 | 10:42 | 全庫最長一類 | 221 | 1,796（最多） | **缺 scenes 檔** | 明確排除 |

全庫範圍（EP1–EP34）核對結果：

- ffprobe 最短：**EP4（260.9 秒）**，其次 EP8（293.8 秒）、EP7（300.8 秒）。
- 字幕總字元最少：**EP4（855 字）**，其次 EP8（894 字）、EP5（895 字）。
- 字幕句數最少的是 EP12（107 句），但其總字元（987）、時長（334 秒）與情境複雜度都高於 EP4。選集不能只看句數。

### 1.3 為什麼 EP4 適合當 pilot

1. **情節線性、單一主線：** 早安音樂叫大家起床 → 鈴鈴做出承諾 → 大雨弄濕喇叭 → 喇叭壞掉 → 鈴鈴改用車燈／雨刷逐一叫醒朋友 → 大家陪她去維修廠 → 原來只是進水 → 守信用得到信任。沒有支線、沒有倒敘、沒有多地點跳轉。
2. **天然重複結構，適合 Pre-A1–A1：** 「叫醒小紅」「叫醒安安」是同構重複情節。英文版可使用重複句型（"Time to wake up!" / "Flash, flash!" / "Swish, swish!"）。
3. **角色少且辨識度高：** 核心說話角色為旁白（馬米）、鈴鈴、小紅、安安，外加黃色計程車一句感謝、維修廠叔叔一句診斷。聲音配置與角色區分測試的負擔最低。
4. **具體動作詞多、抽象詞少：** wake up、flash、swish、rain、broken、fix 可由聲音與情境直接理解。核心價值可落成 "I promised. So I came."
5. **音效／音樂可重用性高：** 早安音樂鈴、雨聲、車燈（無聲，需以旁白＋短音效提示）、雨刷聲、維修廠環境聲，只重用有權利使用的原站資產（見 §8、§9）。
6. **寓意可驗證：** 盲聽可用單一問題看孩子是否抓到「答應了就要做到」（見 Gate 2）。

### 1.4 為什麼其他候選不做這一集

- **EP8（第二短）：** 主題「輕輕開、顧及螢火蟲與別人感受」較抽象，且含月光森林等夜間情境。保留為第二波候選。
- **EP7：** 高鐵、捷運、延遲、改路線，專門詞與在地交通轉換成本高。
- **EP12：** 句數最少，內容是巴士載臨產媽媽趕往醫院、警車支援。
- **EP5：** 時長與字元都多於 EP4，場景 16 場。
- **EP33／EP34 等無 scenes 檔的集數：** episode pack 不完整。
- **EP1／EP2：** 時長 6–8 分鐘、字元 1,500+，且含大量 Bonbon 真人童聲互動。見聲音倫理。

---

## 2. Pilot Episode Pack 摘要（EP4）

以下抽自實際資產。

### 2.1 基本資料

| 欄位 | 實際值 | 來源 |
|---|---|---|
| slug | `ep-4` | `data/stories.ts` |
| ep | 4 | `data/stories.ts` |
| 中文標題 | 《守信用的鈴鈴清潔車》 | `data/stories.ts` |
| 上架日期 | 2026-05-20 | `data/stories.ts` |
| 標示時長 | 4:21 | `data/stories.ts` |
| 音檔實測 | 260.86 秒（ffprobe）／4,174,202 bytes | `public/stories/ep-4/audio.mp3` |
| 主角車種 | 清潔車（street sweeper） | `data/stories.ts`、`data/characters.json` |
| 中文摘要 | 鈴鈴清潔車的早安音樂鈴壞掉了，她仍努力提醒車車朋友起床，學會守信用、說到做到。 | `data/stories.ts` |
| 適齡 | 約 3–7 歲 | `data/stories.ts` |
| tags | 守信用、負責 | `data/stories.ts` |
| pageCount | 14（與 scenes 14 場一致） | `data/stories.ts` |
| 字幕 | 124 句、855 字元、`t` 從 0 到 247.9 秒、無 speaker 欄位 | `data/subtitles/ep-4.json` |
| 場景 | 14 場、`audioDuration: 253`、model: `semantic-15-20s` | `data/scenes/ep-4.json` |
| captions | 14 句場景摘要，與 captionTimes 14 個時間點對齊 | `data/stories.ts` |

### 2.2 EP4 場景表

| # | 時間（秒） | 場景摘要 | scenes.characters |
|---:|---|---|---|
| 1 | 0–21.9 | 介紹鈴鈴清潔車 | （無標示，主持人開場） |
| 2 | 21.9–44.1 | 廣場播放早安音樂 | 鈴鈴清潔車 |
| 3 | 44.1–67.9 | 小紅與安安起床 | 鈴鈴清潔車、小紅賽車、安安救護車 |
| 4 | 67.9–85.9 | 鈴鈴答應守信用（字幕後段轉入雨夜） | 鈴鈴清潔車 |
| 5 | 85.9–106.3 | 喇叭壞了著急 | 鈴鈴清潔車 |
| 6 | 106.3–116.8 | 仍決定出發提醒 | 鈴鈴清潔車 |
| 7 | 116.8–137.3 | 車燈叫醒小紅 | 鈴鈴清潔車、小紅賽車 |
| 8 | 137.3–152.3 | 小紅聽見承諾 | 鈴鈴清潔車、小紅賽車 |
| 9 | 152.3–174.1 | 雨刷叫醒安安 | 鈴鈴清潔車、安安救護車 |
| 10 | 174.1–184.4 | 一起去維修廠 | 鈴鈴清潔車、小紅賽車、安安救護車 |
| 11 | 184.4–201 | 喇叭只是進水 | 鈴鈴清潔車、小紅賽車、安安救護車（＋字幕中的維修廠叔叔，scenes 未列） |
| 12 | 201–217.2 | 小紅稱讚守信用 | 鈴鈴清潔車、小紅賽車 |
| 13 | 217.2–238 | 大家更信任鈴鈴 | 鈴鈴清潔車、小紅賽車、安安救護車 |
| 14 | 238–253 | 守信用結語拜拜 | （無標示，主持人結語） |

### 2.3 EP4 字幕中實際出現／被提及的角色

- 主持人：Bonbon（「嗨 我是 Bonbon」，t=8）、馬米（「我是馬米」，t=10.8）。僅開場自我介紹，正文以旁白敘事為主。
- 鈴鈴清潔車：主角。
- 小紅賽車：被叫醒、對話、結尾稱讚鈴鈴守信用。
- 安安救護車：整理急救箱、被雨刷叫醒、感動回應。
- 黃色計程車：開場段落說「謝謝你鈴鈴清潔車……我們都不會遲到哦」（t≈49.4–56.7，經旁白轉述）。
- 被順帶叫醒者（t≈174.1–180.6 字幕）：計程車、小挖土機（東東）、警車。僅一句帶過，無個別對話。scenes 第 10 場未逐一列名。
- 修理車的叔叔（維修廠叔叔）：t≈184.4–193.7 說明「喇叭進水，休息一下就會好」。`characters.json` 無此角色 canon，scenes 亦未列，屬功能性配角。
- 字幕全文為旁白轉述體。內嵌對話（例如小紅「你今天怎麼沒有音樂呢」）沒有獨立 speaker 標記。英文版必須重新分配 speaker（見 §4）。

---

## 3. Locked Story Beats（鎖定節拍，含來源時間戳）

規則：以下節拍的**事件、因果、順序**在英文重創作中不得改變。可以改變的是英文句型、句長、重複次數、擬聲字與銜接語。時間戳為中文原版字幕 `t`（秒）與 scenes 區間，僅供對照與審稿，不要求英文版逐秒對齊。

| Beat | 時間（字幕 t／scenes） | 鎖定內容 | 來源證據（字幕摘意） |
|---|---|---|---|
| B1 開場與主角介紹 | t 0–20.4／Scene 1 | 主持人開場；介紹車車遊樂園裡有一台特別的清潔車「鈴鈴」，她每天早上負責叫大家起床 | 「有一臺很特別的清潔車，名字呢叫做鈴鈴清潔車」 |
| B2 早安音樂的日常 | t 21.9–38.3／Scene 2 | 鈴鈴準時到廣場，播放溫柔可愛的早安音樂，叫大家起床、吃早餐、出任務 | 「播放那個溫柔又可愛的提醒音樂，叫大家起床咯」 |
| B3 朋友的回應（常態） | t 38.3–58.5／Scenes 2–3 | 小紅聽到音樂立刻起床；安安整理急救箱；黃色計程車道謝：有鈴鈴提醒，大家不會遲到 | 「謝謝你鈴鈴清潔車……我們都不會遲到哦」 |
| B4 承諾成立 | t 58.5–67.9／Scene 4 前段 | 鈴鈴認真承諾：每天早上準時叫大家起床 | 「我答應大家，每天早上都會準時……提醒大家起床哦」 |
| B5 大雨與喇叭受損 | t 67.9–85.9／Scene 4 後段 | 一天晚上遊樂園下大雨，雨打在車窗上，也打濕了鈴鈴的音樂喇叭 | 「雨水呢……也打溼了他的音樂喇叭」 |
| B6 喇叭壞掉與焦急 | t 85.9–106.3／Scene 5 | 隔天早上鈴鈴想播音樂，喇叭發不出聲音；她焦急，想到自己答應過大家 | 「怎麼音樂喇叭發不出聲音啊」「我答應要提醒大家」 |
| B7 決定照樣出發 | t 106.3–116.8／Scene 6 | 鈴鈴本想留在車庫休息，但想到大家還在睡、可能會遲到，仍努力出發 | 「本來很想要留在車庫裡面休息的，可是他想到大家還在睡覺」 |
| B8 車燈叫醒小紅 | t 116.8–137.3／Scene 7 | 鈴鈴到小紅家門口，因為不能播音樂，改用車燈一閃一閃叫醒小紅；小紅問今天怎麼沒有音樂 | 「就用車燈一閃一閃的」「你今天怎麼沒有音樂呢」 |
| B9 說明與承諾重申 | t 137.3–152.3／Scene 8 | 鈴鈴小聲說明喇叭壞了，但「我答應要叫大家起床，所以我還是來了」 | 「我的音樂喇叭壞掉了，但是我答應要叫大家起床了，所以我還是來了」 |
| B10 雨刷叫醒安安 | t 152.3–174.1／Scene 9 | 鈴鈴到安安家，用雨刷刷刷作響叫醒安安；安安感動：喇叭壞了還記得叫大家起床 | 「用雨刷刷著刷」「你的音樂喇叭壞掉了，還記得要叫大家起床的事啊」 |
| B11 大家準時起床、陪去維修廠 | t 174.1–184.4／Scene 10 | 計程車、小挖土機、警車等也都準時起床；大家一起陪鈴鈴去維修廠 | 「大家都準時起床了」「一起陪鈴鈴呢去維修廠」 |
| B12 診斷：只是進水 | t 184.4–201／Scene 11 | 維修廠叔叔檢查後說：喇叭只是進水，休息一下就會好；鈴鈴不好意思，說以後會保護好喇叭 | 「你只是喇叭進水了，休息一下就會好了」 |
| B13 稱讚守信用、喇叭恢復 | t 201–217.2／Scene 12 | 小紅稱讚鈴鈴真的很守信用，答應了就努力做到；鈴鈴開心笑了，喇叭終於好了 | 「你真的很守信用耶，答應了大家就會努力做到哦」 |
| B14 信任與寓意 | t 217.2–238／Scene 13（字幕寓意段 t 225.6–240.5） | 從那天起大家更信任鈴鈴，因為她說到做到；對小朋友說：答應別人的事要努力做到，守信用會讓朋友更相信你 | 「鈴鈴呢是一臺會說到做到的車」「守信用會讓朋友更相信你」 |
| B15 結語道別 | t 238–247.9／Scene 14 | 今天的故事說到這裡，下一集見，拜拜 | 「車車遊樂園的故事就說到這裡咯，下一集見，拜拜」 |

### 3.1 Facts List — 不得改變的事實

1. 主角是鈴鈴清潔車（street sweeper），她的職責是**每天早上用早安音樂叫車車朋友起床**。
2. 承諾的內容是「準時提醒大家起床」，不是打掃、送貨或其他任務。
3. 喇叭故障原因依序為：**夜間大雨 → 雨水打濕音樂喇叭 → 隔天早上發不出聲音**。不得改成沒電、被撞壞、被偷走或故意不響。
4. 鈴鈴的解法依序為：**車燈一閃一閃叫醒小紅 → 雨刷刷刷叫醒安安**。兩個方法、對象與順序不得互換或省略。
5. 小紅的關鍵回應是問「今天怎麼沒有音樂」並在結尾稱讚鈴鈴守信用；安安的關鍵回應是感動於鈴鈴喇叭壞了還記得承諾。兩人的反應功能不得互換。
6. 維修結果是「**只是進水，休息就會好**」，不是大修、換新喇叭或魔法修好。
7. 結局狀態：大家都準時起床、喇叭恢復、朋友更信任鈴鈴。不得改成有人遲到受罰或問題未解決。
8. 核心寓意只有一個：**守信用、說到做到（答應了就努力做到），朋友會更信任你。** 不得新增第二個寓意（例如交通安全、環保回收）搶走焦點。
9. 場域是車車遊樂園內的日常早晨；角色都是車車（或主持人），不得新增人類小孩主角進入故事世界。
10. 開場主持人為 Bonbon 與馬米；結尾必須有面向小朋友的溫和收束與道別。

### 3.2 Forbidden Changes — 明確禁止的改動

- 禁止把故事改成比賽、救援受困、迷路尋寶等其他集的情節骨架。
- 禁止新增反派、意外事故、哭泣懲罰、遲到闖禍等原作沒有的衝突升級。
- 禁止改變故障原因、修復方式、叫醒順序與寓意（見 §3.1）。
- 禁止逐字／逐句翻譯中文句序。英文版以英文幼兒敘事節奏重寫。這是重創作範圍，不是翻譯授權。
- 禁止為了英文感加入原作沒有的品牌、歌曲旋律、流行文化梗、雙關語笑話。
- 禁止新增原作沒有的角色對白立場（例如讓安安責怪鈴鈴、讓小紅嘲笑喇叭壞掉）。
- 禁止真實兒童聲音克隆。禁止把 Bonbon 本人聲音作為生成目標（見 §4.3）。
- 禁止把英文版放入 RSS／Podcast feed、Apple/Spotify 等 podcast 平台。僅限原站站內播放（見 §9）。
- 禁止複製 repo 插圖到外部網站、外部 TTS／LLM 供應商的展示頁或社群平台。

---

## 4. Character Canon（本集角色與聲音計畫）

英文顯示名見上方 OD-1，本節不鎖定。

### 4.1 角色 canon（依 characters.json 與 EP4 實際出現）

| 中文 canon 名 | aliases（原資料） | vehicle（原資料） | 穩定 id | 在 EP4 的功能 | canon 來源 |
|---|---|---|---|---|---|
| 鈴鈴清潔車 | 玲玲清潔車、玲玲、鈴鈴、清潔車 | street sweeper | `ling-ling` | 主角；早安音樂、承諾、車燈／雨刷叫醒朋友 | `characters.json`（firstSeen: ep-4；alsoIn: ep-9/14/15）；`characters.ts` |
| 小紅賽車 | 小紅、賽車、紅賽車 | race car | `xiao-hong` | 第一個被叫醒；結尾稱讚守信用。車身有白色圓圈 2 號與白色賽車條紋（視覺 canon，英文旁白不得描述成其他號碼） | `characters.json`（firstSeen: ep-3；alsoIn 含 ep-4）；[STYLE-BIBLE.md](../STYLE-BIBLE.md) 圖內文字例外 |
| 安安救護車 | 安安、救護車 | ambulance | `an-an` | 整理急救箱；被雨刷叫醒；感動回應 | `characters.json`（firstSeen: ep-6；alsoIn 含 ep-4） |
| 黃色計程車 | 黃色的計程車、計程車、阿樂 | taxi | `huang-ji-cheng` | 開場一句道謝（旁白轉述） | `characters.json`（firstSeen: ep-3；EP4 字幕 t≈49.4） |
| 東東挖土機 | 東東、挖土機 | excavator | `dong-dong` | B11 被順帶叫醒，無個別對白（英文版可只在旁白名單中帶過） | `characters.json`（firstSeen: ep-5）；EP4 字幕「小挖土機」 |
| 警車（本集未具名） | — | police car | — | B11 被順帶叫醒，無個別對白。不得擅自等同於 ep-12 才具名的「亮亮警車」 | EP4 字幕僅稱「警車」；亮亮 firstSeen 為 ep-12，id `liang-liang` |
| 馬米 | 媽咪、Mami | host | `mami` | 主持人／旁白 | `characters.json`（firstSeen: ep-1） |
| Bonbon | 阿蹦、蹦蹦、Bon Bon | child（對照文案為「小男孩」） | `bong-bong` | 主持人（開場）。聲音處理見 §4.3 | `characters.json`；`data/characters.ts` 的 `child: "小男孩"`；`app/about/page.tsx`「是一個非常喜歡車子的小男孩」 |
| 維修廠叔叔 | （無 canon 條目） | —（人類功能角色） | — | B12 一句診斷。英文版只保留功能對白，不新增姓名、背景或口頭禪，除非 Gate 1 另行核准 | EP4 字幕 t≈184.4–193.7 |

### 4.2 英文名

v1 的提案表已移到上方 **OD-1**，狀態全部是未定案。Gate 1 逐項定案或退回後，才寫回 Glossary 的 locked 版。定案前，prompt 若使用提案拼法，必須原樣抄寫，並在 Part 1 列出實際用了哪些提案。

### 4.3 Voice Assignment Plan（聲音指派計畫）

總原則：

- **全部使用合成固定聲線（synthetic fixed voices）。** Pilot 階段每個角色綁定一個固定 voice，不得同一角色中途換聲。
- **禁止真實兒童聲音克隆。** Bonbon 是真實兒童（站內介紹為小男孩）。任何階段都不得以其錄音做 voice cloning，也不得要求合成聲模仿 Bonbon 本人。英文版 Bonbon 若出現，只能是：(a) 由旁白代述其開場功能，或 (b) 使用明確的合成童聲型聲線，且不模仿特定真實兒童。Pilot 預設採 (a)，把兒童角色對白降到最低。
- **馬米聲音克隆僅為 Phase 2 選項：** 須有馬米本人明確同意（consent）、可撤回、用途限本專案英文版，並另案核准。Pilot 階段不克隆，先用合成成人女聲旁白驗證流程。若 script 過關、合成聲被判定不合適，才依 §12 考慮 Phase 2。
- 聲線區分優先於「像不像原聲」。孩子能分辨誰在說話，比還原中文版音色更重要（Gate 2 會測）。

下表的 Speaker ID 是 schema 用的**暫用標籤**，對應 OD-1，尚未鎖定。具體 voice ID 維持 placeholder，見 §7、§8。

| Speaker ID（暫用） | 角色 | 聲線計畫 | 語速／表演 |
|---|---|---|---|
| `narrator` | 馬米／旁白 | 成人女聲、溫暖、清晰；全集敘事骨幹 | 慢速、停頓明確；新詞前後留白 |
| `lingling` | 鈴鈴 | 成人女聲（較年輕、明亮）合成聲；不得使用童聲克隆 | 誠懇、著急時略快但不尖叫 |
| `ruby` | 小紅 | 成人聲優型合成聲、活潑、音高略高 | 短句、精神飽滿；與鈴鈴必須一聽可辨 |
| `andy` | 安安 | 成人合成聲、平穩溫和（可與小紅拉開音高／語速差異） | 慢、安心感 |
| `sunny` | 黃色計程車 | 合成聲、友善；本集僅 1 句，可由 narrator 代述或獨立一句 | 明快 |
| `mr_fix` | 維修廠叔叔 | 成人男聲合成聲、沉穩 | 一句診斷，清楚慢速 |
| `bonbon` | Bonbon（主持） | **Pilot 預設不獨立配音**：開場由 narrator 以英文重述開場功能。如 Gate 1 決定保留 Bonbon 一句開場，只能用非模仿真人兒童的合成聲並經家長同意 | 不克隆、不可辨識為真實兒童本人 |

---

## 5. Glossary Starter（固定譯名表）

規則：下表英文為 pilot **建議**用法。標示「本集」者 EP4 起草時要遵守提案拼法；標示「通用」者供擴充集數沿用。標示 PROPOSED 的角色／站名屬於 OD-1／OD-3，**Gate 1 核准後才算 locked**。鎖定後的改動須改版號，並回溯檢查已生成腳本。

### 5.1 本集核心詞（EP4）

| # | 中文 | 固定英文 | 詞性／用法註記 |
|---:|---|---|---|
| 1 | 車車遊樂園 | CheChe Playground（PROPOSED，OD-1） | 站名／故事世界名 |
| 2 | 鈴鈴清潔車 | Lingling the Street Sweeper（PROPOSED，OD-1） | 角色名 |
| 3 | 清潔車／清掃車 | street sweeper | 車種名。不用 garbage truck（那是垃圾車） |
| 4 | 小紅賽車 | Ruby the Little Race Car（PROPOSED，OD-1） | 角色名，未定案 |
| 5 | 賽車 | race car | |
| 6 | 安安救護車 | Andy the Ambulance（PROPOSED，OD-1） | 角色名，未定案 |
| 7 | 救護車 | ambulance | |
| 8 | 黃色計程車 | Sunny the Taxi（PROPOSED）／the yellow taxi | 具名與否 Gate 1 定案 |
| 9 | 計程車 | taxi | 不用 cab |
| 10 | 挖土機（東東） | excavator／Dongdong（PROPOSED） | 本集僅旁白帶過 |
| 11 | 警車 | police car | 本集不具名 |
| 12 | 早安音樂 | good-morning music | 固定搭配，不用 morning song 輪替 |
| 13 | 音樂喇叭（鈴鈴的喚醒喇叭） | music speaker | 指車頂喚醒喇叭；與 #14 一起在 Gate 1 確認 |
| 14 | 喇叭（壞掉的發聲裝置，字幕語境） | speaker（優先） | 英文統一 speaker，避免和 horn（按喇叭）混淆 |
| 15 | 守信用 | keep your promise | 核心詞，動詞片語固定 |
| 16 | 答應／承諾（動詞） | promise | "I promise." 為核心句 |
| 17 | 說到做到 | do what you promised | 結尾寓意句固定 |
| 18 | 起床 | wake up | 核心動詞，全集統一 |
| 19 | 叫（某人）起床 | wake (someone) up | |
| 20 | 準時 | on time | |
| 21 | 遲到 | be late | 只用在「怕大家遲到」的假設語境，不得改成真的有人遲到 |
| 22 | 廣場 | the square | 故事地點 |
| 23 | 車庫 | garage | |
| 24 | 維修廠 | repair shop | 不用 factory |
| 25 | 修理 | fix | 動詞；repair 可作名詞場域名 |
| 26 | 壞掉 | broken | "My speaker is broken." |
| 27 | 進水／被雨淋濕 | wet／got wet | 診斷句："It just got wet." |
| 28 | 大雨 | heavy rain／big rain（幼兒優先 big rain，Gate 1 二選一鎖定，OD-3） | 不用 storm |
| 29 | 雨刷 | wipers | 叫醒安安的關鍵道具 |
| 30 | 車燈 | headlights | 叫醒小紅的關鍵道具 |
| 31 | 一閃一閃 | flash, flash | 擬聲／動作重複，見 §6 |
| 32 | 雨刷刷刷聲 | swish, swish | 固定擬聲 |
| 33 | 急救箱 | first-aid kit | 安安的標誌道具 |
| 34 | 早餐 | breakfast | |
| 35 | 出任務 | go to work（幼兒版，OD-3） | 不得譯成 mission |
| 36 | 相信／信任 | trust | 結尾示例："Friends trust Lingling." 角色名隨 OD-1 定案後替換 |
| 37 | 朋友 | friends | |
| 38 | 謝謝你 | Thank you! | 黃色計程車關鍵句功能 |

### 5.2 通用車車詞（擴充集數沿用，Starter）

| # | 中文 | 固定英文 | 註記 |
|---:|---|---|---|
| 39 | 挖土機 | excavator | |
| 40 | 吊車 | crane truck | 對應吊車阿公車種 |
| 41 | 消防車 | fire truck | 全站統一，不混用 fire engine |
| 42 | 巴士／小巴士 | bus／minibus | 藍色小巴士為 minibus |
| 43 | 卡車 | truck | |
| 44 | 怪獸卡車 | monster truck | EP8 擴充用 |
| 45 | 無人機 | drone | EP2 擴充用 |
| 46 | 電動車 | electric car | EP1 擴充用 |
| 47 | 高鐵 | high-speed train | EP7 擴充用。如需指涉 THSR 另案處理 |
| 48 | 捷運 | metro train | EP7 擴充用 |
| 49 | 露營車 | camper van | |
| 50 | 餐車 | food truck | |
| 51 | 水泥車 | cement mixer | |
| 52 | 三輪車 | tricycle | |
| 53 | 摩天輪 | Ferris wheel | |
| 54 | 紅綠燈 | traffic light | |
| 55 | 輪子／輪胎 | wheel | 幼兒版統一 wheel；tire 僅大人向註解 |
| 56 | 方向盤 | steering wheel | |
| 57 | 引擎 | engine | |
| 58 | 充電 | charge | 無人機／電動車集用 |
| 59 | 加油（燃料） | get gas | 鼓勵語另用 You can do it! |
| 60 | 馬路／道路 | road | |
| 61 | 橋 | bridge | |
| 62 | 公園 | park | |
| 63 | 學校 | school | |
| 64 | 醫院 | hospital | |
| 65 | 早上／晚上 | morning／night | 時間詞全站統一 |
| 66 | 今天／明天 | today／tomorrow | |
| 67 | 睡覺 | sleep／go to sleep | |
| 68 | 夢 | dream | |
| 69 | 開心 | happy | 情緒詞入門組 |
| 70 | 難過 | sad | |
| 71 | 害怕 | scared | |
| 72 | 勇敢 | brave | |
| 73 | 累 | tired | |
| 74 | 慢慢來 | slow down／take your time | 依語境二選一，單集內不混用 |
| 75 | 小心 | be careful | |
| 76 | 幫忙 | help | 核心動詞 |
| 77 | 一起 | together | 核心詞 |
| 78 | 輪流 | take turns | 好習慣類集數用 |
| 79 | 排隊 | line up | |
| 80 | 再試一次 | try again | 鼓勵句固定 |

本表共 80 條（本集核心 38 條＋通用 42 條）。PROPOSED 項目未定案。其餘為建議固定譯法，仍須 Gate 1 一次核准後才正式 locked。

---

## 6. English Level Rules（英文程度規則，3–7 歲／CEFR Pre-A1–A1）

1. **句長：** 每句以 **3–8 個英文單字**為原則，上限 10 字。一句只放一個訊息（一個動作或一個感受）。旁白句可略長，不得超過 12 字，且須可自然斷句。
2. **時態與句型：** 以現在簡單式與祈使句為主（"Lingling drives to the square." / "Time to wake up!"）。過去式只在必要敘事處少量使用，且同一事件不得時態跳來跳去。角色顯示名隨 OD-1；此處 Lingling 只是句型例子。
3. **詞彙：** 限 Pre-A1–A1 高頻詞＋本表 Glossary 車車詞。每場景（scene）新詞**最多 2 個**，新詞必須在同一場景內以動作／情境重複出現至少 2 次。超出者必須在 JSON 的 `vocab_flagged` 標記，交 Gate 1 裁決。
4. **重複設計：** 核心句型每集至少重複 3 次（EP4 建議："Time to wake up!"、"I promised. So I came."、擬聲 "Flash, flash!"／"Swish, swish!"）。重複必須有情境變化（對象不同）。
5. **擬聲字（onomatopoeia）：** 只用幼兒英語常見且可跟讀者：`flash, flash`（車燈）、`swish, swish`（雨刷）、`beep, beep`、`vroom`、`ding-ding`（音樂鈴提示）。每場最多 2 組擬聲。擬聲不得取代關鍵劇情資訊。
6. **問答互動：** 每集可設 2–3 個停頓提問（"Can you say…?"／"Where is Lingling going?"），提問後在腳本標記 `pause_ms` 留白。後續劇情必須在孩子不回答時仍然聽得懂。
7. **數字／顏色／身體等教學詞**只能順帶出現。EP4 不新增顏色課或數字課。
8. **文化與用詞：** 使用中性、國際可懂的幼兒英語。避免俚語、縮讀連讀寫法（gonna/wanna）、雙關、反諷。專名依 Glossary 的當下提案或已鎖定版本。
9. **寓意句：** 結尾寓意最多 2 句短句，例如 "A promise is important. Do what you promised."
10. **總量目標（估計，非硬性秒數）：** EP4 英文版目標約 550–750 個英文單字、旁白＋對白合計約 4–6 分鐘語音（以慢速幼兒語速估計）。不追求與中文版 260.9 秒等長。

---

## 7. Full LLM Prompt（可直接貼上使用）

使用方式：把下方 prompt 全文貼給模型，並在 `{{EPISODE_PACK_JSON}}` 位置附上 EP4 的 episode pack（`data/stories.ts` 中 ep-4 條目、`data/subtitles/ep-4.json`、`data/scenes/ep-4.json`、`data/characters.json` 中相關角色，加上本規格的 locked beats、facts 與 Glossary）。**本 prompt 只產出腳本 JSON 與審稿清單，不產音訊。** 產出後必須走 Gate 1，不得直接進 TTS。

v1.1 相對 v1 的 prompt 差異只有兩處：每行新增 `tts_text`；並寫明 PROPOSED 名字與 speaker id 仍未鎖定（見 OD-1）。

```text
You are an English re-creator of Mandarin children's audio stories for ages 3-7.
You are NOT a translator. Read the full Mandarin episode pack first, understand the
locked story beats and facts, then independently re-create the story in simple
English (CEFR Pre-A1-A1) for young children. Do not translate sentence by sentence.
Do not copy the Mandarin sentence order.

[EPISODE PACK]
{{EPISODE_PACK_JSON}}
(The pack contains: story metadata, full Mandarin subtitles with timestamps,
scene list with characters, and character canon. Subtitles have NO speaker labels;
infer speakers from context and the scene character lists, and mark uncertain
speaker assignments in facts_checked.notes.)

[LOCKED RULES]
- Keep every locked story beat, its cause-and-effect, and its order. Do not add,
  remove, merge, or reorder beats. Do not invent new conflicts, villains,
  accidents, punishments, or morals.
- Facts that must not change and forbidden changes are listed in the pack/spec.
  If the pack and your idea conflict, the pack wins.
- Use ONLY the fixed English names and glossary terms provided in the pack/spec.
  Names marked PROPOSED are NOT locked. Copy them exactly as given; do not invent
  variants (do not switch Ruby/Andy/Sunny to another English name on your own).
  Speaker ids in this schema (ruby, andy, sunny, and the others) are provisional
  labels until a human locks them. Do not rename the ids.
- Sentence length: 3-8 words per line (hard max 10; narrator lines max 12 and
  must split naturally). One idea per line. Present simple and imperatives are
  preferred. No slang (no gonna/wanna), no puns, no irony.
- Repeat each core pattern at least 3 times across the episode with changing
  context. Max 2 new vocabulary words per scene; repeat each new word at least
  twice in the same scene. Flag every word above Pre-A1-A1 in vocab_flagged.
- Onomatopoeia allowed only from: flash flash, swish swish, beep beep, vroom,
  ding-ding. Max 2 per scene. Never let sound effects replace story information.
- Do NOT write singing. Any musical moment must be written as a short spoken
  chant (rhythmic spoken lines), marked emotion "chant".
- Speakers allowed only from the pack's speaker list. Do not create new named
  characters. Unnamed functional roles in the original (e.g. repair-shop uncle)
  keep their original functional status.
- The ending moral is the single moral from the pack, in at most 2 short lines.
- tts_text is a pronunciation override for a speech engine. The spelling a child
  sees or a reviewer reads stays in text. If no override is needed, tts_text is
  an empty string. Do not put different story words in tts_text.

[OUTPUT — TWO PARTS, IN THIS ORDER]
PART 1 (human-readable, for review): A beat/fact checklist.
  - List each locked beat ID, one line per beat: "B1 OK - <where it appears in
    your script: scene/line numbers>" or "B1 MISSING - <reason>".
  - List each must-not-change fact: "F1 OK" or "F1 VIOLATED - <detail>".
  - List every PROPOSED name/glossary item you used, exactly as spelled, and
    label each one PROPOSED / NOT LOCKED.
  - List every uncertain speaker assignment and why.

PART 2 (machine-readable): ONE JSON object, no markdown fences, no commentary,
matching this schema exactly:

{
  "slug": "ep-4",
  "title_en": "string, proposed English title, max 8 words",
  "summary_en": "string, 1-2 short sentences for the website, Pre-A1-A1 friendly for parents to read",
  "summary_zh_review": "string, Traditional Chinese summary FOR HUMAN REVIEW ONLY, faithfully describing what your English script actually says (not the original), so a Mandarin-speaking reviewer can approve without reading every English line",
  "locked_beats": [
    { "beat_id": "B1", "covered": true, "line_refs": ["S1L1", "S1L2"], "note": "string, empty if none" }
  ],
  "facts_checked": [
    { "fact_id": "F1", "ok": true, "note": "string, empty if none" }
  ],
  "scenes": [
    {
      "scene_index": 1,
      "scene_summary_en": "string, max 10 words",
      "lines": [
        {
          "line_id": "S1L1",
          "speaker": "narrator | lingling | ruby | andy | sunny | mr_fix | bonbon",
          "text": "string, one line, the listener-facing spelling",
          "tts_text": "string, pronunciation override only; empty string when it matches text. Example: text Lingling, tts_text Ling-ling",
          "emotion": "warm | happy | worried | sleepy | proud | gentle | chant | neutral",
          "sfx": "none | morning_music | rain | headlight_flash | wipers | repair_shop | speaker_fixed",
          "pause_ms": 0
        }
      ]
    }
  ],
  "vocab_flagged": [
    { "word": "string", "line_ref": "S1L1", "reason": "above Pre-A1-A1 | new_in_this_scene | glossary_exception_request" }
  ]
}

Scene count and order must follow the pack's scene list. Every locked beat must
appear in locked_beats with covered=true; if you cannot cover a beat, still emit
the JSON, set covered=false, and explain in note — never silently drop it.
If any instruction in this prompt conflicts with the pack's locked beats/facts,
follow the pack and report the conflict in facts_checked.notes.
```

Schema 欄位說明（給審稿者）：

- `slug`：固定 `ep-4`（pilot）。
- `title_en`：英文標題提案。v1 示例方向是 "Lingling Keeps Her Promise"。此為提案示例，未定案，仍須 Gate 1 核准（OD-3）。
- `summary_en`：網站英文簡介。`summary_zh_review` 只供華語審稿者核對英文腳本實際內容，不得直接拿中文原摘要複製貼上。
- `locked_beats`／`facts_checked`：與 Part 1 清單互相對照。兩者不一致即 Gate 1 退件。
- `scenes[].lines[]`：每行一個 speaker、一句英文、`tts_text`、`emotion`、`sfx`、`pause_ms`。提問或擬聲後留白建議 600–1200 ms，一般句間 250–500 ms，由混音階段再微調。
- `tts_text`：v1.1 新增。給 TTS 的發音覆寫。網站字幕與審稿閱讀以 `text` 為準。不需要覆寫時給空字串 `""`。不得在這欄改劇情用字或偷偷改已顯示的專名拼法。
- `speaker` 列舉值是暫用標籤（OD-1）。`ruby`／`andy`／`sunny` 不代表英文名已定案。
- `vocab_flagged`：超綱詞主動申報。空白不代表沒有超綱，Gate 1 仍須抽查。

---

## 8. TTS Plan（語音生成計畫 — 本階段不執行、不花錢）

> 本節是計畫，不是授權。任何付費生成前，須 Gate 1 通過，且 Kaiyi 另行確認預算與供應商條款（見 WORKFLOW 的花費停點）。

1. **供應商與聲線：** ElevenLabs 固定 voice（fixed voices）。腳本 JSON 的每個 speaker 綁定一個 voice ID。本規格階段只寫 placeholder，例如 `EL_VOICE_NARRATOR_TBD`、`EL_VOICE_LINGLING_TBD`、`EL_VOICE_RUBY_TBD`、`EL_VOICE_ANDY_TBD`、`EL_VOICE_MRFIX_TBD`。不得在 spec 階段填入或猜測真實 voice ID，不得購買或生成。placeholder 名稱沿用暫用 speaker id；英文名若在 OD-1 改掉，placeholder 名稱跟著改，仍不得填真實 ID。
2. **生成單位：** 逐行（per-line）生成。檔名建議 `ep-4_en/S{scene}L{line}_{speaker}_take{n}.wav`（或供應商原生格式）。這個目錄是提案，落地位置見 OD-2。保留 line_id 對照。禁止一次生成整集長音檔後再切。
3. **Takes：** 每行生成 **2–3 takes**，人工挑選。挑選標準依序為：發音正確＞角色辨識度＞情緒自然＞語速。被選 take 寫入清單（含 voice ID、model、settings、日期）。未選 takes 保留至 Gate 2 通過後再依儲存政策處理。
4. **Model／Settings Lock：** pilot 一旦選定 ElevenLabs model 與參數（如 stability／similarity／style、語速），整集鎖定並記錄於生成清單。中途不得默默換 model 或參數。確切 model 名稱與參數值在 TTS 執行前依當時供應商文件與帳戶方案確認。本 spec 不預先寫死未驗證的型號。
5. **唱歌改 chant：** 原集早安音樂屬旋律性內容時，英文版不唱歌，改為節奏朗誦 chant，`emotion: "chant"`。旋律本身若重用原音樂，依 §9 權利限制處理。
6. **發音詞典與 `tts_text`：** `Lingling`、`CheChe` 等專名（以 OD-1 定案拼法為準）在生成前先做發音測試行並記錄讀法。若 TTS 讀錯，把發音覆寫寫進該行的 `tts_text`（例如 `text` 維持 `Lingling`，`tts_text` 為 `Ling-ling`）。顯示文本留在 `text`。v1.1 已把此欄放進 §7 schema，進 TTS 前不再口頭補欄。
7. **禁止事項：** 不克隆真實兒童聲、不克隆未同意的成人聲、不使用來源不明的 voice marketplace 聲線冒充固定角色聲。供應商條款（商用權、兒童內容、資料保留）須在付費前逐項確認並留存紀錄。

---

## 9. Mixing / Publishing Plan（混音與發布計畫）

### 9.1 混音

- **音樂／SFX 重用原則：** 只重用原站有權使用的原始音樂與音效資產，且僅在原站站內英文版使用。權利不確定者不得重用，改用無版權疑慮的替代音效並記錄來源。不得把原中文人聲（含 Bonbon／馬米原聲）剪入英文版。
- **結構：** 以英文逐行錄音為主幹，依腳本 `sfx` 欄位鋪音樂／音效，句間停頓依 `pause_ms` 再人工微調。整體響度與中文版網站播放體驗保持相近等級。確切 LUFS／peak 數值在實作時依原站既有音檔規格量測後對齊，本 spec 不憑空訂數值。
- **長度：** 不與中文版等長對齊。以孩子能跟上為準，預估 4–6 分鐘（估計值）。
- **QC：** 逐場對照 scenes。音樂不得蓋過人聲關鍵詞。擬聲段不得與旁白重疊到聽不清。結尾寓意句前留明顯停頓。

### 9.2 檔案與資料

v1 提案與 repo 慣例的差異在 **OD-2**。這裡只重複約束：

- 英文音檔不得覆蓋 `public/stories/ep-4/audio.mp3`。
- 英文資料不得假裝已經存在於 `data/en/ep-4.json`。欄位定版屬實作階段。
- 真正改 `data/`、`public/`、播放器之前，須另案實作，並通過 Gate 2。本規格不授權改 repo。

### 9.3 前端呈現（計畫）

- 播放器增加語言切換：**「中文原版 | English (AI)」**（toggle 文案提案，未定案，OD-3）。
- 英文模式下：播放英文音檔、字幕／場景文案顯示英文腳本定案的 `text`（顯示拼法，不用 `tts_text`）。插圖沿用原站站內既有頁面。
- **AI 標示文案（提案，未定案，須 Gate 1 核准）：**
  - 英文：`English (AI) — retold in simple English`。展開說明：`This English version was re-created with AI voices for young listeners. It retells the same story in simple words. It is not a word-for-word translation.`
  - 中文：`英文版（AI 配音）— 以簡單英文重新說這個故事，不是逐字翻譯。`
  - 標示位置：toggle 旁與播放器可見處。
- **No RSS：** 英文音檔不得加入 `app/feed.xml`／`lib/feed.ts` 的 RSS 輸出，不得送 Podcast 平台，不得產生英文版 podcast enclosure。網站 sitemap／SEO 如何處理英文資料頁，屬實作階段另案，預設不新增可被 podcast 平台抓取的 feed 項目。實作時要特別檢查 `story.audio`：feed 目前只包這一個檔名（見 OD-2）。
- 未通過 Gate 2 前，英文 toggle 不得對公開使用者顯示（可用 staging／preview 驗證）。
- 以後若做得到孩子看得到的畫面，驗收走 [VISUAL-ACCEPTANCE.md](../VISUAL-ACCEPTANCE.md)。本規格階段沒有畫面改動。

---

## 10. Two Human Gates（兩道人工關卡）

表單：[templates/gate-1-script-review.md](./templates/gate-1-script-review.md)、[templates/gate-2-listening-review.md](./templates/gate-2-listening-review.md)。

### Gate 1 — Script Approval（腳本核准，進 TTS 之前）

審稿者：至少 1 名熟悉原作的華語審稿者＋1 名英語（幼兒教育或兒童英語）審稿者。同一人不得自產自核。

Checklist（全數打勾才可進 TTS）：

- [ ] LLM Part 1 清單與 Part 2 JSON 的 `locked_beats`／`facts_checked` 一致，無 beat 遺漏或被默默合併。
- [ ] B1–B15 全數 covered。§3.1 的 F 清單無 violated。故障原因、叫醒順序、診斷結果、寓意逐項對回中文來源時間戳。
- [ ] `summary_zh_review` 描述的是英文腳本實際內容，且與英文逐場抽查相符（至少抽查 3 場逐句對照）。
- [ ] OD-1 的英文名／站名已逐項定案或退回（鈴鈴拼法、小紅是否用 Ruby 或拼音、安安是否用 Andy 或 An-An、CheChe Playground、維修廠稱呼、speaker id 是否改對 `characters.ts`）。定案結果寫回 Glossary locked 版。
- [ ] 每行都有 `tts_text`（可為空字串）。`text` 與 `tts_text` 沒有偷改劇情。顯示拼法在 `text`。
- [ ] 句長、時態、新詞密度符合 §6。`vocab_flagged` 每項已裁決（保留／換詞／刪除）。
- [ ] Speaker 分配合理。旁白轉述與角色對話的切換自然。不確定 speaker 已逐項確認。警車未被擅自具名為亮亮。維修廠叔叔未被新增 canon 背景。
- [ ] 無 §3.2 禁止改動：無新增衝突、無逐字翻譯句序、無俚語／雙關／品牌梗。
- [ ] AI 標示文案與 toggle 文案已核准。
- [ ] 結果記錄：通過／退回修改／否決，並留下審稿者、日期、版本（script 版號）。

Gate 1 通過之後、任何付費 TTS（含少量發音測試）之前，還要 Kaiyi 的花費核准。見 WORKFLOW。

### Gate 2 — Listen-Through + Blind Listen（聽畢核准，發布之前）

前半：內部完整聽畢（至少 1 名未參與挑 take 的人）。

- [ ] 全集無錯字讀音、專名讀法一致。無爆音、斷句、音樂蓋字。
- [ ] 角色一聽可辨：鈴鈴／小紅／安安／旁白不混淆。著急、感動、開心等情緒不過度表演、不驚嚇幼兒。
- [ ] Chant 段是朗誦，不是走音唱歌。擬聲與旁白不互相遮蓋。寓意句清楚、停頓足夠。
- [ ] 與網站 staging 播放器實測：toggle 切換、字幕同步、英文音檔載入均正常，且 RSS feed 檢查無英文 enclosure。此項要等另案實作 PR；實作完成前，Gate 2 的網站項維持未測，不得當成已通過。

後半：盲聽（Blind Listen）。通過標準如下，不得放寬後事後宣稱通過。

- 對象：**2–3 名英語環境兒童（3–7 歲）**。未先看過中文版劇情說明、不被家長提示答案。須取得家長同意。只記錄匿名結果（年齡段、答案摘要），不錄存可識別兒童聲音作其他用途。怎麼找到這些孩子見 WORKFLOW，本規格不指定管道。
- 播放：只播英文版音訊（可看原站插圖，如同網站體驗），不給字幕提示答案。
- 四個理解問題（英文問，或依孩子語言習慣問，記錄原答）。題幹裡的角色名在 OD-1 定案後改成鎖定拼法；定案前用審定腳本裡的拼法，預期答案一起改。下面用 v1 提案拼法當占位：
  1. Who wakes everyone up in the morning?（預期：鈴鈴的定案英文名／the street sweeper）
  2. What broke? Why?（預期：her speaker／music speaker；it got wet in the rain）
  3. How did Lingling wake her friends up?（預期：flashing lights + wipers。答出其一，另一個經一次提示後也能說出，記為部分通過。句中 Lingling 在 OD-1 定案後改成鎖定拼法）
  4. Why do her friends trust her?（預期：she keeps her promise／she came anyway）
- **角色區分測驗：** 隨機重播 3 句不同角色台詞，問 “Who is talking?”。每名孩子至少答對 2/3。全組不得出現同一組角色被系統性混淆。
- **通過標準：** 每名孩子 Q1、Q4 必須答對（抓到主角與寓意）。Q2、Q3 至少答對一題，且另一題經一次提示後能理解。角色區分達上述標準。家長回報注意力完全無法維持，視為未通過訊號，須記錄。
- 未達標處置：回到對應環節修正（劇本太難 → 退 Gate 1 改稿；聲線太像 → 換固定聲線或拉開表演差異；混音遮字 → 重混）。不得只靠家長翻譯給孩子聽來宣稱通過。

---

## 11. Cost / Time Estimate（成本與時間估計）

> 以下皆為 **planning estimates（估計）**，不是報價、不是已查證的供應商牌價。ElevenLabs 或其他供應商的實際計價、字元計算方式與方案限制，必須在 Gate 1 通過、Kaiyi 核准付費前，以當時官方方案頁與帳戶試算為準。

| 項目 | 估計（每集，EP4 規模） | 依據／假設 |
|---|---|---|
| 英文腳本文案量 | 約 550–750 個英文單字；TTS 字元數粗估約 3,500–5,000 字元（估計） | 幼兒慢速語速＋4–6 分鐘目標長度推估。實際以定案 JSON 逐行字元加總為準。`tts_text` 若不同於 `text`，計價以實際送進 TTS 的字串為準 |
| TTS 生成量（含 takes） | 定案字元數 × 2–3 takes，粗估約 7,000–15,000 生成字元（估計） | §8 per-line 2–3 takes。重錄率未計，須預留緩衝 |
| TTS 費用 | **付費前查價，spec 階段不寫死金額**。預算表只留「單集 TTS 估計區間」欄位待填 | 供應商計價可能以字元／點數／訂閱方案計 |
| LLM 改稿 | 1 次主生成＋預估 1–2 輪修改（估計） | 含 Part 1 清單與 JSON。人工審稿時間另計 |
| 人工時間 | Gate 1 審稿約 1–2 小時、挑 take 約 1–2 小時、混音 QC 約 1–3 小時（均為估計，單集） | 以 EP4 124 句中文、14 場景的規模推估。首集另加一次性建置時間 |
| 盲聽安排 | 2–3 名兒童各約 15–25 分鐘（估計，含家長說明） | 須家長同意與排程。招募是關鍵路徑，見 WORKFLOW |
| 一次性成本 | Prompt／schema 定版、Glossary locked、voice 綁定與發音詞典、前端 toggle 與英文資料路徑設計 | 只發生在 pilot。路徑設計含 OD-2 |

省錢紀律：Gate 1 未過不進 TTS。花費未核准不進 TTS。先以少量行數做 voice 發音測試（仍屬付費生成，須另行核准）再全集生成。

---

## 12. Decision Rules（決策規則，通過後才擴充）

1. **Script + Voice + Blind Listen 全數通過 → 才討論擴充 3 集。** 依同流程再做 3 集。候選順序建議 EP8 → EP5 → EP3，此為建議，未定案（OD-3）。選集時重跑 §1 的量化驗證。Glossary 與聲線表沿用 locked 版。
2. **Script 過關、Voice 被判定失敗 → 才進入馬米聲音方案的評估。** 即 §4.3 Phase 2。須馬米本人明確同意後，才評估以馬米聲音（克隆或本人錄製，另案定義）重做旁白主線。兒童角色仍不得克隆真實兒童。在同意與另案核准前，不得先行錄製或克隆。
3. **Drift Fail Twice → 停止。** 若同一集或連續兩集出現事實漂移（locked beats／facts 被改動、寓意被換、順序被調），且退回修改後第二次仍漂移，停止本英文重創作路線。不擴充、不上線，並保留審稿紀錄。
4. **盲聽未達標：** 先按 Gate 2 處置修正並重測一次。重測仍未達標，視同 pilot 未通過。不得以降低標準方式發布。
5. **任何一關否決：** 英文版不上線、不進 RSS、不對外宣稱已推出。中文原版不受影響。

---

## 13. Risks and Mitigations（風險與緩解）

| 風險 | 說明 | 緩解 |
|---|---|---|
| 事實漂移（drift） | 模型重創作時改掉因果、順序或寓意 | Locked beats＋facts 清單雙重對照（Part 1 vs JSON）。Gate 1 逐項打勾。漂移兩次即停（§12） |
| 逐字翻譯腔 | 英文變成中文句序直譯，孩子聽不懂 | Prompt 要求獨立重寫。句長與 Pre-A1–A1 規則。英語審稿者把關 |
| 英文名拆品牌或性別讀感不合 | Ruby／Andy 與中文名、既有場景英文、`characters.ts` id 不一致；Andy 的男孩名讀感和 canon 未寫明的性別對不上 | OD-1 維持未定案。Gate 1 逐項鎖定後才進 TTS。speaker id 與顯示名一起決定 |
| 兒童聲音倫理 | 誤用或克隆真實兒童（Bonbon）聲音 | 全面禁止兒童聲克隆。Bonbon pilot 以旁白代述。成人聲克隆僅 Phase 2 且須本人同意、可撤回 |
| 角色混淆 | 合成聲線太像，孩子分不清誰說話 | 固定聲線綁定、表演差異設計。Gate 2 角色區分測驗為硬門檻 |
| 專名讀錯 | TTS 把定案專名讀錯或每 take 不一致 | 發音測試行＋`tts_text`。定案讀法寫入發音詞典。顯示拼法留在 `text` |
| 供應商鎖定與計價變動 | ElevenLabs 方案、條款、聲線可用性變動 | Settings/model lock 留紀錄。付費前重查條款與價格。保留逐行音檔與生成清單 |
| 音樂／SFX 權利不清 | 原音樂或音效未必可延伸用於英文版 | 只重用權利確定者。不確定改用無疑慮替代並記錄來源。中文原人聲不剪入 |
| 插圖外流 | 把 repo 插圖複製到外部服務／網站 | 禁止外拷。英文版僅在原站站內沿用既有頁面資產 |
| RSS 誤入 | 英文音檔被 feed 抓取或誤上 Podcast 平台 | 發布檢查含 feed 驗證。英文檔不得寫進 `story.audio`（OD-2）。Gate 2 checklist 明列 |
| 路徑與側車慣例不合 | `data/en/ep-4.json` 不是現有資料夾形狀 | OD-2。實作 PR 另案，本規格不建檔 |
| 家長誤解「英文版＝原版翻譯」 | 期待逐字對應，認為改寫是錯誤 | AI 標示寫明 retold in simple English／不是逐字翻譯。`summary_zh_review` 只供內部審稿 |
| 孩子聽不懂但被宣稱成功 | 盲聽標準被放寬或家長代答 | 四問與通過標準寫在 Gate 2。記錄原答 |
| 盲聽找不到孩子 | 2–3 名英語環境兒童是關鍵路徑，也是最難排的一步 | WORKFLOW 列出做法且不預選。排不到人就停在 Gate 2 前半，不宣稱通過 |
| 資產不完整（擴充時） | 部分集數缺 scenes 檔、字幕無 speaker | 選集前重跑量化驗證。缺 scenes 先補切分。speaker 不確定項在 Gate 1 逐項裁決 |
| 時間軸誤差 | scenes 253 秒 vs 音檔 260.9 秒 | 本 spec 已記錄 EP4 差異。英文版不逐秒對齊中文，只對照 beats 與場景順序 |

---

## 14. 本階段交付與未做事項（Boundary）

v1 已完成、v1.1 保留的規格內容：

- [x] 以實際 repo 資產驗證 pilot 選集（EP4），含時長、字幕字元、場景與角色證據。
- [x] EP4 episode pack 摘要、14 場景、B1–B15。
- [x] Facts、禁止改動、角色 canon、Glossary（80 條）、英文程度規則、LLM prompt、TTS／混音／發布計畫、Gate 1／Gate 2、成本時間估計、決策規則與風險表。

v1.1 在文件內完成的修訂：

- [x] JSON schema 每行新增 `tts_text`。
- [x] 英文名列為未定案，並引用 repo canon（含安安／Andy、小紅／Ruby）。
- [x] 提案路徑對過 `public/stories/<slug>/audio.mp3`、`data/stories.ts`、`data/subtitles/`、`data/scenes/`、`lib/feed.ts`。
- [x] 變更紀錄。

仍未做（不在本檔核准範圍）：

- [ ] 未生成任何英文腳本成稿，未生成任何英文音訊，未呼叫任何付費 TTS，未填入真實 ElevenLabs voice ID。
- [ ] 未修改 `data/`、`public/`、播放器、RSS。未建立 `audio-en.mp3` 或 `data/en/ep-4.json`。
- [ ] 未複製任何插圖出 repo。未聯絡任何家庭做盲聽。

下一步見 [WORKFLOW.md](./WORKFLOW.md)。每一步的停點都要 Kaiyi 明確同意後才繼續。

---

## 15. 變更紀錄（v1 → v1.1）

| 版本 | 日期 | 內容 |
|---|---|---|
| v1 | 2026-10-17 | Kaiyi 的 spec_v1。證據 commit `31b88654445ee1f46a01c55eaa17a257adc8c8b2`。選定 EP4，鎖定 B1–B15 與十條事實，寫出角色、Glossary、prompt、TTS、混音、兩道關卡、估計與風險。狀態是規格，不是生產授權。JSON schema 有 `text`，沒有 `tts_text`；§8 寫明發音覆寫欄要在進 TTS 前補進 v1.1。英文名在 §4.2 標 PROPOSED。路徑寫成建議，並註明實作前要再對 repo。 |
| v1.1 | 2026-10-17 | 同一 `main` commit 上的文件修訂，仍不授權生產。(1) §7 每行新增 `tts_text`；空字串表示不覆寫；顯示拼法留在 `text`。§8.6 改為此欄已經在 schema。(2) 新增〈未定案〉OD-1：英文名不代決。引用 `data/characters.ts` id、場景裡已有的 Lingling／An An／An-An／Xiao Hong，以及小紅字幕「她」、安安字幕「他」不能單獨當性別鎖、Andy 的男孩名讀法。(3) OD-2：`audio-en.mp3` 與目錄慣例相容，但 `story.audio` 單檔會進 RSS；`data/en/ep-4.json` 不符合 `data/<種類>/<slug>.json`。兩者維持未定案，本 PR 不建檔。(4) Speaker 列舉 `ruby`／`andy`／`sunny` 標成暫用，是否改對 `xiao-hong`／`an-an`／`huang-ji-cheng` 等 Gate 1。(5) 索引與流程、關卡表另見同目錄，不改節拍與事實。 |
