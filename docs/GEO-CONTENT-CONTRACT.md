# GEO 內容欄位契約

> 目的：釐清單集「家長向」內容欄位的責任邊界，避免同一套親子提示被兩處資料重複維護，也避免頁面為了 GEO 堆滿可見文字。  
> 關聯任務：REUSE-2（`parentGuide`）、GEO 第二階段（低干擾閱讀）。  
> 最後更新：2026-07-20

## 原則

1. **一個意圖、一個欄位、一個主通路** — 同一句親子提問不要同時寫進 `familyActivity` 與 `parentGuide`。
2. **可見層短、機器層全** — 頁面預設少字；完整語意走 JSON-LD、`llms-full`、VTT、RSS（見 `docs/geo-checklist.md`）。
3. **互動與 SEO 分離** — 播放器／結束畫面的互動提示，不另塞一題進 FAQPage JSON-LD。

## 場景字幕 vs 完整逐字稿（P0 契約）

| 種類 | 資料來源 | 粒度 | 允許對外稱「完整逐字稿」 | 主要通路 |
|------|----------|------|--------------------------|----------|
| **場景字幕** | `story.captions` + `captionTimes` | 每翻頁一幕一句（看圖提示／故事大綱） | **否** | 故事頁「故事大綱」HTML、播放器翻頁輔助 |
| **完整逐字稿** | `data/subtitles/<slug>.json`（`getSubtitles`） | 音檔逐句 `{ t, text }` | **是** | `/story/<slug>/transcript.vtt`、RSS `podcast:transcript`、JSON-LD `MediaObject`（`text/vtt`）、`llms-full`「完整逐字稿」行 |

**程式錨點（單一真相）：** [`lib/transcript.ts`](../lib/transcript.ts) — `hasSceneCaptions`、`hasFullTranscript`／`validateFullTranscript`、`hasTranscriptVtt`、`buildFullTranscriptVtt`；字幕側車由 [`lib/subtitles.ts`](../lib/subtitles.ts) 驗證非空文字、非負且單調時間，build gate 另以 `data/scenes/<slug>.json` 的 `audioDuration` 檢查 cue 不超出音檔；舊名 `hasVtt`／`buildStoryVtt` 語意已對齊完整逐字稿。

**禁止：** 用場景 `captions` 產生 `transcript.vtt`、在 JSON-LD／RSS／頁面文案把場景字幕標成「完整逐字稿」或「逐字字幕」。

## 欄位對照

| 欄位 | 資料來源 | 字數／語氣 | 頁面呈現 | RSS | JSON-LD | llms-full |
|------|----------|------------|----------|-----|---------|-----------|
| `familyActivity` | `data/family-activities.ts` | 短：1 題 + 選填 1 個小活動 | `FamilyActivityCard`（可見卡片） | show notes 末段 `🏡 聽完聊一聊` | FAQPage **加 1 題**（`familyActivityFaq`） | 有則附問題行 |
| `reflectionPrompt` | `data/reflection-prompts.ts` | 短：孩子問句 + 家長追問 | 播放結束／`ReflectionPrompt` 互動 | **不進** | **不另加 FAQ** | **不進** |
| `parentGuide`（待建） | 待 REUSE-2 定 sidecar 或 `stories` 選填 | 中：2–3 句摘要 + 1–2 延伸提問／小活動 | `ShowNotes` 區塊，預設 **收合** `<details>` | 可選 1 段，**不得**複製 `familyActivity` 全文 | 可併入 `description` 衍生句，**不**重複 FAQ 題幹 | 可摘 1 段要點 |
| `episodeFaq` | `data/episode-faqs.ts` | 短：1 題緊扣該集劇情／主題 | `storyFaqs()` 第一題（可見 + 收合皆含） | **不進** | FAQPage 併入 `storyFaqs()`（第一項） | 有則附 1 行 `❓` |
| `storyParentExtension` | `lib/story-geo.ts` 程式產生 | 通用共聽引導（非逐集手寫） | 單集頁 `<details>` 收合 | **不進** | 已含於 `storyFaqs` 通用答案語意 | **不進** |
| `storyFaqs` | `lib/story-geo.ts` 程式產生 | 3 題模板化 FAQ | 可見 1 題 + 其餘收合 | **不進** | FAQPage 全量 | **不進** |

## `familyActivity`（已上線）

**定位：** 單集專屬的「聽完聊一聊」鉤子 — 一題口語化討論 + 可選離線小活動。

**允許通路：**

- 單集詳情頁：`components/story/FamilyActivityCard.tsx`
- RSS：`lib/story-geo.ts` → `familyActivityShowNote`
- JSON-LD：`familyActivityFaq` 併入 FAQPage（固定題幹「聽完這一集可以和孩子聊什麼？」）
- `llms-full`：`scripts/generate-llms-full.ts`

**禁止：**

