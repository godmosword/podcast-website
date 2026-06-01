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
| `npm run font:subset` | 重新子集化中文字型（新增文案後執行，見下方） |

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

4. **重生中文字型子集**（若新增了標題/大綱/字幕等新文字）

```bash
npm run font:subset   # 需要 /tmp/huninn.ttf，見「字型維護」
```

5. **驗證**

```bash
npm test
npm run build
```

6. **部署** — push 後 CI/平台自動建置即可。

### 檢查清單

- [ ] `slug` 與 `public/stories/<slug>/` 資料夾名稱一致
- [ ] `01.jpg` 存在且可在本機開啟
- [ ] `audio.mp3` 可在播放器播放
- [ ] `ep` 為目前最大集數 + 1
- [ ] 詳情頁分享預覽正常（title / 描述 / 封面圖）
- [ ] 若有新中文字 → 已重跑 `npm run font:subset`

## 專案結構

```
app/                    Next.js App Router
  page.tsx              首頁（篩選 + 卡片）
  story/[slug]/         故事詳情（SEO metadata）
  story/[slug]/play/    全螢幕播放器
  fonts/                自託管中文字型子集（huninn woff2）
components/             UI 元件
  decor/                SVG 裝飾（雲、馬路、輪子、星星、彩帶）
data/stories.ts         故事資料（單一真相源）
lib/                    共用工具（路徑、metadata）
scripts/                字型子集 / 圖示 / 佔位圖產生器
public/stories/         每集音檔與插圖
```

## 音檔體積建議

目前每集 MP3 約 4–7MB。若要優化行動載入：

```bash
# 需安裝 ffmpeg
ffmpeg -i audio.mp3 -codec:a libmp3lame -b:a 128k -ac 1 audio-optimized.mp3
```

播放器使用 `preload="metadata"`，進入播放頁才開始載入完整音檔。

## 字型維護（圓體中文）

中文用自託管的 **jf-open 粉圓（huninn）**，但只內嵌「網站實際用到的字」以維持輕量
（`app/fonts/huninn-subset.woff2`，約 100KB；完整字型 4.9MB）。拉丁字母與數字由
Baloo 2 提供，字型堆疊見 `app/globals.css`。

**新增/修改文案後**，若出現先前沒用過的中文字，需重生子集，否則該字會回退系統圓體：

```bash
# 1) 下載完整字型（一次即可）
curl -sL https://github.com/justfont/open-huninn-font/releases/download/v2.1/jf-openhuninn-2.1.ttf -o /tmp/huninn.ttf
# 2) 重生子集（掃描 data/app/components/lib 的文字）
npm run font:subset
# 3) commit app/fonts/huninn-subset.woff2
```

子集腳本：`scripts/subset_font.py`（需 `fonttools` + `brotli`：`pip install fonttools brotli`）。

## 視覺素材（佔位圖 / 圖示 / 吉祥物）

- **裝飾元件**：`components/decor/`（雲、馬路、輪子、星星、彩帶，皆為內嵌 SVG）。
- **佔位插圖**：`scripts/gen_placeholders.py` 產生；若資料夾已有真實插圖則不覆蓋。
- **PWA / iOS 圖示與吉祥物**：`scripts/gen_icons.py`（`python3 scripts/gen_icons.py build sky`）。

動效全部包在 `prefers-reduced-motion: reduce` 守門內（`app/globals.css`），系統開啟「減少動態」時自動停用位移/旋轉。

## 授權與內容

Podcast 音檔與品牌內容屬 Bonbon & 馬米。再分發前請確認 SoundOn / 版權授權範圍。
