# 多多壽司屋：像一間真的壽司店（2026-11-08）

狀態：**Approved（2026-11-08）**。三審兩輪後定稿；使用者決策已全部定案。下一步 `/agent-action` 從 PR-A 開始。來源：使用者 2026-11-08 實玩回饋 7 點（截圖：點餐泡泡、軍艦、手捲）。

## Goal

讓壽司屋像一間真的壽司店：客人點的由客人吃（輸送帶送過去），配方與食材外觀接近真實，遊戲場景是畫面主角；每盤的回饋不比現在弱、等待不比現在長。

## 已拍板（使用者）

- **A 客人吃**：做好的壽司經輸送帶送到點餐朋友的櫃台座位，朋友吃、說謝謝；多多當店長。朋友跟多多同比例。不再寫「給多多吃」。
- **B 生圖**：重畫軍艦、手捲、鮪魚沙拉；補幾樣真實配料。付費，參考圖流程。
- **C 甜點**：拿掉草莓、布丁；只留芥末彩蛋。

## 三審後的決定（Leader 綜合）

| 決定 | 內容 | 來源 |
| --- | --- | --- |
| **順序** | PR-A 客人吃＋送餐＋版面（沿用現有訂單）→ PR-B 生圖（等托盤實際尺寸定了，先底座後配料）→ PR-C 真實配方＋貼紙換新。輸送帶不必等配方；貼紙總數只在 PR-C 動一次。 | 對抗審 #5 |
| **等待預算** | 從按「送出」到能做下一盤 ≤ 1.6 秒，每盤都一樣（不做「之後變短」）：交接 120ms → 帶上 600ms → 一口＋高潮同一拍（愛心、謝謝、多多表情、盤子進疊盤）→ 解鎖。下一位滑進座位 300ms 與泡泡出現可跟解鎖重疊。e2e 量時間。 | 對抗審 #2、設計審 §2 |
| **高潮同一拍** | 客人第一口就有咀嚼音、碎屑、愛心；多多換表情同一拍。多多的字卡在送餐時收起，文字只留客人的謝謝。 | 設計審 §2、§6 |
| **交接不飛越面板** | 砧板上的盤子縮掉 120ms，同時在多多面前的帶子起點冒出，再往右送到座位。 | 設計審 §1 |
| **泡泡與客人** | 點餐泡泡的尾巴指向客人（不再指多多），泡泡內客人頭像拿掉省寬度；「客人頭上」同一時間只有一樣東西：泡泡 → 打勾淡掉 → 謝謝 → 下一位泡泡。 | 設計審 §1 |
| **輸送帶方向** | 點餐模式送餐時裝飾盤停住並淡出；送的那盤是孩子做的那份（約砧板 0.5 倍），明顯大於裝飾盤。帶子方向統一由多多往客人。 | 設計審 §6 |
| **桌面版面** | 寬 ≥ 900 且高 ≥ 720：場景佔上排、砧板（多多下方）＋托盤（右）在下；其餘（筆電短視窗、橫向手機）三欄。 | 設計審 §3 |
| **觸控** | 兒童主要操作 ≥ 48px、間距 ≥ 8px（STYLE-BIBLE §3）；料位維持 64px；寬 < 340px 才允許 44px。 | 設計審 §6 |
| **自由做** | 沒有客人：盤子直接出現在多多面前（現行做法），多多吃，客人座位空著。 | 設計審 §6 |
| **芥末** | 客人辣到搖一搖、冒小火，接著轉成愛心（「好過癮！」），多多同拍開心；不做「店長笑客人」。 | 設計審 §6 |
| **料不齊就送** | 盤子不上帶；泡泡裡缺的那樣閃一下，多多看泡泡。 | 設計審 §6 |
| **甜點時程** | PR-A 就把草莓、布丁從托盤與反應拿掉（含刷牙鈕）；對應貼紙在 PR-C 換新前暫時拿不到（期間短，CHANGELOG 註明）。型別不在 PR-A 收窄。 | 使用者 C、工程審 |
| **貼紙** | 不開「以前收集的」區：已擁有的甜點、刷牙貼紙留在原分組，說明改「這家店現在不賣甜點」；不計入總數與全收集。總數在 PR-C 一次調整（−4 舊＋新配料張數）。退役 id 仍是合法 id（讀寫存檔不過濾）；全收集改成「現役集合都擁有」，已領過的不重發也不收回；保底只送現役貼紙。 | 對抗審 #4、工程審 |
| **新配料** | 以形狀、顏色跟現有料差很多的為主：鮭魚卵、鰻魚必做；第三樣（蛋沙拉或干貝）在生圖閘門讓使用者選。醬類沙拉這輪只留鮪魚沙拉。 | 對抗審 #5、設計審 §4–5 |
| **第 1–4 天題池** | 第 1 天：握壽司單一料 ×5，托盤干擾項只從「能放上握壽司的料」挑。第 2 天：握壽司＋軍艦，最多一張兩樣料（軍艦組合）。第 3 天：手捲登場，只出兩樣料。第 4 天：三種飯、手捲可三樣。主題改「偏好」不是硬篩：只在主題料放得上當天飯型時加權。 | 對抗審 #3、設計審 §4 |

