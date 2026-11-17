# 《車車遊樂園》網站智慧財產風險盤點

盤點日期：2026-10-12  
範圍：本儲存庫（Next.js 網站，Vercel 上線）。  
性質：風險篩查，不是法律意見，也不構成侵權與否的認定。授權或來源無法從檔案、文件或公開頁面核對時，一律標為「不確定」。

## 結論

程式碼有 MIT 授權，節目內容已明文排除在外；字型在儲存庫內附有 SIL OFL；站上有 `/legal`。依賴樹裡沒有 GPL 或 AGPL。字幕抽查沒有看到整段搬來的知名兒歌歌詞。收聽平台是連出去的連結，沒有內嵌 YouTube 或 Spotify 播放器。

最需要先處理的是遊戲「方塊轉轉」。它的背景音樂第一句與周知的《俄羅斯方塊》主題相同，七種方塊的形狀與顏色對應也沿用該遊戲的慣例，並有下落影子與 10 欄井面。這是本次唯一標為**高**的項目。

其次是平台商標的實際用法，以及法律頁的描述彼此對不上；家長地圖直接向 OpenStreetMap 官方圖磚伺服器要圖。角色方面，小紅賽車、小橘高鐵、金龜車與「101」有殘餘近似或指名風險，生圖流程已用負向提示刻意避開閃電麥坤，但本次不能單憑文字設定書宣告「已經不近似」。

下面「已對上證據的項目」與「需要權利人確認的項目」分開列。建議只是建議。

## 這次實際查了什麼

- 授權與聲明：`LICENSE`、`DISCLAIMER.md`、`THIRD_PARTY_NOTICES.md`、`app/legal/page.tsx`、`app/fonts/OFL-*.txt`、`public/brand/SOURCES.md`。
- 圖像抽樣（沒有逐張看完約 1,447 張故事圖）：`public/characters/` 36 張定裝照中的小紅賽車、噗噗豬、小紅豆金龜車、小橘高鐵、恐龍車多多、吉祥物 `public/mascot.png`、第 20 集封面 `public/stories/ep-20/01.webp`、遊戲封面 `public/games/v2/block-drop/cover.webp` 與 `public/games/v2/candy-match/cover.webp`。
- 生圖提示：`scripts/lib/illustrate-core.ts`、`scripts/lib/character-sheet.ts`、`scripts/generate-roamer-assets.ts`、`data/scenes/`、`data/characters.json`。
- 音訊：33 集 `public/stories/ep-*/audio.mp3` 的檔案清單與字幕文字；遊戲音效是程式合成（`lib/gamekit/runtime/`）。沒有逐集聽完音檔。
- 商標與第三方名稱：字幕、場景摘要、家長文章、SEO／Open Graph（`app/layout.tsx`）、平台連結（`lib/platforms.ts`、`lib/social.ts`、`lib/connect-icons.tsx`）。
- 依賴：`package-lock.json` 的 `license` 欄位統計。
- 地圖：`components/for-parents/PlayMapLeaflet.tsx`。
- 抽查 git 歷史：平台標誌引入於 `cfe7b27e`（2026-06-10）、圓形圖示改寫於 `b9a3b43f`（2026-06-10）；方塊旋律出現於 `460f23c4`（2026-06-25）。

## 已對上證據的項目

### 1. 方塊轉轉的旋律與方塊表現方式對上《俄羅斯方塊》

- 風險：高
- 路徑：
  - `lib/gamekit/runtime/chiptune-bgm.ts`（`block-drop` 主題）
  - `lib/games/block-drop/pieces.ts`（I O T S Z J L 七種四連方塊、`ghostY` 下落影子）
  - `components/games/blockDropTheme.ts`（`COLS = 10`；`CLAY_BLOCK_COLORS`）
  - `public/games/v2/block-drop/cover.webp`（封面是自有黏土風格，與井內方塊不是同一套畫法）
