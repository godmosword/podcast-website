# Handover — Hero 橫向 2.5D 視差改版（2026-09-11）

給接手的 agent。讀完這份就能冷啟動；每一節都寫「現況／證據在哪／下一步」。
規格全文在 [`docs/specs/HERO-PARALLAX-SPEC.md`](specs/HERO-PARALLAX-SPEC.md)，這裡不重複規格，只講規格沒寫的實作現況與踩過的坑。

---

## 0. 一句話現況

**視差帶已是首頁覆蓋層與 `/intro` 的預設舞台**（main `e7be2852`，含 Astra 視覺審查後的文字安全區修正）。3D 等距 diorama 只剩回滾用途。Phase 1／2／3／3b／4 全部落地；**Phase 3c（下架 R3F／Three）刻意沒做**，等實機看過再拉。

**2026-09-12：** 產品已下架開場（`INTRO_PORTAL_ENABLED = false`）。首頁不掛覆蓋層、`/intro` 導回 `/`。下列檔案與契約仍保留。

---

## 1. 這一輪推上 main 的 commit（由舊到新）

| commit | 內容 |
|---|---|
| `99c76cbc` | Phase 4：四張零件表 → `scripts/compose-parallax-tiles.mjs` 合成可平鋪 tile |
| `e1ecee49` | Phase 3：`components/landing/hero-parallax/` 視差帶，與 3D 並存 A/B |
| `02c34151` | Phase 3b：預設切為 parallax，`e2e/intro-portal.spec.ts` 改寫為視差帶契約 |

三個 commit 的訊息都寫了「為什麼」；卡住時先 `git show` 它們。

---

## 2. 舞台開關與回滾

```
components/landing/hero-world/config.ts
  HERO_STAGE_DEFAULT  = NEXT_PUBLIC_HERO_STAGE === "world" ? "world" : "parallax"
  resolveHeroStage()  讀 ?stage=world|parallax（hydration 後才生效，不進 canonical）
```

- 整站回滾：Vercel 設 `NEXT_PUBLIC_HERO_STAGE=world` 重新部署。
- 單頁比對：`/intro?stage=world`。
- `HeroWorld.tsx` 用 `data-stage` 標記目前舞台；e2e 與 visual 都靠它。

**world 舞台現在只有單元測試守，沒有 e2e。** 它是保險絲，不是產品。

---

## 3. 契約在哪裡

| 層 | 檔案 | 守什麼 |
|---|---|---|
| e2e | `e2e/intro-portal.spec.ts`（63 tests，~13s） | 永不請求 WebGL context、不載 three chunk、reduced motion 是靜態圖、無暫停鈕且看著頁面時一直跑、隱藏分頁才凍 `animation-play-state`、F09／F10 active-time 預算、tile 404 不擋出口、覆蓋層閘門關著不下載 tile、**文字安全區**（六個尺寸，文案／按鈕列在透明遮罩段內或在會動的層之上，與相位無關） |
| visual | `e2e/visual.spec.ts` → `intro-parallax-1440x900-light`／`390x844` | reduced-motion 定格畫面 |
| unit | `components/landing/hero-parallax/layers.test.ts` | `PARALLAX_LAYERS` 尺寸與 `public/landing/hero-parallax/manifest.json` 對帳；速度遞增；三份 tile 蓋得住 2560 |
| unit | `components/landing/hero-world/config.test.ts` | `resolveHeroStage`、預設是 parallax |

跑法：

```bash
npm run compose:parallax                      # 重生 tile（改 props/ 或 LAYERS 旋鈕後）
npx vitest run components/landing/hero-parallax components/landing/hero-world
NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app npx playwright test e2e/intro-portal.spec.ts
NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app npm run test:visual:trusted
```

`NEXT_PUBLIC_SITE_URL` 一定要帶，否則 canonical 烤成 localhost、smoke 假性失敗。

---

## 4. 檔案地圖

```
components/landing/hero-parallax/
  HeroParallax.tsx          四層 strip ＋ 主角 sprite；ready 只看路面與主角
  HeroParallax.module.css   --s 縮放、--horizon 62%、--k 單層縮放；stacking context 在 .band
  layers.ts                 PARALLAX_LAYERS（尺寸／速度）、BASE_VELOCITY 60px/s、TILE_COPIES 3
components/landing/hero-world/
  HeroWorld.tsx             外殼：文案、CTA、進站轉場、覆蓋層語意；useHeroStage 選舞台
  config.ts                 HERO_STAGE_DEFAULT / resolveHeroStage（其餘是 3D 的）
scripts/compose-parallax-tiles.mjs   零件表 → tile；L3 路面三道處理
assets/landing/hero-parallax/
  props/L1.png L2.png L3.png L5.png  生圖原檔（ChatGPT Images 2.5）
  PHASE4-ASSET-PROMPTS.md            實際用的 prompt、失敗版本的原因、後製紀錄
  verify/*-seam.png                  接縫對照圖
public/landing/hero-parallax/        l1-props / l2-props / l3-road / l5-props .webp ＋ manifest.json
public/adventures/roamers/xiao-hong.webp   主角 sprite，與地圖 roamer 共用同一份
```