## 使用者決策（2026-11-08 三審後）

- **客人「好吃」表情**：補。PR-B 第二輪替 6 位客人各生一張「好吃」表情貼紙（瞇眼、張嘴），參考各客人現有貼紙；PR-A 先用點頭、壓扁、紅暈、碎屑、愛心，PR-B 核可後換上表情。

## Scope / Out of scope

- In：PR-A、PR-B、PR-C。
- Out：客人喜好長線玩法、主題創作、新客人、新飯型（稻荷等）、遊樂園大海報、聲音重錄（只重用既有音效）、其他遊戲。

## Task DAG

### PR-A 客人吃、送餐、比例與版面（L3 UI；沿用現有訂單與食材）

- [ ] A1（L3，Leader）構圖規格：吧台橫切面，多多在左、輪底與客人同一條櫃台頂線（約舞台 72–74%），客人在右、寬約多多 0.85 倍，排隊站在最下方地板線右側門口。四種尺寸配置照設計審 §1（390×844 舞台約 330px；393×659 送出鈕與料位同列、皿高上限 80px、舞台約 210px、不畫排隊；844×390 三欄 430/220/150；1280×800 上場景 1040×340、下砧板＋托盤）。補 320×568、iPad 1024×768／820×1180 的退化規則。— 依賴：無
- [ ] A2（L3，Leader）送餐 phase 重新設計：`ServePhase = idle | handoff | ride | eat | react`（取代 `slide | open | chew`）。全部走既有的可暫停排程（暫停記剩餘時間、繼續補排；畫面動畫用 `data-paused` 凍結）；離開或回標題取消所有排程。同步改所有讀 `phase` 的元件與 `useDinoSushiPlay` 測試。時間表（從按下「送出」起算）：

  | phase | 一般 | 減少動態 | 發生的事 |
  | --- | --- | --- | --- |
  | handoff | 0–120ms | 0ms（略過） | 砧板盤子縮掉、帶子起點冒出；輸入鎖住 |
  | ride | 120–720ms | 0ms（略過，盤子直接在座位） | 盤子送到座位，客人在約 70% 處往前探；裝飾盤停住淡出 |
  | eat | 720–1020ms | 0–300ms（淡入淡出） | 一口：咀嚼音、碎屑、壓扁；PR-B 後換「好吃」臉 |
  | react | 1020–1600ms | 300–800ms | 同一拍：愛心、謝謝、多多表情、盤子進疊盤；讀屏宣告謝謝 |
  | idle | 1600ms 起 | 800ms 起 | 解鎖；下一位滑進座位（300ms，可重疊）、泡泡出現；閒置提示從這裡起算 |

  — 依賴：A1