- 證據：
  - 檔案註解寫「Phase 3 佔位，日後可換 BeepBox 匯出」。旋律於 2026-06-25 的 Game Kit 重構進入現檔。
  - `block-drop` 第一句音高為 `E5 B4 C5 D5 C5 B4 A4 A4 C5 E5 D5 C5 B4 B4 C5 D5`。這與周知的《俄羅斯方塊》主題開頭一致。該主題是俄國民謠〈Korobeiniki〉的電玩編曲。民謠本體在許多法域可能已屬公有領域；1989 年前後的具體電玩編曲是否仍受保護，本次不確定。
  - 方塊顏色對應為：I 青 `#8ddff0`、O 黃 `#ffe16f`、T 紫 `#c9b4ff`、S 綠 `#9de7b8`、Z 粉紅 `#ff9fb7`、J 藍 `#9dbbff`、L 橙 `#ffc28a`。形狀與色相的對應方式與《俄羅斯方塊》的慣例相同。井寬 10 欄；`pieces.ts` 註明自由堆疊為 10×20。有下落影子。
  - 方塊上另有圓、方、三角等內嵌符號，封面也是黏土車車，遊戲名稱是「方塊轉轉」，沒有使用 Tetris 這個字。這些差異沒有拿掉旋律與形狀配色這兩項。
  - 同檔的 `candy-match` 與 `dino-sushi` 旋律是較單純的分解和弦，本次沒有對上特定知名曲子。
- 建議：換掉 `block-drop` 的旋律與低音，不要再使用這段音高序列。方塊顏色改成與上述 I／O／T／S／Z／J／L 慣例不同的對應，或改用本站已有的內嵌符號當主要辨識、壓低「形狀即顏色」的讀法。保留黏土封面。上線前用耳朵確認新旋律。

### 2. 平台標誌：法律頁、備存檔與畫面上的圖示不是同一套

- 風險：中
- 路徑：
  - 畫面圖示：`lib/connect-icons.tsx`、`lib/platforms.ts`、`lib/social.ts`
  - 法律頁：`app/legal/page.tsx`（第三方商標一節）
  - 備存檔：`public/brand/`（`SOURCES.md`、`spotify-icon-green.png`、`apple-podcasts-listen-badge-zh-hant.svg`、`youtube-icon.svg`、`youtube-logo.svg`、`kkbox-logo.svg`）
  - 聲明：`THIRD_PARTY_NOTICES.md`、`DISCLAIMER.md`
- 證據：
  - `public/brand/SOURCES.md` 寫明這些是歷史備存，站內圖示已改為 `lib/connect-icons.tsx` 的圓形 SVG。git：`cfe7b27e` 曾改為官方資產，同日 `b9a3b43f` 改為圓形圖示。
  - `/legal` 仍寫「收聽平台使用官方提供之徽章／標誌檔（見站內 `public/brand/`）」。與現況的畫面圖示不符。
  - `public/brand/` 在 `public/` 底下，部署後這些檔案仍可依網址取得，即使畫面沒有引用。
  - `youtube-icon.svg` 檔首註解寫明是從官方 `youtube-logo.svg` 裁出圖示區。這是對官方標誌的改作。
  - 畫面用的 Spotify 三弧線、YouTube 圓角播放鈕、Instagram 相機、Facebook「f」、Threads 標誌，都是可辨認的品牌圖形，而且是自行描繪的路徑，不是各平台下載的原檔。路徑是否抄自 Simple Icons 這類圖庫，本次不確定；即使上游是 CC0，商標仍屬各公司。
  - Apple 那顆圖示是麥克風／podcast 造型，路徑本身不是蘋果標誌。連結文字是「Apple Podcasts」，網址指向本節目的 Apple Podcasts 頁。官方徽章 SVG 留在 `public/brand/apple-podcasts-listen-badge-zh-hant.svg`，畫面沒有用它。
  - `kkbox-logo.svg` 與 Wikimedia Commons `File:KKBOX_logo.svg` 的說明相符（2026-10-12 核對該頁）。該頁使用「未達原創性門檻」模板，並同時標示商標。模板是上傳者主張，不是 KKBOX 的授權書，也不是法院認定。畫面用的 KKBOX 圖示是另一組自繪路徑，完整字標仍在 `public/brand/`。
- 建議：讓 `/legal` 的句子與實際圖示一致。若要使用官方徽章，改回各平台提供的原檔、不裁切、並連到該平台上的本節目頁，同時讀一次各平台現行品牌規範。若繼續用自繪圖示，避免可獨立辨認的標誌路徑，改以文字連結為主，並從網站可公開路徑移走 `public/brand/` 裡已裁切或未使用的標誌檔。KKBOX 字標在取得權利人同意前，不要當成可自由使用的素材。

