# Phase 6 build.py 執行驗證（2026-09-07）

## 環境

| 項目 | 值 |
|---|---|
| Blender A | 4.5.9 LTS（build.py 文件宣稱的目標版本，自 download.blender.org 取得，掛載 dmg 執行，未安裝到系統） |
| Blender B | 5.2.1 LTS（`brew install --cask blender`，安裝於 `/Applications/Blender.app`） |
| 執行方式 | 於 scratchpad 內複製一份 `assets/blender/hero-world/build.py`，讓 `ROOT`（`parents[3]`）落在隔離目錄；repo 的 `.blend`、`export/*.raw.glb` 與 `public/models/` 全程未被覆寫 |
| 後段管線 | `scripts/optimize-hero-world.mjs` 以 patch 過的暫存副本執行，來源指向隔離的 raw GLB、輸出與 QA 報告寫入 scratchpad |

## 結果

1. **未修改的 build.py 在 Blender 5.2.1 崩潰**：`AttributeError: 'Action' object has no attribute 'fcurves'`（原 build.py 第 229 行）。Blender 4.4 起 action 改為 slotted／layered，5.x 移除了 legacy `Action.fcurves`。崩潰發生在 Vehicle 輪子動畫，因此 `little-red.raw.glb` 完全沒有產出。
2. **未修改的 build.py 在 Blender 4.5.9 完整跑完**，退出碼 0，輸出 `HERO_WORLD_EXPORT_COMPLETE seed=20260906 blender=4.5.9 LTS`，三個 raw GLB 與 `poster.png` 皆產出。
3. **修正**：新增 `action_fcurves(action)` 相容函式（legacy 屬性優先，否則走 `layers → strips → channelbags`）。修正後 4.5.9 與 5.2.1 產出的三個 raw GLB **節點結構逐行相同**，且與修正前的 4.5.9 產出相同（無回歸）。

## 節點階層對照（build.py + optimize vs 已上線 v2）

| 必要節點 | 重建產物 | 已上線 v2 |
|---|---|---|
| `Environment` | ✅ | ✅ |
| `FerrisRotor` | ✅ | ✅ |
| `GondolaPivot0..7` | ✅ 8/8，皆為 FerrisRotor 子節點 | ✅ 8/8 |
| `RimAndSpokes_cream` / `_pink` | ✅ | ✅ |
| `Vehicle` → `Body` | ✅ | ✅ |
| `Wheel_0..3` | ✅ 4/4，皆為 Vehicle 直屬子節點 | ✅ 4/4 |
| `Drive` clip | ✅ 4 channels，2.0417s | ✅ 4 channels，2.0417s |
| `Tree` → `Trunk` / `Crown` | ✅ | ✅ |

節點總數：environment 41／41、little-red 16／16、tree 3／3，完全一致。節點名稱集合三個模型皆完全一致（對 v2 與 v3 皆然）。

## 可解釋的差異（非逐 byte 相同）

| 項目 | 重建 | 已上線 v2 | 說明 |
|---|---|---|---|
| environment bytes | 280,352 | 285,676 | dedup 命中率不同：重建版多共用兩個 gondola mesh（meshes 23 vs 25） |
| environment triangles | 11,897 | 12,111 | `gltf-transform simplify --ratio 0.76` 的結果與輸入頂點順序相關，非決定性 |
| little-red bytes / tris | 84,472 / 3,740 | 84,472 / 3,740 | 完全相同 |
| tree bytes | 10,720 | 10,716 | quantize padding 差 4 bytes |
| 子節點排列順序 | 依 `ensureSemanticHierarchy` 重新掛載後的順序 | 同上，順序不同 | 執行期一律以名稱查找，順序無語意 |
| poster.png | 966,611 bytes | 957,220 bytes | Cycles 32 samples + denoiser 非決定性 |
| SHA-256 | 全部不同 | — | 上述差異的必然結果 |

gltf-validator：重建的三個 raw 與三個 optimized GLB 皆 0 errors、0 warnings。資產預算檢查（總計 <1MB、<40k triangles）通過。

## 結論

- 已上線的 **v2 可由現行 build.py + optimize 重建**，語意階層完全一致，差異全部可解釋 → SPEC/PLAN Phase 6 的「可重建得到語意一致資產」條件成立。
- **v3 仍不可由 build.py 重建**：v3 是 `scripts/polish-hero-world.mjs` 對 v2 幾何做 NodeIO 後製的產物，`build.py` 的 `PROD` 仍指向 v2。前端目前引用 v3，因此上線資產的來源鏈仍未閉合。
- `assets/blender/hero-world/export/*.raw.glb`（repo 內未追蹤的既有檔）**早於現行 build.py**：缺少 `Environment`／`Tree` 語意根節點、`Trunk`／`Crown` 命名，且 ferris 子節點仍叫 `FerrisRotor_*`。它們不是 v2 的實際輸入，不應被當成來源證據。

## 版控範圍

本目錄的文字報告、hierarchy dump 與 JSON 量測入版控；QA 截圖與錄影依 `.gitignore` 留在本機。`assets/blender/hero-world/export/*.raw.glb` 亦不入庫——它們是 build.py 的中間產物，且現存檔案比腳本還舊，入庫只會留下誤導性的來源證據。
