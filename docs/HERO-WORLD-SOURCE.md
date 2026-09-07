# 車車遊樂園 3D Hero｜原始檔與設計理念

> 這份文件整理本次 3D 首頁 Hero 的設計決策、技術架構、效能與無障礙策略，以及可重建場景的原始檔內容。  
> 生成日期：2026-09-05

## 文件用途

本文件是交接與保存用的設計／原始碼說明。真正會被編譯與部署的檔案仍在專案路徑中；下方程式碼區塊是當時檔案的完整快照。Blender 的 `hero-world.blend` 與 GLB 是二進位資產，因此以檔案連結保存，不把二進位內容轉成文字。

## 設計理念

### 選定方向：故事入口小樂園

首頁第一屏是一座溫暖、低多邊形的玩具小樂園：小紅沿著環形道路慢慢抵達，經過故事小屋、樹木與遊樂設施，再繼續前進。它把「開始聽故事」表達成一個可探索的入口，而不是單純的模型展示器。

這個方向在三個候選方案中被選定，原因是：

- 延續既有的奶油色、柔和紅藍車輛、圓角黏土造型與薄荷色樹木。
- 只改造首頁首段，不取代既有四段落導覽、故事連結或 `/adventures` 地圖。
- 一個自足的小場景能維持低 GPU 成本，並讓手機版有清楚的構圖。
- 故事 CTA 和所有重要文字仍是 HTML，搜尋引擎、鍵盤與輔助科技都能直接讀取。

### 視覺與動態原則

- **玩具模型語言**：使用平面色、圓角幾何、簡單 Principled 材質與柔和陰影。
- **視線先文字、再場景**：左側保留歡迎文案與「車車遊樂園的故事 →」；3D 是情境層，不承擔導覽。
- **慢而可中斷**：小紅約 18 秒繞行一次，在前景短暫停留；使用者可以暫停與繼續。
- **小幅互動**：桌面只做有限的指標視差，避免暈動；手機採更近、更低的鏡頭，減少樹木數量。
- **保留退路**：WebGL 不可用、Save-Data／2G、使用者偏好減少動態、載入錯誤或逾時時，直接保留同一場景的 poster。

### 效能與載入策略

首屏先送出固定 poster 與 HTML，React Three Fiber／Three.js 以延遲 chunk 載入。場景使用 `frameloop="demand"`，只有在可見、文件位於前景且尚未暫停時才重繪。重複樹木使用 `InstancedMesh`，模型拆成 environment、little-red、tree 三個可快取 GLB。

Phase 6/7 v2 驗證值：

- `public/models/hero-world/v2/` 含 environment、little-red、tree、desktop/mobile WebP poster 與 `manifest.json`；三個 GLB 合計 380,864 bytes、16,343 triangles。
- environment 285,676 bytes、little-red 84,472 bytes（`Drive` 2.0417s）、tree 10,716 bytes；所有 raw/final GLB 通過 `gltf-validator`，0 errors、0 warnings。
- `Vehicle → Body/Wheel_0..3`、`Environment → FerrisRotor → GondolaPivot0..7`、`Tree → Trunk/Crown` 由 validator 檢查；前端以弧長查表將輪速綁定實際道路距離，懸吊只套在 Body。
- 首頁 3D chunk 延遲載入；初始 HTML 不依賴 canvas 才能閱讀或操作。桌面／手機與 greeting captures 見 `docs/qa/intro-portal/phase6-7-20260906/`。

### 無障礙與失敗狀態

canvas 設為 `aria-hidden`，歡迎標題、說明、CTA、段落標題與暫停按鈕都在 DOM。減少動態時不掛載 canvas；fallback poster 和相同 HTML 仍可操作。模型載入錯誤與 15 秒逾時會回到 poster，而不是顯示空白區塊。

## 技術架構

```text
LandingSegment (首段)
  └─ HeroWorld
      ├─ semantic HTML + poster + CTA + pause/replay
      └─ HeroScene (dynamic import)
          ├─ World          environment + instanced trees
          ├─ Vehicle        little-red.glb + Drive clip
          ├─ CameraRig      responsive camera + pointer parallax
          └─ QualityManager quality tier + demand rendering
```

## 檔案索引

### 3D 前端

- [HeroWorld.tsx](../components/landing/hero-world/HeroWorld.tsx)：語意區塊、poster、狀態機、fallback、控制按鈕。
- [HeroScene.tsx](../components/landing/hero-world/HeroScene.tsx)：延遲載入 R3F 與場景組合。
- [World.tsx](../components/landing/hero-world/World.tsx)：環境模型與重複樹木。
- [Vehicle.tsx](../components/landing/hero-world/Vehicle.tsx)：小紅模型、Drive 動畫與繞行。
- [CameraRig.tsx](../components/landing/hero-world/CameraRig.tsx)：桌面／手機鏡頭與有限視差。
- [QualityManager.tsx](../components/landing/hero-world/QualityManager.tsx)：DPR、frameloop 與可見性狀態。
- [SceneLoader.ts](../components/landing/hero-world/SceneLoader.ts)：GLB 載入、AbortController、資源清理。
- [config.ts](../components/landing/hero-world/config.ts)／[config.test.ts](../components/landing/hero-world/config.test.ts)：環境變數與品質設定。
- [HeroWorld.module.css](../components/landing/hero-world/HeroWorld.module.css)：Hero 版面、poster 與控制項樣式。

### Blender 與部署資產

- [build.py](../assets/blender/hero-world/build.py)：可重建 Blender 場景與 GLB 匯出器。
- [hero-world.blend](../assets/blender/hero-world/hero-world.blend)：可在 Blender 4.5 LTS 編輯的原始場景。
- [optimize-hero-world.mjs](../scripts/optimize-hero-world.mjs)：gltf-transform 優化、簡化、驗證與 poster 產生流程。
- [public/models/hero-world/v2/](../public/models/hero-world/v2/)：v2 部署用的 environment、little-red、tree GLB、poster、manifest。

