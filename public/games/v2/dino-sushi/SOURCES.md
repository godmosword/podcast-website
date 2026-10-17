# 多多壽司屋圖檔來源

恐龍車多多的小遊戲「多多壽司屋」（路徑仍是 `dino-sushi`）。本表只登記這個目錄裡已經進儲存庫的圖，一檔一列。提示詞和沒選上的候選圖在儲存庫外面。

核對方式：git 歷史、`#212`、`#214`，以及 `scripts/generate-dino-sushi-cover.ts`、`scripts/optimize-dino-sushi-assets.ts`。透明度用畫面檔實測（有沒有 alpha 通道）。模型沒有逐檔的 API 紀錄，是依實測結果套上已知規則：不透明圖用 OpenAI `gpt-image-2`，透明圖用 `gpt-image-1.5`。`gpt-image-2` 不支援透明底，見 `scripts/generate-zone-night-art.ts`。

`sm/` 是 2026-10-14 由原檔做出的畫面用副本，不是另外生的一套圖。

## 逐檔

| 檔名 | 用途 | 產生方式 | 模型 | 日期 | 人工處理 | 對應 PR |
|------|------|----------|------|------|----------|---------|
| `cover.webp` | 遊樂園卡片與遊戲標題封面 | AI 生圖後轉 webp。儲存庫有 `scripts/generate-dino-sushi-cover.ts`，#212 換上的是核准原檔，該 PR 沒有呼叫生圖。成品 1536×1024，不是腳本裡 2048×1536 的放大檔。 | gpt-image-2 | 2026-10-13 | 轉 webp。#212 寫明未重畫、未再壓縮。去白邊：不確定（檔案不透明）。無分層。 | #212 |
| `duoduo/sticker-closed.webp` | 多多待機（閉嘴） | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-13 | 去白邊、轉 webp。無分層。 | #212 |
| `duoduo/sticker-open.webp` | 多多張嘴 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-13 | 去白邊、轉 webp。無分層。 | #212 |
| `duoduo/sticker-chew.webp` | 多多咀嚼 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-13 | 去白邊、轉 webp。無分層。 | #212 |
| `duoduo/sticker-laugh.webp` | 多多笑 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-13 | 去白邊、轉 webp。無分層。 | #212 |
| `duoduo/sticker-love.webp` | 反應：最愛、一次做對 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-13 | 去白邊、轉 webp。無分層。 | #212 |
| `duoduo/sticker-yum.webp` | 反應：好吃 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-13 | 去白邊、轉 webp。無分層。 | #212 |
| `duoduo/sticker-sweet.webp` | 反應：吃到甜點 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-13 | 去白邊、轉 webp。無分層。 | #212 |
| `duoduo/sticker-look.webp` | 反應：缺料，先不吃 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-13 | 去白邊、轉 webp。無分層。 | #212 |
| `duoduo/sticker-puff.webp` | 舊的芥末白煙；畫面已改用 sticker-fire，檔仍留著 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-13 | 去白邊、轉 webp。無分層。 | #212 |
| `duoduo/sticker-toothbrush.webp` | 吃完甜點後的刷牙按鈕 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-13 | 去白邊、轉 webp。無分層。 | #212 |
| `duoduo/sticker-fire.webp` | 吃到芥末的噴火表情（心情代碼仍是 puff） | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-14 | 去白邊、轉 webp。無分層。 | #214 |
| `duoduo/sm/sticker-closed.webp` | 多多待機（閉嘴）（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-13） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `duoduo/sm/sticker-open.webp` | 多多張嘴（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-13） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `duoduo/sm/sticker-chew.webp` | 多多咀嚼（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-13） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `duoduo/sm/sticker-laugh.webp` | 多多笑（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-13） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `duoduo/sm/sticker-love.webp` | 反應：最愛、一次做對（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-13） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `duoduo/sm/sticker-yum.webp` | 反應：好吃（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-13） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `duoduo/sm/sticker-sweet.webp` | 反應：吃到甜點（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-13） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `duoduo/sm/sticker-look.webp` | 反應：缺料，先不吃（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-13） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `duoduo/sm/sticker-toothbrush.webp` | 吃完甜點後的刷牙按鈕（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-13） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `duoduo/sm/sticker-fire.webp` | 吃到芥末的噴火表情（心情代碼仍是 puff）（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-14） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/nigiri.webp` | 握壽司飯底 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/gunkan.webp` | 軍艦飯底 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/temaki.webp` | 手捲飯底（海苔後層） | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-14 | 去白邊、手捲拆成前後層、轉 webp。 | #214 |
| `food/temaki-front.webp` | 手捲海苔前片，蓋在配料上 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-14 | 去白邊、手捲拆成前後層、轉 webp。 | #214 |
| `food/tamago.webp` | 配料：玉子 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/shrimp.webp` | 配料：蝦 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/crab.webp` | 配料：蟹肉棒 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/corn.webp` | 配料：玉米 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/cucumber.webp` | 配料：小黃瓜 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/tuna.webp` | 配料：鮪魚沙拉 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/floss.webp` | 配料：肉鬆 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/salmon.webp` | 配料：鮭魚 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/avocado.webp` | 配料：酪梨 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/strawberry.webp` | 配料：草莓（甜點） | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/pudding.webp` | 配料：布丁（甜點） | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `food/wasabi.webp` | 配料：芥末（wasabi-2 小丘；檔名未另存） | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 2026-10-14 | 去白邊、轉 webp。無分層。 | #214 |
| `food/sm/nigiri.webp` | 握壽司飯底（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/gunkan.webp` | 軍艦飯底（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/temaki.webp` | 手捲飯底（海苔後層）（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-14） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/temaki-front.webp` | 手捲海苔前片，蓋在配料上（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-14） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/tamago.webp` | 配料：玉子（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/shrimp.webp` | 配料：蝦（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/crab.webp` | 配料：蟹肉棒（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/corn.webp` | 配料：玉米（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/cucumber.webp` | 配料：小黃瓜（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/tuna.webp` | 配料：鮪魚沙拉（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/floss.webp` | 配料：肉鬆（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/salmon.webp` | 配料：鮭魚（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/avocado.webp` | 配料：酪梨（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/strawberry.webp` | 配料：草莓（甜點）（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/pudding.webp` | 配料：布丁（甜點）（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `food/sm/wasabi.webp` | 配料：芥末（wasabi-2 小丘；檔名未另存）（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖：2026-10-14） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `shop/wall.webp` | 店面牆（不透明滿版） | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-2 | 不確定（2026-10-13 或 2026-10-14） | 轉 webp。去白邊：不確定（不透明滿版）。無分層。 | #214 |
| `shop/awning.webp` | 雨棚 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `shop/counter.webp` | 櫃台前板（「多多壽司」四字由程式刻上，不在圖裡） | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `shop/belt.webp` | 迴轉帶 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `shop/window.webp` | 圓窗 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `shop/lantern.webp` | 燈籠 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `shop/dome.webp` | 迴轉帶裝飾盤上的圓蓋 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `shop/plate.webp` | 盤子 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `shop/prepplate.webp` | 備料盤 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `shop/tray-neutral.webp` | 家常料的托盤底 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `shop/tray-sweet.webp` | 甜點的托盤底 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `shop/tray-wasabi.webp` | 芥末的托盤底 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `shop/sign.webp` | 直式木招牌原檔；程式已不引用 | AI 生圖。儲存庫內沒有這張圖的生圖腳本。 | gpt-image-1.5 | 不確定（2026-10-13 或 2026-10-14） | 去白邊、轉 webp。無分層。 | #214 |
| `shop/sm/wall.webp` | 店面牆（不透明滿版）（原檔照抄的副本） | 原檔逐位元照抄（`asset-src.ts` 寬度表為 null）。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | 無。與原檔相同。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `shop/sm/awning.webp` | 雨棚（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `shop/sm/counter.webp` | 櫃台前板（「多多壽司」四字由程式刻上，不在圖裡）（原檔照抄的副本） | 原檔逐位元照抄（`asset-src.ts` 寬度表為 null）。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | 無。與原檔相同。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `shop/sm/belt.webp` | 迴轉帶（原檔照抄的副本） | 原檔逐位元照抄（`asset-src.ts` 寬度表為 null）。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | 無。與原檔相同。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `shop/sm/window.webp` | 圓窗（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `shop/sm/lantern.webp` | 燈籠（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `shop/sm/dome.webp` | 迴轉帶裝飾盤上的圓蓋（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `shop/sm/plate.webp` | 盤子（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `shop/sm/prepplate.webp` | 備料盤（原檔照抄的副本） | 原檔逐位元照抄（`asset-src.ts` 寬度表為 null）。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | 無。與原檔相同。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `shop/sm/tray-neutral.webp` | 家常料的托盤底（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `shop/sm/tray-sweet.webp` | 甜點的托盤底（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `shop/sm/tray-wasabi.webp` | 芥末的托盤底（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-14 做成副本（原圖日期不確定） | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | 不確定（commit `f50202eb` 在 main，GitHub 未關聯 PR） |
| `customers/xiaohong.webp` | 小紅全身貼紙（排隊、座位、點餐泡泡） | 核准草稿去背、去掉地面淡影、縮到 1024，輪底對齊 92%。不重畫。草稿在 `scripts/assets/dino-sushi-customer-drafts/xiaohong.jpg`。車頭本來朝左，號碼 2 不翻。 | 草稿不是這次生的 | 2026-10-17 | `scripts/build-dino-sushi-customer-stickers.ts`（沿用 `scripts/lib/roamer-alpha.ts` 邊界去背）。 | #243 |
| `customers/anan.webp` | 安安全身貼紙 | 同上。草稿車頭朝右，水平翻轉後朝向多多（舞台左側）。 | 草稿不是這次生的 | 2026-10-17 | 同上，並水平翻轉。 | #243 |
| `customers/ale.webp` | 阿樂全身貼紙 | 同上。草稿車頭已朝左，不翻。 | 草稿不是這次生的 | 2026-10-17 | 同上。 | #243 |
| `customers/lingling.webp` | 鈴鈴全身貼紙 | 同上。草稿掃把與臉在右，水平翻轉後朝向多多。 | 草稿不是這次生的 | 2026-10-17 | 同上，並水平翻轉。 | #243 |
| `customers/dongdong.webp` | 東東全身貼紙 | 同上。铲子已經朝左，不翻。 | 草稿不是這次生的 | 2026-10-17 | 同上。 | #243 |
| `customers/xiangxiang.webp` | 香香全身貼紙 | 同上。草稿車頭已朝左，不翻。 | 草稿不是這次生的 | 2026-10-17 | 同上。 | #243 |
| `customers/sm/xiaohong.webp` | 小紅全身貼紙（畫面讀的縮小副本） | 由原檔以 `scripts/optimize-dino-sushi-assets.ts` 縮到 384。不是另一次生圖。 | 同原檔 | 2026-10-17 | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | #243 |
| `customers/sm/anan.webp` | 安安全身貼紙（畫面讀的縮小副本） | 同上。 | 同原檔 | 2026-10-17 | 同上。 | #243 |
| `customers/sm/ale.webp` | 阿樂全身貼紙（畫面讀的縮小副本） | 同上。 | 同原檔 | 2026-10-17 | 同上。 | #243 |
| `customers/sm/lingling.webp` | 鈴鈴全身貼紙（畫面讀的縮小副本） | 同上。 | 同原檔 | 2026-10-17 | 同上。 | #243 |
| `customers/sm/dongdong.webp` | 東東全身貼紙（畫面讀的縮小副本） | 同上。 | 同原檔 | 2026-10-17 | 同上。 | #243 |
| `customers/sm/xiangxiang.webp` | 香香全身貼紙（畫面讀的縮小副本） | 同上。 | 同原檔 | 2026-10-17 | 同上。 | #243 |

## 人類創作紀錄

這批圖的方向是 Kaiyi 定的。他從候選裡選定要往下做的是：封面 cover-2、粉彩 concept-3、芥末 wasabi-2、手捲 temaki 1、噴火 fire 1。

他要求再改的是：飯要更像真的飯、配料要坐在飯上、芥末的樣子。放上網站的是他核准的成品。

提示詞和候選圖留在儲存庫外面，不在這個目錄。

## 不確定

- 店面與食材裡，除了手捲前後層（`food/temaki.webp`、`food/temaki-front.webp`）、芥末（`food/wasabi.webp`，內容是 wasabi-2）和噴火貼紙（`duoduo/sticker-fire.webp`）以外，單張是 2026-10-13 還是 2026-10-14 生的，git 只看得到 `#214` 一次加入。日期欄寫不確定。
- `sm/` 的 commit 是 `f50202eb`（2026-10-14，直接在 main）。GitHub 沒有把這個 commit 關聯到 PR，所以對應 PR 寫不確定。
- 封面在 2026-10-11 的 `83483ed2` 換過一版生成圖，那個 commit 也沒有關聯 PR。現在這張是 2026-10-13、`#212` 放上的核准原檔（1536×1024）。
- `cover.webp` 和 `shop/wall.webp` 不透明。有沒有做過去白邊，不確定。
- 單張實際呼叫的模型沒有留在 git。模型欄是依透明度規則填的，不是逐檔 log。
