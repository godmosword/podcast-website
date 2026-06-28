"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MAP_STAGE, ZONE_TERRAIN, type ZoneDef, type ZoneId, type ZoneStatus } from "@/data/universe-zones";
import { resolveUniverseMap } from "@/lib/universe-map";
import { getZoneArtTile } from "@/lib/universe/zone-art-tile";
import { parseDevStatusOverrides } from "@/lib/universe/dev-map-flags";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/components/ThemeProvider";
import { MapDecorBirds, MapDecorNearWater } from "./MapDecorLayer";
import MapControls from "./MapControls";
import UniverseMapParallax from "./UniverseMapParallax";
import ZoneIsland from "./ZoneIsland";
import ZoneSheet from "./ZoneSheet";
import { FLY_DURATION_MS, useMapCamera } from "./useMapCamera";
import styles from "./UniverseMap.module.css";

/** 點島後放大到的目標倍率。 */
const FOCUS_SCALE = 1.6;

type MapContentProps = {
  devStatusOverrides: Partial<Record<ZoneId, ZoneStatus>>;
};

function UniverseMapContent({ devStatusOverrides }: MapContentProps) {
  const { zones, bridges, viewBox } = resolveUniverseMap();
  const camera = useMapCamera();
  const reduced = useReducedMotion();
  const { theme: daylight } = useTheme();
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [tabHidden, setTabHidden] = useState(false);
  const [mapInView, setMapInView] = useState(true);
  const paused = tabHidden || !mapInView;
  const [activeZone, setActiveZone] = useState<ZoneDef | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      camera.flyTo(zone.coord, FOCUS_SCALE);

      const reveal = () => {
        const directRoute =
          zone.route && zone.status === "open" && !zone.subSegmentIds?.length;
        if (directRoute && zone.route) {
          if (zone.route.external) {
            window.open(zone.route.href, "_blank", "noopener,noreferrer");
          } else {
            router.push(zone.route.href);
          }
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
      <div className={styles.moonGlint} aria-hidden="true" />

      <div
        className={styles.viewport}
        ref={camera.bind.ref}
        onPointerDown={camera.bind.onPointerDown}
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
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#d6efff" />
                <stop offset="1" stopColor="#bce0f4" />
              </linearGradient>
              <radialGradient id="clayShade" cx="38%" cy="30%" r="75%">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
                <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="1" stopColor="#6b4a1e" stopOpacity="0.16" />
              </radialGradient>
              <filter id="islandShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>
            <rect x="0" y="0" width={MAP_STAGE.width} height={MAP_STAGE.height} fill="url(#seaGrad)" />
            <g className={styles.waveGroup} stroke="#b4ddf5" strokeWidth="3" fill="none" opacity="0.7">
              <path d="M 60 140 q 20 -12 40 0 t 40 0" />
              <path d="M 640 620 q 20 -12 40 0 t 40 0" />
              <path d="M 120 600 q 20 -12 40 0 t 40 0" />
            </g>

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

            {zones.map((zone) => {
              if (getZoneArtTile(zone.id).mode !== "island") return null;
              return (
                <ellipse
                  key={`foam-${zone.id}`}
                  className={styles.foamRing}
                  cx={zone.px.x}
                  cy={zone.px.y + 18}
                  rx="126"
                  ry="90"
                />
              );
            })}

            {bridges.map((bridge) => (
              <path
                key={bridge.id}
                d={bridge.d}
                fill="none"
                stroke="#c8a979"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={bridge.dashed ? "4 22" : undefined}
                className={bridge.dashed ? styles.dashedBridge : undefined}
                opacity={bridge.dashed ? 0.7 : 0.95}
              />
            ))}

            <MapDecorNearWater reduced={reduced} paused={paused} daylight={daylight} />
            <MapDecorBirds reduced={reduced} paused={paused} daylight={daylight} />
          </svg>

          {zones.map((zone) => (
            <ZoneIsland
              key={zone.id}
              zone={zone}
              onActivate={handleActivate}
              reduced={reduced}
              paused={paused}
              night={daylight === "night"}
              devStatusOverride={devStatusOverrides[zone.id]}
            />
          ))}
        </div>
      </div>

      <MapControls
        onReset={camera.reset}
        onZoomIn={() => camera.zoomBy(0.25)}
        onZoomOut={() => camera.zoomBy(-0.2)}
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