---

## 5. 踩過的坑（規格與程式註解沒寫完整的部分）

### 5.1 視差帶本身

- **覆蓋層是 SSR 出來、閘門關著時 `display:none`。eager 的 `<img>` 沒有 layout box 瀏覽器也照抓。** 覆蓋層模式必須全部 `loading="lazy"`（`HeroParallax` 的 `deferImages`），否則明確表達「不要動畫」的人白白下載 290KB，e2e 的「never sees the overlay and downloads no tile」會抓到。
- **13 張圖全部 eager 會跟 hydration 的 JS 搶頻寬。** 使用者在 hydration 前點「略過」就變原生導航到 `/?enter=1`。`/intro` 直達頁只有路面第一份與主角 eager。
- **SSR 的 `<img>` 常在 hydration 前就 load／error 完，`onLoad`／`onError` 掛不到。** 掛載後要補查 `complete`，而且失敗也算 settled——否則 tile 404 會把 Intro 卡在 poster，出口永遠等不到。
- **`.band` 必須自成 stacking context**（`z-index: 1; isolation: isolate`）。沒有這行，層內 z-index 3／5 會壓過 HeroWorld 的 CTA（2）與略過（3）——實測整顆 CTA 消失。
- **動畫用 `translateX(-33.333%)`** 而不是 px：百分比對自身寬，就不用在 `@keyframes` 裡讀 custom property（瀏覽器支援參差）。
- **背景往右捲、主角面朝左。** 不鏡像 sprite——鏡像會把車門與引擎蓋的「2」變反。
- **文字安全區靠 L1／L2 左側的透明漸層遮罩**（`--text-clear`／`--text-fade`），不是靠尺寸碰巧避開。數字是量出來的（1440 按鈕列右緣 26%、844 橫向 45%）；改按鈕文案或字級後要重跑「text safe zone」測試。視差舞台的 CTA 在副標正下方，不在 3D 的 bottom 23%。
- **手機直向要把略過放進第三列，地平線維持 62%，L5 `bottom: 0`。** `--horizon: 46%` 加近景沉出、略過 `position: absolute`，會讓路浮在上半、草叢貼底被切、中間空一截奶油。`--s` 用 `min(0.7, 100cqh / 680px)` 夾住（兩個運算元都必須無單位，`min()` 才合法），矮螢幕才不會把路面裁掉。覆蓋層已付 `--nav-h`，內容列不要再加 `safe-area-inset-top`。
- **三條 hydration 競速測試**（skip 進站 ×2、覆蓋層焦點陷阱）等 `[data-hero-parallax][data-running="true"]` 再操作——那是 React effect 才會寫的訊號。server 冷啟動＋機器負載時不等會偶發原生導航。
- 沒照規格 §4.4 把 Hero 改成 520–600px：`/intro` 與覆蓋層都是全螢幕，視差帶填滿 `100svh`。見規格 §5.2。

### 5.2 素材管線

- **影像模型出不了 1920px 無縫長條**。改成「透明底零件 → Sharp 排進 1920 畫布、左右各留 120px 空白」，接縫落在空白處。
- **L3 路面是唯一沒有空白緩衝的層**，三道處理**順序不可調換**：先偵測虛線週期（163px）→ 才能校色 → 裁「間隙中點起、整數個週期」→ 一個週期寬的**預乘 alpha** 交叉淡接。先校色會把路面提亮到接近奶油色，虛線判定把整條路當虛線，週期抓成 42px。
- 交叉淡接**必須預乘 alpha**：直接混 RGB 會在草皮／透空交界產生綠色鬼影。
- 路面色**刻意保留生圖原色 `#a47846`**（`RECOLOUR_STRENGTH = 0`）。對齊 Art Bible 步道色的機制還在，調回 0.78 重跑即可；但校正後虛線對比會降。
- 第一版 STYLE prompt 寫了 `tabletop model`，模型給每個零件配了橢圓草皮底座，**裁不掉**（灌木比草皮先變寬）。修正版 prompt 在 `PHASE4-ASSET-PROMPTS.md` §2。

### 5.3 測試與環境

