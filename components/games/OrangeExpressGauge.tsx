"use client";

import { COPY } from "@/lib/games/orange-express/copy";
import {
  GAUGE_MAX_KMH,
  GAUGE_UNIT,
  arcPath,
  gaugeBands,
  gaugeTicks,
  gaugeValueText,
  gaugeZone,
  kmh,
  polar,
  speedToAngle,
} from "@/lib/games/orange-express/gauge";
import styles from "./orange-express.module.css";

const C = 100;
const BAND_R = 74;
const TICK_R = 86;

/** 圓形速度表：外圈綠／黃／紅色帶，一根指針。數字刻度要家長打開。 */
export function OrangeExpressGauge({
  speed,
  limit,
  numbers,
}: {
  speed: number;
  limit: number;
  numbers: boolean;
}) {
  const bands = gaugeBands(limit);
  const zone = gaugeZone(speed, limit);
  const angle = speedToAngle(speed);
  const flagAngle = speedToAngle(limit);
  const flagTip = polar(C, C, BAND_R + 14, flagAngle);
  const now = Math.round(Math.min(100, Math.max(0, (speed / (limit > 0 ? limit : 1)) * 100)));
  const ticks = gaugeTicks();

  return (
    <div
      className={styles.gauge}
      role="meter"
      aria-label={COPY.speedometer}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={now}
      aria-valuetext={gaugeValueText(speed, limit, numbers)}
      data-zone={zone}
      data-numbers={numbers ? "true" : "false"}
      data-testid="orange-express-gauge"
    >
      <svg viewBox="0 0 200 200" aria-hidden className={styles.gaugeSvg}>
        <circle cx={C} cy={C} r={97} className={styles.gaugeBezel} />
        <circle cx={C} cy={C} r={90} className={styles.gaugeFace} />
        <path
          d={arcPath(C, C, BAND_R, speedToAngle(bands.green[0]), speedToAngle(bands.green[1]))}
          className={styles.bandGreen}
        />
        <path
          d={arcPath(C, C, BAND_R, speedToAngle(bands.yellow[0]), speedToAngle(bands.yellow[1]))}
          className={styles.bandYellow}
        />
        <path
          d={arcPath(C, C, BAND_R, speedToAngle(bands.red[0]), speedToAngle(bands.red[1]))}
          className={styles.bandRed}
        />
        {ticks.map((tick) => {
          const deg = speedToAngle(tick.value / GAUGE_MAX_KMH);
          const a = polar(C, C, TICK_R, deg);
          const b = polar(C, C, tick.major ? TICK_R - 9 : TICK_R - 5, deg);
          return (
            <line
              key={tick.value}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={tick.major ? styles.tickMajor : styles.tickMinor}
            />
          );
        })}
        {numbers
          ? ticks
              .filter((tick) => tick.major)
              .map((tick) => {
                const p = polar(C, C, 54, speedToAngle(tick.value / GAUGE_MAX_KMH));
                return (
                  <text key={tick.value} x={p.x} y={p.y + 4} className={styles.gaugeNumber}>
                    {tick.value}
                  </text>
                );
              })
          : null}
        <path
          d={`M${flagTip.x.toFixed(1)} ${flagTip.y.toFixed(1)}l0 -14l11 4.5l-11 4.5`}
          transform={`rotate(${flagAngle} ${flagTip.x.toFixed(1)} ${flagTip.y.toFixed(1)})`}
          className={styles.gaugeFlag}
        />
        <g className={styles.needle} style={{ transform: `rotate(${angle}deg)` }}>
          <path d="M96 104L100 26L104 104Z" className={styles.needleBody} />
        </g>
        <circle cx={C} cy={C} r={13} className={styles.needleCap} />
        <circle cx={C - 4} cy={C - 4} r={4} className={styles.needleShine} />
        {numbers ? (
          <>
            <text x={C} y={146} className={styles.gaugeReadout}>
              {kmh(speed)}
            </text>
            <text x={C} y={162} className={styles.gaugeUnit}>
              {GAUGE_UNIT}
            </text>
          </>
        ) : null}
      </svg>
    </div>
  );
}
