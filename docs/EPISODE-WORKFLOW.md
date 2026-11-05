# 每集營運 Workflow（全幕標準範本：ep-9、ep-10）

新集與 EP2–8 升級時**必須**與 ep-9／ep-10 同一套流程與產物，不得跳步。

## 新集上架總覽（先看這裡）

SoundOn 上架後，新集會自己出現在站上，字幕、封面格式也會自動補。**第 4 步起要人或 agent 做**，「待生圖」Issue 有 checklist。

| # | 誰 | 做什麼 | 產物 | 沒做會怎樣 |
|---|---|---|---|---|
| 1 | 自動：`Sync Apple Podcast`（每 15 分鐘） | 抓 RSS，推 `sync/apple` 開 PR 自動合併；開「待生圖」Issue | 音檔、封面 `01.jpg`、`pageCount=1`、四個 sidecar stub、blur、音檔長度 | — |
| 2 | 自動：同一個 job | 封面缺 WebP／AVIF 就補；缺檔 `sync-validate` 擋下 | `01.avif`、`01.webp` | 播放器會退回 JPG，不再破圖 |
| 3 | 自動：`Transcribe backfill`（每小時，一輪一集） | Whisper 草稿字幕＋自動 `--fix`，同一路徑開 PR 自動合併。字幕沒蓋滿整集會自己重試；還是不夠就算失敗，同一集失敗 3 次開 Issue | `data/subtitles/<slug>.json` | 字幕進 main 前 `verify:geo` 紅（缺完整逐字稿），屬預期 |
| 4 | 人／agent，字幕進來後 | 讀字幕，歸一個主題（見下方「歸主題」） | `data/episode-themes.ts` 多一列 | 找故事的主題篩選找不到這集；`verify:episodes` 列 `theme-pending`；`--strict`、字幕 `--mark` 後的測試會擋 |
| 5 | 人／agent | 字幕校對到 `--mark`（[SUBTITLE-PROOFREAD.md](./SUBTITLE-PROOFREAD.md)） | `data/subtitles/_proofread/<slug>.json` | 不能生圖；站上一直是草稿字幕 |
| 6 | 人／agent | 改寫 stub：反思提問、FAQ，確認 zone | `data/reflection-prompts.ts`、`data/episode-faqs.ts`、`data/story-zones.ts` | 站上是模板句 |
| 7 | 人（生圖付費，先取得同意） | 切場景 → 一輪生圖 → 審圖 → `--approve`（見下方「標準步驟」） | 全幕插圖、`captions`、`captionTimes` | 維持單張封面的 MVP；`verify:episodes` 每次列 warn |
| 8 | 人／agent | 驗證、commit、push、`npm run sync:notify` | — | 「待生圖」Issue 不會更新 |
| 9 | 營運（選用） | YouTube 影片、SoundOn show notes 回鏈 | — | — |

第 1～3 步的 PR 只跑 `sync-validate`、不等 CI，全站單元測試要到下一個人 push 才會跑。

### 這一集做完了沒

```bash
npm run optimize:lcp-images -- --verify   # 第 2 步：WebP／AVIF 齊備
npm run verify:geo                        # 第 3 步：完整逐字稿（要先 build）
npm run verify:episodes                   # 第 4–7 步：error 擋、warn 列待辦（theme-pending、subtitle-unproofread…）
gh pr view sync/apple --json state,mergeable   # 第 1、3 步：OPEN 又 CONFLICTING 就是卡住了
```

同步 PR 卡住時（常見原因：PR 開著的時候有人手動改了 `data/apple-sync-state.json`）：字幕沒問題就把 main 合進 `sync/apple`、解衝突；字幕有問題就在 main 補好、關 PR。下一次有新集時同步會把分支重設到 main。

### 字幕轉錄失敗

片頭音樂會讓 Whisper 陷入重複幻覺（「请不吝点赞…」一路重複到後面），這些句子被過濾後字幕少一大段甚至全空。`transcribeWithRetries` 會自救：照常轉 → 覆蓋不足就加 `-mc 0` 重跑 → 第一句在 15～90 秒之間就把前面切成每段 9 秒補轉 → 還是不足就失敗（第一句 ≤ 25 秒、最大空白 ≤ 60 秒、離結尾 ≤ 60 秒、每分鐘至少 5 句才算夠）。

