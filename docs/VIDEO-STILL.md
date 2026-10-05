# 看圖聽故事：用現有插圖接成 YouTube 影片

多一條影片，不取代 podcast。聲音仍用該集的 `audio.mp3`。Apple、Spotify、RSS 都不動。

這份是現在要做的出片路。不呼叫生片模型，不新畫插圖。每一幕整段時間都是已上線的 `NN.jpg`，只加慢推與幕與幕之間的短淡入。生片留到這支看完、確定靜止畫面不夠的時候，規格在 [VIDEO-GENERATE.md](./VIDEO-GENERATE.md)，這一輪不做。

適用對象是**已經全幕上線**的集：`pageCount > 1`，而且 `data/scenes/<slug>.json` 與 `public/stories/<slug>/NN.jpg` 都在。`pageCount = 1` 的單張封面不走這份，仍用 [VIDEO-EXPORT.md](./VIDEO-EXPORT.md)。

`<slug>` 換成該集代號。這份不指定哪一集先做。

## 已經有的

| 步驟 | 位置 | 這份怎麼用 |
|------|------|----------|
| 字幕校對標記 | `data/subtitles/_proofread/<slug>.json` | 沒有標記就不匯出 |
| 分幕 | `data/scenes/<slug>.json` | 每幕 `start`／`end` 決定這張圖出現多久 |
| 插圖 | `public/stories/<slug>/NN.jpg` | 1400 正方形，不覆蓋 |
| 靜圖匯出 | `npm run export:video -- <slug>` | 今天只把圖硬接，左右黑邊。這份要改的是這支指令的畫面，不劣開第二個指令 |

產物仍在 `export/video/<slug>/<slug>.mp4`（gitignore）。YouTube Studio 手動上傳。

## 畫面

一幕一張 `NN.jpg`，時長 `L = end - start`。不循環，不接生片。

每幕只做一種運鏡，預設慢推：起始縮放 1.00，結束縮放 1.06，等速，鏡頭中心不動。不切鏡，不加速，不晃鏡。這一輪不逐幕改運鏡方向。

幕與幕之間交叉淡化 `F = 0.4` 秒，寫成常數。淡化吃掉的是前一幕的尾與下一幕的頭，兩幕輸出長度加起來仍然等於各自的 `L`。某一幕 `L < 1.5` 秒時，這一個接點改硬切，不做淡化。第一幕之前、最後一幕之後不加額外畫面。

正方形縮放到高 1080，左右墊到 1920×1080。整支影片只用一種墊色，寫成一個常數。現況是黑邊；顏色沒定之前不換，換的時候只改這一個常數，靜圖幕跟有運鏡的幕讀同一個。

所有段落先統一 fps、尺寸、`yuv420p`、SAR 1:1 再接。fps 以現在的靜圖匯出為準。

音軌只鋪 `public/stories/<slug>/audio.mp3`。字幕仍用 `data/subtitles/<slug>.json` 逐句燒進畫面，不因為加了運鏡就改字幕規格。

接完的影片總長要和音軌一致，差一幀以內；不符就報錯，不出片。

## 步驟

### 1. 確認校對標記

看 `data/subtitles/_proofread/<slug>.json` 在不在，且句數與 `data/subtitles/<slug>.json` 一致。沒有標記才跑：

```bash
npm run proofread:subtitles -- <slug>
npm run proofread:subtitles -- <slug> --mark
```

不要為了出片重轉錄。標記已在就不要重跑 `--mark`。

### 2. 讀現有分幕，不要重切

分幕以 `data/scenes/<slug>.json` 為準。檔案已在時，**不要**跑 `npm run illustrate -- <slug> --segment-only`。

### 3. 不重畫插圖

已上線的 `NN.jpg` 就是畫面。不為了 YouTube 改成 16:9，也不覆蓋這些檔。要重抽某一幕時，仍先列出幕號、原因與張數，等文字確認才跑 `npm run illustrate -- <slug> --scene N`。整集 `npm run illustrate -- <slug>` 不在這份流程裡。

### 4. 匯出

```bash
npm run export:video -- <slug>
```

這一行不綁某一集。改完之前，同一行仍然只出現在的硬接靜圖。

出片前印出每一幕：幕號、`L`、這幕是慢推還是因為太短而硬切。

### 5. 人看一次

整支從頭看到尾，只看這幾項：

- 每一幕都是該幕的 `NN.jpg`，沒有裁掉主體。
- 慢推沒有抖，淡化沒有黑幀。
- 左右墊邊整支同一色。
- 字幕對得上旁白，沒有被運鏡推出畫面。
- 總長與 `audio.mp3` 一致。

不過就改常數或修匯出，不重畫。

### 6. 手動上傳與站上播放頁

上傳步驟與播放頁嵌入跟 [VIDEO-GENERATE.md](./VIDEO-GENERATE.md) 的「手動上傳」「站上播放頁」相同：不做 YouTube API，兒童製作，播放清單不變。這一路沒有生片，不勾「變造／合成媒體」。編號仍放 `data/youtube-ids.ts`，不寫進 `apple-synced.json`。

## 先不做

- 不呼叫任何生片模型，不建 `data/clips/`，不為片段另做備份。
- 不重錄、不改 RSS、不一次補全部集數。
- 不把站上正方形改成 16:9。看過試片之後若留邊不能接受，再另做橫圖，另存，不覆蓋 `NN.jpg`。
- 不做 9:16 Shorts，不做自動上傳。
- 不逐幕指定推、移或停。要這種控制，另開一份，不塞進這次的匯出。

## 做不到的地方

畫裡的東西不會自己動。慢推只讓畫面不像幻燈片。若這支看完仍然像幻燈片，下一步才是拿同一張 `NN.jpg` 去試一支生片，不在這份裡先選模型。

## 相關文件

- [VIDEO-EXPORT.md](./VIDEO-EXPORT.md) — 現有靜圖 mp4 匯出
- [VIDEO-GENERATE.md](./VIDEO-GENERATE.md) — 生片路，這一輪不做
- [EPISODE-WORKFLOW.md](./EPISODE-WORKFLOW.md) — 全幕插圖與校對閘門
