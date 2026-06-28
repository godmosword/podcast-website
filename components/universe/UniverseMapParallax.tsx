import type { CSSProperties } from "react";
import { MAP_STAGE } from "@/data/universe-zones";
import type { ThemePreference } from "@/lib/theme";
import { FLY_DURATION_MS } from "./useMapCamera";
import SkyBodies from "./SkyBodies";
import styles from "./UniverseMapParallax.module.css";

/** 視差係數：背景層跟隨鏡頭位移的比例（越小越「遠」）。 */
const PARALLAX = 0.38;

const CLOUDS = [
  { dur: "58s", delay: "0s", ellipses: [
    { cx: 120, cy: 88, rx: 52, ry: 22 }, { cx: 155, cy: 82, rx: 38, ry: 18 },
    { cx: 90, cy: 82, rx: 32, ry: 16 }, { cx: 138, cy: 94, rx: 28, ry: 13 },
  ], opacity: 0.85 },
  { dur: "72s", delay: "4s", ellipses: [
    { cx: 420, cy: 56, rx: 64, ry: 26 }, { cx: 468, cy: 50, rx: 44, ry: 20 },
    { cx: 378, cy: 50, rx: 36, ry: 18 }, { cx: 440, cy: 64, rx: 34, ry: 15 },
  ], opacity: 0.8 },
  { dur: "64s", delay: "8s", ellipses: [
    { cx: 860, cy: 72, rx: 58, ry: 24 }, { cx: 905, cy: 66, rx: 40, ry: 18 },
    { cx: 820, cy: 66, rx: 34, ry: 16 }, { cx: 876, cy: 80, rx: 30, ry: 14 },
  ], opacity: 0.82 },
  { dur: "50s", delay: "2s", ellipses: [
    { cx: 680, cy: 180, rx: 48, ry: 20 }, { cx: 715, cy: 175, rx: 34, ry: 16 },
    { cx: 654, cy: 186, rx: 26, ry: 12 },
  ], opacity: 0.7 },
  { dur: "68s", delay: "6s", ellipses: [
    { cx: 240, cy: 520, rx: 70, ry: 28 }, { cx: 290, cy: 512, rx: 48, ry: 22 },
    { cx: 208, cy: 528, rx: 34, ry: 15 },
  ], opacity: 0.62 },
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
        {/* 遠景丘陵 */}
        <ellipse className={styles.hill} cx="180" cy="120" rx="200" ry="48" fill="#b8dcc8" opacity="0.42" />
        <ellipse className={styles.hill} cx="780" cy="100" rx="240" ry="52" fill="#a8d4c0" opacity="0.38" />
        <ellipse className={styles.hill} cx="520" cy="640" rx="280" ry="44" fill="#c8e0d0" opacity="0.34" />

        {CLOUDS.map((cloud, i) => (
          <g
            key={i}
            className={styles.cloud}
            fill="#fff"
            opacity={cloud.opacity}
            style={
              {
                "--dur": cloud.dur,
                "--delay": cloud.delay,
              } as CSSProperties
            }
          >
            {cloud.ellipses.map((e, j) => (
              <ellipse key={j} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
