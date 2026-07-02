"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MAP_STAGE, ZONE_TERRAIN, type ZoneDef, type ZoneId, type ZoneStatus } from "@/data/universe-zones";
import { resolveUniverseMap } from "@/lib/universe-map";
import { getZoneArtTile } from "@/lib/universe/zone-art-tile";
import { parseDevStatusOverrides } from "@/lib/universe/dev-map-flags";
import { mapDepthZ } from "@/lib/universe-depth";
import { seaTexturePath } from "@/lib/universe/map-art-src";
import { resolveTextureHref } from "@/lib/universe/png-to-webp";
import { playSfx } from "@/lib/sfx";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWebpSupported } from "@/hooks/useWebpSupported";
import { useTheme } from "@/components/ThemeProvider";
import { MapDecorBirds, MapDecorNearWater } from "./MapDecorLayer";
import MapBridgeLayer from "./MapBridgeLayer";
import MapRoamerLayer from "./MapRoamerLayer";
import MapControls from "./MapControls";
import NightFireworks from "./NightFireworks";
import UniverseMapParallax from "./UniverseMapParallax";
import ZoneIsland from "./ZoneIsland";
import ZoneSheet from "./ZoneSheet";
import { FLY_DURATION_MS, useMapCamera } from "./useMapCamera";
import styles from "./UniverseMap.module.css";

/** 點島後放大到的目標倍率。 */
const FOCUS_SCALE = 1.6;

/** 黏土海面貼圖平鋪尺寸（stage 單位）；無縫 tile 見 Art Bible §14。 */
const SEA_TILE = 300;

type MapContentProps = {
  devStatusOverrides: Partial<Record<ZoneId, ZoneStatus>>;
};

