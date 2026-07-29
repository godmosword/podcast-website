# iOS App（SwiftUI）— P2–P4

> 對齊 [docs/IOS-APP-ARCHITECTURE.md](../docs/IOS-APP-ARCHITECTURE.md)。  
> **Cloud／Linux CI 無法編譯 Xcode**；請在 macOS + Xcode 15+ 開啟本專案。  
> **改網頁版之前先看 [SYNC-WITH-WEB.md](./SYNC-WITH-WEB.md)** — 哪些網站改動必須連帶改 iOS、
> 兩種測試失敗分別代表什麼、例行 review 節奏。

## 開啟方式

1. 安裝 Xcode 15+（iOS 17 SDK）
2. 開啟 [`CheCheCar.xcodeproj`](./CheCheCar.xcodeproj)
3. Signing：填 Development Team（Associated Domains 需付費／有效 Team）
4. 官網 Vercel 設 `APPLE_TEAM_ID`（與 Xcode Team 一致）後重新部署，AASA 才會含 `appIDs`

預設 API：`https://podcast-website-mu.vercel.app`  
本機：`CHECHECAR_API_BASE=http://127.0.0.1:3000`

## 功能範圍

| 有（P2–P4） | 沒有（後續） |
|-------------|--------------|
| `/api/v1` 列表／詳情／串流播放 | 睡前定時、完播反思 UI（P5） |
| 收藏／繼續聽／基本離線 | 地圖／遊戲／帳號 |
| **Universal Links**（`applinks:podcast-website-mu.vercel.app`） | App Store 上架本身 |
| 官網單集頁「用 App 開啟本集」（僅 iPhone／iPad 顯示） | 與 PWA 進度互通 |

### Universal Links 路徑

| URL | App |
|-----|-----|
| `/stories` | 列表 |
| `/story/{slug}` | 詳情 |
| `/story/{slug}/play` | 播放器 |

## 目錄重點

- `Services/DeepLinkRouter.swift` — 解析與 `NavigationPath`
- `CheCheCar.entitlements` — Associated Domains
- 官網：`/.well-known/apple-app-site-association`、`components/OpenInAppCTA.tsx`

## 契約測試

```bash
npm test -- api-v1 ios-app-links OpenInAppCTA next.config
```

兩層，失敗的意義不同（詳見 [SYNC-WITH-WEB.md §3](./SYNC-WITH-WEB.md)）：

| 檔案 | 鎖什麼 | 紅了代表 |
|---|---|---|
| `lib/api-v1.ios-fixture.test.ts` | 樣本 JSON 的**值** | 多半只是進新集 → `UPDATE_IOS_FIXTURES=1 npm test -- api-v1.ios-fixture` |
| `lib/api-v1.contract-guard.test.ts` | 欄位**結構**＋網域 | **契約真的變了** → 停下來同步改 Swift，不可用環境變數掩蓋 |

## 授權提醒

音訊與插圖禁止再散布；離線僅本機快取。上架前對齊 legal／產品授權。
