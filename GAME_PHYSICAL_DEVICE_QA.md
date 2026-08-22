# Game Area Physical Device QA

## Physical device verification required

本文件是人工裝置驗證 checklist，不是自動化測試結果。以下項目目前均未宣稱已驗證；請在 production deployment 或與 production 等價的 HTTPS 環境，以真實 Safari 裝置逐項勾選。每項目標約 30–60 秒，測試前先清除該站遊戲 localStorage，並記錄裝置、iOS/iPadOS、Safari 版本與結果。

- [ ] **iPhone Safari — Candy 完整一局**：開啟、開始、完成一關，確認棋盤、完成站與 CTA 都可用。
- [ ] **iPhone Safari — Candy 快速交換與 replay**：連續快速交換兩格，再進入 replay，確認沒有重複觸發或卡住。
- [ ] **iPhone Safari — Block Drop 快速操作**：快速點按左右／旋轉／下降控制，確認方塊與 pause 狀態正常。
- [ ] **iPhone Safari — Block Drop 切 App 回來**：遊戲中切到另一個 App 約 5 秒再回來，確認已暫停且可繼續。
- [ ] **iPhone Safari — Block Drop 旋轉**：playing/paused 間 portrait ↔ landscape，確認棋盤尺寸與操作列仍可用。
- [ ] **iPhone Safari — Coloring 長時間畫線**：連續畫線約 30 秒，確認線條不中斷、頁面不捲動、不白屏。
- [ ] **iPhone Safari — Coloring toolbar**：左右滑動工具列，切換蠟筆／油漆桶／橡皮擦，確認 active tool 與 touch target。
- [ ] **iPhone Safari — Coloring 旋轉**：畫布中 portrait ↔ landscape，確認畫面、工具列與完成 CTA 仍可見。
- [ ] **iPhone Safari — Safari browser chrome**：上下滑動讓 Safari address/tab chrome 收合與展開，確認 sticky header、畫布與 CTA 不被遮住。
- [ ] **iPhone Safari — Home Indicator / safe area**：全面屏裝置確認底部 touch controls、完成站與返回動線不被 Home Indicator 擋住。
- [ ] **iPhone Safari — sound / mute**：首次互動後開關音效，確認 mute 狀態、播放限制與返回遊戲都正常。
- [ ] **iPhone Safari — Back / Forward**：遊戲頁與 hub 間使用 Safari Back/Forward，確認不出現空白頁或重複 modal。
- [ ] **iPhone Safari — reload**：ready、playing、result 三種狀態各 reload 一次，確認頁面可重新進入且不白屏。
- [ ] **iPhone Safari — result modal**：完成或 game over 後確認 focus 落在 modal，Tab/VoiceOver 可到 replay、下一站與離開 CTA。
- [ ] **iPad Safari — portrait / landscape / Split View**：分別檢查 Candy、Block Drop、Coloring 的主要操作；在 Split View 窄 viewport 確認沒有水平溢出與遮擋。

## Notes

- 這份 checklist 不等同於自動化 Chromium/WebKit viewport 測試；真實 iPhone/iPad Safari、Safari browser chrome、Home Indicator、硬體音效與真實 App background lifecycle 仍需人工確認。
- 若發現問題，記錄：裝置與 OS、Safari 版本、viewport/orientation、是否 reduced motion、localStorage 狀態、重現步驟與螢幕錄影。
