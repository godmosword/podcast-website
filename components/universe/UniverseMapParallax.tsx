import type { CSSProperties } from "react";
import { MAP_STAGE } from "@/data/universe-zones";
import type { ThemePreference } from "@/lib/theme";
import { cloudPath } from "@/lib/universe/map-art-src";
import { resolveTextureHref } from "@/lib/universe/png-to-webp";
import { useWebpSupported } from "@/hooks/useWebpSupported";
import { FLY_DURATION_MS } from "./useMapCamera";
import styles from "./UniverseMapParallax.module.css";

/** 視差係數：雲層為「近景頂層」，要比地面移得快（>1）深度文法才成立。 */
const PARALLAX_NEAR = 1.15;

/** 黏土雲團（透明 PNG），飄在島群上方的近景雲影。cx/cy＝中心、w＝寬（stage 單位）。
 *  海洋滿版後無地平線帶，cy 散布全舞台 0–720。 */
const CLOUDS = [
  { id: "cloud-a", cx: 120, cy: 110, w: 150, dur: "58s", delay: "0s", opacity: 0.62 },
  { id: "cloud-b", cx: 460, cy: 60, w: 190, dur: "72s", delay: "4s", opacity: 0.58 },
  { id: "cloud-c", cx: 880, cy: 150, w: 150, dur: "64s", delay: "8s", opacity: 0.6 },
  { id: "cloud-a", cx: 700, cy: 430, w: 120, dur: "50s", delay: "2s", opacity: 0.55 },
  { id: "cloud-b", cx: 220, cy: 610, w: 200, dur: "68s", delay: "6s", opacity: 0.66 },
] as const;

type Props = {
  tx: number;
  ty: number;
  scale: number;
  isAnimating: boolean;
  reduced: boolean;
  paused: boolean;
  daylight: ThemePreference;
};

/** 近景雲層：飄在島群上方、以較快速率跟隨 pan/zoom（海洋滿版後的頂層雲影）。 */
export default function UniverseMapParallax({
  tx,
  ty,
  scale,
  isAnimating,
  reduced,
  paused,
  daylight,
}: Props) {
  const webpSupported = useWebpSupported();
  const factor = reduced ? 1 : PARALLAX_NEAR;
  const pScale = reduced ? scale : 1 + (scale - 1) * PARALLAX_NEAR;
  const transform = `translate(${tx * factor}px, ${ty * factor}px) scale(${pScale})`;
  const isNight = daylight === "night";
  const layerClass = [
    styles.layer,
    isNight ? styles.night : "",
    paused ? styles.paused : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={layerClass}
      aria-hidden="true"
      style={{
        width: MAP_STAGE.width,
        height: MAP_STAGE.height,
        transform,
        transition: isAnimating
          ? `transform ${FLY_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
          : "none",
      }}
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${MAP_STAGE.width} ${MAP_STAGE.height}`}
        width={MAP_STAGE.width}
        height={MAP_STAGE.height}
        focusable="false"
      >
        {/* 黏土雲團（drift 慢飄） */}
        {CLOUDS.map((cloud, i) => {
          const h = cloud.w * 0.6;
          return (
            <image
              key={`cloud-${i}`}
              className={styles.cloudImg}
              href={resolveTextureHref(cloudPath(cloud.id), webpSupported)}
              x={cloud.cx - cloud.w / 2}
              y={cloud.cy - h / 2}
              width={cloud.w}
              height={h}
              opacity={cloud.opacity}
              preserveAspectRatio="xMidYMid meet"
              style={
                {
                  "--dur": cloud.dur,
                  "--delay": cloud.delay,
                } as CSSProperties
              }
            />
          );
        })}
      </svg>
    </div>
  );
}
