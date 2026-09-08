# v3 乾淨重建與 Phase 8 視覺驗收（2026-09-08）

## 這一輪解決的問題

上線資產（v3）先前的來源鏈是斷的：`build.py` 產出 v2，`scripts/polish-hero-world.mjs`
再用 gltf-transform NodeIO 改寫 v2 的材質與頂點資料得到 v3。`.blend` 與 `build.py` 都不
包含 v3 的美術，manifest 自己寫著 `blenderCleanRebuild: false`。本輪把 polish 的每一項
決策回寫進 Blender 來源，刪掉 polish 腳本，讓 v3 可以從 `.blend` / `build.py` 乾淨重建。

## 環境

| 項目 | 值 |
|---|---|
| Blender | 4.5.0，以 PyPI 的 `bpy==4.5.0` 模組在容器內執行 `python3 assets/blender/hero-world/build.py`。**這不等於 `blender -b --python` 的執行環境**：兩者共用同一份 Blender 版本與 Python API，但 CLI 會走完整的應用程式啟動、載入 startup file 與 addon 集合（glTF 匯出器在 CLI 是預設啟用的 addon，在 bpy 模組則由 Python 匯入），因此 addon 版本、preferences 與預設場景都可能不同。本輪的結果須在 Phase 13 前用實體 Blender CLI 重跑驗證（見「未結案」） |
| Node | v22.22.2；gltf-transform 4.5.0、gltf-validator（`npm run optimize:hero-world`） |
| 瀏覽器 | Chromium（Playwright 1.60，容器預裝 `/opt/pw-browsers/chromium`，**軟體算圖**） |
| 產物 | `public/models/hero-world/v3/`、`assets/hero-world/posters/v3/`、`assets/blender/hero-world/hero-world.blend` 全部重新產生 |

## 回寫進 build.py 的內容

| polish 做的事 | 現在由誰負責 |
|---|---|
| 換掉 14 個共用材質的 base color / roughness | `WORLD_PALETTE` / `WORLD_ROUGHNESS` |
| 暖窗 emissive `(.27,.10,.018)` | warmglass 材質的 Emission Color（strength 1，glTF 直接就是這個值） |
| 吊艙與輪胎維持原本明亮玩具色 | `TOY_PALETTE`（`cabin_*`、`wheel_*` 材質；原本靠「跳過這些節點、留著 v2 的 palette atlas」達成） |
| 餅乾底座 −0.085、前庭鋪面 +0.032（節點位移） | 直接寫在幾何座標（`Island biscuit` z −0.325、`Courtyard clay` z 0.302） |
| 以世界座標算 COLOR_0 接觸陰影 | `CONTACT_SHADE` + `bake_contact_colors()`，以 FLOAT_COLOR 屬性匯出成 COLOR_0 |
| 刪 TEXCOORD_0 | 匯出前移除 UV layer（全場景無貼圖，UV 沒有用途） |

另外：`optimize-hero-world.mjs` 改用 `--palette false`，所以 GLB 完全不帶貼圖（v2/v3 之前
會產生 `PaletteBaseColor` / `PaletteMetallicRoughness` 兩張 PNG）；raw 與 final 都要求
validator **0 errors 且 0 warnings**；manifest 記錄 Blender 版本、build seed、`build.py`
的 SHA-256 與三個 raw export 的 SHA-256。`polish-hero-world.mjs` 已刪除。

## 階層與動畫

`rebuilt-*.hierarchy.txt` 對 `shipped-*.hierarchy.txt`（重建前的上線 v3）：

| 必要節點 | 重建 | 重建前 |
|---|---|---|
| `Environment` → `FerrisRotor` → `GondolaPivot0..7` | ✅ 8/8 | ✅ |
| `RimAndSpokes_cream` / `_pink` | ✅ | ✅ |
| `Vehicle` → `Body`、`Wheel_0..3` | ✅ | ✅ |
| `Drive` clip | ✅ 4 channels、2.0417s、目標為四個輪子 | ✅ 相同 |
| `Tree` → `Trunk` / `Crown` | ✅ | ✅ |

三個模組的**節點名稱集合與節點數完全相同**（environment 41、little-red 16、tree 3）。

## bytes / triangles / materials / clips

| 模組 | bytes（重建 / 重建前） | triangles | materials | textures | clips |
|---|---|---|---|---|---|
| environment | 216,428 / 287,120 | 12,141 / 12,111 | 18 / 14 | 0 / 2 | — |
| little-red | 64,924 / 84,968 | 3,740 / 3,740 | 9 / 8 | 0 / 1 | Drive 2.0417s（相同） |
| tree | 10,132 / 12,232 | 492 / 492 | 2 / 2 | 0 / 0 | — |
| **合計** | **291,484 / 384,320（−24.2%）** | **16,373 / 16,343（+30）** | 29 / 24 | 0 / 3 | — |

gzip：environment 101,705、little-red 25,467、tree 5,373 bytes。預算 <1 MB、<40k triangles 皆通過。

