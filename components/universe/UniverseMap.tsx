"use client";

import { useCallback, useRef, useState } from "react";
import { MAP_STAGE, type ZoneDef } from "@/data/universe-zones";
import { resolveUniverseMap } from "@/lib/universe-map";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import MapControls from "./MapControls";
import ZoneIsland from "./ZoneIsland";
import ZoneSheet from "./ZoneSheet";
import { FLY_DURATION_MS, useMapCamera } from "./useMapCamera";
import styles from "./UniverseMap.module.css";

/** 點島後放大到的目標倍率。 */
const FOCUS_SCALE = 1.6;

export default function UniverseMap() {
  const { zones, bridges, viewBox } = resolveUniverseMap();
  const camera = useMapCamera();
  const reduced = useReducedMotion();
  const [activeZone, setActiveZone] = useState<ZoneDef | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            window.location.href = zone.route.href;
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
    [camera, reduced],
  );

  const transform = `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.scale})`;

  return (
    <section className={styles.map} aria-label="車車宇宙樂園地圖">
      <div
        className={styles.viewport}
        ref={camera.bind.ref}
        onPointerDown={camera.bind.onPointerDown}
        onPointerMove={camera.bind.onPointerMove}
        onPointerUp={camera.bind.onPointerUp}
        onPointerCancel={camera.bind.onPointerCancel}
      >
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
            className={styles.scene}
            viewBox={viewBox}
            width={MAP_STAGE.width}
            height={MAP_STAGE.height}
            aria-hidden="true"
            focusable="false"
          >
            {/* 海：印刷地圖固定淺色，不隨日夜反轉 */}
            <rect x="0" y="0" width={MAP_STAGE.width} height={MAP_STAGE.height} fill="#cfeaff" />
            {/* 浪紋裝飾 */}
            <g stroke="#b4ddf5" strokeWidth="3" fill="none" opacity="0.7">
              <path d="M 60 140 q 20 -12 40 0 t 40 0" />
              <path d="M 640 620 q 20 -12 40 0 t 40 0" />
              <path d="M 120 600 q 20 -12 40 0 t 40 0" />
            </g>

            {/* 沙洲 + 草地（每島底座，固定淺色） */}
            {zones.map((zone) => (
              <g key={`land-${zone.id}`}>
                <ellipse cx={zone.px.x} cy={zone.px.y + 18} rx="118" ry="84" fill="#f3e3bd" />
                <ellipse cx={zone.px.x} cy={zone.px.y + 6} rx="92" ry="62" fill="#dcefc4" />
              </g>
            ))}

            {/* 橋：實心棧道 / 虛線未開通 */}
            {bridges.map((bridge) => (
              <path
                key={bridge.id}
                d={bridge.d}
                fill="none"
                stroke="#c8a979"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={bridge.dashed ? "4 22" : undefined}
                opacity={bridge.dashed ? 0.7 : 0.95}
              />
            ))}
          </svg>

          {zones.map((zone) => (
            <ZoneIsland key={zone.id} zone={zone} onActivate={handleActivate} />
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