function UniverseMapContent({ devStatusOverrides }: MapContentProps) {
  const { zones, bridges, viewBox } = resolveUniverseMap();
  const camera = useMapCamera();
  const reduced = useReducedMotion();
  const webpSupported = useWebpSupported();
  const { theme: daylight } = useTheme();
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [tabHidden, setTabHidden] = useState(false);
  const [mapInView, setMapInView] = useState(true);
  const paused = tabHidden || !mapInView;
  const [activeZone, setActiveZone] = useState<ZoneDef | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 夜海貼圖惰性載入：首次切到夜晚才掛 pattern，日間不下載 sea-night.png；
  // 掛上後保持常駐，讓日夜切換仍有 600ms crossfade。
  const [nightSeaMounted, setNightSeaMounted] = useState(false);
  const seaDayHref = resolveTextureHref(seaTexturePath(false), webpSupported);
  const seaNightHref = resolveTextureHref(seaTexturePath(true), webpSupported);

  useEffect(() => {
    if (daylight === "night") setNightSeaMounted(true);
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

  const handleActivate = useCallback(
    (zone: ZoneDef) => {
      // 慶祝音（尊重 SfxToggle 靜音偏好；reduced-motion 保留音效、只關動畫）
      playSfx("collect");

      const directRoute =
        zone.route && zone.status === "open" && !zone.subSegmentIds?.length;

      // 外連必須留在使用者手勢的同步呼叫棧內開窗；
      // 放進 setTimeout 會被 Safari／iOS 彈窗攔截靜默擋掉。
      if (directRoute && zone.route?.external) {
        window.open(zone.route.href, "_blank", "noopener,noreferrer");
        return;
      }

      camera.flyTo(zone.coord, FOCUS_SCALE);

      const reveal = () => {
        openTimerRef.current = null;
        if (directRoute && zone.route) {
          router.push(zone.route.href);
          return;
        }
        setActiveZone(zone);
      };

      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (reduced) {
        reveal();
      } else {
        openTimerRef.current = setTimeout(reveal, FLY_DURATION_MS);
      }
    },
    [camera, reduced, router],
  );

  /** 使用者拖曳打斷 fly-to 時，取消尚未觸發的開 sheet／導航。 */
  const cancelPendingReveal = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
    };
  }, []);

  const transform = `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.scale})`;
  const sceneClass = [styles.scene, paused ? styles.paused : ""].filter(Boolean).join(" ");

  return (
    <section ref={sectionRef} className={styles.map} aria-label="車車宇宙樂園地圖">
      <div className={styles.nightSeaOverlay} aria-hidden="true" />

      <div
        className={styles.viewport}
        ref={camera.bind.ref}
        onPointerDown={(e) => {
          // 島嶼 button 的 pointerdown 交給 activate 流程自行接手（會重設 timer）
          if (!(e.target as Element).closest("button")) cancelPendingReveal();
          camera.bind.onPointerDown(e);
        }}
        onPointerMove={camera.bind.onPointerMove}
        onPointerUp={camera.bind.onPointerUp}
        onPointerCancel={camera.bind.onPointerCancel}
      >
        <UniverseMapParallax
          tx={camera.tx}
          ty={camera.ty}
          scale={camera.scale}
          isAnimating={camera.isAnimating}
          reduced={reduced}
          paused={paused}
          daylight={daylight}
        />
        <div
          className={styles.stage}
          style={{
            width: MAP_STAGE.width,
            height: MAP_STAGE.height,
            transform,
            transition: camera.isAnimating
              ? `transform ${FLY_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
              : "none",
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
              {/* v5：黏土海面貼圖（無縫平鋪），取代 seaGrad 漸層。 */}
              <pattern
                id="seaTile"
                patternUnits="userSpaceOnUse"
                width={SEA_TILE}
                height={SEA_TILE}
              >
                <image
                  href={seaDayHref}
                  x="0"
                  y="0"
                  width={SEA_TILE}
                  height={SEA_TILE}
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
              {nightSeaMounted && (
                <pattern
                  id="seaTileNight"
                  patternUnits="userSpaceOnUse"
                  width={SEA_TILE}
                  height={SEA_TILE}
                >
                  <image
                    href={seaNightHref}
                    x="0"
                    y="0"
                    width={SEA_TILE}
                    height={SEA_TILE}
                    preserveAspectRatio="xMidYMid slice"
                  />
                </pattern>
              )}
              <radialGradient id="clayShade" cx="38%" cy="30%" r="75%">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
                <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="1" stopColor="#6b4a1e" stopOpacity="0.16" />
              </radialGradient>
              <filter id="islandShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>
            {/* 海面基色（貼圖載入前 / overscroll 露出時的底）；rx 圓角讓世界
                在退遠鏡頭下讀作「漂在天空上的立體模型板」而非硬切矩形 */}
            <rect x="0" y="0" width={MAP_STAGE.width} height={MAP_STAGE.height} rx="28" fill="#bfe0ef" />
            <rect x="0" y="0" width={MAP_STAGE.width} height={MAP_STAGE.height} rx="28" fill="url(#seaTile)" />
            {nightSeaMounted && (
              <rect
                x="0"
                y="0"
                width={MAP_STAGE.width}
                height={MAP_STAGE.height}
                rx="28"
                fill="url(#seaTileNight)"
                className={styles.seaNightTile}
                style={{ opacity: daylight === "night" ? 1 : 0 }}
              />
            )}

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
              mapScale={camera.scale}
              devStatusOverride={devStatusOverrides[zone.id]}
            />
          ))}
        </div>
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
          camera.reset();
        }}
        onZoomIn={() => {
          playSfx("tap");
          camera.zoomBy(0.25);
        }}
        onZoomOut={() => {
          playSfx("tap");
          camera.zoomBy(-0.2);
        }}
      />

      <ZoneSheet zone={activeZone} onClose={() => setActiveZone(null)} />
    </section>
  );
}

function UniverseMapWithDevFlags() {
  const params = useSearchParams();
  const devStatusOverrides =
    process.env.NODE_ENV !== "production"
      ? parseDevStatusOverrides(`?${params.toString()}`)
      : {};
  return <UniverseMapContent devStatusOverrides={devStatusOverrides} />;
}

export default function UniverseMap() {
  return (
    <Suspense fallback={<UniverseMapContent devStatusOverrides={{}} />}>
      <UniverseMapWithDevFlags />
    </Suspense>
  );
}
