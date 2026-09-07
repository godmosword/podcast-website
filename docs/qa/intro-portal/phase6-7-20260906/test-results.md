# Intro Portal Phase 6／7 QA

日期：2026-09-06 · artifact：`phase6-7-20260906` · server：Next.js 16.3.2 production server · browser：Playwright 1.60.0／headless Chromium · Node：v25.8.0

## Pass

| 檢查 | 命令／證據 | 結果 |
|---|---|---|
| Raw GLB validator | `npm run optimize:hero-world` source validation | PASS：environment 494,368 B、little-red 136,108 B、tree 16,416 B；0 errors／0 warnings |
| v2 optimizer | `npm run optimize:hero-world` | PASS：quantize／dedup／weld；只簡化 environment；不 flatten／join dynamic hierarchy；生成 WebP、manifest、asset report |
| v2 validator | `npm run validate:hero-world` | PASS：所有檔案、SHA-256、bytes、尺寸、parents、Drive targets、budgets；0 failures |
| GLB budget | `docs/qa/intro-portal/phase6-7-20260906/asset-report.json` | PASS：三 GLB 合計 380,864 B、16,343 triangles；每個 <1 MB |
| Poster budget | v2 manifest | PASS：desktop 45,574 B／1400×1000；mobile 34,048 B／840×600；lossless master 957,220 B |
| Hierarchy | validator + manifest | PASS：`Environment → FerrisRotor → GondolaPivot0..7`；`Vehicle → Body/Wheel_0..3`；`Tree → Trunk/Crown` |
| Animation contract | validator + `animation-report.json` | PASS：`Drive` 2.0417s，四個 channel 只指向四個 wheel；arc-length wheel mapping；Body-only settle |
| Source syntax | `python3 -m py_compile assets/blender/hero-world/build.py`; `node --check scripts/{optimize,validate}-hero-world.mjs` | PASS |
| TypeScript／lint | `npm run typecheck`; `npm run lint` | PASS |
| Unit suite | `npm test` | PASS：288 files／1,815 tests |
| Production build | `npm run build` | PASS：Next 16.3.2，333 static pages，`/intro` static route |
| Intro E2E | `PW_REUSE_SERVER=1 npx playwright test e2e/intro-portal.spec.ts --project=chromium` | PASS：14/14；v2 request、poster/fallback、WebGL/data saver、phase state、pause/resume、Enter |
| Public regression | `PW_REUSE_SERVER=1 npm run test:e2e:public` | PASS：17/17 |
| Service worker／diff | `npm run verify:service-worker`; `git diff --check` | PASS |
| Runtime fetch smoke | curl `/models/hero-world/v2/{environment,little-red,tree,poster.webp,poster-mobile.webp,manifest.json}` | PASS：全部 HTTP 200，bytes 與 manifest 一致 |
| Visual captures | `capture-summary.json`, `animation-capture.json`, desktop/mobile PNGs | PASS：desktop 1440×900、mobile 390×844；poster／ready／greeting；phase screenshots for approach／decelerate／stop／settle／acknowledge／continue where observed |

## Phase 7 timeline

The runtime uses active frame delta. The canonical timeline and distance math are in `animation-report.json`. `data-motion-phase` is emitted by the live scene for capture and E2E; no wall-clock timer advances the car while hidden or paused. The 24-second sleep threshold uses accumulated visible foreground time.

## Limitations / blockers

- This execution environment has no `blender` executable on PATH, so the updated `build.py` could be syntax-checked but not re-run here. The existing raw exports are validator-clean, and the v2 optimizer applies and verifies the semantic hierarchy; a Blender 4.5 LTS workstation should run `blender -b --python assets/blender/hero-world/build.py` before the next art edit.
- Runtime FPS evidence is headless Chromium software rendering: the captured mobile Medium sample was 46 FPS / 51 calls / 19,555 triangles / DPR 1.25. No physical iPhone Safari or Android Chrome measurement, field INP, thermal or GPU memory measurement was claimed.
- No Phase 8 art polish, deployment, commit or push was performed.