### 3. 家長地圖使用 OpenStreetMap 官方圖磚伺服器

- 風險：中
- 路徑：`components/for-parents/PlayMapLeaflet.tsx`（`TileLayer` 的 `url` 為 `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`，attribution 含 `© OpenStreetMap contributors`）
- 證據：畫面上有著作權歸屬連結，這部分對上 ODbL 對地圖資料的署名要求。圖磚直接向 `tile.openstreetmap.org` 請求。OpenStreetMap 營運方的圖磚使用政策要求大量使用或把官方圖磚當成應用程式的地圖服務時，事先取得許可；官方圖磚伺服器不是公開的免費圖磚 CDN。本次沒有在儲存庫裡看到許可紀錄，也不確定營運者是否另有書面同意。
- 建議：若沒有 OSMF 的使用許可，改接自己的圖磚或允許這種用量的圖磚供應商，並保留資料與圖磚的署名。Leaflet 本身是 BSD-2-Clause，署名義務主要在散布軟體時保留著作權聲明，npm 套件已含授權；這與圖磚服務條款是兩件事。

### 4. 字型授權全文沒有放在公開網站上，Noto 也沒寫進法律頁

- 風險：低
- 路徑：
  - `app/fonts/huninn-subset.woff2`、`candy-huninn.woff2`、`OFL-huninn.txt`（justfont 粉圓，SIL OFL 1.1；著作權 Justfont，未見 Reserved Font Name）
  - `app/fonts/gensen-rounded-tw-bold-subset.woff2`、`candy-gensen.woff2`、`OFL-gensen-rounded.txt`（源泉圓體；OFL 文字含 Adobe、Reserved Font Name「Source」）
  - `app/fonts/noto-sans-tc-og.ttf`、`OFL-noto-sans-tc.txt`、`lib/og-font.ts`（OG 圖用 Noto Sans TC）
  - `app/layout.tsx` 的 `next/font/google`：Fredoka、Gochi Hand
  - 公開說明：`app/legal/page.tsx` 字型一節、`DISCLAIMER.md`、`THIRD_PARTY_NOTICES.md`
- 證據：OFL 全文在儲存庫內。`/legal` 要讀者去看 `app/fonts/OFL-*.txt` 與 `THIRD_PARTY_NOTICES.md`。這些路徑不在 `public/`，`DISCLAIMER.md` 又寫原始碼儲存庫為私人性質，因此網站訪客讀不到全文。粉圓與源泉圓體的子集會作為網頁字型送到瀏覽器。Noto Sans TC 有 OFL 檔，用於 OG 點陣字，但 `/legal` 與 `THIRD_PARTY_NOTICES.md` 的字型表都沒有列它。OFL 文字開頭寫 Reserved Font Name「Source」，與「Noto Sans TC」這個名稱並陳；這份標頭是否與字型檔內的 name table 一致，本次沒有拆字型表，不確定。子集檔檔名使用 huninn／gensen，沒有把產品名稱寫成「Source」。
- 建議：在 `/legal` 或獨立的授權頁放上 OFL 全文（或可下載的授權檔），補上 Noto Sans TC。核對 gensen 與 Noto 子集的內部字型名稱沒有使用 Reserved Font Name「Source」。

### 5. 第三方聲明的版本與依賴清單已過期

- 風險：低
- 路徑：`THIRD_PARTY_NOTICES.md`、`package.json`、`package-lock.json`
- 證據：`package.json` 沒有 `license` 欄位；根目錄 `LICENSE` 是 MIT，並排除節目內容。聲明表寫 next 16.3.2、sharp 0.35.3；`package.json` 現為 next 16.3.8、sharp 0.35.5。直接依賴裡的 `three`、`@react-three/fiber`、`@sentry/core` 沒有出現在該表。
- 建議：改聲明表時以 lockfile 為準，並在 `package.json` 補上 `"license": "MIT"`，與 `LICENSE` 對齊。這不改變「節目內容不適用 MIT」的排除條款。

### 6. 依賴授權裡有 copyleft 與非 OSI 授權，範圍限於工具或原生圖片函式庫