- 不要把同一 `question` 再寫進 `reflectionPrompt.child`
- 不要在 `storyParentExtension` 手動複製 `familyActivity` 文案
- 不要用 `familyActivity` 承載整段家長共讀長文（那是 `parentGuide`）

## `reflectionPrompt`（已上線）

**定位：** 播放體驗內的互動反思 — 孩子先答、家長再追問。

**允許通路：**

- `StoryPlayer`／`StoryEndScreen`／`ReflectionPrompt`
- `storyParentExtension` 可 **引用** 兩句作收合區補充（程式合併，非第二份資料）

**禁止：**

- 不另產生 FAQPage 題目
- 不進 RSS show notes
- 不與 `familyActivity.question` 逐字相同（見 `lib/geo-content-contract.ts` 迴歸測試）

## `parentGuide`（REUSE-2 已上線）

**定位：** 較完整的家長共讀指引（對標 Circle Round show notes），供想深挖的家長閱讀。

**資料來源：** `data/parent-guides.ts` sidecar，於 `data/content.ts` `enrichStory()` 合併。

```ts
type ParentGuide = {
  /** 「這集可以聊什麼」2–3 句 */
  summary: string;
  /** 1–2 個延伸到現實的提問或小活動 */
  prompts: string[];
};
```

**呈現：** `components/story/ShowNotes.tsx`，放在單集頁大綱區下方，**預設收合**；與 `FamilyActivityCard` 並存時，卡片維持短鉤子，`parentGuide` 放長文。

**與 `familyActivity` 分工：**

| | `familyActivity` | `parentGuide` |
|--|------------------|---------------|
| 長度 | 1 題 (+ 選填 1 活動) | 2–3 句 + 多個延伸 |
| 目的 | 注意力鉤子、平台 show note | 睡前共讀深度指引 |
| 可見性 | 常駐小卡片 | 收合區 |
| 重複規則 | 若兩者並存，`familyActivity.question` 不得與 `parentGuide.summary`／`prompts` 任一逐字相同 |

**REUSE-2 開工條件：** 本文件 + `components/story/ShowNotes.tsx` 已上線；新增集數請補 sidecar 並跑 `data/parent-guides.test.ts`。

## `episodeFaq`（已上線）

**定位：** 每集專屬、緊扣該集劇情／主題的 1 題 FAQ，避免全站每集 `storyFaqs()` 首題都是同一套模板問句。

**資料來源：** `data/episode-faqs.ts` sidecar，於 `data/content.ts` `enrichStory()` 合併；`lib/story-geo.ts` `storyFaqs()` 有值時放在最前面，其餘 3 題通用 FAQ 順序不變。

**允許通路：**

- 單集詳情頁：`storyFaqs()` 輸出的第一題（可見區 + `<details>` 收合區共用同一份資料）
- JSON-LD：併入 FAQPage `mainEntity` 第一項
- `llms-full`：有則附 1 行 `❓ <question>：<answer>`

**禁止：**

- 不得與同集 `familyActivity`／`reflectionPrompt`／`parentGuide` 文案逐字重複（`hasDuplicateGuideText`）
- 不得用「僅替換集名」的模板句（題目須綁該集具體劇情或角色）
- 未寫好的集數寧可留白，不得為了衝覆蓋率硬湊填充內容

**覆蓋率：** `episodeFaqCoverage(allSlugs)` 回傳 `{ total, covered, ratio, missingSlugs }`；`verify:geo` 直接以此檢查故事 slug 與 sidecar slug，缺漏或多餘都會 fail，不是僅供觀察的 warning。目前 `getStories()` 20 集全數覆蓋；日後新增集數若暫時沒空寫，應讓 gate 明確失敗並補齊內容，不得為衝覆蓋率硬湊填充內容。

## 程式錨點

| 用途 | 檔案 |
|------|------|
| 契約常數與重複檢查 | `lib/geo-content-contract.ts` |
| 迴歸測試 | `lib/geo-content-contract.test.ts` |
| familyActivity／episodeFaq 合併 | `data/content.ts` → `enrichStory()` |
| episodeFaq sidecar＋覆蓋率 | `data/episode-faqs.ts` |
| FAQ／RSS 輸出 | `lib/story-geo.ts`、`lib/feed.ts` |
| 場景字幕 vs 完整逐字稿 | `lib/transcript.ts`、`lib/subtitles.ts` |
| 單集頁編排 | `app/story/[slug]/page.tsx` |

## 變更紀錄

- **2026-07-20（GEO P1）：** 新增 `episodeFaq` sidecar（每集專屬 1 題 FAQ），併入 `storyFaqs()` 第一題。
- **2026-07-20（GEO P0）：** 場景字幕 vs 完整逐字稿契約；`transcript.vtt`／RSS／JSON-LD 僅認 `subtitles` 側車。
- **2026-07-10（GEO-P3）：** 初版契約；`parentGuide` 仍待 REUSE-2 實作。
