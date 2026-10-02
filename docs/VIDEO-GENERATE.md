# 看圖聽故事：生成 YouTube 影片

多一條影片，不取代 podcast。聲音仍用該集的 `audio.mp3`。Apple、Spotify、RSS 都不動。

適用對象是**已經全幕上線**的集：`pageCount > 1`，而且 `data/scenes/<slug>.json` 與 `public/stories/<slug>/NN.jpg` 都在。`pageCount = 1` 的單張封面不走這份；那種集仍用 [VIDEO-EXPORT.md](./VIDEO-EXPORT.md) 的單圖匯出。

`<slug>` 換成該集代號。這份不指定哪一集先做。

## 已經有的

| 步驟 | 指令／位置 | 現況 |
|------|------------|------|
| 字幕校對標記 | `data/subtitles/_proofread/<slug>.json` | 沒有標記時，生圖與匯出都會擋 |
| 分幕 | `data/scenes/<slug>.json` | 每幕有 `start`／`end` |
| 插圖 | `public/stories/<slug>/NN.jpg` | 1400 正方形 |
| 靜圖匯出 | `npm run export:video -- <slug>` | 1920×1080 mp4，逐句字幕燒進畫面，配 `audio.mp3` |

靜圖匯出今天只會把圖接起來。正方形進 1920×1080 時左右留邊，`pad` 沒指定顏色，邊是黑的。產物在 `export/video/<slug>/<slug>.mp4`（gitignore）。YouTube Studio 手動上傳。站上播放頁仍是 `StoryPlayer`。

## 這次要加的

1. 每一幕可以有一支無聲短片。第一幀是該幕已通過的插圖。向模型要的秒數不超過該模型上限，也不超過幕長。片段要人審過才進匯出。生成與審片結果記在 `data/clips/<slug>.json`。停格是設計的一部分。
2. 匯出時只用審過的片段。片段結尾淡回該幕插圖，停在插圖直到該幕 `end`。沒有片段的幕維持靜圖。整支影片只用一種墊邊顏色。
3. 旁路檔 `data/youtube-ids.ts` 以 slug 對應 YouTube 影片編號。有非空編號，`/story/<slug>/play` 才嵌 `youtube-nocookie.com`。沒有編號就維持 `StoryPlayer`。

片段生成與「匯出改接片段」都還沒有 CLI。在那兩段落地之前，`npm run export:video -- <slug>` 仍然只出靜圖。

## 步驟

### 1. 確認校對標記

看 `data/subtitles/_proofread/<slug>.json` 在不在，且句數與 `data/subtitles/<slug>.json` 一致。沒有標記才跑：

```bash
npm run proofread:subtitles -- <slug>
npm run proofread:subtitles -- <slug> --mark
```

不要為了出片重轉錄。標記已在就不要重跑 `--mark`。

### 2. 讀現有分幕，不要重切

分幕以 `data/scenes/<slug>.json` 為準。檔案已在時，**不要**跑 `npm run illustrate -- <slug> --segment-only`。那個指令會呼叫模型並覆寫場景檔，連已上線的秒數和提示詞一起換掉。

幕長就是該幕的 `end - start`。全幕集通常是十幾秒到幾十秒，第一幕或結尾幕可能更長。

### 3. 不重畫插圖

已上線的 `NN.jpg` 就是第一幀。站上播放頁用的是正方形，不為了 YouTube 改成 16:9，也不覆蓋這些檔。

要重抽某一幕時，仍先列出幕號、原因與張數，等文字確認才跑：

```bash
npm run illustrate -- <slug> --scene N
```

整集 `npm run illustrate -- <slug>` 不在這份流程裡。

### 4. 每幕一支無聲短片

工具另定。定了才寫模型名稱、版本、可選秒數與輸出尺寸。沒定之前，這一步停著，現在不能跑。

選型條件：

- 要有真正的首幀輸入，不是只拿來當風格參考。先用一幕試一支，第一幀要和 `NN.jpg` 構圖一致。
- 優先選支援 1:1 輸出的模型。
- 支援尾幀輸入是加分，不是必要。
- 非同步 API 要能用 job id 回頭查狀態。

