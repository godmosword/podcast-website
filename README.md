# 車車遊樂園

Bonbon & 馬米親子 podcast 的官方看圖聽故事網站。Next.js 15 全靜態（SSG），零後端。

- 版本：**1.1.0** — 詳見 [CHANGELOG.md](./CHANGELOG.md)
- 待辦與路線圖 — 見 [TODOS.md](./TODOS.md)

## 本機開發

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 指令

| 指令 | 用途 |
|------|------|
| `npm run dev` | 開發伺服器 |
| `npm run build` | 正式建置（SSG） |
| `npm run start` | 執行建置結果 |
| `npm test` | 執行資料層單元測試 |

## 部署

適合 Vercel、Netlify 等靜態/Edge 平台。建置後所有頁面預渲染，無伺服器需求。

**正式環境請設定：**

```bash
NEXT_PUBLIC_SITE_URL=https://你的網域
```

用於 Open Graph / Twitter 分享圖的絕對網址。在 Vercel 上若未設定，會 fallback 到 `https://${VERCEL_URL}`。

## 新增一集故事（SOP）

1. **建立資料夾**  
   `public/stories/<slug>/`  
   - `slug` 用英文小寫，與網址一致（例：`firetruck`）

2. **放入檔案**
   - `audio.mp3` — 該集音檔（建議 mono 128kbps，單檔 < 5MB）
   - `01.jpg` — 封面/第一頁插圖（若有更多頁：`02.jpg`、`03.jpg`…）

3. **編輯 `data/stories.ts`** — 在 `stories` 陣列加一筆：

```ts
{
  slug: "firetruck",
  ep: 7,                    // 比現有最大值 +1
  title: "標題",
  date: "2026-06-01",       // ISO 日期
  duration: "5:30",         // 選填
  vehicle: "消防車",
  emoji: "🚒",
  color: "#e03131",
  audio: "audio.mp3",
  pageCount: 1,             // 多頁插圖時改為實際張數
  summary: "一句話大綱",
  tags: ["勇敢", "合作"],
  captions: [               // 選填：字幕跟讀，每句一行
    "第一句…",
    "第二句…",
  ],
},
```

4. **驗證**

```bash
npm test
npm run build
```

5. **部署** — push 後 CI/平台自動建置即可。

### 檢查清單

- [ ] `slug` 與 `public/stories/<slug>/` 資料夾名稱一致
- [ ] `01.jpg` 存在且可在本機開啟
- [ ] `audio.mp3` 可在播放器播放
- [ ] `ep` 為目前最大集數 + 1
- [ ] 詳情頁分享預覽正常（title / 描述 / 封面圖）

## 專案結構

```
app/                    Next.js App Router
  page.tsx              首頁（篩選 + 卡片）
  story/[slug]/         故事詳情（SEO metadata）
  story/[slug]/play/    全螢幕播放器
components/             UI 元件
data/stories.ts         故事資料（單一真相源）
lib/                    共用工具（路徑、metadata）
public/stories/         每集音檔與插圖
```

## 音檔體積建議

目前每集 MP3 約 4–7MB。若要優化行動載入：

```bash
# 需安裝 ffmpeg
ffmpeg -i audio.mp3 -codec:a libmp3lame -b:a 128k -ac 1 audio-optimized.mp3
```

播放器使用 `preload="metadata"`，進入播放頁才開始載入完整音檔。

## 授權與內容

Podcast 音檔與品牌內容屬 Bonbon & 馬米。再分發前請確認 SoundOn / 版權授權範圍。
