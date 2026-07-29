# 網頁版 ↔ iOS 同步工作流

> **分支紀律：** `main` = 網頁版開發線；`cursor/ios-app-architecture-1652` = iOS 開發線（PR #69）。
> 兩者皆有 GitHub ruleset 擋刪除、不擋 force push。
>
> **本 branch 的唯一目標＝把 App 送上 App Store。**
> 網頁版功能開發一律回 `main`；本 branch 只接受「iOS 上架路徑上的改動」與「為此必需的網站介面」。
> 送審清單見 [TODOS.md](../TODOS.md)「上架送審清單」三關卡。
>
> **本文回答一個問題：** 網頁版改了東西，什麼時候必須順帶改 iOS？

> ⚠️ **Git 不會自動同步。** `main` 有新 commit 時，本 branch **不會**自己更新，
> 護欄也不會自己叫——因為護欄（`lib/api-v1.contract-guard.test.ts`）目前只存在於本 branch，
> `main` 上沒有。必須手動 `git merge main` 之後跑 `npm run check`，護欄才會在這裡發聲。
> 詳見 §4。

## 1. 這條 branch 裡有什麼

48 個檔案，**不是全部都是 Swift**：

| 類別 | 檔案數 | 說明 |
|---|---|---|
| 純 iOS（`ios/**`） | 23 | Swift、Xcode 專案、Fixtures |
| 網站「為了餵 App」新增 | 18 | `lib/api-v1.ts`、`app/api/v1/**`、AASA、`OpenInAppCTA`、`lib/ios-app-links.ts` |
| 網站既有檔案被修改 | 7 | 見下 |

被修改的既有檔案只有這 7 個——**合併時真正會影響網頁版的就只有這裡**：

| 檔案 | 改動 | 對訪客可見？ |
|---|---|---|
| [`app/story/[slug]/page.tsx`](../app/story/[slug]/page.tsx) | 插入 `<OpenInAppCTA>` | 只在 `NEXT_PUBLIC_IOS_APP_STORE_URL` 有值時才渲染 → 目前**不可見** |
| [`lib/story-metadata.ts`](../lib/story-metadata.ts) | 加 `apple-itunes-app` meta | 只在 `NEXT_PUBLIC_IOS_APP_STORE_ID` 有值時輸出 → 目前**不可見** |
| [`next.config.ts`](../next.config.ts) | 兩條 AASA header 規則 | 新路徑，既有 header 未動 |
| `next.config.test.ts` | 對應測試 | — |
| `.env.example`、`.gitignore`、`TODOS.md` | 設定與文件 | — |

## 2. 耦合點：改了左邊，必須看右邊

| 網頁版改動 | 連帶影響 | 護欄會叫嗎 |
|---|---|---|
| `data/content.ts` 的 `Story` **加／刪／改名欄位** | `lib/api-v1.ts` DTO → [`APIModels.swift`](./CheCheCar/Models/APIModels.swift) 的 Codable | ✅ `api-v1.contract-guard` |
| 新增家長／通路 sidecar（如 `familyActivity`） | 不得流進 App | ✅ `api-v1.contract-guard` |
| `lib/site-url.ts` 的 `CANONICAL_SITE_URL`（**換網域**） | `AppConfig.swift`、`CheCheCar.entitlements`、Vercel AASA、App Store 送審 | ✅ `api-v1.contract-guard` |
| `lib/story-utils.ts` 的 `storyCoverPath`／`storyAudioUrl`（**改副檔名或搬 CDN**） | App 的離線下載直接抓這些絕對 URL | ⚠️ 部分（fixture 值會變，但不會說明原因） |
| **改動 `/story/{slug}`、`/story/{slug}/play`、`/stories` 路由** | AASA `components` + [`DeepLinkRouter.swift`](./CheCheCar/Services/DeepLinkRouter.swift) 的 `DeepLinkParser` | ❌ **無護欄，手動檢查** |
| `lib/platforms.ts`、`lib/feed-constants.ts` | `/api/v1/meta` → App 首頁標題與平台列表 | ⚠️ 只有 fixture 值比對 |
| **Apple 同步進新的一集** | `ios/Fixtures/*.sample.json` 值比對失效 | ✅ 但這是**例行**，見 §3 |

