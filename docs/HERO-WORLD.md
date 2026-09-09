# 車車遊樂園：微型故事入口

完整的設計理念、架構說明與原始檔快照請參閱：[HERO-WORLD-SOURCE.md](./HERO-WORLD-SOURCE.md)。

> **改版規格（未實作）：** 等距 diorama → 橫向 2.5D 視差帶的規格見 [`specs/HERO-PARALLAX-SPEC.md`](./specs/HERO-PARALLAX-SPEC.md)。該文 §0.3 逐項核對了現版 `build.py` 小紅幾何與角色設定書的落差。

## Repository inspection / implementation decision

Inspected App Router routes, LandingHub/Segment/ScrollView/SegmentNav, theme and global tokens, DESIGN.md, landing art and 小紅 portrait, universe/character asset organization, landing playback, service worker, analytics, next.config, metadata/JSON-LD, font subsets, Vitest and Playwright suites. Next 16.3.2 + React 19.2.7, strict TypeScript, CSS Modules. Homepage is statically rendered with four full-height panes inside a dedicated scroll container. It has a hidden H1, hidden section headings, existing story links, companion and bedtime overlay. Route content, canonical and podcast JSON-LD live outside WebGL. Audio starts only after a deliberate play action. Existing art uses soft red/blue toy vehicles, warm cream, rounded clay shapes, mint trees. Preserve the four-pane navigation, story discovery links, parent navigation, themes, audio semantics and child-friendly typography. Only the opening pane becomes spatial.

Large unrelated feedback/navigation/legal changes were already present in the working tree. This task does not replace them. The original first image is static and has no readable visible heading; the new original scene adds depth and a visible HTML welcome. No story, scoring, game, map, API or SW contract changes are needed.

## Three concepts evaluated before implementation

| | A — 故事入口小樂園 | B — 口袋故事島 | C — 沿路聽故事 |
|---|---|---|---|
| Composition | Oval toy base, loop road, story house, tiny ride and trees | Three connected biome islands and a central station | Long winding road through three story vignettes |
| Story | 小紅 drives into the park, pauses to greet, then continues | Choose which neighborhood to visit | Follow a delivery car from story to story |
| Camera | Elevated orthographic, compact frontal three-quarter view | Higher oblique overview | Perspective side view with scroll travel |
| Vehicle moment | One slow circuit with a brief suspension greeting | Train emerges from forest | Delivery car stops at each scene |
| Interaction | Gentle pointer response; HTML pause/replay and story link | Landmark selection + equivalent DOM list | Scroll advances route, DOM links at stops |
| Blender assets | Toy island, road, house, ride, trees, red car, wheel clip | Three islands, bridges, train, regional props | Three environments, longer road, delivery car |
| Complexity | Medium; one self-contained enhancement | High; selection and camera states | High; scroll synchronization and route semantics |
| Estimated raw GLB | 0.5–1 MB | 1.5–3 MB | 2–4 MB |
| Mobile | Centered closer framing, less foliage; HTML above/below | Single island at a time | One vignette, no camera travel |
| Expected GPU cost | Low/medium; <40k triangles, <70 calls | Medium/high; 60–100k triangles | Medium/high; 50–100k triangles |
| Pros | Brand continuity, readable CTA, simple lifecycle | Broad world-building and discovery | Strong narrative |
| Risks | Must avoid a generic model viewer | Crowded phone composition, duplicate map product | Motion burden, complex loading, scroll traps |

**Selected A.** It reinforces the existing story entrance without duplicating `/adventures`. Existing visible story CTA wording and destination are preserved. A calm miniature with a single authored character moment balances loading, accessibility, maintainability and brand fit. User explicitly authorized autonomous implementation, including the visible HTML content; this supersedes the older hidden-title design rule for this first pane only.

## Initial budgets

- Raw GLBs together <1 MB, compressed scene payload target <500 KB; no textures or remote decoder requests.
- <40,000 visible triangles; <=70 draw calls, high quality including one static shadow pass.
- Deferred 3D JS target <=300 KB gzip; initial wrapper <=15 KB gzip.
- DPR high 1.5, medium 1.25, low 1; mobile capped at 1.25.
- Brief arrival, then demand rendering; user can pause or replay. Low tier stays static.
- No essential copy/links inside canvas; SSR poster and fixed layout precede dynamic code.

## Blender asset pipeline

The editable source is `assets/blender/hero-world/hero-world.blend`; the procedural rebuild is `build.py`. It uses only Principled materials that survive glTF export, shared flat colors, low-poly rounded geometry, and named parts (`Environment`, `FerrisRotor`, `GondolaPivot0..7`, `Vehicle`, `Body`, `Wheel_0..3`, `Tree`, `Trunk`, `Crown`, `Drive`). Since the v3 convergence (2026-09-08) the shipped release has exactly one source chain — there is no post-export script that edits a previous release:

