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

## 視覺系統

- 雪道使用固定 seed 的曲面高度場；視覺網格與 `HeightMapShape3D` 共用 `Course.height_at()`。
- 桌機使用方向光陰影與完整雪粉，觸控裝置自動縮減粒子、樹林密度與壓雪紋密度。
- **黏土材質庫** `scripts/materials.gd`（`SnowMaterials`）：`clay`／`snow`／`grooming`／具名 `skin`・`fabric`・`wood`・`foliage`・`board_plastic`・`ice`・`board_decal`；角色微貼圖 `assets/clay-micro.svg`・`fabric-knit.svg`・`board-stripe.svg`。站內契約見 `lib/games/snowboard/visual-qa.ts`。
- 阿蹦角色含臉部細節（眼白／腮紅／眉／微笑）與板面条紋，QA 近景可用 `visualPose=carve`。
- `scripts/export-snowboard.sh` 會在 smoke 與 Web 匯出後注入裝置／視覺 QA 參數，請勿以未經 wrapper 處理的 `index.html` 發佈。
- QA 截圖可直接開啟：
  - `?visualStage=start|forest|valley|finish`
  - `&visualPose=ride|carve|jump|landing`
- QA 模式固定角色位置且不會送出 `run-finish` 或寫入 GameKit 成績。
- `VIS_PERF_RESULT` 會輸出瀏覽器幀率、draw calls、primitives 與 mobile profile 狀態；PCK 上限為 8MB。