> **唯一沒有機制護住的是路由結構改動。**
>
> 現況是安全的：EP1–6 的舊 slug（`/story/ev` 等，見 `lib/story-slug-aliases.ts`）**照樣能開 App**——
> AASA 的 `/story/*` 涵蓋舊路徑，`getStoryApi()` 又走 `canonicalStorySlug()`
> （實測 `/api/v1/stories/ev` → `ep-1`）。所以既有的 redirect 不構成問題。
>
> 有風險的是**新增 `/story`、`/stories` 以外的故事路由前綴**，或把播放頁搬離
> `/story/{slug}/play`。那時 [`lib/ios-app-links.ts`](../lib/ios-app-links.ts) 的
> `IOS_APP_LINK_COMPONENTS` 與 `DeepLinkParser.parse()` 兩邊都要改，**沒有測試會提醒你**。

## 3. 兩種測試失敗，意義完全不同

**別把兩者混為一談**——這是本文件最重要的一段。

### `lib/api-v1.ios-fixture.test.ts` 紅了

`ios/Fixtures/*.sample.json` 是按**實際內容**釘死的（目前 `ep-23`／`ep-23,22,21`）。
Apple 同步一進新集就會紅。這是**例行**，不是壞掉：

```bash
UPDATE_IOS_FIXTURES=1 npm test -- api-v1.ios-fixture
git diff ios/Fixtures/   # 確認只有集數／標題變動，沒有欄位增刪
```

### `lib/api-v1.contract-guard.test.ts` 紅了

**停下來。**這代表契約真的變了——欄位增刪改名，或網域搬家。
本檔刻意不比對任何「哪一集、標題是什麼」，所以新集**不會**讓它變紅。

絕對不要用 `UPDATE_IOS_FIXTURES=1` 掩蓋它（那個環境變數對本檔無效）。
照 §2 的表格找到對應的 Swift 檔案一起改。

## 4. 例行 review

| 時機 | 做什麼 |
|---|---|
| **每次 Apple 同步進新集**（幾天一次） | 跑 `npm test -- api-v1`；只有 fixture 紅 → 更新 fixture；guard 紅 → 查 §2 |
| **每次要合併 `main` → 本 branch** | `git merge main` 後跑 `npm run check`，特別看 `api-v1.contract-guard` |
| **每月**或**動到 `data/content.ts`／路由/網域時** | 走一次 §2 表格；`ios/README.md` 的功能範圍表是否還誠實 |
| **上架送審前** | TODOS.md「iOS 待修」與「上架前置」兩區塊須清空 |

```bash
# 一行版：耦合全檢（不需 Mac）
npm test -- api-v1 ios-app-links OpenInAppCTA next.config
```

> **注意：** 以上全部都是**網站端**的護欄，跑得動、不需要 Mac。
> `ios/**` 的 Swift 本身**沒有任何 CI**——本 repo 的 Linux／雲端環境無法 `xcodebuild`。
> Swift 的正確性目前只能靠 macOS + Xcode 人工驗收，這是已知缺口，見 TODOS.md。

## 5. 合併之後

PR #69 合併到 `main` 後，本文件描述的耦合就變成 `main` 內部的事：

- `ios/Fixtures` 的值比對會跟著每集 churn **落在 `main` 上** → §3 的例行更新變成營運管線的一部分，
  建議併進 [`docs/EPISODE-WORKFLOW.md`](../docs/EPISODE-WORKFLOW.md)。
- 屆時「main = 網頁版、branch = iOS」的分工失效，需要重新決定 iOS 是否另開長期 branch 或獨立 repo
  （見 [`docs/IOS-APP-ARCHITECTURE.md`](../docs/IOS-APP-ARCHITECTURE.md) §5「可之後拆獨立 repo」）。
