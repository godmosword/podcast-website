"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ZONE_IDS } from "@/data/universe";
import {
  MAP_STAGE,
  ZONE_TERRAIN,
  type ZoneDef,
  type ZoneId,
  type ZoneStatus,
} from "@/data/universe-zones";
import { isIslandPath, targetFor, targetToFlyParams } from "@/lib/camera";
import { resolveUniverseMap } from "@/lib/universe-map";
import {
  RECENTER_IDLE_MS,
  anyPointVisible,
  bucketMapScale,
} from "@/lib/universe/map-camera-utils";
import {
  applyParallaxCamera,
  applySeaCamera,
  applyStageCamera,
} from "@/lib/universe/map-camera-visual";
import { getZoneArtTile } from "@/lib/universe/zone-art-tile";
import { parseDevStatusOverrides } from "@/lib/universe/dev-map-flags";
import type { ZoneStoriesBundle } from "@/lib/story-zone-query";
import { mapDepthZ } from "@/lib/universe-depth";
import { seaTexturePath } from "@/lib/universe/map-art-src";
import { resolveTextureHref } from "@/lib/universe/png-to-webp";
import { playSfx } from "@/lib/sfx";
import {
  trackUniverseDayNightToggle,
  trackUniverseZoneTap,
} from "@/lib/analytics";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWebpSupported } from "@/hooks/useWebpSupported";
import { computeZoneProgress, useCompletedSlugs } from "@/hooks/useZoneProgress";
import { useTheme } from "@/components/ThemeProvider";
import { MapDecorBirds, MapDecorNearWater } from "./MapDecorLayer";
import MapBridgeLayer from "./MapBridgeLayer";
import MapGuide from "./MapGuide";
import MapRoamerLayer from "./MapRoamerLayer";
import MapControls from "./MapControls";
import NightFireworks from "./NightFireworks";
import SkyBodies from "./SkyBodies";
import UniverseMapParallax from "./UniverseMapParallax";
import HotspotLayer from "./HotspotLayer";
import ZoneIsland from "./ZoneIsland";
import { FLY_DURATION_MS, useMapCamera } from "./useMapCamera";
import styles from "./UniverseMap.module.css";

/** bottom dock 開啟時，fly-to 把島往上留出的視窗像素。 */
const FOCUS_DOCK_OFFSET_Y = 96;

/** 首訪底部提示：每個分頁 session 僅 dismiss 後才寫入（StrictMode 安全）。 */
export const TAP_HINT_KEY = "cc-universe-tap-hint-shown";

/** 底部提示自動收合時間（毫秒）。 */
const TAP_HINT_TTL_MS = 8000;

/** 首訪提示狀態：pending→visible→dismissed；key 僅在 dismissed 寫入。 */
type TapHintPhase = "pending" | "visible" | "dismissed";

type MapContentProps = {
  devStatusOverrides: Partial<Record<ZoneId, ZoneStatus>>;
  zoneStoryPreviewsMap: Record<ZoneId, ZoneStoriesBundle>;
  children?: ReactNode;
};