```text
blender -b --python assets/blender/hero-world/build.py   # → export/*.raw.glb + build-info.json
npm run optimize:hero-world                              # → public/models/hero-world/v3/*.glb
npm run render:hero-posters                              # → posters + manifest.json
npm run validate:hero-world                              # → 88 checks, 0 failures
# or all three at once: npm run release:hero-world
assets/blender/hero-world/export/*.raw.glb
  → gltf-transform optimize (quantize, dedup, weld; palette atlas off)
  → gltf-transform simplify environment --ratio 0.76 --error 0.002
  → gltf-transform semantic hierarchy pass
  → public/models/hero-world/v3/*.glb + asset-report.json
  → scripts/render-hero-posters.mjs (real R3F scene) → poster WebP + manifest.json
```

`build.py` owns the whole art direction: the v3 palette and roughness, the warm-window emissive, the two ground offsets (the sand biscuit sits below the meadow, the courtyard paving above its rim), and the contact shading, which is baked as a linear `COLOR_0` attribute on the four surfaces that actually vary (meadow, house walls, red volumes, tree crown). The Ferris cabins and the tyres keep the brighter toy palette in their own materials. GLBs carry no texture at all: the optimizer runs with `--palette false` and fails the build if an image reappears.

The optimizer validates raw and final output with `gltf-validator` (0 errors **and** 0 warnings), preserves dynamic parents, and records the Blender version, build seed, `build.py` hash and raw-export hashes in the manifest. `npm run validate:hero-world` independently checks file existence, hashes, dimensions, budgets, required parents and that the manifest still declares a Blender clean rebuild. To replace a model, edit the Blender source or generator, then rerun the chain above and keep the node names and `Drive` clip stable. Camera composition is owned by `CameraRig.tsx`; quality tiers are in `config.ts`.

## Frontend architecture and behavior

`HeroWorld.tsx` owns the semantic section, poster, HTML copy, story link, loading timeout, reduced-motion/data-saver gate, pause/replay control, and error boundary. `HeroScene.tsx` dynamically loads React Three Fiber and connects `World`, `Vehicle`, `CameraRig`, and `QualityManager`. `SceneLoader.ts` aborts requests and disposes geometries/materials on unmount. Static environment meshes are grouped by shared material; repeated trees use `InstancedMesh`. The scene runs with `frameloop="demand"`, only while visible and the document is foregrounded. Pointer parallax stays within a small range on desktop; mobile uses a closer, lower camera with fewer trees. The car follows one 18-second loop, pausing near the front before continuing. There is no autoplay audio and no canvas-only navigation.

If WebGL is unavailable, the model load fails, the 15-second timeout expires, reduced motion is enabled, or the user has Save-Data/2G, the poster and HTML remain in place. `NEXT_PUBLIC_HERO_3D=0` is also a deployment kill switch. The fallback is not a blank state: it is the same miniature world rendered as the transparent poster.

## Measured QA (v2 release, 2026-09-06)

> v3 clean-rebuild numbers and the before/after comparison are in
> [`docs/qa/intro-portal/v3-clean-rebuild-20260908/report.md`](./qa/intro-portal/v3-clean-rebuild-20260908/report.md).

Validated on the local production server at 1440×900 and 390×844 with headless Chromium. Captures and the machine-readable summary are in `docs/qa/intro-portal/phase6-7-20260906/`.

- v2 GLBs: environment 285,676 bytes / 12,111 triangles; little-red 84,472 bytes / 3,740 triangles / `Drive` 2.0417s; tree 10,716 bytes / 492 triangles. Combined GLB payload is 380,864 bytes and the combined triangle count is 16,343.
- Posters: desktop WebP 45,574 bytes at 1400×1000; mobile WebP 34,048 bytes at 840×600. Both are below their wire budgets.
- All raw and final GLBs passed `gltf-validator` with zero errors and zero warnings. `validate:hero-world` passed hashes, dimensions, parents, clip targets and size limits.
- Chromium loaded exactly three v2 model URLs and rendered one Canvas at both viewports. The mobile medium-tier sample recorded 46 FPS, 51 calls, 19,555 triangles and DPR 1.25; this is a local software-rendered sample, not a real-device claim.
- The phase6/7 timeline captures include poster, ready and greeting states for desktop and mobile; `capture-summary.json` records HTTP status, model requests and scene state.
- Unit, lint, typecheck, production build, targeted Intro E2E and public E2E are listed in `docs/qa/intro-portal/phase6-7-20260906/test-results.md`.

## Accessibility and maintenance notes

The welcome heading, description, CTA, section heading, and all existing navigation remain semantic DOM. The WebGL layer is `aria-hidden`; canvas interactions never gate story discovery. Keyboard focus styles use the existing token language, the pause control is a real button with a stateful accessible name, and reduced motion removes camera/parallax/vehicle motion. The existing four-pane navigation, audio gesture requirement, theme, metadata, JSON-LD, service worker and story routes remain unchanged.

Known limitations: model files are intentionally untextured flat-color GLBs rather than KTX2-compressed textures (v2 still carried a generated palette atlas; v3 dropped it); the poster is generated from Blender Cycles and does not share realtime shadow maps; and browser evidence uses headless Chromium rather than physical Safari/Android devices. A future pass can add a production RUM sample for low-tier frame rate after real-device QA.
