# 阿蹦雪山衝刺

Godot 4.3.x 製作的親子 3D 滑雪板遊戲，Web export、GL Compatibility、無 threads。

- 雪道：糖霜雪峰，1,200m，三星條件為完賽／95 秒內／12 枚雪花。
- 操作：← → 或 A/D 轉向、Space 跳躍、P/Esc 暫停；觸控提供三顆按鈕。
- 摔倒：最近檢查點復位、加罰 3 秒、1.2 秒無敵，不設 Game Over。
- 網站：嵌入 `/games/snowboard`，bridge source 為 `cheche-snowboard`。

```bash
# repo 根目錄
./scripts/export-snowboard.sh

# 只跑 headless smoke
~/godot-toolchain/Godot.app/Contents/MacOS/Godot --headless --path snowboard-game -- --smoke
```

Web 匯出產物位於 `public/snowboard/`，需與程式碼一同入庫。
