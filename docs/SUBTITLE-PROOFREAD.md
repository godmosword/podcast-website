# 字幕校對 Workflow

Whisper 轉錄產出的是**草稿**，會在播放器即時顯示。在切場景、生圖、`--approve`（寫入幕級 `captions` 到站上）之前，**必須完成字幕校對**。

## 在新集流程中的位置

```
SoundOn 上架
    ↓
GHA sync:apple（音檔 + 封面 + Whisper 草稿字幕 + 簡轉繁 + 自動 --fix）
    ↓
【本文件】最終校稿 + --mark          ← 更新到繪本／幕級字幕前的閘門
    ↓
illustrate（segment → 生圖 → approve）
    ↓
verify → commit push
```

> **MVP 上線說明：** GHA 會先部署 `pageCount=1` + 草稿字幕，供抽查播放。同步腳本會對**本輪新集／新轉錄**字幕自動跑 `--fix`（Bonbon／馬米等品牌名），**不會**自動 `--mark`。正式生圖管線（illustrate）在 `--mark` 之前**會被 CLI 擋下**，避免未校對台詞流入 scenes／captions。

## 指令

```bash
# 0. 若 sync 未轉錄（本機補跑）
npm run transcribe -- ep-N

# 1. Lint 報告（列出待修項；GHA 已跑過 --fix 時通常剩同音誤字）
npm run proofread:subtitles -- ep-N

# 2. （本機補跑）自動修正高信心項（Bonbon／馬米品牌名、多餘空白）
#    GHA sync 對新集已自動執行；本機 transcribe 補跑後可手動再 --fix
npm run proofread:subtitles -- ep-N --fix

# 3. 人工編輯側車檔
#    編輯 data/subtitles/ep-N.json

# 4. 再次 lint，通過後標記（illustrate 閘門）
npm run proofread:subtitles -- ep-N --mark
```

校對標記寫入 `data/subtitles/_proofread/ep-N.json`（含句數，字幕改動後需重新 `--mark`）。

## 校對清單

### 必改（品牌／專名）

| 誤聽 | 正確 |
|------|------|
| 寶寶、Bon Bon | **Bonbon** |
| 媽咪、马米 | **馬米** |
| 該集主角車名（如小蔥、菜車） | 對照 `data/apple-synced.json` summary／`data/characters.json` canonical 名 |

### 常見同音誤字（依語境判斷）

| 誤聽 | 常見正解 | 備註 |
|------|----------|------|
| 全部都**按**了下來 | **暗**了下來 | 燈光變暗 |
| 喜歡**吃雞** | 喜歡**刺激** | 賽車角色語境 |
| 需要**按摩** | 需要**安慰** | 情緒支持 |
| 不小心**買車** | **開太快**／飆車 | 口語誤聽 |
| **貫**車 | **貨**車 | |
| 太**擠**了 | 太**急**了 | |

### 刪除

- Whisper 幻覺：`字幕:XXX`、`請訂閱`、`謝謝收看` 等（腳本已濾一輪，仍要抽查）

### 格式

- 逐字稿保留口語「呢、喔、啊」即可（兒童 podcast 風格）
- 簡轉繁已由 transcribe 處理；少數漏網詞人工改

## 與 illustrate 的關係

| 操作 | 需 `--mark` |
|------|-------------|
| `illustrate --segment-only` | ✅ |
| `illustrate` / `--from-scenes` | ✅ |
| `illustrate --approve` | ✅（`pageCount>1` 舊集除外） |
| `illustrate --scene N` / `--char` | 否（場景已存在時） |

繞過：`illustrate` 不支援跳過校對；請先完成 `--mark`。

## Agent 路由

中文字幕校對任務請用 **Sonnet 4.6**（見 [AGENT-WORKFLOW.md](./AGENT-WORKFLOW.md)），完成後執行 `--mark`。

## 相關文件

- [EPISODE-WORKFLOW.md](./EPISODE-WORKFLOW.md) — 全幕插圖標準步驟
- [README — 自動字幕](../README.md#自動字幕逐字即時字幕npm-run-transcribe)
