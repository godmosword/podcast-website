# 成長量測基線（Growth-Measure-1a）

> 每週人工記錄 Spotify／Apple／YouTube／SoundOn 後台指標。**勿 commit 個資**（截圖、CSV 僅存本機）。

## 檔案慣例

| 類型 | 檔名範例 | 說明 |
|------|----------|------|
| 週報筆記 | `weekly-2026-W28.md` | 文字摘要 + 週起迄 |
| 截圖 | `weekly-2026-W28-*.png` | 後台截圖（gitignore） |
| 匯出 CSV | `weekly-2026-W28-*.csv` | 平台匯出（gitignore） |

## 每週必填欄位

| 平台 | 訂閱／追蹤 | 播放／收聽 | 完播／留存 | 流量來源備註 |
|------|-----------|------------|------------|--------------|
| Spotify | | | | |
| Apple Podcasts | | | | |
| YouTube | | | | |
| SoundOn | | | | |

## 官網 UTM（Growth-Measure-1b）

外連至收聽平台已加：

- `utm_source=cheche_web`
- `utm_medium=story_page | footer | subscribe_cta`
- `utm_campaign=<slug|site>`

實作：`lib/platform-utm.ts`、`TrackedPlatformLink`。

## SoundOn show notes 回鏈（Growth-Measure-1）

官網→SoundOn 為單向；**回鏈在 SoundOn 後台手動貼入** show notes（sync 管線不寫入 SoundOn）。

```bash
# 產生帶 UTM 的單集 URL（貼到 SoundOn 該集 show notes 尾段）
node -e "const { soundOnStoryBacklinkLine } = require('./lib/soundon-backlink'); console.log(soundOnStoryBacklinkLine('ep-18','集數標題'))"
```

或於程式庫：

```ts
import { soundOnStoryBacklinkLine } from "@/lib/soundon-backlink";
soundOnStoryBacklinkLine(slug, title);
```

建議格式：`看圖聽完整故事：<標題>\n<官網 URL>`。`utm_medium=story_page`、`utm_campaign=<slug>`。

## 參考

- [GEO baseline](./GEO-baseline-2026-07-10.md)
- [geo-checklist](../geo-checklist.md)
