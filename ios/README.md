# iOS App（SwiftUI）— P2 骨架

> 對齊 [docs/IOS-APP-ARCHITECTURE.md](../docs/IOS-APP-ARCHITECTURE.md) **P2**：列表 → 詳情 → AVPlayer 串流播放。  
> 本目錄放在官網 monorepo 的 `ios/`（架構文件允許「獨立 repo 或 monorepo `ios/`」）。  
> **Cloud／Linux CI 無法編譯 Xcode**；請在 macOS + Xcode 15+ 開啟本專案。

## 開啟方式

1. 安裝 Xcode 15+（iOS 17 SDK）
2. 開啟 [`CheCheCar.xcodeproj`](./CheCheCar.xcodeproj)
3. 選模擬器或真機 → Run
4. （可選）Signing：在 Target → Signing 填你的 Development Team

預設 API：`https://podcast-website-mu.vercel.app`  
本機官網：`export CHECHECAR_API_BASE=http://127.0.0.1:3000` 後從 Xcode scheme 環境變數帶入，或暫時改 [`AppConfig.swift`](./CheCheCar/Services/AppConfig.swift)。

## 功能範圍（P2）

| 有 | 沒有（後續） |
|----|--------------|
| 拉 `/api/v1/stories` 列表 | 收藏／繼續聽／離線（P3） |
| 拉 `/api/v1/stories/{slug}` 詳情 | Universal Links（P4） |
| AVPlayer 串流 + ±10 秒 | 睡前定時、完播反思 UI（P5） |
| 依 `captionTimes` 翻頁＋場景字幕 | 地圖／遊戲 |

## 目錄

```text
ios/
  CheCheCar.xcodeproj/
  CheCheCar/
    CheCheCarApp.swift
    Models/APIModels.swift      # 對齊 lib/api-v1.ts
    Services/APIClient.swift
    Services/AudioPlayerController.swift
    Views/StoryListView.swift
    Views/StoryDetailView.swift
    Views/StoryPlayerView.swift
    Theme/AppTheme.swift
  Fixtures/*.sample.json        # 由官網序列化器產生；vitest 鎖契約
```

## 契約測試（官網 repo）

```bash
npm test -- lib/api-v1.ios-fixture.test.ts
```

確保 `Fixtures/` 與 `listStoriesApi`／`getStoryApi`／`getChannelMetaApi` 輸出一致。更新 fixture：

```bash
UPDATE_IOS_FIXTURES=1 npm test -- lib/api-v1.ios-fixture.test.ts
```

## 授權提醒

`public/stories/` 音訊與插圖**禁止再散布**；本 App 僅透過 HTTPS 串流官方站點資源，上架前請對齊 legal／產品授權。
