"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MAP_STAGE, ZONE_TERRAIN, type ZoneDef, type ZoneId, type ZoneStatus } from "@/data/universe-zones";
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
import { parseZoneDeepLink, parseZoneDeepLinkFromSearch } from "@/lib/universe/zone-deep-link";
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
import ZoneIsland from "./ZoneIsland";
import ZoneSheet from "./ZoneSheet";
import { ENTRY_PLAYED_KEY, FLY_DURATION_MS, useMapCamera } from "./useMapCamera";
import styles from "./UniverseMap.module.css";

/** 點島後放大到的目標倍率。 */
const FOCUS_SCALE = 1.6;

/** bottom dock 開啟時，fly-to 把島往上留出的視窗像素。 */
const FOCUS_DOCK_OFFSET_Y = 96;

/** 首訪「點點看」引導：每個分頁 session 只出現一次（T5）。 */
const TAP_HINT_KEY = "cc-universe-tap-hint-shown";

/** 引導泡泡自動收合時間（毫秒）。 */
const TAP_HINT_TTL_MS = 8000;

/**
 * 地圖互動狀態機（單一事實來源）：
 * idle（漫遊）→ flying（fly-to 中、sheet 已排程）→ sheet（介紹開啟）。
 * 取代舊的三個命令式門閂（focusedOpenZoneRef／openTimerRef／deepLinkHandledRef）——
 * 點島、深連結、拖曳取消全部走同一個模型，孩子看到的規則只有一條：
 * 「點任何島 → 飛過去 → 打開介紹」。
 */
type MapInteraction =
  | { phase: "idle" }
  | { phase: "flying"; zone: ZoneDef }
  | { phase: "sheet"; zone: ZoneDef };

type MapContentProps = {
  devStatusOverrides: Partial<Record<ZoneId, ZoneStatus>>;
  zoneQuery: string | null;
  syncZoneQuery: (zoneId: ZoneId | null) => void;
  zoneStoryPreviewsMap: Record<ZoneId, ZoneStoriesBundle>;
};