差異的成因，逐項可解釋：

- **bytes −24%**：拿掉 palette atlas 的兩張 PNG 與所有 TEXCOORD_0，並且只有真正有濃淡的
  四個網格帶 COLOR_0（重建前是所有被 polish 過的網格都帶一組全白 COLOR_0）。
- **materials +5**：atlas 拆回實體材質（吊艙 4 色 + 吊桿、輪胎／輪轂／中心）。顏色值與
  atlas 內容相同，draw call 不變（吊艙本來就各自是一個節點）。
- **triangles +30（+0.2%）**：`gltf-transform simplify --ratio 0.76` 的結果與輸入頂點順序
  有關；輸入少了 UV 造成的頂點分裂，簡化落點就不同（ivory +494、mint −178、rim −86…）。
- **COLOR_0 數值**：以世界座標對照原 polish 的公式，重建後最大偏差 **0.002**（＝量化級距），
  與重建前的資產對同一公式的偏差相同。平均值的小差來自頂點數不同（例如草地 358→257 個
  頂點，面數不變）。

## 重建的重現性

在隔離目錄獨立跑兩次 `build.py` + optimize（同一台機器、同一版腳本）：

- raw GLB **不是逐 byte 相同**：JSON chunk 完全相同，只有三角形索引的順序不同。Blender 的
  glTF 匯出器每次產生的索引順序會變（與 `PYTHONHASHSEED` 無關，固定成 0 仍會變）。
- 最終 GLB：**JSON chunk 完全相同**（節點、材質、accessor 的 count 與 min/max 全等）、
  **byte 長度相同**（environment 216,428）、**triangle 數相同**（12,141），差異只在索引與
  被重新排序的頂點屬性。
- 因此幾何、材質、動畫與階層可重現，SHA-256 不可重現。這符合 PLAN Phase 6 的退出條件
  「二進位不一定逐 byte 相同，差異需能解釋」，manifest 也因此每次重建都會換 hash——
  hash 的用途是綁定「這次發布的檔案」，不是宣稱重建結果相同。

## Validator

- `optimize-hero-world.mjs`：三個 raw、三個 final 全部 **0 errors / 0 warnings**（有 warning 就中止）。
- `npm run validate:hero-world`（v3）：**88 checks、0 failures**，含檔案存在、SHA-256、poster
  尺寸與預算、語意節點與父子關係、`Drive` 目標、無內嵌貼圖、以及 manifest 必須宣告
  `blenderCleanRebuild: true` 與 build.py／.blend 來源。
- `npm run validate:hero-world v2`：仍然通過（回退版本未被本輪改動）。

## poster 與 live scene 一致性

poster 由 `scripts/render-hero-posters.mjs` 用**正式的 R3F 場景、燈光與 CameraRig** 輸出，
所以模型、tone mapping、陰影與相機參數天生同源；manifest 的 `camera` / `lighting` 現在
直接讀場景實際使用的 `art-direction.ts`，不再是腳本裡另抄一份常數（本輪修掉的漂移）。

- desktop poster 1380×980、74,032 bytes（WebP，預算 180 KB）；mobile 615×490、28,206 bytes（預算 100 KB）。
- `renderer-report.json`：摩天輪 0°／90°／180°／270° 四個角度，八個吊艙的世界向上向量
  與 (0,1,0) 的最大誤差為 **0**；high 81 calls（主 pass 52 + shadow 29）、medium 52 calls。
- 擷取比對（`after-framing/` 的 poster 幀 vs live 首幀，量世界輪廓的 bounding box）：
  desktop 位移 0.14% 寬 / 0.00% 高、尺度差 0.20% / 0.16%；mobile 位移與尺度差皆 0.00%。
  SPEC §12（V02）要求位移 ≤2%、尺度差 ≤5%，通過。

## before / after 影像差分

`before/` = 重建前的上線 v3 資產，`after/` = 重建後的資產（**相機未動**），兩組都在同一台
機器、同一版程式、同一組控制姿勢下擷取。以合成到白底後的每像素最大通道差計算：

| 擷取 | 平均差 | 差 > 8 的像素比例 |
|---|---|---|
| desktop poster / ready / acknowledge | 0.386 / 0.108 / 0.246 | 0.25% / 0.27% / 0.67% |
| mobile poster / ready / acknowledge | 0.297 / 0.148 / 0.082 | 0.16% / 0.31% / 0.18% |

差異集中在輪廓邊緣一像素（簡化落點不同），沒有色偏、亮度或材質層級的改變。完整表格見
`image-diff.json`。

## Phase 8 視覺驗收

`after-framing/` 是最終狀態（重建資產 + 本輪相機定稿），desktop 1440×900、mobile 390×844，
各含 poster、ready 與五個受控姿勢（approach／decelerate／stop／settle／acknowledge／continue）。