- 風險：低
- 路徑：`package-lock.json`
- 證據（依 lockfile 的 `license` 欄位，2026-10-12）：
  - 沒有 GPL、AGPL。
  - LGPL-3.0-or-later：`@img/sharp-libvips-*`（10 個可選平台套件）以及部分 `@img/sharp-*` 的複合授權（Apache-2.0 AND LGPL-3.0-or-later，wasm 包再加 MIT）。這是 sharp 用來處理圖片的 libvips，通常在建置或伺服器，不是瀏覽器裡的網站程式。LGPL 動態連結一般不會把整個網站變成 LGPL；若靜態連結或把二進位再散布，義務會不同。本次不確定正式部署是否把 libvips 二進位交給終端使用者。
  - MPL-2.0：`axe-core`、`@axe-core/playwright`，皆為 devDependency。
  - Hippocratic-2.1：`react-leaflet`、`@react-leaflet/core`（正式依賴）。`THIRD_PARTY_NOTICES.md` 已寫明這不是相容性結論、需要人工審查。兒童網站的用途本身不像該授權要排除的情形；它仍然不是常見的寬鬆授權。
  - FSL-1.1-MIT：`@sentry/cli` 及其平台套件。這是上傳 sourcemap 的命令列工具，不是網站頁面。FSL 是功能原始碼授權，兩年後轉 MIT；本次不確定該版本的轉換日。
  - CC-BY-4.0：`caniuse-lite`（建置期瀏覽器資料）。若資料本身被再散布，CC-BY 要求署名；一般只在建置機使用。
  - 其餘大量為 MIT、Apache-2.0、ISC、BSD。有一筆根套件「(no license field)」，即本儲存庫自己的 `package.json`。
- 建議：維持 sharp 以動態連結使用 libvips，不要把 LGPL 二進位打進對外下載包卻不附 LGPL 全文。Hippocratic 與 FSL 維持在聲明表，讓權利人自己決定是否可接受。沒有看到需要立即替換的 AGPL 依賴。

## 需要權利人確認的項目

這些有指名、外形或轉載關係，但儲存庫不足以做成「已經侵權」或「已經沒問題」。

### A. 小紅賽車與《Cars》／閃電麥坤的殘餘近似

- 風險：中（殘餘；不是已確認的複製）
- 路徑：`public/characters/小紅賽車.jpg`、`scripts/lib/character-sheet.ts`、`data/characters.json`、`scripts/generate-roamer-assets.ts`、`docs/specs/HERO-PARALLAX-SPEC.md`、`assets/landing/hero-parallax/PHASE4-ASSET-PROMPTS.md`
- 證據：定裝照是紅色、有臉的賽車，白條紋、車門白圓號碼「2」、擋風玻璃上的眼睛、車頭另有黃色圓燈、圓潤高車身、一支尾翼。設定書與負向提示明確排除號碼 95、閃電貼紙、低趴跑車、水箱護罩嘴巴，以及「一眼看成 Disney/Pixar《Cars》或 Lightning McQueen」。提示是用來避開角色，不是要求畫成該角色。規格書把「瞇眼測試」列為驗收，儲存庫沒有這項驗收已通過的紀錄。
- 不確定：黏土紅賽車這個類型仍會讓人聯想到該角色。是否達到受保護表達的近似，要看並排比對，本次不能單憑一張定裝照下結論。故事圖約一千多張，只抽了定裝照，同一角色在各集的漂移沒有逐張看。
- 建議：用定裝照與麥坤並排做一次瞇眼測試，沒過的集數圖列成重繪清單。繼續把負向清單放在生圖管線，不要在對外文案使用麥坤、95、閃電或 Cars。

### B. 小橘高鐵的橘色流線列車

- 風險：中（需確認）
- 路徑：`public/characters/小橘高鐵.jpg`、`data/subtitles/ep-7.json`、節目標題與關鍵字（測試與同步資料中的「小橘高鐵晚到了」「高鐵故事」）
- 證據：定裝照是橘色、車頭有白線的黏土高速列車，自有五官，沒有看到台灣高鐵的標誌或「台灣高鐵」字樣。字幕用「高鐵」講延遲與搭車，屬於對真實交通的描述，也把角色命名為小橘高鐵。台灣高鐵列車的橘色塗裝是否構成外觀保護，本次不確定。
- 建議：權利人看定裝照與真實列車塗裝的並排。若要降低聯想，可改車身配色或避免「高鐵」成為角色本名，故事仍可講「列車晚到」。

