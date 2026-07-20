# YouTube 整集影片匯出 Workflow

將站上「看圖聽故事」素材匯出為 **1920×1080** mp4，供 **YouTube Studio 手動上傳**。換頁時間來自場景切分；字幕為 **`data/subtitles/<slug>.json` 原始逐句側車**（與播放器即時字幕相同），**burn-in** 燒進影片。

> **不做**：YouTube API 自動上傳、9:16 Shorts（見 TODOS REUSE-3 二期）。

## 在營運管線中的位置

```
illustrate --approve（全幕插圖上線）
    ↓
proofread --mark（若尚未完成）
    ↓
【本文件】npm run export:video -- ep-N
    ↓
YouTube Studio 手動上傳 + 設定（兒童向／AI 標示）
```

詳見 [EPISODE-WORKFLOW.md](./EPISODE-WORKFLOW.md) 與 [TODOS — 營運管線 Phase 4](../TODOS.md)。

## 字幕來源（重要）

| 來源 | 粒度 | 本 workflow |
|------|------|-------------|
| `data/subtitles/*.json` | 逐句 `{ t, text }` | **使用**（burn-in） |
| `captions` + `captionTimes` | 每幕一句（故事大綱） | **不用**（RSS／`transcript.vtt` 亦用 `subtitles` 側車，非 captions） |

YouTube 影片字幕應與站上播放器看到的**逐句**內容一致，而非幕級 `captions`。

## 前置條件

1. **全幕生圖**（建議）：`pageCount > 1`、插圖 = scenes 幕數 → `npm run verify:episodes`
2. **字幕校稿**：`npm run proofread:subtitles -- ep-N --mark`（未 mark 時 CLI 會擋，可用 `--force` 略過）
3. **本機工具**：
   - **ffmpeg**（含 **libass**）：Homebrew 請用 `brew install ffmpeg-full`（一般 `ffmpeg` 公式不含 subtitles filter）
   - **fonttools**：`brew install fonttools`（提供 `pyftsubset` CLI；**不是** `python3 -m fontTools`）
   - **huninn TTF**：`HUNINN_TTF` 或預設 `/tmp/huninn.ttf`

```bash
curl -sL https://github.com/justfont/open-huninn-font/releases/download/v2.1/jf-openhuninn-2.1.ttf -o /tmp/huninn.ttf
```

## 匯出指令

```bash
# 標準匯出
npm run export:video -- ep-9

# 略過未 --mark 警告（草稿字幕，不建議）
npm run export:video -- ep-9 --force

# 只印 manifest 與 ffmpeg 計畫，不跑合成
npm run export:video -- ep-9 --dry-run
```

### 產物（gitignore）

```
export/video/ep-9/
  ep-9.mp4           # 整集 1080p，字幕已 burn-in
  manifest.json      # 時長、幕數、字幕句數
  _work/             # ASS、子集字型、暫存
```

### MVP 降級（`pageCount = 1`）

僅有 Apple 封面 `01.jpg` 時仍可匯出：整段音檔配單張靜圖 + 逐句字幕。CLI 會警告；視覺較單調，適合搶先上片或預告。

## 合成邏輯（摘要）

1. **換圖**：`data/scenes/<slug>.json` 每幕 `start`/`end` → `public/stories/<slug>/NN.jpg`；最後一幕補齊至音檔結尾
2. **音長**：`scenes.audioDuration` → ffprobe `audio.mp3` → 最後一句字幕 `t + 3`
3. **字幕**：逐句 ASS，置底白字 + 黑邊；字型依字幕 charset 子集 `jf-openhuninn-2.1`
4. **ffmpeg**：多圖 concat + `ass` filter → H.264 + AAC

## YouTube Studio 上架（手動）

1. 上傳 `export/video/ep-N/ep-N.mp4`（無需另附 .srt）
2. **標題**：與 podcast 一致或加「看圖聽故事｜…」
3. **描述**：官網 `https://…/story/ep-N`、Apple／Spotify 連結
4. **設定**：
   - **為兒童製作**（Made for kids）
   - **變造／合成媒體**（AI 插圖）
   - 加入播放清單：[既有 YouTube playlist](https://www.youtube.com/playlist?list=PLVbyl20K8lOeuJ2ky6dEsmpew7xAxZDhF)
5. **縮圖**：可沿用 `01.jpg` 或另做 16:9

## 故障排除

| 問題 | 處理 |
|------|------|
| 找不到 huninn | 執行上方 curl，或 `export HUNINN_TTF=/path/to.ttf` |
| `subtitles filter` 不存在 | `brew install ffmpeg-full`（一般 `ffmpeg` 不含 libass） |
| `fontTools.subset` 找不到 | 改用 `brew install fonttools`（腳本會呼叫 `pyftsubset`） |
| 字幕方塊／缺字 | 確認 ASS 字型名 `jf-openhuninn-2.1` 與子集 TTF 一致；重跑 export |
| 缺插圖 | `npm run illustrate -- ep-N --approve` |
| 畫面比音短 | 已自動補最後一幕；若仍異常，檢查 `scenes` 的 `audioDuration` |

## 相關文件

- [SUBTITLE-PROOFREAD.md](./SUBTITLE-PROOFREAD.md) — 校稿與 `--mark`
- [EPISODE-WORKFLOW.md](./EPISODE-WORKFLOW.md) — 全幕生圖標準
- [README — 字型維護](../README.md#字型維護)