| 項目 | 結果 | 依據 |
|---|---|---|
| desktop / mobile before-after | PASS | 上表影像差分 + `before/`、`after/`、`after-framing/` |
| Little Red 角色感 | PASS | 眼睛、瞳孔高光、笑臉、車頭線在 390px 仍可辨；懸吊只作用在 Body，四輪保持接地 |
| story house 前庭 | PASS | 道路→石階→橢圓鋪地→門檻的關係完整；鋪面比外框高 0.032，不像懸空平台 |
| lighting / roughness / contact depth | PASS | 單一主光＋hemisphere；roughness 依材質（車身 .77、屋牆 .92、葉 .88、窗 .58）；接觸陰影是 COLOR_0 的廣義暗部，未疊加過強 AO |
| world scale / crop | **本輪修正** | 見下 |
| Ferris wheel / tree motion | PASS | 四角度吊艙直立誤差 0；樹擺只在 high、只動兩株樹冠、樹幹不漂移（`World.tsx`） |
| poster → live continuity | PASS | 同一 renderer 產生，manifest 相機參數即場景參數 |

**world scale / crop（本輪唯一的美術修正）**：驗收時發現實作與自己的美術宣稱不符——
`art-direction.ts` 註解寫「mobile 刻意裁切島緣」，但 390px 實拍是整座島浮在大片奶油色中央，
桌機也一樣整座底座都在框內，不符合 PLAN Phase 8「桌面世界約增加 5–10% 存在感、局部底座出框」。
本輪只改兩個數字：desktop scale 1.16 → 1.20、mobile 0.94 → 1.15。改後底座在兩端出框、
世界佔滿舞台，屋頂、摩天輪輪圈、小紅的眼睛與所有 CTA 都仍完整（`after-framing/`）。
沒有新增任何物件、shader、particle 或相依套件。

## 效能取樣（軟體算圖，不是裝置宣稱）

同一台容器、Chromium 軟體算圖，medium／390×844：

| 版本 | FPS | draw calls | triangles | textures |
|---|---|---|---|---|
| 重建前資產、原相機 | 31 | 52 | 19,557 | 4 |
| 重建後資產、原相機 | 32 | 52 | 19,803 | 1 |
| 重建後資產、新相機（定稿） | 24／16（兩次取樣） | 52 | 19,803 | 1 |

有意義的是 draw call 不變、貼圖由 4 張變 1 張——重建沒有讓場景變重。FPS 欄在這台機器上
噪音很大（同一組設定兩次取樣 24 與 16），相機放大後填充像素變多在**軟體光柵化**特別敏感；
所有情況都低於 QualityManager 的 38 FPS 門檻，行為一致。這些數字不能當作真機效能，
真機驗證仍未做。desktop（high）取樣時間不足，未取得穩態 FPS。

順帶一提，這台機器的低幀率正好暴露了動畫時間依賴幀率的既有缺陷，已一併修正
（見 [frame-rate-timeline.md](./frame-rate-timeline.md)）；`after-framing/` 的擷取是修正後
重拍的，摩天輪與樹擺的相位因此與修正前的擷取不同（受控姿勢本身仍相同）。

## 未結案：實體 Blender CLI 驗證（Phase 13 前必做）

本輪的乾淨重建是用 `bpy` 模組跑的，等同於「同一版 Blender 的 Python API」，但不是
`blender -b --python assets/blender/hero-world/build.py` 這條發布文件寫的路徑。Phase 13
交付前必須在裝有 Blender 4.5 LTS 的環境重跑一次 CLI，並比對：

1. 三個 raw GLB 的節點名稱集合、節點數、`Drive` clip 與 COLOR_0 是否與本輪一致；
2. 經 `optimize:hero-world` 後的 bytes、triangles、materials 是否落在本輪的數值；
3. `validate:hero-world` 是否同樣 88 項全通過。

在那之前，「v3 可由 build.py 乾淨重建」的成立範圍是 **bpy 4.5.0 模組**，不是 Blender CLI。

## 已知限制

- 沒有實體 iPhone／Android，未做真機 Safari 驗證。
- 上述 Blender CLI 驗證未做（本容器沒有 Blender 應用程式，只有 `bpy` 模組）。
- 驗收當下 `e2e/intro-portal.spec.ts` 的 `runs the signature phases once and pauses active time`
  在本容器 FAIL（以重建前的資產跑也同樣 FAIL，不是本輪回歸）。追查後確認是既有缺陷：
  動畫以 `Math.min(delta, .05)` 累加 render delta，低幀率會把 18 秒的旅程拉長。已在
  2026-09-08 修正（見 `frame-rate-timeline.md`），修正後 `e2e/intro-portal.spec.ts`
  **20 passed / 0 failed**。
- 其餘驗證：`npm test`、`npm run lint`、`npm run typecheck`、production build、
  `verify:no-public-fs`、`verify:function-size`、`public-smoke`、`public-a11y` 全數通過。
- QA 截圖依 `.gitignore` 留在本機（`docs/qa/**/*.png` 不入庫），本報告與 JSON 量測入庫。