function UniverseMapContent({
  devStatusOverrides,
  zoneQuery,
  syncZoneQuery,
  zoneStoryPreviewsMap,
}: MapContentProps) {
  // useMemo 錨定引用：resolveUniverseMap 每次呼叫都產新 zone 物件，
  // 不錨定的話 memo(ZoneIsland) 會被每 tick 全新的 zone prop 擊穿。
  const { zones, bridges, viewBox } = useMemo(() => resolveUniverseMap(), []);
  // 進度中樞：孩子聽完的集數（localStorage，mount 後才讀）→ 各島星章與 sheet 打勾
  const completedSlugs = useCompletedSlugs();
  const zoneProgress = useMemo(
    () => computeZoneProgress(zoneStoryPreviewsMap, completedSlugs),
    [zoneStoryPreviewsMap, completedSlugs],
  );
  // 深連結入場：預寫 entry key 跳過進場降落動畫，避免與 flyTo 目標島互搶鏡頭
  // （兩者共用 FLY_DURATION_MS 時序）。必須在 useMapCamera 首次量測 effect 讀取
  // sessionStorage 之前寫入，故放 useState 初始化器（render 期一次、StrictMode 幂等）。
  useState(() => {
    if (typeof window === "undefined") return;
    if (!parseZoneDeepLinkFromSearch(window.location.search)) return;
    try {
      sessionStorage.setItem(ENTRY_PLAYED_KEY, "1");
    } catch {
      // sessionStorage 不可用時退回原行為（進場動畫照播，deep link 仍會開 sheet）
    }
  });
  const camera = useMapCamera();
  // 穩定的 flyTo 引用（useCallback，不隨 pointer-move 每 tick 重建的 camera 物件
  // 一起變動）；供下方多個 callback 當依賴，避免每次平移都重建它們並連鎖重渲染
  // ZoneIsland（ZoneIsland 已 memo）。deep-link effect 沿用同一個解構值。
  const { flyTo: cameraFlyTo, bindVisual, getCam, idleEpoch, isInteracting } =
    camera;
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
  const [interaction, setInteraction] = useState<MapInteraction>({ phase: "idle" });
  // 供事件回呼／effect 讀「當下」狀態而不把 interaction 加進依賴（避免關 sheet
  // 時 deep-link effect 因狀態變動重跑、拿著尚未清掉的 query 又把 sheet 開回來）。
  const interactionRef = useRef(interaction);
  interactionRef.current = interaction;
  const activeZone = interaction.phase === "sheet" ? interaction.zone : null;
  /** 迷路自救：viewport 元素引用（量測可見性用；camera.bind.ref 之外的旁支引用）。 */
  const viewportElRef = useRef<HTMLDivElement | null>(null);
  // 首訪一次性「戳我」引導（T5）：指向開放主島；deep link 入場不顯示。
  const [tapHintVisible, setTapHintVisible] = useState(false);
  const carParkZone = useMemo(
    () => zones.find((zone) => zone.id === "car-park") ?? null,
    [zones],
  );

  useEffect(() => {
    if (parseZoneDeepLinkFromSearch(window.location.search)) return;
    try {
      if (sessionStorage.getItem(TAP_HINT_KEY)) return;
      sessionStorage.setItem(TAP_HINT_KEY, "1");
    } catch {
      return;
    }
    setTapHintVisible(true);
  }, []);

  useEffect(() => {
    if (!tapHintVisible) return;
    const timer = setTimeout(() => setTapHintVisible(false), TAP_HINT_TTL_MS);
    return () => clearTimeout(timer);
  }, [tapHintVisible]);
  // 夜海貼圖惰性載入：首次切到夜晚才掛 pattern，日間不下載 sea-night.png；
  // 掛上後保持常駐，讓日夜切換仍有 600ms crossfade。
  const [nightSeaMounted, setNightSeaMounted] = useState(false);
  const seaDayHref = resolveTextureHref(seaTexturePath(false), webpSupported);
  const seaNightHref = resolveTextureHref(seaTexturePath(true), webpSupported);
  const daylightTrackedRef = useRef(false);

  useEffect(() => {
    if (daylight === "night") setNightSeaMounted(true);
  }, [daylight]);

  const closeSheet = useCallback(() => {
    setInteraction({ phase: "idle" });
    syncZoneQuery(null);
  }, [syncZoneQuery]);

  const revealSheet = useCallback(
    (zone: ZoneDef) => {
      setInteraction({ phase: "sheet", zone });
      syncZoneQuery(zone.id);
    },
    [syncZoneQuery],
  );

  /** 單一開島入口：fly-to 並進入 flying（reduced-motion 直接開 sheet）。 */
  const openZone = useCallback(
    (zone: ZoneDef) => {
      cameraFlyTo(zone.coord, FOCUS_SCALE, { viewportOffsetY: FOCUS_DOCK_OFFSET_Y });
      if (reduced) {
        revealSheet(zone);
      } else {
        setInteraction({ phase: "flying", zone });
      }
    },
    [cameraFlyTo, reduced, revealSheet],
  );

  // flying → sheet 的排程走 effect：StrictMode 模擬卸載會 cleanup 再重排（幂等），
  // 使用者拖曳把狀態切回 idle 時 cleanup 自動取消，無需手動管 timer ref。
  useEffect(() => {
    if (interaction.phase !== "flying") return;
    const zone = interaction.zone;
    const timer = setTimeout(() => revealSheet(zone), FLY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [interaction, revealSheet]);

  // 深連結開 sheet：與點島同一條狀態機路徑（openZone）。
  // 依賴不含 interaction——關 sheet 時 query 尚未同步清掉，
  // 若依賴狀態會立刻重跑把 sheet 開回來；改由 interactionRef 讀當下值。
  // camera 完成首次量測前（sizeRef 0×0）flyTo 會 no-op：以「已離開初始姿態」
  // 判定 ready，未 ready 先不開，等量測 setCam 的 commit 觸發本 effect 重跑再飛。
  const cameraInitialized =
    camera.scale !== 1 || camera.tx !== 0 || camera.ty !== 0;
  useEffect(() => {
    const zone = parseZoneDeepLink(zoneQuery);
    if (!zone) return;
    if (!cameraInitialized) return;
    const current = interactionRef.current;
    // 已在飛往／已開同一座島 → 冪等跳過（StrictMode 雙跑、sheet 開啟後 query 回寫）。
    if (current.phase !== "idle" && current.zone.id === zone.id) return;
    openZone(zone);
  }, [cameraInitialized, openZone, zoneQuery]);

  useEffect(() => {
    if (!daylightTrackedRef.current) {
      daylightTrackedRef.current = true;
      return;
    }
    trackUniverseDayNightToggle(daylight);
  }, [daylight]);

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

  /** 統一點擊語意（Q5）：點任何島（含鎖島本體）→ fly-to＋開介紹 sheet。 */
  const handleActivate = useCallback(
    (zone: ZoneDef) => {
      setTapHintVisible(false);
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

      // 連點加速：已在飛往同島途中再點一次 → 立即開 sheet，不重排 600ms。
      const current = interactionRef.current;
      if (current.phase === "flying" && current.zone.id === zone.id) {
        revealSheet(zone);
        return;
      }

      openZone(zone);
    },
    [openZone, revealSheet, router],
  );

  /** 使用者拖曳打斷 fly-to、或主動改鏡頭（縮放／重置／方向鍵）時，取消尚未開啟的 sheet。 */
  const cancelPendingReveal = useCallback(() => {
    if (interactionRef.current.phase === "flying") {
      setInteraction({ phase: "idle" });
    }
  }, []);

  // wheel／觸控板縮放走 useMapCamera 內部監聽（非 React 事件），這裡補一個
  // 平行監聽讓「主動改鏡頭 → 取消尚未開啟的 sheet」語意涵蓋滾輪（diff 審 HIGH）。
  useEffect(() => {
    const el = viewportElRef.current;
    if (!el) return;
    const onWheel = () => cancelPendingReveal();
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, [cancelPendingReveal]);

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
  // fly-to 動畫中不檢查；結束後 idleEpoch 會再 bump。
  const { reset: cameraReset } = camera;
  useEffect(() => {
    if (camera.isAnimating) return;
    const timer = setTimeout(() => {
      const el = viewportElRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (interactionRef.current.phase !== "idle") return;
      const cam = getCam();
      const coords = zones.map((zone) => zone.coord);
      if (!anyPointVisible(cam, rect.width, rect.height, coords)) {
        cameraReset();
      }
    }, RECENTER_IDLE_MS);
    return () => clearTimeout(timer);
  }, [camera.isAnimating, idleEpoch, cameraReset, getCam, zones]);

  const handleMapKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          cancelPendingReveal();
          // 與控制列同一步進：放大略大、縮小略溫和，避免一次跳太兇
          camera.zoomBy(0.32);
          break;
        case "-":
        case "_":
          e.preventDefault();
          cancelPendingReveal();
          camera.zoomBy(-0.24);
          break;
        case "ArrowUp":
          e.preventDefault();
          cancelPendingReveal();
          camera.panBy(0, 80);
          break;
        case "ArrowDown":
          e.preventDefault();
          cancelPendingReveal();
          camera.panBy(0, -80);
          break;
        case "ArrowLeft":
          e.preventDefault();
          cancelPendingReveal();
          camera.panBy(80, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          cancelPendingReveal();
          camera.panBy(-80, 0);
          break;
      }
    },
    [camera, cancelPendingReveal],
  );

  const sceneClass = [styles.scene, paused ? styles.paused : ""].filter(Boolean).join(" ");

  // 海面貼圖：screen-space CSS 平鋪，不放進被 transform 的 stage。
  // 鏡頭 background-position/size 由 bindVisual 命令式更新（T3b），避免 zoom 卡頓。

  return (
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
        onPointerDown={(e) => {
          if (!(e.target as Element).closest("button")) cancelPendingReveal();
          camera.bind.onPointerDown(e);
        }}
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
            />
          ))}

          {/* 首訪引導泡泡：指向開放主島，點任何島或逾時即收（純裝飾，aria-hidden） */}
          {tapHintVisible && carParkZone ? (
            <span
              className={styles.tapHint}
              aria-hidden="true"
              style={{
                left: `${carParkZone.px.x}px`,
                top: `${carParkZone.px.y - 118}px`,
                transform:
                  "translate(-50%, -100%) scale(calc(1 / var(--map-scale, 1)))",
              }}
            >
              <span className={styles.tapHintFinger}>👆</span> 點點看！
            </span>
          ) : null}
        </div>

        {/* 近景雲影：DOM 排在 stage 之後（同 z:1），飄在島群上方 */}
        <UniverseMapParallax
          layerRef={parallaxElRef}
          paused={paused}
          daylight={daylight}
        />
      </div>

      <MapGuide zones={zones} />

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
          cancelPendingReveal();
          camera.reset();
        }}
        onZoomIn={() => {
          playSfx("tap");
          cancelPendingReveal();
          camera.zoomBy(0.32);
        }}
        onZoomOut={() => {
          playSfx("tap");
          cancelPendingReveal();
          camera.zoomBy(-0.24);
        }}
        canZoomIn={camera.canZoomIn}
        canZoomOut={camera.canZoomOut}
      />

      <ZoneSheet
        zone={activeZone}
        onClose={closeSheet}
        zoneStories={
          activeZone ? (zoneStoryPreviewsMap[activeZone.id] ?? null) : null
        }
        completedSlugs={completedSlugs}
      />
    </section>
  );
}