### 整合點

- [LandingSegment.tsx](../components/landing/LandingSegment.tsx)：首段將既有靜態圖切換為 `<HeroWorld />`。
- [package.json](../package.json)：加入 `@react-three/fiber`、`three`、型別與資產工具。
- [public-smoke.spec.ts](../e2e/public-smoke.spec.ts)：Save-Data、reduced-motion、場景 ready 與暫停控制測試。
- [HERO-WORLD.md](./HERO-WORLD.md)：較短的實作報告與 QA 結果。

## Blender 重建流程

```bash
blender -b --python assets/blender/hero-world/build.py
npm run optimize:hero-world
```

產物會先寫入 `assets/blender/hero-world/export/*.raw.glb`，再輸出到 `public/models/hero-world/v2/`。請保留 `Environment → FerrisRotor → GondolaPivot0..7`、`Vehicle → Body/Wheel_0..3`、`Tree → Trunk/Crown` 與動畫 clip `Drive`；`npm run validate:hero-world` 會阻止缺失或錯誤的語意節點。

## 原始檔快照

### `components/landing/hero-world/HeroWorld.tsx`

~~~tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import type { ResolvedLandingSegment } from "@/lib/landing-query";
import { chooseQuality, type Quality } from "./config";
import styles from "./HeroWorld.module.css";

const Scene = dynamic(() => import("./HeroScene"), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

export default function HeroWorld({ segment, siteIntro, nextAnchorId }: {
  segment: ResolvedLandingSegment; siteIntro?: string; nextAnchorId: string | null;
}) {
  const root = useRef<HTMLElement>(null);
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [quality, setQuality] = useState<Quality>("medium");
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: Connection };
    const connection = nav.connection;
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(timer);
      const allowed = process.env.NEXT_PUBLIC_HERO_3D !== "0" && !motion.matches &&
        !connection?.saveData && !/^(slow-)?2g$/.test(connection?.effectiveType ?? "");
      if (!allowed) { setEligible(false); setReady(false); return; }
      // 留出首屏 HTML／圖片繪製時間，進入視窗後才下載 WebGL 程式。
      timer = setTimeout(() => {
        setQuality(chooseQuality(nav.hardwareConcurrency || 4, nav.deviceMemory ?? 8, matchMedia("(max-width: 768px)").matches));
        setEligible(true);
      }, 900);
    };
    const visibility = () => setPageVisible(!document.hidden);
    update(); visibility();
    motion.addEventListener("change", update);
    connection?.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .05 });
    if (root.current) observer.observe(root.current);
    return () => {
      clearTimeout(timer); observer.disconnect(); motion.removeEventListener("change", update);
      connection?.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  // 上限避免慢速／卡住的模型讓空白 canvas 長期蓋住備用圖。
  useEffect(() => {
    if (!eligible || !visible || ready || failed) return;
    const timeout = setTimeout(() => setFailed(true), 15_000);
    return () => clearTimeout(timeout);
  }, [eligible, visible, ready, failed]);

  const mounted = eligible && !failed && (visible || ready);
  const active = visible && pageVisible && !paused;
  return (
    <section ref={root} id={segment.anchorId} className={styles.hero}
      aria-labelledby={`${segment.anchorId}-title`} data-hero-world
      data-scene-state={failed ? "fallback" : ready && eligible ? "ready" : "poster"}
      data-scene-active={mounted && active}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>BONBON & 馬米的故事小天地</p>
        <h1 className={styles.title}>歡迎來到<br /><span>車車遊樂園</span></h1>
        <h2 id={`${segment.anchorId}-title`} className="sr-only titleHidden">{segment.title}</h2>
        <p className={styles.description}>跟著小紅，走進故事裡。<br />每一次出發，都有新的發現。</p>
        {siteIntro ? <p className="sr-only">{siteIntro}</p> : null}
      </div>
      <div className={styles.stage} aria-hidden="true">
        <picture className={styles.poster}>
          <source media="(max-width: 768px)" srcSet="/models/hero-world/v2/poster-mobile.webp" type="image/webp" />
          <img src="/models/hero-world/v2/poster.webp" width={1400} height={1000} alt="" fetchPriority="high" decoding="async" />
        </picture>
        {mounted ? <div className={styles.canvas} data-ready={ready}>
          <SceneBoundary onFailure={() => setFailed(true)}>
            <Scene active={active} quality={quality} run={run}
              onReady={() => setReady(true)} onFailure={() => setFailed(true)}
              onFinish={() => setFinished(true)} onQuality={setQuality} />
          </SceneBoundary>
        </div> : null}
      </div>
      <div className={styles.actions}>
        <Link href={segment.cta.href} className={styles.cta}>{segment.cta.label} →</Link>
        <p className={styles.note}>一起看圖、聽故事，慢慢長大。</p>
      </div>
      {ready && eligible && !failed ? <button type="button" className={styles.motion}
        aria-label={finished ? "再看一次小紅出發" : paused ? "繼續小紅的旅程" : "暫停小紅的旅程"}
        onClick={() => {
          if (finished) { setRun(n => n + 1); setFinished(false); setPaused(false); }
          else setPaused(value => !value);
        }}><span aria-hidden="true">{finished ? "↻" : paused ? "▷" : "Ⅱ"}</span> {finished ? "小紅，再出發！" : paused ? "繼續旅程" : "暫停動態"}</button> : null}
      {nextAnchorId ? <a className={styles.next} href={`#${nextAnchorId}`} aria-label="捲動到下一個專區">⌄</a> : null}
    </section>
  );
}

~~~

### `components/landing/hero-world/HeroScene.tsx`

~~~tsx
"use client";

