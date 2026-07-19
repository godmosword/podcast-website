import type { CSSProperties, Ref } from "react";
import { MAP_STAGE } from "@/data/universe-zones";
import type { ThemePreference } from "@/lib/theme";
import { cloudPath } from "@/lib/universe/map-art-src";
import { resolveTextureHref } from "@/lib/universe/png-to-webp";
import { useWebpSupported } from "@/hooks/useWebpSupported";
import styles from "./UniverseMapParallax.module.css";

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
  /** 鏡頭 transform 由 useMapCamera bindVisual 命令式寫入，避免 zoom 每幀 React 重渲染。 */
  layerRef?: Ref<HTMLDivElement | null>;
  paused: boolean;
  daylight: ThemePreference;
};

/** 近景雲層：飄在島群上方、以較快速率跟隨 pan/zoom（海洋滿版後的頂層雲影）。 */
export default function UniverseMapParallax({
  layerRef,
  paused,
  daylight,
}: Props) {
  const webpSupported = useWebpSupported();
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
      ref={layerRef}
      className={layerClass}
      aria-hidden="true"
      style={{
        width: MAP_STAGE.width,
        height: MAP_STAGE.height,
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
