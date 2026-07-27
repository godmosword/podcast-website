# 阿蹦雪山衝刺

Godot 4.3.x 製作的親子 3D 滑雪板遊戲，Web export、GL Compatibility、無 threads。

- 雪道：糖霜雪峰、森林小徑、冰河夜滑；由 `CourseData` 驅動長度、坡度、障礙、雪花與 par。
- 操作：← → 或 A/D carving、Space 跳躍／空中特技、P/Esc 暫停；觸控提供三顆按鈕。
- 玩法：收集雪花建立 combo，跳台完成 clean／sketchy trick，遊戲端計算分數；終點前進入 `FINISHING`，穿過拱門才結算。
- 難度：relaxed／standard／challenge 由網站設定注入，影響速度、障礙密度、輔助與跌倒懲罰。
- 摔倒：以跌倒當下進度回溯 12m、保留時間懲罰與 combo reset，不設 Game Over。
- 網站：嵌入 `/games/snowboard`，bridge source 為 `cheche-snowboard`，訊息 protocol v2。

```bash
# repo 根目錄
./scripts/export-snowboard.sh

# 只跑 headless smoke
~/godot-toolchain/Godot.app/Contents/MacOS/Godot --headless --path snowboard-game -- --smoke
```

Web 匯出產物位於 `public/snowboard/v2/`，需與程式碼一同入庫。HTML 是 no-cache 入口，WASM／PCK 使用版本化 immutable cache。

## 驗證與匯出

```bash
# 預設雪道 smoke
~/godot-toolchain/Godot.app/Contents/MacOS/Godot --headless --path snowboard-game -- --smoke

# 逐條雪道／難度 smoke
~/godot-toolchain/Godot.app/Contents/MacOS/Godot --headless --path snowboard-game -- --smoke-course=pine-trail --smoke-difficulty=challenge

# 產生並 patch public/snowboard/v2/index.html
./scripts/export-snowboard.sh
```

匯出 wrapper 會先跑 smoke，再使用 `export_presets.cfg` 的版本化輸出路徑，最後注入 visual QA／裝置參數。正式環境不轉送 `debugFinish`／visual query，Godot 端也只在 debug build 或 localhost 接受 debug finish。

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