import { useCallback, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import { useWorldAssets } from "./SceneLoader";
import { QUALITY, type Quality } from "./config";
import World from "./World";
import Vehicle from "./Vehicle";
import CameraRig from "./CameraRig";
import QualityManager from "./QualityManager";

type Props = { active: boolean; quality: Quality; run: number; onReady: () => void; onFailure: () => void; onFinish: () => void; onQuality: (q: Quality) => void };

function Contents(props: Props) {
  const callbacks = useRef(props); callbacks.current = props;
  const failure = useCallback(() => callbacks.current.onFailure(), []);
  const assets = useWorldAssets(failure);
  const gl = useThree(s => s.gl);
  const invalidate = useThree(s => s.invalidate);
  const frames = useRef(0);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); failure(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, failure]);
  useEffect(() => {
    if (assets) { gl.shadowMap.needsUpdate = true; invalidate(); }
  }, [assets, gl, props.quality, invalidate]);
  useFrame(() => {
    if (assets && frames.current < 2) {
      frames.current++;
      if (frames.current === 2) callbacks.current.onReady();
      else invalidate();
    }
  });
  return <>
    <hemisphereLight args={["#fff4de", "#a1b4ad", 2.2]} />
    <directionalLight position={[-3, 8, 5]} intensity={3.1} color="#fff3df" castShadow={QUALITY[props.quality].shadows}
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-7} shadow-camera-right={7}
      shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-near={.5} shadow-camera-far={25}
      shadow-bias={-.001} shadow-normalBias={.04} />
    <CameraRig active={props.active} />
    <QualityManager active={props.active} quality={props.quality} onQuality={props.onQuality} />
    {assets ? <>
      <World environment={assets.environment} tree={assets.tree} quality={props.quality} />
      <Vehicle asset={assets.vehicle} active={props.active} run={props.run} quality={props.quality} onFinish={props.onFinish} />
    </> : null}
  </>;
}
export default function HeroScene(props: Props) {
  return <Canvas orthographic camera={{ position: [7, 10, 12], near: .1, far: 80, zoom: 55 }}
    dpr={QUALITY[props.quality].dpr} frameloop={props.active ? "demand" : "never"}
    shadows={QUALITY[props.quality].shadows ? "soft" : false}
    gl={{ alpha: true, antialias: props.quality === "high", powerPreference: "low-power", toneMapping: ACESFilmicToneMapping }}
    onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.shadowMap.autoUpdate = props.quality === "high"; }}
    fallback={null}>
    <Contents {...props} />
  </Canvas>;
}

~~~

### `components/landing/hero-world/World.tsx`

~~~tsx
import { useLayoutEffect, useMemo, useRef } from "react";
import { InstancedMesh, Matrix4, Mesh, Object3D } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { TREE_PLACEMENTS, type Quality, QUALITY } from "./config";

function TreeInstances({ source, count, shadows }: { source: Mesh; count: number; shadows: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current!;
    const object = new Object3D();
    const matrix = new Matrix4();
    TREE_PLACEMENTS.slice(0, count).forEach(([x, z, scale], i) => {
      object.position.set(x, .19, z); object.scale.setScalar(scale); object.updateMatrix();
      matrix.multiplyMatrices(object.matrix, source.matrixWorld);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
  }, [source, count]);
  return <instancedMesh ref={ref} args={[source.geometry, source.material, count]} castShadow={shadows} receiveShadow={shadows} dispose={null} />;
}

export default function World({ environment, tree, quality }: { environment: GLTF; tree: GLTF; quality: Quality }) {
  const settings = QUALITY[quality];
  const trees = useMemo(() => {
    tree.scene.updateMatrixWorld(true);
    const parts: Mesh[] = [];
    tree.scene.traverse(o => { if (o instanceof Mesh) parts.push(o); });
    return parts;
  }, [tree]);
  useLayoutEffect(() => {
    environment.scene.traverse(o => {
      if (o instanceof Mesh) { o.castShadow = settings.shadows; o.receiveShadow = settings.shadows; }
    });
  }, [environment, settings.shadows]);
  return <group dispose={null}>
    <primitive object={environment.scene} />
    {trees.map(source => <TreeInstances key={source.uuid} source={source} count={settings.trees} shadows={settings.shadows} />)}
  </group>;
}

~~~

### `components/landing/hero-world/Vehicle.tsx`

~~~tsx
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AnimationMixer, Group } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { ARRIVAL_SECONDS, driveProgress, type Quality } from "./config";

export default function Vehicle({ asset, active, run, quality, onFinish }: {
  asset: GLTF; active: boolean; run: number; quality: Quality; onFinish: () => void;
}) {
  const group = useRef<Group>(null);
  const elapsed = useRef(0);
  const completed = useRef(false);
  const invalidate = useThree(s => s.invalidate);
  const mixer = useMemo(() => new AnimationMixer(asset.scene), [asset]);
  useEffect(() => {
    asset.animations.forEach(clip => mixer.clipAction(clip).play());
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(asset.scene); };
  }, [asset, mixer]);
  useEffect(() => { elapsed.current = 0; completed.current = false; invalidate(); }, [run, invalidate]);
  useEffect(() => { if (active) invalidate(); }, [active, invalidate]);
  useFrame((_, delta) => {
    if (!group.current) return;
    if (active && !completed.current && quality !== "low") elapsed.current = Math.min(ARRIVAL_SECONDS, elapsed.current + Math.min(delta, .05));
    const progress = driveProgress(elapsed.current);
    const angle = -.5 + progress * Math.PI * 2;
    group.current.position.set(3.98 * Math.sin(angle), .27 + .012 * Math.sin(progress * Math.PI * 24), 2.48 * Math.cos(angle));
    group.current.rotation.y = Math.atan2(3.98 * Math.cos(angle), -2.48 * Math.sin(angle));
    mixer.setTime(progress * 11);
    if (elapsed.current >= ARRIVAL_SECONDS || quality === "low") {
      if (!completed.current) { completed.current = true; onFinish(); }
    } else if (active) invalidate();
  });
  return <group ref={group} dispose={null}><primitive object={asset.scene} /></group>;
}

~~~

### `components/landing/hero-world/CameraRig.tsx`