收到「字幕轉錄失敗」的 Issue 時，本機跑 `npm run transcribe -- <slug>`（音檔不外送）。照樣失敗就聽一下音檔：真的有長音樂或長靜音，加 `--allow-gaps` 寫出最好的一份；開頭幾分鐘都轉不出來，先用 `-mc 0` 轉整集、前段切成每段 9 秒分開轉（`whisper-cli -m models/ggml-large-v3.bin -f <wav> -l zh -mc 0 -oj -of <輸出>`），合併成 `data/subtitles/<slug>.json` 後跑 `npm run transcribe -- --convert <slug>` 與 `npm run proofread:subtitles -- <slug> --fix`。補好後把 `data/apple-sync-state.json` 該集的 `subtitles` 改成 `ok`。轉出來仍是草稿，要走第 5 步校對。

### 歸主題

`data/episode-themes.ts` 是手寫檔，同步不能寫（同步 PR 不跑單元測試，見 `scripts/ci/sync-output-paths.txt`）。字幕還沒 `--mark` 的新集可以先不在表裡；`--mark` 後就一定要有，否則 `data/episode-themes.test.ts` 紅。

- **判斷依據**：字幕裡故事真正在教的那一件事，不依標題關鍵字硬套。字幕是草稿也可以判斷，不必等 `--mark`。
- **只能選一個**，而且只能是 `STORY_FINDER_THEMES` 這七個：成長勇氣、責任品格、生活好習慣、情緒管理、交友與合作助人、安全與自我保護、思考與創造。
- **`title` 要跟 `storyDisplayTitle(story)` 一字不差**，也就是完整標題「｜」前的主標；測試會比對。
- 依 `ep` 順序加在表尾：

```ts
{ ep: 36, slug: "ep-36", title: "電動車與機器人的尋找任務", theme: "思考與創造" },
```

（上面只示範格式；`theme` 要讀過字幕才定。）

### 下一集上架時順便確認

這些自動化是 2026-11-04（PR-S1）補的，還沒有真的新集走過一輪。下一集上架時看：封面 `01.avif` 有跟著進 PR、字幕 PR 有合併且第一句在開頭、main 的 CI 仍是綠的、Issue 有「歸主題」那一項。

## 黃金範本

| 集數 | 幕數 | 說明 |
|------|------|------|
| **ep-9** | 21 | 恐龍車多多刷牙 |
| **ep-10** | 20 | 粽子餐車端午 |

播放器行為：每幕一張插圖 + **幕級字幕**（`captions` 與 `pageCount` 同長），換圖時間對 `captionTimes`。

## 必備產物（全幕繪本，`pageCount > 1`）

| 產物 | 路徑 |
|------|------|
| 字幕側車 | `data/subtitles/<slug>.json` |
| 字幕校對標記 | `data/subtitles/_proofread/<slug>.json`（`--mark` 後） |
| 場景切分 | `data/scenes/<slug>.json` |
| 插圖 | `public/stories/<slug>/01.jpg` … `NN.jpg`（張數 = `pageCount`） |
| Metadata | `pageCount`、`captionTimes[]`、`captions[]`（長度皆 = 幕數） |

Metadata 寫入位置：

- **sync 新集（ep-7+）**：`data/apple-synced.json` + `data/apple-sync.defaults.json` overrides
- **手動集（ep-1–6）**：同上 overrides + `data/stories.ts`（`--approve` 自動同步）

執行時由 `data/content.ts` 合併 overrides。

### MVP sync 自動補齊的 catalog sidecar

新集寫入後會進入 `getStories()`，下列四檔必須有該 slug（見 issue #46）。主題 `data/episode-themes.ts` 不在其中，見上方「歸主題」。

| Sidecar | 路徑 | sync 行為 |
|---------|------|-----------|
| zone 對映 | `data/story-zones.ts` | 標題關鍵字推斷（恐龍→dino 等），缺則寫入 |
| 反思提問 | `data/reflection-prompts.ts` | 標題推導 MVP stub（`child` 問號結尾） |
| 修改時間 | `data/story-dates.ts` | `now` + `` `${sha7} sync Apple RSS MVP` `` |
| FAQ | `data/episode-faqs.ts` | 由 RSS 標題與摘要產生 MVP stub |