- **`test:visual:trusted` 是序列模式，第一張失敗後其餘全部 did not run。** 看到「N did not run」不代表那 N 張壞了。用 `--grep-invert "<name>"` 排除已知過期的再跑。
- **`.githooks/pre-push` 有視覺 baseline 閘門**：動到 `components/`／`app/` 的 tsx／css 卻沒有任何 `e2e/visual.spec.ts-snapshots/` 變更就擋 push。逃生門 `SKIP_VISUAL_GATE=1`，要在 commit message 說理由。
- **baseline 只能在 macOS 錄**（`-chromium-darwin`）。CI 跑 ubuntu 不跑 visual。
- **3D 舞台的 e2e 在這台機器上本來就在邊緣**：軟體算圖的 WebGL 要 25–30s 才 ready，測試上限 30s，機器一忙就失敗。這是切預設的理由之一，也是為什麼不要回頭把 3D 測試加回來。
- **同一個工作區可能有另一個 agent session 同時在改**（本輪撞過兩次：ep-29 圖片與 characters 頁）。`git stash` 前先看 `git status`，只 `git add` 自己的檔案，commit 前確認沒掃到別人的。
- **本機 3000 常被 dev server 佔住**；e2e 的 webServer 寫死 3000。要重用自己起的 production server 用 `PW_REUSE_SERVER=1`。切換 build 時**一定要先殺舊 server**——舊 server 配新 `.next` 會 CSS 404 整頁裸奔。
- main 的 ruleset：CI 狀態檢查可 bypass（push 時會印 "Bypassed rule violations"），歷史保護不可。

---

## 6. 目前已知的過期 baseline（不是視差改版造成，未處理）

| baseline | 原因 | 該誰重錄 |
|---|---|---|
| `stories-390-light` | ep-29 新集數改了列表（`77429838`／`da2dbf23`） | ep-29 那條線 |
| `story-card-earliest-light`（故事卡，錨定最早一集） | 同上，1px 高度差 | 同上 |
| `characters-390-light`（角色圖鑑） | `e06cce9c` 頁高 8263→6888 沒重錄 | characters 那條線 |

重錄前先確認畫面是對的，不要盲目 `--update-snapshots`。

---

## 7. 下一步（依優先序）

### 7.1 實機驗收（先做）

- iPhone Safari／Android Chrome 開 `/`（覆蓋層）與 `/intro`：看小紅份量、路面接縫、文案與遠景是否打架、略過鍵的奶油底 pill。
- 量 LCP：路面 `l3-road.webp`（102KB）與 `xiao-hong.webp`（30KB）是 LCP 元素。`measure:intro-performance` 目前固定走 `?stage=world`，量視差帶要另寫或加參數。
- 美術旋鈕都在 CSS 變數與 `layers.ts`：`--s`（斷點縮放）、`--horizon`、`--hero-left`、`--hero-height`、`.l1 --k`、`BASE_VELOCITY_PX_PER_SECOND`。改這些不用重新生圖也不用重跑 compose。

### 7.2 Phase 3c：下架 R3F／Three（實機看過再做，不可逆）

清單在規格 §5.1.1。要刪的：

- `components/landing/hero-world/`：`HeroScene`、`World`、`Vehicle`、`CameraRig`、`QualityManager`、`SceneLoader`、`WorldEnvironment`、`art-direction.ts`；`config.ts` 只留 `HeroStage` 相關，其餘（`QUALITY`、`WHEEL_RADIUS`、`driveProgress`…）一併刪；`HeroWorld.tsx` 移除 `Scene` dynamic import、WebGL 資格判定、`LOAD_TIMEOUT` 邏輯、`quality` state、poster `<picture>`
- 依賴：`three`、`@react-three/fiber`、`@react-three/drei`（確認沒有別處用）
- 資產：`public/models/hero-world/`、`assets/blender/`、`assets/hero-world/`
- 腳本：`optimize-hero-world`、`render-hero-posters`、`validate-hero-world`、`qa-hero-framing`、`qa-intro-viewports`、`measure-intro-performance`、`capture-intro-*`；`package.json` 對應的 `release:hero-world` 等 script
- 文件：`docs/HERO-WORLD.md`、規格 §0.3／§0.4 的 3D 核對表改為歷史紀錄

做完之後 `HERO_STAGE` 開關也可以拿掉——但那時就真的沒有回滾了。

### 7.3 Phase 2b／2c（3D 舞台的美術，若 3c 做了就作廢）

輪徑比例、引擎蓋長條紋＋大「2」、大燈白外環、`blue` 色票偏青、後照鏡浮空。清單在 `TODOS.md`。**如果決定做 3c，這些直接關掉。**

### 7.4 主角 sprite 解析度

`xiao-hong.webp` 是 625×396，桌機 `--hero-height: 230px`（`--s: 1.15` 時 265px）已接近 1:1。若要更大或 2x，`PHASE4-ASSET-PROMPTS.md` §5 有 image-edit 的備案 prompt——**必須用既有 sprite 當參考圖**，純文字生成會回落到通用卡通車（《Cars》樣板）。

---

## 8. 不要做的事

- 不要把 3D 的 e2e 測試「加回來當 skip」。切預設的決定是刪它們，不是藏它們。
- 不要在 `@keyframes` 裡讀 custom property。
- 不要鏡像主角 sprite。
- 不要把 `RECOLOUR_STRENGTH` 調回去而不看虛線對比。
- 不要用 `git stash -u` 收整個工作區——會把別的 session 的檔案一起收走，pop 時撞衝突。