**輸入。** 一幕一張已上線的 `NN.jpg`，當第一幀。只送這一張，不另附角色參考圖。場景檔裡的 `characters` 只是名字。尺寸必須等於該模型要求的輸出尺寸。

- 模型支援 1:1：送正方形，只縮放，不墊邊。
- 模型只出 16:9：送進去前用墊色墊邊，生成後先裁回中央正方形再存檔。模型畫進邊條的東西一律丟掉。
- 模型支援尾幀：尾幀也給同一張 `NN.jpg`。

墊色寫成一個常數，生成和匯出都讀它，不要兩邊各寫一次。顏色另定。存進 `clips/` 的片段一律是正方形。

**提示詞。** 每幕送出的提示詞是「固定約束」加上「該幕一句動作描述」。固定約束寫在程式裡，不逐幕改：

- 動作緩慢、幅度小。
- 鏡頭固定，或極慢推移。不切鏡、不轉場。
- 不加新角色、新物件、文字或字幕。
- 角色不張嘴說話。旁白沒有對嘴，嘴巴動了會對不上。
- 維持原圖的畫風與配色。

模型支援負面提示時，上面幾條也寫進去。動作描述要人看過，列在確認清單裡。

**確認。** 每一幕列六項：

1. 幕號
2. 幕長（`end - start`）
3. 向模型要的秒數：該模型可選秒數中，不超過幕長的最長一檔。幕長比最短一檔還短，這一幕不做片段，維持靜圖。
4. 預估停格秒數：幕長減掉要的秒數。實際以匯出時量到的片段長度為準。
5. 動作描述
6. 預估費用

最後一行列整集總額。

紀錄檔裡已經是 `approved` 的幕預設跳過，不列進清單。要重抽得明確寫出幕號與原因。

等文字確認才跑。沒確認前不得整集連跑。

**送出與重試。**

- 每支送出後，先把 job id 寫進紀錄檔，再開始輪詢。
- 輪詢 timeout 不等於失敗。用 job id 回頭查：還在跑就繼續等，確定失敗才重送。
- 確定失敗或 5xx：同一幕最多重送一次。
- 被內容審核擋下：不重送，這一幕留空，原因寫進紀錄檔。
- 送出時斷線、沒拿到 job id：先確認服務端有沒有建出 job，再決定要不要重送。job 可能已經在跑、在計費，直接重送等於付兩次。

停格是設計的一部分，不是失敗。某一幕失敗就留空。匯出時那一幕退回靜圖，不擋其他幕。

**產物。**

```
export/video/<slug>/clips/NN.mp4
```

`NN` 對應該幕 `index`（兩位數）。目錄已在 `.gitignore` 的 `/export/video/` 底下，不進 `public/stories`。

片段是花錢、重抽也不會一樣的素材，不是建置產物。生成後另外備份到不會被清掉的地方（例如 R2），位置寫進紀錄檔。

**紀錄檔。** `data/clips/<slug>.json`，進 git：

```json
{
  "slug": "<slug>",
  "model": "<模型名稱>",
  "modelVersion": "<版本>",
  "padColor": "<墊色>",
  "clips": [
    {
      "index": 1,
      "action": "鏡頭不動，樹葉輕輕晃動",
      "prompt": "<實際送出的完整提示詞>",
      "requestedSeconds": 5,
      "actualSeconds": 5.04,
      "seed": null,
      "jobId": "<job id>",
      "cost": 0,
      "status": "approved",
      "reason": "",
      "backup": "<備份位置>"
    }
  ]
}
```

`seed` 模型有提供才填。`status` 只有五種：`submitted`（已送出，有 job id）、`generated`（檔案已存）、`approved`、`rejected`、`failed`。匯出只認 `approved`。

### 5. 審片

由人看，不由程式或模型判斷。片段生成完，列出這一集所有 `generated` 的幕，等文字逐幕回覆通過或不通過。

每支從頭看到尾，看這幾項：

- 第一幀與 `NN.jpg` 構圖一致。
- 角色造型沒有走樣，沒有多出或消失的部分。
- 沒有新角色、文字、浮水印。
- 沒有張嘴說話。
- 動作夠慢，沒有閃爍或突然跳動。
- 最後一秒畫面乾淨。匯出時這一秒會和 `NN.jpg` 疊在一起淡過去。
- 從 16:9 裁回正方形的，邊緣沒有被切掉一半的東西。

