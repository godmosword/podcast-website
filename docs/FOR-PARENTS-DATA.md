# 家長端可用資料清單（STEM-P3 盤點）

> 資料來源：`localStorage` 鍵 `cheche:progress`（`lib/progress-store.ts`），**不上傳伺服器**。

## 遊戲進度

| 欄位 | 路徑 | 說明 |
|------|------|------|
| 玩過哪些遊戲 | `gameProfile.gamesPlayed` | 四款遊戲 boolean |
| 最佳分數 | `gameProfile.bests` / `bestScores` | 各遊戲最高分 |
| 關卡三星 | `gameProfile.medals` | 每關 bit flags（通關／無失誤／全收集） |
| 累積星星 | `gameProfile.stars` / `economy.lifetimeStars` | 車庫解鎖用 |
| 貼紙 | `gameProfile.stickers` | 如 `played-car-adventure` |
| 解鎖車款 | `gameProfile.unlockedVehicles` | 車庫 |
| 遊戲偏好 | `preferences.gameKit` | 兒童模式、方塊難度等 |

## 故事／收聽

| 欄位 | 路徑 | 說明 |
|------|------|------|
| 繼續收聽 | `continue` | slug、頁碼、時間、updatedAt |
| 收藏 | `favorites` | 故事 slug 陣列 |
| 聽完標記 | `engagement.storiesCompleted` | 播放完畢寫入 |
| Reflection 已顯示 | `engagement.reflectionShown` | 互動提問已出現過的集數 |

## Reflection Prompt（靜態文案）

| 來源 | 說明 |
|------|------|
| `data/reflection-prompts.ts` | 全部集數（ep-1～ep-17）：`child` + `parentFollowUp` |
| `components/story/ReflectionPrompt.tsx` | 故事詳情／播放結束顯示 |

## 對外 analytics 事件（匿名，Vercel Web Analytics）

> 口徑 single source of truth：`lib/analytics.ts` 各 track 函式 JSDoc。全部 PII-free。

| 事件 | Payload | 口徑 |
|------|---------|------|
| `story_completed` | `{ slug }` | native `ended` 且非 repeat 觸發；每次完整播放計一次（含重聽）；本機 `storiesCompleted` 維持去重 |
| `return_visit` | `{ daysSince }` | 距上次造訪 ≥6h 才送；只送天數區間（same-day/1d/2-3d/4-7d/8-30d/30d+），無原始時間戳；每 session 最多一次（本機 key：`cheche:last-visit-at`） |

## 其他家長相關

| 功能 | 位置 |
|------|------|
| 信任文案 | `components/ParentTrustStrip.tsx` |
| GEO 家長指南 | `/for-parents`（`lib/for-parents.ts`） |
| 家庭儀表板 MVP | `/for-parents/dashboard` |
| 隱私 | `/legal#privacy` |

## 尚未有、P3 後續可接

- 每集 `parentGuide`（REUSE-2，BLOCKED）
- 跨裝置帳號同步
- 遊戲 session 時間戳（無法做真「本週」統計，目前用累積摘要）
- 家長閘門（STEM-P3 付費前算術題）
