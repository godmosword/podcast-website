import type { CSSProperties } from "react";
import { MAP_STAGE } from "@/data/universe-zones";
import type { ThemePreference } from "@/lib/theme";
import { cloudPath, farIslandSrcSet } from "@/lib/universe/map-art-src";
import { resolveTextureHref } from "@/lib/universe/png-to-webp";
import { useWebpSupported } from "@/hooks/useWebpSupported";
import { FLY_DURATION_MS } from "./useMapCamera";
import SkyBodies from "./SkyBodies";
import styles from "./UniverseMapParallax.module.css";

/** 視差係數：背景層跟隨鏡頭位移的比例（越小越「遠」）。 */
const PARALLAX = 0.38;

/** v5：黏土雲團（透明 PNG），沿用 drift 動畫。cx/cy＝中心、w＝寬（stage 單位）。 */
const CLOUDS = [
  { id: "cloud-a", cx: 120, cy: 88, w: 150, dur: "58s", delay: "0s", opacity: 0.9 },
  { id: "cloud-b", cx: 420, cy: 56, w: 190, dur: "72s", delay: "4s", opacity: 0.85 },
  { id: "cloud-c", cx: 860, cy: 72, w: 150, dur: "64s", delay: "8s", opacity: 0.88 },
  { id: "cloud-a", cx: 680, cy: 180, w: 120, dur: "50s", delay: "2s", opacity: 0.78 },
  { id: "cloud-b", cx: 240, cy: 520, w: 200, dur: "68s", delay: "6s", opacity: 0.7 },
] as const;

/** v5：地平線遠景黏土島剪影（透明 PNG），取代向量丘陵。
 *  §13 深度文法：y 越大越近，遠景剪影只能落在地平線帶（cy ≲ 200），
 *  放到舞台底部會與慢速視差產生「近處卻遠移」的矛盾。 */
const FAR_ISLANDS = [
  { id: "far-island-a", cx: 180, cy: 130, w: 400, opacity: 0.5 },
  { id: "far-island-b", cx: 780, cy: 110, w: 480, opacity: 0.46 },
  { id: "far-island-a", cx: 500, cy: 150, w: 300, opacity: 0.38 },
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

/** R2：遠景雲層 + 丘陵 + 太陽月亮，以較慢速率跟隨 pan/zoom。 */
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
  const factor = reduced ? 1 : PARALLAX;
  const pScale = reduced ? scale : 1 + (scale - 1) * 0.18;
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
      <SkyBodies daylight={daylight} reduced={reduced} paused={paused} />
      <svg
        className={styles.svg}
        viewBox={`0 0 ${MAP_STAGE.width} ${MAP_STAGE.height}`}
        width={MAP_STAGE.width}
        height={MAP_STAGE.height}
        focusable="false"
      >
        {/* 遠景黏土島剪影（ridge 底緣對齊 cy） */}
        {FAR_ISLANDS.map((hill, i) => {
          const h = hill.w * 0.42;
          return (
            <image
              key={`hill-${i}`}
              className={styles.hillImg}
              href={resolveTextureHref(farIslandSrcSet(hill.id).src, webpSupported)}
              x={hill.cx - hill.w / 2}
              y={hill.cy - h}
              width={hill.w}
              height={h}
              opacity={hill.opacity}
              preserveAspectRatio="xMidYMax meet"
            />
          );
        })}

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