通過：紀錄檔標 `approved`。不通過：標 `rejected`，寫原因，檔案移到 `clips/_rejected/`。要重抽就回到第 4 步重新列確認。

沒審過的片段不進匯出。

### 6. 匯出

這支指令今天仍只出靜圖；`export-video-core.ts` 改成讀紀錄檔與 `clips/` 之後，才用同一行指令：

```bash
npm run export:video -- <slug>
```

只用紀錄檔裡 `approved` 的片段。其他幕（沒有片段、失敗、未審、不通過）一律用靜圖 `NN.jpg`，不擋整集。

有片段的幕，`L` 是幕長（`end - start`），`d` 是用 ffprobe 量到的片段實際長度。不用紀錄檔裡要的秒數。

- `d >= L`：片段裁到 `L`，沒有停格。
- `d < L`：片段最後 `F` 秒交叉淡化到 `NN.jpg`，之後停在 `NN.jpg` 直到該幕 `end`。不循環。

`F` 寫成常數，建議 0.8 秒。停格畫面是已通過的插圖，不是片段的最後一幀。每幕輸出長度必須剛好等於 `L`。

畫面規格：

- 所有段落先統一 fps、尺寸、pixel format（`yuv420p`）、SAR（1:1）再接。fps 以現在的靜圖匯出為準。
- 正方形縮到高 1080，左右用墊色墊到 1920×1080。靜圖幕也用同一個墊色，整支影片只有一種邊色。墊色換掉之後，只出靜圖的集也會跟著換。

音軌只鋪 `public/stories/<slug>/audio.mp3`，片段自帶的聲音丟掉。字幕仍用 `data/subtitles/<slug>.json` 逐句燒進畫面。

出片前印出每一幕的對照：幕號、用片段還是靜圖、`L`、`d`、停格秒數。接完的影片總長要和音軌一致，差一幀以內；不符就報錯，不出片。

產物路徑不變：`export/video/<slug>/<slug>.mp4`。

### 7. 手動上傳

不做 YouTube API。

1. 上傳 `export/video/<slug>/<slug>.mp4`。
2. 標題與 podcast 一致，或加上「看圖聽故事」。
3. 描述放官網 `https://podcast-website-mu.vercel.app/story/<slug>`，以及該集的 Apple、Spotify 連結。
4. 設定為兒童製作，並標變造／合成媒體。
5. 放進播放清單 `PLVbyl20K8lOeuJ2ky6dEsmpew7xAxZDhF`。

### 8. 站上播放頁

程式可以先接，編號等上傳後才寫。

- 編號放在 `data/youtube-ids.ts`，鍵是 slug，值是非空的影片編號。不要寫進 `apple-synced.json` 或 `apple-sync.defaults.json`；同步白名單不會把這個欄位送到播放頁。
- `app/story/[slug]/play`：有編號才嵌 `https://www.youtube-nocookie.com/embed/<id>`。不要自動有聲播放。
- 沒有編號就用現在的 `StoryPlayer`。
- 一旦嵌入，這一頁不再走站上播放器：睡前定時、翻頁、逐句字幕、聽完反思都不會出現。聲音是影片裡已經鋪好的 `audio.mp3`。
- 目錄、RSS、故事詳情頁、這份匯出以外的頁面先不動。

## 先不做

- 不重錄、不改 RSS、不一次補全部集數。
- 不把站上正方形改成 16:9。看過試片之後若留邊不能接受，再另做橫圖，另存，不覆蓋 `NN.jpg`。
- 不做 9:16 Shorts，不做自動上傳。
- 單張封面集維持靜圖匯出。

## 相關文件

- [VIDEO-EXPORT.md](./VIDEO-EXPORT.md) — 現有靜圖 mp4 匯出
- [EPISODE-WORKFLOW.md](./EPISODE-WORKFLOW.md) — 全幕插圖與校對閘門
- [SUBTITLE-PROOFREAD.md](./SUBTITLE-PROOFREAD.md) — `--mark`