只補缺 key、不覆寫人工條目。Phase 2（校對／生圖前）請覆寫反思文案與 FAQ，並確認 zone。

封面 blur（`data/story-image-blurs.json`）不是人工 sidecar。sync 在封面 `01.jpg` 落地後呼叫 `ensureStoryCoverBlurs`；GHA 在驗證前跑 `npm run generate:story-blurs`。缺 blur 會讓 `sync:validate` 擋下上架（#251）。

## 標準步驟

```bash
# 0. GHA 同步後為 MVP（pageCount=1、01.jpg＋WebP／AVIF；自動補 story-zones／reflection-prompts／story-dates／episode-faqs）。
#    Whisper **草稿**字幕由 transcribe-backfill 之後補；本機 sync:apple 有 whisper 時會順便轉錄

# 0b. 封面現代格式：GHA 同步會補；本機 sync 後自己跑（播放頁先要 AVIF，缺檔時退回 JPG 會慢一拍）
npm run generate:story-covers

# 0c. 歸主題（總覽第 4 步，見「歸主題」）：編輯 data/episode-themes.ts

# 1. 字幕校對（**illustrate 前必做**，見 docs/SUBTITLE-PROOFREAD.md）
npm run proofread:subtitles -- <slug>          # lint
npm run proofread:subtitles -- <slug> --fix    # 自動修正品牌名
#    人工編輯 data/subtitles/<slug>.json
npm run proofread:subtitles -- <slug> --mark   # 通過後標記（illustrate 閘門）

# 2. 切場景（可先審、不生圖）
npm run illustrate -- <slug> --segment-only

# 3. 生圖 → staging + contact.html（需 OPENAI_API_KEY）— 整集只跑一輪
OPENAI_API_KEY=sk-... npm run illustrate -- <slug>
open public/.illustrate-staging/<slug>/contact.html

# 3b. 審圖後若要重抽：先列幕號給人確認，再執行（禁止 agent 自行連抽）
#    npm run illustrate -- <slug> --scene N
#    npm run illustrate -- <slug> --char 名字

# 4. 審圖通過 → 上線
npm run illustrate -- <slug> --approve
#    → public/stories/<slug>/NN.jpg
#    → pageCount / captionTimes / captions

# 5. 驗證（對照 ep-9／ep-10）
npm run verify:episodes
npm run verify:browse-index

# 6. 建置與推送
npm run sync:apple && npm run build
git add public/stories/ data/scenes/ data/subtitles/ data/subtitles/_proofread/ \
  data/apple-synced.json data/apple-sync.defaults.json data/stories.ts data/characters.json \
  data/illustration-queue.json
git commit -m "feat(stories): illustrate <slug> full scenes"
git push
npm run sync:notify   # 務必先 push 成功再跑；走 GHA 同一路徑補開／去重「待生圖」Issue（見 README「同步通知」）

# 7. （可選）匯出 YouTube 整集影片
npm run export:video -- <slug>
#    → export/video/<slug>/<slug>.mp4（原始逐句字幕 burn-in；今天是靜圖換頁）
#    見 docs/VIDEO-EXPORT.md
#    要讓畫面動起來（無聲短片 + 停格）見 docs/VIDEO-GENERATE.md

# 8. （營運）SoundOn show notes 回鏈
#    於 SoundOn 後台該集 show notes 尾段貼官網連結（含 UTM），見 docs/metrics/README.md
#    lib/soundon-backlink.ts → soundOnStoryBacklinkLine(slug, title)
```

## 審圖與重抽（成本閘門）

圖像 API **按張計費**。Agent 必須遵守：

1. **整集生圖一輪即停** — `illustrate`／`--from-scenes` 跑完 → 開 contact → **停止**，把結果交使用者審。
2. **重抽前先報價** — 在聊天列出建議幕號、原因、張數；用 A/B/C 等文字等回覆。未確認前**不得**跑 `--scene`／`--char`／自寫 regen。
3. **「修正／檢查／對齊定裝」≠ 准許重抽** — 預設產出問題清單；只有使用者明確說「重抽 #N／這些幕可以重抽」才可呼叫 API。
4. **失敗重試上限** — 單次 API timeout／5xx：同幕最多再試 **1** 次；仍失敗就停下來報告，不要換一批幕繼續燒。
5. **定裝照同規** — `generate-character-portraits`／`--char` 每次重生都要先問。