- [ ] A3（L3，Leader）元件：`DinoSushiCustomerSeat` → 櫃台座位（吃相：點頭、壓扁、紅暈、碎屑、愛心）；`DinoSushiGuestThanks` 錨在客人頭上；點餐泡泡尾巴指向客人；`DinoSushiCustomerQueue` 落地；`ShopBelt` 加送餐道、送餐時裝飾盤停住淡出；`DinoSushiDuoDuo` 店長反應模式（自由做保留吃相）；疊盤移到櫃台前板中間偏右；圓蓋獎品移到牆面中段、謝謝之後才出、矮舞台不出。— 依賴：A2
- [ ] A4（L3，Leader）字句與操作：「給多多吃」→ 送出鈕「盤子 → 客人頭像」＋可見文字「送給安安」；朗讀念出料名（「安安想吃手捲，有蟹肉棒和小黃瓜」）；送出時捲到舞台與座位（取代捲回多多的臉）；首單教學手指的目標、砧板角標（⇄、↓）重新定錨；料不齊就送的處理。— 依賴：A3
- [ ] A5（L3，Leader）拿掉甜點（不收窄型別）：`orders.ts` 的 `classicTray` 不再抽甜點、`withTheme` 不再保留或補回甜點（`buildTray`、`buildTrayWithTheme`、自由做都經過這兩條，托盤變成 7 鹹料＋芥末）；`reactions.ts` 拿掉 sweet 與刷牙觸發、刷牙鈕移除；芥末反應改客人。貼紙空窗：新增 `UNAVAILABLE_STICKER_IDS`（`topping-strawberry`、`topping-pudding`、`mood-sweet`、`mood-brush`），`collectStickers` 的保底跳過它們；總數與全收集規則不動，PR-C 再正式退役。測試：seed 1–1000 的一般、主題、自由做托盤都沒有甜點；保底不會送出這 4 張。— 依賴：A2
- [ ] A6（L3，Leader）版面：手機舞台加高、泡泡料圖窄螢幕 ≥ 40px／桌面 ≥ 56px、托盤 ≥ 48px；桌面上下版面（≥ 900×720）。— 依賴：A1
- [ ] A7（L2，Leader）文件：DESIGN.md 壽司屋段（泡泡尾巴、客人比例、帶子方向）、STYLE-BIBLE §2.1（多多在櫃台後時輪子的規則）、`GAME_PHYSICAL_DEVICE_QA.md` 與驗收台補「送餐流程」「櫃台比例」「等待時間」。— 依賴：A3–A6
- [ ] A8（L3，Leader）測試：
  - 單元：phase 時序（含暫停在每個 phase、離場取消、減少動態）。
  - e2e：送出到解鎖 ≤ 1.6 秒（每盤）、客人頭上同時只有一樣、謝謝與座位不蓋臉、料不齊不上帶、自由做沿用多多吃。
  - `dino-sushi-kitchen.spec.ts` 的座標斷言：先列清單，逐條改成新構圖的不變量，不刪測試湊綠。
  - 視覺基準 `--update-snapshots=changed` 連錄兩次。
  - 依賴：A2–A6

### PR-B 生圖（L3 付費；PR-A 合併、托盤尺寸定了才開始）

- [x] B1（L3，Leader）底座 3 張（第一輪，2026-11-09 上線；軍艦飯面與海苔邊同高，沒切 gunkan-front）：軍艦、手捲、鮪魚沙拉。`images.edit`，參考圖用 `nigiri.webp`＋一張料圖，鎖同一俯角（約 30°）、同光向、透明底、置中、無盤、無字、無臉；底部接觸線位置一致。
  - 軍艦：橢圓、長軸水平、矮（邊緣高約長度 40–45%）；一圈薄海苔帶，霧面墨綠微光澤與紙紋，正面偏右一條直接縫；不要絨布感、不要兩層台階；頂部寬橢圓開口約外寬 80%，飯面低於邊緣 10–15%。從同一張切出 `gunkan-front` 前緣層。
  - 手捲：比例約 1:1.5；海苔斜捲、一條斜接縫；後片比前緣高約 15%；飯口寬約圖寬 90%、微朝鏡頭、飯面微隆無洞；傾斜 ≤ 15°。`temaki-front` 從同一張切。
  - 鮪魚沙拉：米色帶粉的鮪魚碎、看得到纖維、美乃滋拌在裡面帶光澤；矮丘（高約寬 45%）、平底、寬約軍艦開口 70%；不要擠花。
