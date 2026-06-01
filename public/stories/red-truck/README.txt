紅色大卡車（red-truck）素材放置說明
=====================================

請把這則故事的圖片與音檔放在這個資料夾裡：

  public/stories/red-truck/
  ├─ 01.jpg
  ├─ 02.jpg
  ├─ 03.jpg
  ├─ 04.jpg
  ├─ 05.jpg
  ├─ 06.jpg
  ├─ 07.jpg
  ├─ 08.jpg
  ├─ 09.jpg
  ├─ 10.jpg
  └─ audio.mp3

檔名規則（很重要）
-------------------
1. 圖片一律用 .jpg，數字「補零兩位」：01.jpg、02.jpg ⋯ 10.jpg。
   不要用 1.jpg、1.png 之類，否則程式會找不到圖。
2. 張數必須等於 data/stories.ts 裡這則故事的 pageCount（目前是 10）。
3. 音檔檔名要和 data/stories.ts 裡的 audio 欄位一致（目前是 audio.mp3）。

想換故事內容
-------------
- 改字幕：編輯 data/stories.ts 的 captions。
- 換張數：同時改 pageCount 與這個資料夾裡的圖片數量。

這個 README.txt 不會影響網站，放著當提醒即可，也可以刪除。