function UniverseMapWithDevFlags({
  zoneStoryPreviewsMap,
}: {
  zoneStoryPreviewsMap: Record<ZoneId, ZoneStoriesBundle>;
}) {
  const params = useSearchParams();
  const devStatusOverrides =
    process.env.NODE_ENV !== "production"
      ? parseDevStatusOverrides(`?${params.toString()}`)
      : {};

  const syncZoneQuery = useCallback(
    (zoneId: ZoneId | null) => {
      const next = new URLSearchParams(params.toString());
      if (zoneId) next.set("zone", zoneId);
      else next.delete("zone");
      const q = next.toString();
      const href = q ? `/adventures?${q}` : "/adventures";
      // Keep the address bar synchronous with the sheet state. This also
      // avoids a production-only delay where navigation can leave a
      // static route's old search params visible for several seconds.
      window.history.replaceState(null, "", href);
    },
    [params],
  );

  return (
    <UniverseMapContent
      devStatusOverrides={devStatusOverrides}
      zoneQuery={params.get("zone")}
      syncZoneQuery={syncZoneQuery}
      zoneStoryPreviewsMap={zoneStoryPreviewsMap}
    />
  );
}

export default function UniverseMap({
  zoneStoryPreviewsMap = {} as Record<ZoneId, ZoneStoriesBundle>,
}: {
  zoneStoryPreviewsMap?: Record<ZoneId, ZoneStoriesBundle>;
}) {
  return (
    <Suspense
      fallback={
        <UniverseMapContent
          devStatusOverrides={{}}
          zoneQuery={null}
          syncZoneQuery={() => undefined}
          zoneStoryPreviewsMap={zoneStoryPreviewsMap}
        />
      }
    >
      <UniverseMapWithDevFlags zoneStoryPreviewsMap={zoneStoryPreviewsMap} />
    </Suspense>
  );
}