~~~tsx
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, Vector2 } from "three";

export default function CameraRig({ active }: { active: boolean }) {
  const { camera, size, gl, invalidate } = useThree();
  const target = useRef(new Vector2());
  const offset = useRef(new Vector2());
  const mobile = size.width < 750;
  useEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    // 手機更正面、略低的視角，避免房子遮住前景車車。
    camera.position.set(mobile ? 5 : 7, mobile ? 10.5 : 10, mobile ? 14 : 12);
    camera.zoom = Math.min(size.width / (mobile ? 12.3 : 13.8), size.height / 9.8);
    camera.lookAt(0, .65, 0); camera.updateProjectionMatrix(); invalidate();
  }, [camera, size, mobile, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const move = (event: PointerEvent) => {
      if (!active || mobile || event.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      target.current.set(((event.clientX - rect.left) / rect.width - .5) * .22, ((event.clientY - rect.top) / rect.height - .5) * .10);
      invalidate();
    };
    const reset = () => { target.current.set(0, 0); invalidate(); };
    canvas.addEventListener("pointermove", move, { passive: true }); canvas.addEventListener("pointerleave", reset);
    return () => { canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerleave", reset); };
  }, [gl, active, mobile, invalidate]);
  useFrame(() => {
    if (!active) return;
    offset.current.lerp(target.current, .08);
    camera.position.x = (mobile ? 5 : 7) + offset.current.x;
    camera.position.y = (mobile ? 10.5 : 10) + offset.current.y;
    camera.lookAt(0, .65, 0);
    if (offset.current.distanceToSquared(target.current) > .00001) invalidate();
  });
  return null;
}

~~~

### `components/landing/hero-world/QualityManager.tsx`

~~~tsx
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { lowerQuality, type Quality } from "./config";

/** 只在連續繪製時採樣，排除休眠／首次 shader 編譯；降級不振盪升級。 */
export default function QualityManager({ active, quality, onQuality }: { active: boolean; quality: Quality; onQuality: (q: Quality) => void }) {
  const gl = useThree(s => s.gl);
  const sample = useRef({ frames: 0, time: 0, warmup: 45 });
  useEffect(() => { sample.current = { frames: 0, time: 0, warmup: 45 }; }, [active, quality]);
  useFrame((_, delta) => {
    if (!active || delta > .2 || delta <= 0) return;
    const s = sample.current;
    if (s.warmup-- > 0) return;
    s.frames++; s.time += delta;
    if (s.time >= 2) {
      const fps = s.frames / s.time;
      // 僅供本地 QA 讀取，不改既有 analytics 事件。
      gl.domElement.dataset.worldMetrics = JSON.stringify({ fps: Math.round(fps), calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, quality, dpr: gl.getPixelRatio() });
      if (fps < 38 && quality !== "low") onQuality(lowerQuality(quality));
      s.frames = 0; s.time = 0;
    }
  });
  return null;
}

~~~

### `components/landing/hero-world/SceneLoader.ts`

~~~ts
import { useEffect, useState } from "react";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { Mesh, type BufferGeometry, type Material } from "three";
import { MODEL_PATH } from "./config";

export type WorldAssets = { environment: GLTF; vehicle: GLTF; tree: GLTF };