- [x] **B1 閘門**：呼叫前在聊天列出檔名與張數（3 張＋2 張切圖），等使用者文字確認；暫存 → contact sheet → 核可才上線。不自行重抽。
- [x] B2（L3，Leader，2026-11-10；第三樣選干貝；阿樂好吃臉不要）配料第二輪：鮭魚卵（透明橘紅亮珠，與玉米的霧面黃粒區分）、鰻魚（深棕亮醬長片、烤紋，比例近 `salmon.webp`）、第三樣（使用者在閘門選：蛋沙拉＝淡黃帶白色蛋白塊，或干貝＝白色圓片）；6 位客人的「好吃」表情貼紙（各以該客人現有貼紙為參考圖，同角度、同去背規格，只改眼睛與嘴）。— 依賴：B1 核可
- [x] **B2 閘門**：同 B1（列出 3 樣配料＋6 位客人，共 9 張）。
- [x] B3（L3，Leader，2026-11-09）接上新底座：`BASE_ASPECT`、`ANCHOR.gunkan`、手捲前層切線、`TOPPING_FIT`、`layerSpots`、`TEMAKI_PLACE` 依新圖重調；`optimize-dino-sushi-assets.ts` 出小圖；`asset-src.ts`、`SOURCES.md`。新配料先不進遊戲（PR-C 才接）。— 依賴：B1 核可
- [x] B4（L3，Leader，2026-11-10）客人表情接上：`customers.ts` 加 `yumSticker`；櫃台座位在 `eat` 那一拍換成好吃的臉、`react` 後換回；預載跟著客人貼紙一起；`build-dino-sushi-customer-stickers.ts` 出去背與小圖。— 依賴：B2 核可、PR-A

### PR-C 真實配方、貼紙換新（L2；依賴 PR-B 的新配料）

- [ ] C1（L2，Leader）配方表 `recipes.ts`：每筆含飯型、料、幾樣料。不變量：每一天 × 每個 size × 當天允許飯型，至少 3 道不同配方（第 2 天兩樣料的軍艦至少 2 道，例：鮪魚玉米、鮭魚卵＋小黃瓜…依新料定）；混淆組不同單（醬類沙拉兩兩、蟹肉棒與蟹肉沙拉、玉子與蛋沙拉）。— 依賴：B2 核可
- [ ] C2（L2，Leader）`days.ts` 腳本改寫（決定「第 1–4 天題池」），主題改由腳本指定、作偏好加權。— 依賴：C1
- [ ] C3（L2，Leader）`orders.ts`：五單依序決定，不重抽：
  1. 每單的候選＝符合當天飯型與 size 的配方，再依序套用：「料的聯集加進去後 ≤ 7 格」（托盤 8 格扣掉芥末）、與上一單不同、主題偏好、客人最愛；某一層過濾後沒有候選就跳過那一層（容量那一層除外）。
  2. 容量那一層若沒有候選，改從「只用已在托盤上的料」的配方裡挑；仍沒有就沿用前面任一單的配方（聯集不變，必定可行）。第一單一定放得下：每個配方最多 3 樣料。
  3. 每單只做一次有限的挑選，五單後結束，保證終止且托盤 ≤ 7 鹹料。
  4. 托盤剩下的格子從「放得上當天飯型」的料隨機補滿，加芥末。
  
  測試覆蓋「容量那一層無候選」與「只能沿用」兩條退路。— 依賴：C1、C2
- [ ] C4（L2，Leader）新配料接進遊戲：`toppings.ts` 新增、`ToppingId` 收窄移除 strawberry／pudding（同步 `art.tsx` 的 `TEMAKI_PLACE`、`TOPPING_FIT` 這類完整 `Record`、`stickers.ts` 的 art／state、mood facts、`collectStickers`）。— 依賴：C1、B3
- [ ] C5（L2，Leader）貼紙換新（決定「貼紙」）：`RETIRED_STICKER_IDS` 仍通過 `isDinoSushiStickerId`；`DINO_SUSHI_STICKER_TOTAL` 改成現役數；`awardBookIfComplete` 改成「現役集合都擁有」；保底只抽現役；貼紙書退役貼紙留原分組、說明改字。— 依賴：C4
- [ ] C6（L2，Leader）測試：seed 1–1000 × 第 1–4 天 × 自由做：每單是配方、飯型與 size 合法、相鄰不同、托盤 8 格不重複且做得出每單、第 1 天全握壽司單一料；配方不變量；舊存檔 fixture：(a) 30 張全有、(b) 只缺 4 張退役、(c) 已領全收集 → 退役貼紙仍顯示、不重發、不收回、總數正確、不會自動變成全收集。e2e 依新訂單調整；QA 文件「第 1 天第 5 單」改寫。— 依賴：C2–C5