紅線亦見 [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md)、alwaysApply [`.cursor/rules/podcast.mdc`](../.cursor/rules/podcast.mdc)。

## 驗證

```bash
npm run verify:episodes              # error 才 exit 1，warn 列出待辦
npm run verify:episodes -- --strict  # warn 也視為失敗（approve 前最後把關）
npm run --silent verify:episodes -- --json  # 給 agent/evaluator 的純 JSON report
npm run --silent verify:episodes -- --json --strict  # 純 JSON，且 warn 也影響 exit code
npm run verify:release-content       # 發布前分開檢查 release blocker 與 accepted MVP warning
npm run verify:browse-index          # 找車車／主題索引與目錄一致（warn 不擋 CI）
npm run check                        # test + verify + build，與 CI 同一套
```

新集的字幕還沒進 main 時，`npm run check` 會在 `verify:geo`（缺完整逐字稿）紅。這不是當下改動造成的，等字幕 PR 合併。

- **全幕集**（`pageCount > 1`）：插圖數、scenes 幕數、subtitles、`captionTimes`、`captions` 必須與 `pageCount` 一致，否則 **error**。
- **MVP**（`pageCount = 1`）：至少 `01.jpg` + 字幕側車；一律列 **warn**（`illustrate-pending`，或已切場景未 approve 的 `illustrate-incomplete`），不會靜默通過。
- **Legacy**（ep-2–6 allowlist，6 頁 placeholder、無 scenes）：列 **warn**（`legacy-placeholder`），需依本 workflow 重做。allowlist 以外的多頁集缺 scenes 一律 **error**。

`verify:release-content` 不改變 Apple sync 的 warning 語意：`pageCount = 1` 且只有
`illustrate-pending` 會列為 accepted MVP warning；未校對字幕、缺資產、未完成場景與
其他 warning 會列為 release blocker。這個檢查適合正式內容發布前執行，不綁進每次
Apple sync 的工程 CI。

### CI 行為（每次 sync 一致）

GHA `sync-apple-podcast.yml` 先產生 blur、音檔長度與 sidecar，再由 validate job **一律**跑 `npm run sync:validate`（含 `verify:episodes` 與 `verify:browse-index`）。字幕沒好不擋上架。全站 `npm test`、`npm run build` 不在這裡跑：

| 結果 | 影響 |
|------|------|
| error | 擋下 commit/push，sync 失敗 |
| warn | 不擋 sync；寫入 Actions Job Summary，待生圖集數每次可見 |

## 與舊流程的差異

| 項目 | 舊（僅 MVP） | 標準（ep-9／ep-10） |
|------|----------------|---------------------|
| 插圖 | 1 張封面 | 每 15–20s 一幕 |
| 字幕 | 側車逐句 | 側車 + **每幕一句 `captions`** |
| 接線 | 可只有 `pageCount` | `pageCount` + `captionTimes` + `captions` |

## 相關文件

- [VIDEO-EXPORT.md](./VIDEO-EXPORT.md) — YouTube 整集 mp4 匯出（靜圖換頁、原始字幕 burn-in）
- [VIDEO-GENERATE.md](./VIDEO-GENERATE.md) — 全幕集生成會動的 YouTube 影片（不指定集數）
- [SUBTITLE-PROOFREAD.md](./SUBTITLE-PROOFREAD.md) — Whisper 草稿校對清單與 `--mark` 閘門
- [AGENT-WORKFLOW.md](./AGENT-WORKFLOW.md) — Meta 編排（`/agent-plan`、`/agent-action`）
- [AGENT-DOMAIN.md](./AGENT-DOMAIN.md) — 本專案 Bootstrap、紅線、驗證矩陣
- [README — illustrate](../README.md#每集劇情插圖自動生成npm-run-illustrate)
- [README — 同步通知](../README.md#同步通知) — 新集只發一張待生圖 Issue（stale 不會先另開一張）
- [TODOS — Phase 3 生圖管線](../TODOS.md)