function UniverseMapContent({
  devStatusOverrides,
  zoneStoryPreviewsMap,
  children,
}: MapContentProps) {
  // useMemo 錨定引用：resolveUniverseMap 每次呼叫都產新 zone 物件，
  // 不錨定的話 memo(ZoneIsland) 會被每 tick 全新的 zone prop 擊穿。
  const { zones, bridges, viewBox } = useMemo(() => resolveUniverseMap(), []);
  // 進度中樞：孩子聽完的集數（localStorage，mount 後才讀）→ 各島星章
  const completedSlugs = useCompletedSlugs();
  const zoneProgress = useMemo(
    () => computeZoneProgress(zoneStoryPreviewsMap, completedSlugs),
    [zoneStoryPreviewsMap, completedSlugs],
  );
  const pathname = usePathname() || "/adventures";
  const cameraTarget = useMemo(() => targetFor(pathname), [pathname]);
  const onIsland = cameraTarget.level === "island";
  const activeZoneId = useMemo<ZoneId | null>(() => {
    if (cameraTarget.level !== "island") return null;
    const id = cameraTarget.key.replace(/^island:/, "");
    return ZONE_IDS.includes(id as ZoneId) ? (id as ZoneId) : null;
  }, [cameraTarget]);

  // 島路徑 skip 進場降落，避免與 flyTo 目標島互搶鏡頭（session key 改由 hook effect 寫入）。
  const camera = useMapCamera({
    skipEntryAnimation: isIslandPath(pathname),
  });
  const {
    flyTo: cameraFlyTo,
    reset: cameraReset,
    bindVisual,
    getCam,
    idleEpoch,
    isInteracting,
  } = camera;
  const reduced = useReducedMotion();
  const webpSupported = useWebpSupported();
  const { theme: daylight } = useTheme();
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const stageElRef = useRef<HTMLDivElement | null>(null);
  const seaDayElRef = useRef<HTMLDivElement | null>(null);
  const seaNightElRef = useRef<HTMLDivElement | null>(null);
  const parallaxElRef = useRef<HTMLDivElement | null>(null);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const [tabHidden, setTabHidden] = useState(false);
  const [mapInView, setMapInView] = useState(true);
  // 手勢中暫停漫遊／裝飾動畫，把主執行緒留給鏡頭合成。
  const paused = tabHidden || !mapInView || isInteracting;
  /** 迷路自救：viewport 元素引用（量測可見性用；camera.bind.ref 之外的旁支引用）。 */
  const viewportElRef = useRef<HTMLDivElement | null>(null);
  // 已套用的相機目標 key（避免 StrictMode／重渲染重複 fly）。
  const appliedTargetKeyRef = useRef<string | null>(null);
  // 首訪底部提示：screen-space；島路徑不顯示；dismiss 才寫 session key。
  const [tapHintPhase, setTapHintPhase] = useState<TapHintPhase>("pending");
  const tapHintScheduledRef = useRef(false);

  const dismissTapHint = useCallback(() => {
    setTapHintPhase("dismissed");
    try {
      sessionStorage.setItem(TAP_HINT_KEY, "1");
    } catch {
      // sessionStorage 不可用時仍收合 UI，僅無法跨導覽記憶
    }
  }, []);

  useEffect(() => {
    if (tapHintScheduledRef.current) return;
    if (isIslandPath(window.location.pathname)) {
      setTapHintPhase("dismissed");
      return;
    }
    try {
      if (sessionStorage.getItem(TAP_HINT_KEY)) {
        setTapHintPhase("dismissed");
        return;
      }
    } catch {
      setTapHintPhase("dismissed");
      return;
    }
    tapHintScheduledRef.current = true;
    setTapHintPhase("visible");
  }, []);

  useEffect(() => {
    if (onIsland && tapHintPhase === "visible") dismissTapHint();
  }, [onIsland, tapHintPhase, dismissTapHint]);

  useEffect(() => {
    if (tapHintPhase !== "visible") return;
    const timer = setTimeout(dismissTapHint, TAP_HINT_TTL_MS);
    return () => clearTimeout(timer);
  }, [tapHintPhase, dismissTapHint]);

  // 夜海貼圖惰性載入：首次切到夜晚才掛 pattern，日間不下載 sea-night.png；
  // 掛上後保持常駐，讓日夜切換仍有 600ms crossfade。
  const [nightSeaMounted, setNightSeaMounted] = useState(false);
  const seaDayHref = resolveTextureHref(seaTexturePath(false), webpSupported);
  const seaNightHref = resolveTextureHref(seaTexturePath(true), webpSupported);
  const daylightTrackedRef = useRef(false);

  useEffect(() => {
    if (daylight === "night") setNightSeaMounted(true);
  }, [daylight]);

  // 相機是 pathname 的結果：進島 flyTo；離島 reset（反向動畫／reduced 則瞬間）。
  // 首次 viewport 量測完成前 flyTo 會 no-op：以 isMeasured 判定 ready。
  useEffect(() => {
    if (!camera.isMeasured) return;
    if (appliedTargetKeyRef.current === cameraTarget.key) return;

    if (cameraTarget.level === "island") {
      appliedTargetKeyRef.current = cameraTarget.key;
      const { coord, scale } = targetToFlyParams(cameraTarget);
      cameraFlyTo(coord, scale, { viewportOffsetY: FOCUS_DOCK_OFFSET_Y });
      return;
    }

    // 世界層：若上一目標是島，才 reset（保留首訪進場動畫由 useMapCamera 處理）。
    if (appliedTargetKeyRef.current?.startsWith("island:")) {
      appliedTargetKeyRef.current = cameraTarget.key;
      cameraReset();
      return;
    }
    appliedTargetKeyRef.current = cameraTarget.key;
  }, [camera.isMeasured, cameraTarget, cameraFlyTo, cameraReset]);

  useEffect(() => {
    if (!daylightTrackedRef.current) {
      daylightTrackedRef.current = true;
      return;
    }
    trackUniverseDayNightToggle(daylight);
  }, [daylight]);

  // 世界地圖：prefetch 各島路徑，進島更快。
  useEffect(() => {
    if (onIsland) return;
    for (const id of ZONE_IDS) {
      try {
        router.prefetch(`/adventures/${id}`);
      } catch {
        // ignore
      }
    }
  }, [onIsland, router]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    const observer = new IntersectionObserver(
      ([entry]) => setMapInView(entry?.isIntersecting ?? false),
      { threshold: 0 },
    );
    const section = sectionRef.current;
    if (section) observer.observe(section);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
    };
  }, []);

  /**
   * 點島只改路由（M1 不變式）；相機由 pathname → targetFor 驅動。
   * 手動 pan／zoom 不寫 URL。
   */
  const handleActivate = useCallback(
    (zone: ZoneDef) => {
      if (tapHintPhase === "visible") dismissTapHint();
      trackUniverseZoneTap(zone.id, zone.status);

      if (zone.status === "open") {
        playSfx("collect");

        const directRoute = zone.route && !zone.subSegmentIds?.length;

        if (directRoute && zone.route?.external) {
          window.open(zone.route.href, "_blank", "noopener,noreferrer");
          return;
        }

        if (directRoute && zone.route) {
          router.push(zone.route.href);
          return;
        }
      }

      router.push(`/adventures/${zone.id}`);
    },
    [dismissTapHint, router, tapHintPhase],
  );

  const goWorld = useCallback(() => {
    if (onIsland) {
      router.push("/adventures");
      return;
    }
    cameraReset();
  }, [onIsland, router, cameraReset]);

  // 鏡頭視覺外置：連續 zoom／pan 只寫 DOM，不重跑本元件。
  useEffect(() => {
    bindVisual((pose, meta) => {
      const visualMeta = {
        isAnimating: meta.isAnimating,
        flyDurationMs: FLY_DURATION_MS,
        reducedMotion: reducedRef.current,
      };
      applyStageCamera(stageElRef.current, pose, visualMeta);
      applySeaCamera(seaDayElRef.current, pose, visualMeta);
      if (seaNightElRef.current) {
        applySeaCamera(seaNightElRef.current, pose, visualMeta);
        // 夜海保留 opacity crossfade；勿被海面 fly transition 整段覆寫掉。
        seaNightElRef.current.style.transition = [
          visualMeta.isAnimating
            ? `background-position ${FLY_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), ` +
              `background-size ${FLY_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
            : null,
          "opacity 600ms ease",
        ]
          .filter(Boolean)
          .join(", ");
      }
      applyParallaxCamera(parallaxElRef.current, pose, visualMeta);
    });
    return () => bindVisual(null);
  }, [bindVisual]);

  // 夜海首次掛載後補寫目前鏡頭（bindVisual 當時 ref 尚為 null）。
  useEffect(() => {
    if (!nightSeaMounted || !seaNightElRef.current) return;
    applySeaCamera(seaNightElRef.current, getCam(), {
      isAnimating: camera.isAnimating,
      flyDurationMs: FLY_DURATION_MS,
      reducedMotion: reduced,
    });
    seaNightElRef.current.style.transition = [
      camera.isAnimating
        ? `background-position ${FLY_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), ` +
          `background-size ${FLY_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
        : null,
      "opacity 600ms ease",
    ]
      .filter(Boolean)
      .join(", ");
  }, [nightSeaMounted, getCam, camera.isAnimating, reduced]);

  // 迷路自救（A′ 馴化鏡頭）：訂閱 idleEpoch（手勢結束），勿訂閱每幀 cam。
  // 島內路徑不自救（孩子正在看 overlay）；fly-to 動畫中不檢查。
  useEffect(() => {
    if (camera.isAnimating || onIsland) return;
    const timer = setTimeout(() => {
      const el = viewportElRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const cam = getCam();
      const coords = zones.map((zone) => zone.coord);
      if (!anyPointVisible(cam, rect.width, rect.height, coords)) {
        cameraReset();
      }
    }, RECENTER_IDLE_MS);
    return () => clearTimeout(timer);
  }, [camera.isAnimating, idleEpoch, cameraReset, getCam, zones, onIsland]);

  const handleMapKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          // 與控制列同一步進：放大略大、縮小略溫和，避免一次跳太兇
          camera.zoomBy(0.32);
          break;
        case "-":
        case "_":
          e.preventDefault();
          camera.zoomBy(-0.24);
          break;
        case "ArrowUp":
          e.preventDefault();
          camera.panBy(0, 80);
          break;
        case "ArrowDown":
          e.preventDefault();
          camera.panBy(0, -80);
          break;
        case "ArrowLeft":
          e.preventDefault();
          camera.panBy(80, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          camera.panBy(-80, 0);
          break;
      }
    },
    [camera],
  );

  const sceneClass = [styles.scene, paused ? styles.paused : ""].filter(Boolean).join(" ");

  // 海面貼圖：screen-space CSS 平鋪，不放進被 transform 的 stage。
  // 鏡頭 background-position/size 由 bindVisual 命令式更新（T3b），避免 zoom 卡頓。

  const mapSection = (
    <section ref={sectionRef} className={styles.map} aria-label="車車宇宙樂園地圖">
      <div className={styles.nightSeaOverlay} aria-hidden="true" />

      <div
        className={styles.viewport}
        ref={(el: HTMLDivElement | null) => {
          viewportElRef.current = el;
          camera.bind.ref(el);
        }}
        tabIndex={0}
        role="application"
        aria-label="車車樂園互動地圖：方向鍵平移，加減鍵或右下角按鈕縮放"
        aria-describedby="universe-map-guide"
        onKeyDown={handleMapKeyDown}
        onPointerDown={camera.bind.onPointerDown}
        onPointerMove={camera.bind.onPointerMove}
        onPointerUp={camera.bind.onPointerUp}
        onPointerCancel={camera.bind.onPointerCancel}
      >
        {/* v5：黏土海面貼圖（無縫平鋪）。screen-space 滿版，天生蓋滿任何鏡頭。 */}
        <div
          ref={seaDayElRef}
          className={styles.seaFill}
          aria-hidden="true"
          style={{
            backgroundImage: `url(${seaDayHref})`,
          }}
        />
        {nightSeaMounted && (
          <div
            ref={seaNightElRef}
            className={styles.seaFill}
            aria-hidden="true"
            style={{
              backgroundImage: `url(${seaNightHref})`,
              opacity: daylight === "night" ? 1 : 0,
            }}
          />
        )}

        <div
          ref={stageElRef}
          className={styles.stage}
          style={{
            width: MAP_STAGE.width,
            height: MAP_STAGE.height,
          }}
        >
          <svg
            className={sceneClass}
            viewBox={viewBox}
            width={MAP_STAGE.width}
            height={MAP_STAGE.height}
            style={{ zIndex: mapDepthZ(0, "sea") }}
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <radialGradient id="clayShade" cx="38%" cy="30%" r="75%">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
                <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="1" stopColor="#6b4a1e" stopOpacity="0.16" />
              </radialGradient>
              <filter id="islandShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>
            {zones.map((zone) => {
              if (getZoneArtTile(zone.id).mode === "island") return null;
              const terrain = ZONE_TERRAIN[zone.id];
              return (
                <g key={`land-${zone.id}`}>
                  <ellipse
                    cx={zone.px.x + 14}
                    cy={zone.px.y + 34}
                    rx="120"
                    ry="80"
                    fill="#244a2e"
                    opacity="0.16"
                    filter="url(#islandShadow)"
                  />
                  <ellipse
                    cx={zone.px.x}
                    cy={zone.px.y + 18}
                    rx="126"
                    ry="90"
                    fill="none"
                    stroke="#eaf7fc"
                    strokeWidth="5"
                    opacity="0.8"
                  />
                  <ellipse cx={zone.px.x} cy={zone.px.y + 18} rx="118" ry="84" fill={terrain.sand} />
                  <ellipse cx={zone.px.x} cy={zone.px.y + 6} rx="92" ry="62" fill={terrain.grass} />
                  <ellipse cx={zone.px.x} cy={zone.px.y + 18} rx="118" ry="84" fill="url(#clayShade)" />
                </g>
              );
            })}

            {/* v5：島底單一短柔接地陰影（取代白硬 foam 環，見 Art Bible §0/§2）。 */}
            {zones.map((zone) => {
              if (getZoneArtTile(zone.id).mode !== "island") return null;
              return (
                <ellipse
                  key={`contact-${zone.id}`}
                  cx={zone.px.x}
                  cy={zone.px.y + 30}
                  rx="112"
                  ry="34"
                  fill="#6b5a48"
                  opacity="0.18"
                  filter="url(#islandShadow)"
                />
              );
            })}

            <MapDecorNearWater reduced={reduced} paused={paused} daylight={daylight} />
            <MapDecorBirds reduced={reduced} paused={paused} daylight={daylight} />
          </svg>

          <MapBridgeLayer bridges={bridges} viewBox={viewBox} paused={paused} />

          <NightFireworks daylight={daylight} reduced={reduced} paused={paused} />

          <MapRoamerLayer
            reduced={reduced}
            paused={paused}
            night={daylight === "night"}
          />

          {zones.map((zone) => (
            <ZoneIsland
              key={zone.id}
              zone={zone}
              onActivate={handleActivate}
              reduced={reduced}
              paused={paused}
              night={daylight === "night"}
              mapScale={bucketMapScale(camera.scale)}
              devStatusOverride={devStatusOverrides[zone.id]}
              progress={zoneProgress[zone.id] ?? null}
              invite={tapHintPhase === "visible" && zone.status === "open"}
            />
          ))}

          {activeZoneId ? <HotspotLayer zoneId={activeZoneId} /> : null}

        </div>

        {/* 近景雲影：DOM 排在 stage 之後（同 z:1），飄在島群上方 */}
        <UniverseMapParallax
          layerRef={parallaxElRef}
          paused={paused}
          daylight={daylight}
        />
      </div>

      <MapGuide zones={zones} />

      {/* 首訪底部提示：screen-space，不擋地圖拖曳；dismiss 才寫 session key */}
      {tapHintPhase === "visible" ? (
        <div className={styles.tapHint} role="status" aria-live="polite">
          <span className={styles.tapHintText}>點一座島看看</span>
          <button
            type="button"
            className={styles.tapHintClose}
            aria-label="關閉提示"
            onClick={dismissTapHint}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      ) : null}

      {/* 日月星：海洋滿版後改為 screen-space 固定天象裝飾（不隨鏡頭移動）；
          z:3 高於滿版海(stage z:1)與夜幕(z:2)，天象才不會被海面蓋掉 */}
      <div className={styles.skyLayer} aria-hidden="true">
        <SkyBodies daylight={daylight} reduced={reduced} paused={paused} />
      </div>

      {/* 樂園招牌：地圖作為「紀念品海報」的標題花字 + 羅盤（裝飾，語意標題在頁面 sr-only h1） */}
      <div className={styles.titleSign} aria-hidden="true">
        <svg
          className={styles.compass}
          viewBox="0 0 44 44"
          width="40"
          height="40"
          focusable="false"
        >
          <circle cx="22" cy="22" r="20" fill="#f7ead0" stroke="#a5773c" strokeWidth="2.5" />
          <circle cx="22" cy="22" r="15" fill="none" stroke="#dcbf86" strokeWidth="1" />
          <text x="22" y="10.5" textAnchor="middle" fontSize="7" fontWeight="800" fill="#8a6438">
            N
          </text>
          <polygon points="22,8 26,22 22,26 18,22" fill="#ff8c2b" />
          <polygon points="22,36 18,22 22,26 26,22" fill="#caa063" />
          <circle cx="22" cy="22" r="2.6" fill="#8a6438" />
        </svg>
        <span className={styles.titleText}>車車宇宙樂園</span>
      </div>

      <MapControls
        onReset={() => {
          playSfx("tap");
          goWorld();
        }}
        onZoomIn={() => {
          playSfx("tap");
          camera.zoomBy(0.32);
        }}
        onZoomOut={() => {
          playSfx("tap");
          camera.zoomBy(-0.24);
        }}
        canZoomIn={camera.canZoomIn}
        canZoomOut={camera.canZoomOut}
      />

      {/* 島內 overlay：由 /adventures/[zone] 經 layout children 傳入 */}
      {onIsland ? children : null}
    </section>
  );

  return (
    <>
      {mapSection}
      {/* 世界層 children（sr-only 清單等）；島層已塞進 map 內 absolute overlay */}
      {!onIsland ? children : null}
    </>
  );
}

function UniverseMapWithDevFlags({
  zoneStoryPreviewsMap,
  children,
}: {
  zoneStoryPreviewsMap: Record<ZoneId, ZoneStoriesBundle>;
  children?: ReactNode;
}) {
  const params = useSearchParams();
  const devStatusOverrides =
    process.env.NODE_ENV !== "production"
      ? parseDevStatusOverrides(`?${params.toString()}`)
      : {};

  return (
    <UniverseMapContent
      devStatusOverrides={devStatusOverrides}
      zoneStoryPreviewsMap={zoneStoryPreviewsMap}
    >
      {children}
    </UniverseMapContent>
  );
}

export default function UniverseMap({
  zoneStoryPreviewsMap = {} as Record<ZoneId, ZoneStoriesBundle>,
  children,
}: {
  zoneStoryPreviewsMap?: Record<ZoneId, ZoneStoriesBundle>;
  children?: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <UniverseMapContent
          devStatusOverrides={{}}
          zoneStoryPreviewsMap={zoneStoryPreviewsMap}
        >
          {children}
        </UniverseMapContent>
      }
    >
      <UniverseMapWithDevFlags zoneStoryPreviewsMap={zoneStoryPreviewsMap}>
        {children}
      </UniverseMapWithDevFlags>
    </Suspense>
  );
}
