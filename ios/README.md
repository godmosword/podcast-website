# iOS App（SwiftUI）— P2 骨架 + P3 本機進度／離線

> 對齊 [docs/IOS-APP-ARCHITECTURE.md](../docs/IOS-APP-ARCHITECTURE.md) **P2–P3**。  
> 本目錄在官網 monorepo 的 `ios/`。  
> **Cloud／Linux CI 無法編譯 Xcode**；請在 macOS + Xcode 15+ 開啟本專案。

## 開啟方式

1. 安裝 Xcode 15+（iOS 17 SDK）
2. 開啟 [`CheCheCar.xcodeproj`](./CheCheCar.xcodeproj)
3. 選模擬器或真機 → Run
4. （可選）Signing：在 Target → Signing 填你的 Development Team

預設 API：`https://podcast-website-mu.vercel.app`  
本機官網：Xcode scheme 環境變數 `CHECHECAR_API_BASE=http://127.0.0.1:3000`，或改 [`AppConfig.swift`](./CheCheCar/Services/AppConfig.swift)。

## 功能範圍

| 有（P2–P3） | 沒有（後續） |
|-------------|--------------|
| `/api/v1` 列表／詳情／串流播放 | Universal Links（P4） |
| ±10 秒、`captionTimes` 翻頁＋場景字幕 | 睡前定時、完播反思 UI（P5） |
| **收藏**、**繼續聽**（UserDefaults） | 與網站 PWA 進度互通 |
| **基本離線**：下載音檔＋頁圖＋詳情 JSON | 地圖／遊戲／帳號 |

> App 進度鍵：`chechecar.ios.progress`（欄位形狀對齊官網 `ContinueState`／`favorites`，**不**讀寫 `cheche:progress`）。

## 目錄

```text
ios/
  CheCheCar.xcodeproj/
  CheCheCar/
    Models/APIModels.swift
    Services/APIClient.swift
    Services/AudioPlayerController.swift
    Services/ProgressStore.swift     # P3
    Services/OfflineLibrary.swift    # P3
    Views/StoryListView.swift
    Views/StoryDetailView.swift
    Views/StoryPlayerView.swift
  Fixtures/*.sample.json
```

## 契約測試（官網 repo）

```bash
npm test -- lib/api-v1.ios-fixture.test.ts
```

更新 fixture：`UPDATE_IOS_FIXTURES=1 npm test -- lib/api-v1.ios-fixture.test.ts`

## 授權提醒

`public/stories/` 音訊與插圖**禁止再散布**；離線下載僅供本機播放快取，上架前請對齊 legal／產品授權。