## Files likely touched

- PR-A：`components/games/{DinoSushiKitchen,DinoSushiCustomerSeat,DinoSushiCustomerQueue,DinoSushiGuestThanks,DinoSushiOrderBubble,DinoSushiShop,DinoSushiDuoDuo,DinoSushiView,DinoSushiPlateStack,DinoSushiBadges}.tsx`、`useDinoSushiPlay.ts`、`DinoSushiKitchen.module.css`、`DinoSushiShop.module.css`、`lib/games/dino-sushi/{reactions,orders(只拿掉 sweet 入托盤),sfx}.ts`、`DESIGN.md`、`docs/STYLE-BIBLE.md`、`GAME_PHYSICAL_DEVICE_QA.md`、e2e 與 `e2e/visual.spec.ts-snapshots/dino-sushi-*`。
- PR-B：`public/games/v2/dino-sushi/food/*`、`scripts/generate-dino-sushi-food.ts`（新，參考 `generate-dino-sushi-cover.ts` 的參考圖寫法）、`scripts/optimize-dino-sushi-assets.ts`、`lib/games/dino-sushi/{art,asset-src}.ts(x)`、`SOURCES.md`。
- PR-C：`lib/games/dino-sushi/{recipes(新),orders,days,toppings,stickers,variety}.ts`、`lib/games/dino-sushi/art.tsx`、`lib/gamekit/progress/dino-sushi-stickers.ts`、`components/games/DinoSushiStickerBook.tsx`、測試與 e2e。

## Verification

- 每個 PR：`npm run typecheck`、`npm run lint`、`NODE_OPTIONS=--no-experimental-webstorage npx vitest run lib/games/dino-sushi lib/gamekit components/games`、`npx playwright test e2e/dino-sushi-*.spec.ts e2e/games*.spec.ts`。
- PR-A、PR-B：`npm run test:visual:trusted -- --grep 多多壽司屋 --update-snapshots=changed` 連錄兩次、比對。
- 上線前 `npm run check`（L3）。
- 真機：PR-A 合併後先量五盤的實際等待，再開 PR-C。

## Risks & rollback

- **回饋變弱**：靠「同一拍高潮」與（若核可）客人表情貼紙；PR-A 真機試玩不合格就不往下做 PR-C。
- **e2e 大改**：座標斷言改成不變量清單，逐條換。
- **存檔**：貼紙換新用三組 fixture 守；退役 id 永遠合法。
- **生圖**：分兩輪、每輪先核可；不準就沿用舊圖，PR-B 可單獨回退。
- **甜點空窗**：PR-A 到 PR-C 之間 4 張貼紙暫時拿不到；兩個 PR 間隔盡量短。
- 回退：A、B、C 各自可 revert；C 依賴 B 的新配料，B 的資料接入不影響遊戲（新配料 C 才啟用）。

## Review decision

- 第一輪三審（2026-11-08）：工程 `gpt-6-luna` Reject（6 項，已納入：DAG 依賴、配方回退與托盤、貼紙讀寫過濾與全收集、型別收窄範圍、測試不變量、phase／暫停設計）；對抗 `grok-4.7-high-fast` 5 個 HIGH（已納入：同拍回饋、等待預算、題池不變量、貼紙不收回、PR 順序與生圖分輪）；設計 Opus Approve with changes（已納入構圖、交接、泡泡、帶子方向、時間軸、48px、生圖外觀、自由做、芥末）。
- 第二輪：工程複審（`gpt-6-luna`）Reject，6 點中 4 點已解決，另提 3 個缺口：PR-A 甜點的 `classicTray`／`withTheme` 路徑、C3 托盤重抽無終止保證、PR-A 到 PR-C 空窗的保底貼紙。三點已在 A5、C3 補上具體規則；phase 時間表補在 A2。Leader 判定 Approved，不再開第三輪。
- 使用者決策：客人「好吃」表情補 6 張（已定）。