/** 每次掛載持有資源；離頁中止請求，包含延遲完成的解析也會釋放。 */
export function useWorldAssets(onFailure: () => void) {
  const [assets, setAssets] = useState<WorldAssets | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const owned: GLTF[] = [];
    const dispose = (gltf: GLTF) => {
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      gltf.scene.traverse(object => {
        if (!(object instanceof Mesh)) return;
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
      });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
    };
    const load = async (name: string) => {
      const response = await fetch(`${MODEL_PATH}/${name}.glb`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Hero model ${response.status}`);
      const result = await new GLTFLoader().parseAsync(await response.arrayBuffer(), `${MODEL_PATH}/`);
      if (controller.signal.aborted) { dispose(result); throw new DOMException("Aborted", "AbortError"); }
      owned.push(result);
      return result;
    };
    void (async () => {
      const environment = await load("environment");
      const [vehicle, tree] = await Promise.all([load("little-red"), load("tree")]);
      if (!controller.signal.aborted) setAssets({ environment, vehicle, tree });
    })().catch(() => { if (!controller.signal.aborted) onFailure(); });
    return () => { controller.abort(); owned.forEach(dispose); };
    // 回呼由 Scene 中的 ref 穩定提供；重繪不重複下載。
  }, [onFailure]);
  return assets;
}

~~~

### `components/landing/hero-world/config.ts`

~~~ts
export type Quality = "high" | "medium" | "low";
export const MODEL_PATH = "/models/hero-world/v2";
export const QUALITY = {
  high: { dpr: 1.5, trees: 8, shadows: true },
  medium: { dpr: 1.25, trees: 6, shadows: false },
  low: { dpr: 1, trees: 4, shadows: false },
} as const;

export function chooseQuality(cores: number, memory: number, mobile: boolean): Quality {
  if (cores <= 2 || memory <= 2) return "low";
  if (mobile || cores <= 4 || memory <= 4) return "medium";
  return "high";
}
export function lowerQuality(quality: Quality): Quality {
  return quality === "high" ? "medium" : "low";
}
export const TREE_PLACEMENTS = [
  [-4.35, -.4, .95], [-3.9, -2.1, 1.05], [3.65, -2.2, .92], [4.7, -.6, .85],
  [-2.8, -2.95, .82], [-.7, -3.28, .75], [4.7, .8, .65], [-4.6, 1.8, .64],
] as const;
export const ARRIVAL_SECONDS = 18;

/** 在前景放慢問好，再回到出發點；平滑速度曲線避免突然跳動。 */
export function driveProgress(seconds: number): number {
  const t = Math.min(Math.max(seconds / ARRIVAL_SECONDS, 0), 1);
  return t - .11 * Math.sin(t * Math.PI * 2);
}

~~~

### `components/landing/hero-world/config.test.ts`

~~~ts
import { describe, expect, it } from "vitest";
import { chooseQuality, driveProgress, lowerQuality } from "./config";

describe("hero world quality and arrival timing", () => {
  it("selects a conservative tier from runtime capabilities", () => {
    expect(chooseQuality(2, 8, false)).toBe("low");
    expect(chooseQuality(8, 8, true)).toBe("medium");
    expect(chooseQuality(8, 8, false)).toBe("high");
  });

  it("only lowers quality and keeps the vehicle progress bounded", () => {
    expect(lowerQuality("high")).toBe("medium");
    expect(lowerQuality("medium")).toBe("low");
    expect(lowerQuality("low")).toBe("low");
    expect(driveProgress(-1)).toBe(0);
    expect(driveProgress(18)).toBeCloseTo(1);
    expect(driveProgress(60)).toBe(1);
  });
});

~~~

### `components/landing/hero-world/HeroWorld.module.css`

~~~css
/* 微型樂園固定美術色；沿用品牌的圓角、字型、間距及控制項語彙。 */
.hero {
  position: relative;
  height: var(--landing-pane-h, 100svh);
  min-height: var(--landing-pane-h, 100svh);
  flex: none;
  isolation: isolate;
  overflow: hidden;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  background: radial-gradient(ellipse at 72% 53%, #f4efd7 0%, #f9efdf 45%, #fff8ef 80%);
  color: #453021;
}
.copy { position: absolute; z-index: 2; top: 24%; left: max(6%, calc((100vw - 1500px) / 2)); pointer-events: none; }
.eyebrow { margin: 0 0 22px; font-size: var(--fs-label); letter-spacing: .14em; font-weight: 700; color: #78553c; }
.title { margin: 0; font-size: clamp(2.7rem, 4.1vw, 4.8rem); line-height: 1.28; letter-spacing: .035em; font-weight: 700; }
.title span { color: #28776e; }
.description { margin: 24px 0 0; line-height: 1.9; font-size: var(--fs-h3-compact); color: #78553c; }
.stage { position: absolute; width: 74%; height: 82%; right: -6%; bottom: 2%; }
.poster, .canvas { position: absolute; inset: 0; display: block; }
.poster img { width: 100%; height: 100%; object-fit: contain; }
.canvas { opacity: 0; transition: opacity 600ms ease; touch-action: pan-y; }
.canvas[data-ready="true"] { opacity: 1; }
.stage:has(.canvas[data-ready="true"]) .poster { visibility: hidden; transition: visibility 0s 600ms; }
.actions { position: absolute; z-index: 2; left: max(6%, calc((100vw - 1500px) / 2)); bottom: 17%; }
.cta { display: inline-flex; align-items: center; justify-content: center; min-height: 56px; padding: 12px 26px; border: 2px solid #fff7e8; border-radius: var(--radius-pill); background: var(--landing-brand-ink); color: var(--on-dark); font-size: var(--fs-h3); font-weight: 700; text-decoration: none; box-shadow: var(--elev-2), var(--gloss); transition: transform var(--motion-press); }
.cta:hover { transform: translateY(-2px); }
.cta:active { transform: scale(.98); }
.note { margin: 13px 0 0; font-size: var(--fs-label); color: #78553c; }
.motion { position: absolute; z-index: 3; right: 8%; bottom: 7%; min-height: 44px; padding: 8px 16px; border: 1px solid #bfa98c; background: #fff8ee; color: #614b36; border-radius: var(--radius-pill); font: inherit; font-size: var(--fs-label); cursor: pointer; }
.motion span { font-size: var(--fs-body); margin-right: 4px; }
.next { position: absolute; z-index: 3; bottom: 3%; left: calc(50% - 22px); display: grid; place-items: center; width: 44px; height: 44px; font-size: var(--fs-h1); text-decoration: none; color: #614b36; }
.cta:focus-visible, .motion:focus-visible, .next:focus-visible { outline: 3px solid #28776e; outline-offset: 4px; }
:global([data-theme="night"]) .hero { background: radial-gradient(ellipse at 72% 53%, #4b5044, #252d3c 75%); color: #fff2da; }
:global([data-theme="night"]) .title span { color: #b7dfc2; }
:global([data-theme="night"]) .eyebrow, :global([data-theme="night"]) .description, :global([data-theme="night"]) .note, :global([data-theme="night"]) .next { color: #f1d9bb; }
@media (min-width: 1800px) { .stage { right: -1%; width: 70%; } }
@media (max-width: 1100px) and (min-width: 769px) { .copy { left: 5%; top: 19%; } .title { font-size: 2.9rem; } .stage { width: 83%; right: -14%; bottom: 3%; } .actions { left: 5%; bottom: 15%; } }
@media (max-width: 768px) {
  .copy { top: 5%; left: 7%; right: 7%; text-align: center; }
  .eyebrow { font-size: var(--fs-meta); margin-bottom: 12px; letter-spacing: .1em; }
  .title { font-size: clamp(2rem, 7.8vw, 3rem); line-height: 1.22; }
  .title br { display: none; }
  .title span { display: block; }
  .description { margin-top: 12px; font-size: var(--fs-control); line-height: 1.65; }
  .stage { top: 29%; bottom: auto; height: 51%; width: 120%; right: -10%; }
  .actions { left: 7%; right: 7%; bottom: calc(var(--landing-mobile-nav-h) + 23px); }
  .cta { font-size: var(--fs-h4); padding: 12px 21px; }
  .note { margin-top: 9px; font-size: var(--fs-meta); }
  .motion { right: 5%; bottom: 23%; padding: 6px 11px; font-size: var(--fs-meta); }
  .next { display: none; }
}
@media (max-width: 380px) { .copy { top: 4%; } .eyebrow { margin-bottom: 8px; } .description { margin-top: 9px; } .stage { top: 29%; height: 48%; } .motion { bottom: 25%; } }
@media (max-height: 560px) and (min-width: 600px) {
  .copy { top: 18%; left: 5%; text-align: left; }
  .eyebrow { margin-bottom: 8px; }
  .title { font-size: 2rem; }
  .title br { display: block; }
  .description { font-size: var(--fs-label); margin-top: 10px; }
  .stage { width: 65%; right: -5%; top: 8%; height: 80%; }
  .actions { left: 5%; bottom: calc(var(--landing-mobile-nav-h) + 12px); }
  .note { display: none; }
  .motion { bottom: calc(var(--landing-mobile-nav-h) + 14px); right: 13%; }
}
@media (prefers-reduced-motion: reduce) { .canvas, .cta { transition: none; } .cta:hover, .cta:active { transform: none; } }

~~~

### `assets/blender/hero-world/build.py`

~~~python
"""重建原創微型樂園。Blender 4.5 LTS：blender -b --python assets/blender/hero-world/build.py"""
import bpy, math, os
from mathutils import Vector
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'assets/blender/hero-world/export'
PROD = ROOT / 'public/models/hero-world'
OUT.mkdir(parents=True, exist_ok=True)
PROD.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for item in list(bpy.data.materials): bpy.data.materials.remove(item)
M = {}
def mat(name, color):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = .83
    M[name] = m
    return m
# 色值在線性色彩空間；柔霧陶土質感不依賴 Blender 專屬材質節點。
for n,c in dict(cream=(.83,.65,.40),sand=(.66,.43,.22),grass=(.39,.57,.23),mint=(.19,.40,.22),leaf=(.32,.53,.28),road=(.49,.36,.25),ivory=(.96,.86,.65),red=(.78,.115,.07),pink=(.88,.36,.32),blue=(.10,.38,.48),sky=(.29,.61,.66),yellow=(.95,.59,.13),wood=(.32,.16,.07),tire=(.065,.078,.07),dark=(.025,.037,.03)).items(): mat(n,c)
current = 'Environment'
def finish(o,n,m):
    o.name=n; o.data.materials.append(M[m]); o['part']=current
    for p in o.data.polygons: p.use_smooth=True
    return o
def ball(n,p,s,m,segments=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=8,location=p)
    o=bpy.context.object; o.scale=s
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,n,m)
def box(n,p,s,m,bevel=.12):
    bpy.ops.mesh.primitive_cube_add(size=1,location=p); o=bpy.context.object; o.scale=s
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Soft clay edges','BEVEL');mod.width=bevel;mod.segments=2
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
        mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,n,m)
def rod(n,a,b,r,m,vertices=12):
    d=Vector(b)-Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d.length,location=(Vector(a)+Vector(b))/2)
    o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    return finish(o,n,m)
def tube(n,pts,r,m):
    curve=bpy.data.curves.new(n,'CURVE');curve.dimensions='3D';curve.resolution_u=1;curve.bevel_depth=r;curve.bevel_resolution=2
    sp=curve.splines.new('POLY');sp.points.add(len(pts)-1)
    for p,co in zip(sp.points,pts): p.co=(*co,1)
    o=bpy.data.objects.new(n,curve);bpy.context.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
    return finish(bpy.context.object,n,m)
def ringroad():
    verts=[]; faces=[]; steps=96
    for i in range(steps):
        t=2*math.pi*i/steps
        for rx,ry in [(4.55,3.05),(3.40,1.90)]:verts.append((rx*math.sin(t),ry*math.cos(t),.25))
    for i in range(steps):
        j=(i+1)%steps;faces.append((i*2,j*2,j*2+1,i*2+1))
    mesh=bpy.data.meshes.new('Loop road');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('Loop road',mesh);bpy.context.collection.objects.link(o);finish(o,'Loop road','road')

def merge(part):
    # 靜態幾何依共用材質合併；重複樹另輸出供瀏覽器 InstancedMesh 使用。
    for material in M.values():
        objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.get('part')==part and o.data.materials[0]==material]
        if not objects:continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=f'{part}_{material.name}'
        bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

def export(part,filename):
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.get('part')==part:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/filename),export_format='GLB',use_selection=True,export_cameras=False,export_lights=False,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=False,export_extras=False,export_yup=True)

# 扁平橢圓陶土底座及同心道路。
ball('Island biscuit',(0,0,-.24),(5.65,4.0,.55),'sand',48)
ball('Meadow',(0,0,-.05),(5.6,3.96,.35),'grass',48)
ringroad()
for i in range(36):
    t=i*math.tau/36
    o=box('Road dash',(3.98*math.sin(t),2.48*math.cos(t),.265),(.06,.25,.016),'ivory',.022)
    o.rotation_euler.z=-t-math.pi/2
# 故事屋：開放書本形屋頂，圓門和藍色窗。
box('Story house',(-1.6,.9,1.07),(2.0,1.65,1.75),'ivory',.18)
for side in [-1,1]:
    o=box('Book roof',(-1.6+side*.56,.9,2.11),(1.36,2.1,.24),'red',.09);o.rotation_euler.y=side*.45
    o=box('Book pages',(-1.6+side*.56,.9,2.0),(1.28,2.0,.1),'cream',.035);o.rotation_euler.y=side*.45
rod('Spine',(-1.6,-.17,2.40),(-1.6,1.96,2.40),.13,'red')
box('Door',(-1.6,.058,.70),(.53,.06,.94),'blue',.23)
ball('Door knob',(-1.42,-.002,.67),(.055,.04,.055),'yellow')
for x in [-2.23,-.96]:
    box('Window frame',(x,.045,1.35),(.46,.06,.58),'cream',.15)
    box('Blue glass',(x,.001,1.35),(.34,.055,.44),'sky',.10)
    rod('Window cross',(x,-.035,1.14),(x,-.035,1.56),.022,'ivory')
box('Doorstep',(-1.6,-.24,.34),(.8,.45,.16),'cream',.07)
box('Chimney',(-2.2,1.5,2.25),(.3,.35,.8),'pink',.06)
# 屋側小書本，讓「故事」主題可從形狀辨認。
for i,col in enumerate(['blue','yellow','pink']):
    o=box('Little book',(-2.9,.4+i*.16,.48),(.52,.13,.60),col,.025);o.rotation_euler.y=-.1+i*.12
# 輕巧靜態摩天輪：一個記憶點，無持續旋轉。
cx,cy,cz=1.65,1.35,2.08
for x in [cx-.75,cx+.75]:rod('Wheel support',(x,cy-.1,.27),(cx,cy,cz),.10,'wood')
pts=[(cx+1.26*math.cos(i*math.tau/64),cy,cz+1.26*math.sin(i*math.tau/64)) for i in range(65)]
tube('Ferris rim',pts,.075,'pink')
for i in range(8):
    a=i*math.tau/8;x=cx+1.26*math.cos(a);z=cz+1.26*math.sin(a)
    rod('Spoke',(cx,cy,cz),(x,cy,z),.035,'cream')
    rod('Cabin hanger',(x,cy,z),(x,cy,z-.21),.027,'wood')
    box('Gondola',(x,cy,z-.30),(.38,.39,.26),['blue','yellow','mint','red'][i%4],.09)
ball('Wheel hub',(cx,cy-.14,cz),(.23,.13,.23),'yellow')
# 歡迎拱門在道路後段，旗幟及護欄。
for x in [-.64,.64]:rod('Gate post',(x,2.49,.25),(x,2.49,1.49),.10,'wood')
box('Welcome arch',(0,2.49,1.48),(1.53,.22,.42),'yellow',.18)
for x in [-.64,.64]:
    rod('Flagpole',(x,2.49,1.60),(x,2.49,2.1),.025,'wood')
    mesh=bpy.data.meshes.new('Pennant');mesh.from_pydata([(x,2.49,2.1),(x+.37,2.49,1.98),(x,2.49,1.87)],[],[(0,1,2)]);mesh.update()
    o=bpy.data.objects.new('Pennant',mesh);bpy.context.collection.objects.link(o);finish(o,'Pennant','red')
for i in range(5):
    x=2.8+i*.35;y=-1.1
    box('Fence post',(x,y,.56),(.095,.10,.6),'ivory',.04)
rod('Fence rail',(2.8,-1.1,.7),(4.2,-1.1,.7),.045,'cream')
# 前景花圃與石塊，所有靜態小物同材質合併。
for x,y,s in [(-4,-1.3,.4),(-3.9,1.5,.6),(3.7,1.7,.5),(2.8,-2.9,.4),(-2.9,-2.9,.3)]:
    ball('Shrub',(x,y,.32),(s,s*.75,s*.75),'mint')
    for j in range(3):ball('Flower',(x+(j-1)*.18,y-.22,.52),(.10,.09,.10),'yellow' if j%2 else 'pink',12)
for x,y in [(-4.8,.4),(4.7,-.5),(.8,-3.4),(-.2,-3.4)]:ball('Pebble',(x,y,.25),(.18,.12,.10),'cream',12)
merge('Environment');export('Environment','environment.raw.glb')
# 原點樹模型：兩種共用材質，可由 R3F 實例化。
current='Tree'
rod('Trunk',(0,0,0),(0,0,1.1),.10,'wood')
ball('Crown',(0,0,1.15),(.50,.45,.65),'leaf')
ball('Crown lobe',(.24,0,1.28),(.33,.33,.42),'leaf')
merge('Tree');export('Tree','tree.raw.glb')
for o in [o for o in bpy.context.scene.objects if o.get('part')=='Tree']:o.hide_render=True;o.hide_set(True)
# 小紅：自製圓車身、米色眼眶、藍窗、奶油輪轂與兩條車頭線。
current='Vehicle'
box('Body',(0,0,.47),(1.03,1.65,.51),'red',.23)
box('Cabin',(0,.16,.84),(.90,.84,.57),'red',.22)
box('Windshield',(0,-.274,.90),(.72,.08,.39),'ivory',.13)
for x in [-.23,.23]:
    ball('Eye',(x,-.323,.92),(.125,.035,.147),'blue')
    ball('Pupil',(x+.012,-.350,.925),(.078,.025,.105),'dark')
    ball('Eye glint',(x-.018,-.372,.97),(.031,.014,.036),'ivory',12)
    ball('Headlight',(x*1.6,-.81,.48),(.095,.047,.095),'yellow')
    box('Hood stripe',(x*.33,-.58,.746),(.057,.39,.024),'ivory',.016)
for x in [-.456,.456]:
    box('Side window',(x,.2,.89),(.037,.54,.31),'sky',.12)
    ball('Mirror',(x*1.14,-.25,.76),(.11,.10,.085),'red')
box('Bumper',(0,-.78,.29),(.92,.15,.13),'blue',.06)
tube('Smile',[(-.17,-.836,.47),(-.10,-.853,.40),(0,-.856,.38),(.10,-.853,.40),(.17,-.836,.47)],.026,'dark')
box('Spoiler',(0,.78,.86),(1.12,.22,.11),'red',.055)
for x in [-.34,.34]:box('Spoiler stem',(x,.73,.71),(.06,.08,.22),'red',.025)
merge('Vehicle')
# 四個模組化輪子各自保留原點；Drive 只包含輪軸旋轉。
for i,(x,y) in enumerate([(-.51,-.48),(.51,-.48),(-.51,.5),(.51,.5)]):
    current=f'Wheel{i}'
    rod('Tire',(x-.10,y,.28),(x+.10,y,.28),.275,'tire',20)
    side=1 if x>0 else -1
    rod('Hub',(x+side*.095,y,.28),(x+side*.112,y,.28),.16,'cream',16)
    rod('Hub center',(x+side*.113,y,.28),(x+side*.122,y,.28),.068,'red',12)
    pieces=[o for o in bpy.context.scene.objects if o.get('part')==current]
    bpy.ops.object.select_all(action='DESELECT')
    for o in pieces:o.select_set(True)
    bpy.context.view_layer.objects.active=pieces[0];bpy.ops.object.join();wheel=pieces[0];wheel.name=f'Wheel_{i}'
    bpy.context.scene.cursor.location=(x,y,.28);bpy.ops.object.origin_set(type='ORIGIN_CURSOR');wheel['part']='Vehicle'
    wheel.rotation_euler=(0,0,0);wheel.keyframe_insert(data_path='rotation_euler',index=0,frame=1)
    wheel.rotation_euler.x=math.tau;wheel.keyframe_insert(data_path='rotation_euler',index=0,frame=49)
    action=wheel.animation_data.action;action.name=f'DriveWheel{i}'
    for fc in action.fcurves:
        for k in fc.keyframe_points:k.interpolation='LINEAR'
    track=wheel.animation_data.nla_tracks.new();track.name='Drive';track.strips.new('Drive',1,action);wheel.animation_data.action=None
bpy.context.scene.frame_set(1);export('Vehicle','little-red.raw.glb')
# 備用圖和可編輯來源：場景模型和燈光不一併發送到 GLB。
for o in [o for o in bpy.context.scene.objects if o.get('part')=='Vehicle']:
    root=bpy.data.objects.get('PreviewCar')
    if root is None:
        root=bpy.data.objects.new('PreviewCar',None);bpy.context.collection.objects.link(root)
    o.parent=root
root.location=(-1.90,-2.18,.27);root.rotation_euler.z=1.24
TREE_PLACES=[(-4.35,.4,.95),(-3.9,2.1,1.05),(-2.8,2.95,.82),(-.7,3.28,.75),(3.65,2.2,.92),(4.7,.6,.85),(4.7,-.8,.65),(-4.6,-1.8,.64)]
for x,y,s in TREE_PLACES:
    for proto in [o for o in bpy.context.scene.objects if o.get('part')=='Tree']:
        o=proto.copy();o.data=proto.data;bpy.context.collection.objects.link(o);o.hide_render=False;o.hide_set(False);o.location=(x,y,.19);o.scale=(s,s,s);o['part']='PreviewTree'
scene=bpy.context.scene
scene.world.color=(.8,.8,.8)
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.78,.85,1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
bpy.ops.object.light_add(type='AREA',location=(-3,-5,10));bpy.context.object.data.energy=1600;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=7
bpy.ops.object.camera_add(location=(7,-12,10));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.6))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=14;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(PROD/'poster.png')
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/hero-world/hero-world.blend'))
bpy.ops.render.render(write_still=True)
print('HERO_WORLD_EXPORT_COMPLETE')

~~~

### `scripts/optimize-hero-world.mjs`

~~~javascript
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { renameSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import sharp from 'sharp';
import validator from 'gltf-validator';

const root = new URL('../public/models/hero-world/', import.meta.url);
const sourceRoot = new URL('../assets/blender/hero-world/export/', import.meta.url);
const report = [];
for (const name of ['environment', 'little-red', 'tree']) {
  const input = new URL(`${name}.raw.glb`, sourceRoot);
  const output = new URL(`${name}.glb`, root);
  // 共用材質已在 Blender 合併。保留動態節點和 Drive，不使用破壞階層的 flatten。
  execFileSync('node_modules/.bin/gltf-transform', ['optimize', input.pathname, output.pathname, '--compress', 'quantize', '--texture-compress', 'false', '--simplify', 'false', '--flatten', 'false', '--join', 'false'], {stdio: 'inherit'});
  if (name === 'environment') {
    const simplified = new URL(`${name}.simplified.glb`, root);
    execFileSync('node_modules/.bin/gltf-transform', ['simplify', output.pathname, simplified.pathname, '--ratio', '0.76', '--error', '0.002'], {stdio: 'inherit'});
    renameSync(simplified, output);
  }
  const bytes = await readFile(output);
  const result = await validator.validateBytes(new Uint8Array(bytes), { uri: output.pathname });
  if (result.issues.numErrors > 0) throw new Error(JSON.stringify(result.issues));
  const jsonSize = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonSize).toString());
  const triangles = json.meshes.reduce((sum, mesh) => sum + mesh.primitives.reduce((n, p) => n + (p.indices === undefined ? json.accessors[p.attributes.POSITION].count : json.accessors[p.indices].count) / 3, 0), 0);
  report.push({name, bytes: bytes.length, gzipBytes: gzipSync(bytes).length, triangles, materials: json.materials.length, primitives: json.meshes.reduce((sum,m) => sum+m.primitives.length,0), animations: (json.animations || []).map(a=>a.name), errors: result.issues.numErrors, warnings: result.issues.numWarnings});
}
await sharp(new URL('poster.png', root).pathname).webp({quality: 85}).toFile(new URL('poster.webp', root).pathname);
await sharp(new URL('poster.png', root).pathname).resize(840).webp({quality: 82}).toFile(new URL('poster-mobile.webp', root).pathname);
await writeFile(new URL('../../../docs/qa/hero-world/asset-report.json', root), JSON.stringify(report,null,2)+'\n');
console.log(report);
if (report.reduce((n, r) => n + r.bytes, 0) > 1_000_000 || report.reduce((n,r) => n+r.triangles,0) > 40_000) throw new Error('Hero asset budget exceeded');

~~~

## 重要二進位原始資產

- [hero-world.blend](../assets/blender/hero-world/hero-world.blend)：Blender 可編輯場景。
- [raw GLB exports](../assets/blender/hero-world/export/)：未經部署優化的匯出檔。
- [optimized GLB models](../public/models/hero-world/)：實際由首頁載入的模型。
- [QA captures](./qa/hero-world/)：桌面、手機與 poster 驗證截圖。

## 驗證紀錄

`npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 與公開頁面 Playwright smoke/a11y 測試均已通過。Vercel Preview 也已完成部署 build；首頁和 3D 資產端點可正常回應。