### C. 「金龜車」這個通稱

- 風險：低（需確認）
- 路徑：`public/characters/小紅豆金龜車.jpg`、第 27、28 集字幕與標題
- 證據：角色名叫小紅豆金龜車。定裝照是紅色圓車、黃色背包、大眼睛，沒有看到福斯標誌。華語「金龜車」通常指 Volkswagen Beetle。圖是否複製 Beetle 的受保護外觀，本次不確定。
- 建議：若圓車造型已足夠辨識，對外名稱可改成「小紅豆圓圓車」之類的自有名字。這是降低指名風險的做法，不是認定現名一定不能用。

### D. 第 20 集的「101」與 TOMICA

- 風險：低（需確認）
- 路徑：`public/stories/ep-20/01.webp`、`data/scenes/ep-20.json`、`data/subtitles/ep-20.json`
- 證據：生圖提示多次要求畫「Taipei 101」，並指定彩虹分層與星頂，要與封面一致。抽看的封面是彩虹積木高塔、藍底白字「101」、頂上黃星，讀起來是故事裡的玩具高塔，不是台北 101 的分段外觀與天線。字幕是主持人說去過 101 觀景臺，往下看車子「很像 TOMICA 小車車」。TOMICA 出現在口語字幕與場景摘要，沒有看到多美小汽車的標誌或產品圖。
- 不確定：其他分鏡有沒有畫成可辨認的台北 101，本次只看了封面。建築著作與「台北 101」商標的界線要個案判斷。觀景臺那句是事實敘述，商標風險低於把產品標誌放進圖裡。
- 建議：權利人翻完第 20 集全部分鏡。若某張已長成真實大樓的輪廓，改回現有的彩虹玩具塔。字幕若要保留孩子的原話，可接受指名；不要在標題、SEO 或圖內加上 TOMICA 字樣。場景摘要 `data/scenes/ep-20.json` 若會進入對外搜尋結果，把 TOMICA 從公開摘要拿掉。

### E. 家長文章全文轉載自方格子

- 風險：低；若作者不是同一人則升高
- 路徑：`data/parent-articles.ts`、`components/for-parents/ParentArticleView.tsx`
- 證據：三篇視力保健文章標了方格子原文網址，頁尾有「原文刊於方格子」。程式註解寫明保留作者原文。內文有「iPad」「樂高」，是照顧方法裡的產品通稱，沒有使用這兩個品牌的標誌。
- 不確定：儲存庫不能證明方格子帳號與本站權利人是同一人。若是同一人的自行轉載，這是自己的文章並有回鏈。若不是，則是未授權的全文轉載。
- 建議：權利人確認帳號同一，或在頁上寫明作者即本節目製作者。樂高與 iPad 維持敘述性提及即可，不要加上標誌。

### F. 「爆米花歌」

- 風險：不確定
- 路徑：`data/subtitles/ep-19.json`、`data/scenes/ep-19.json`
- 證據：字幕說小車車哼「快樂的爆米花歌」，沒有收錄歌詞。本次沒有聽 `public/stories/ep-19/audio.mp3`。
- 建議：聽該段。若唱的是既有兒歌，改成自有的哼唱或只保留「他們在唱歌」而不使用受保護歌詞與旋律。

### G. AI 圖的訓練資料近似，以及 3D 場景內部素材

- 風險：不確定
- 路徑：`scripts/lib/illustrate-core.ts`（`CLAY_STYLE_PREFIX` 為黏土／定格風格與粉彩色票，沒有指定在世藝術家或動畫工作室）、`scripts/illustrate.ts` 與各 `generate-*-art.ts`（模型預設 `gpt-image-2`，見 `getImageModel`）、`assets/blender/hero-world/hero-world.blend`、`public/models/hero-world/`、`docs/HERO-WORLD-SOURCE.md`
- 證據：風格描述是材質與色票，負向提示禁止標誌、浮水印，以及把小紅畫成麥坤。沒有「in the style of〔藝術家〕」這類指名。3D 文件寫來源是自有 Blender。本次沒有拆開 `.blend` 檢查是否夾帶下載的模型、貼圖或 HDR。
- 建議：維持生圖提示不指名藝術家、角色與工作室。若 blend 裡有外部素材，補上來源與授權；沒有的話在資產備註寫「場景幾何為自製」。

### H. 遊戲類型本身

- 風險：低（類型），與第 1 項的具體表現分開
- 路徑：`lib/games/candy-match/`、`public/games/v2/candy-match/`、`lib/games/dino-sushi/`
- 證據：消消樂封面與關卡圖是遊樂園黏土場景（摩天輪、甜甜圈屋等），名稱是「繽紛消消樂」「車車消消樂」，沒有 Candy Crush 的名稱或糖果角色。三消是常見玩法。方塊遊戲的類型風險已併入第 1 項，不在這裡重複降級。
- 建議：消消樂維持自有糖果與場景，不要使用 King 或其他產品的糖果造型與名稱。

## 查過、目前沒有單獨列為問題的部分

- `LICENSE` 為 MIT，正文之後排除音檔、插畫、封面、吉祥物、品牌、故事與字幕。`/legal` 有權利歸屬、侵權通知信箱、分享方式與「程式碼授權不含節目內容」。
- Open Graph 與預設標題是「車車遊樂園」「Bonbon & 馬米」，圖像為 `public/mascot.png`。吉祥物抽看是黃色圓車與星星，沒有對上特定商業角色。
- 角色抽看：噗噗豬是豬形車，不是直立、紅裙的粉紅豬角色；恐龍車多多是綠色恐龍車，沒有對上特定恐龍品牌。字幕抽查沒有汪汪隊、波力、湯瑪士、樂高產品線、寶可夢、迪士尼角色名稱（「迪士尼城堡手法」只出現在程式註解 `lib/universe/zone-art-tile.ts`，不是對外文案）。
- 故事音檔是各集節目本體。遊戲音效與另外兩首 BGM 是 Web Audio 合成，沒有 freesound、Epidemic Sound 等外部音庫檔。除第 1 項外，沒有另找知名旋律。
- 塗鴉線稿由自有故事圖轉出（`scripts/generate-coloring-lineart.ts`、`scripts/generate-coloring-ai-lineart.ts`）。上游圖若有近似問題，線稿會跟著走；沒有看到另外購入的塗鴉本。
- 沒有 YouTube／Spotify／Apple 的 iframe 播放器。平台是外連。RSS 描述會去掉「Hosting provided by SoundOn」尾註（`scripts/lib/apple-rss.ts`）；這是站內摘要的清理。SoundOn 託管合約是否要求在節目描述保留該句，本次不確定，合約不在儲存庫。
- `public/sw.js` 是本站快取邏輯，不是未附授權的第三方套件拷貝。
- 地圖圖層有 OpenStreetMap 署名。問題在圖磚服務條款（第 3 項），不在「完全沒署名」。

## 建議的處理順序

1. 換掉方塊轉轉的旋律，並改掉與《俄羅斯方塊》相同的形狀配色（第 1 項）。
2. 改 `/legal` 的平台標誌敘述，並決定官方徽章或純文字連結；移走公開路徑上已裁切的 YouTube 圖示與未使用的 KKBOX 字標（第 2 項）。
3. 家長地圖改圖磚來源，或確認已有 OSMF 許可（第 3 項）。
4. 把 OFL 全文放到公開的授權頁，補上 Noto（第 4 項）。
5. 權利人自行看圖：小紅賽車並排、第 20 集全部分鏡、小橘高鐵塗裝、金龜車名稱、方格子作者是否同一人、第 19 集是否唱了既有歌曲。

## 本次做不到的事

- 沒有逐張審約 1,447 張故事圖，也沒有逐集聽 33 個音檔。
- 沒有做商標檢索，沒有查台灣、美國或其他法域的註冊簿。
- 沒有拆 `.blend`、字型 name table 或 mp3 內容指紋。
- Wikimedia 的公有領域模板、OFL、MIT、LGPL、Hippocratic、FSL 的法律效果，需由權利人請律師依實際散布方式判斷。本報告只指出儲存庫裡看得到的事實與落差。
