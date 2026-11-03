"use client";

import type { CSSProperties } from "react";
import { LandmarkGlyph, XiaojuFace } from "@/components/games/OrangeExpressGlyphs";
import { COPY } from "@/lib/games/orange-express/copy";
import type { RouteStrip } from "@/lib/games/orange-express/route-strip";
import styles from "./orange-express.module.css";

/**
 * 前窗上緣的路線條：一段地圖軌道，站點是插在軌道上方的地標章（像地圖釘），小橘走在軌道上，不會蓋住章。
 * 下一站的章亮黃圈，停過的章填黃底，走過的軌道塗實。要接的朋友只在駕駛台的座位上（PR-J2），這裡不重複畫。
 * 小橘的位置每一幀照算、不做滑動動畫（減少動態也一樣）。
 */
/** arrive：任務卡剛收進來，站點章依序彈一下（減少動態不彈）。 */
export function OrangeExpressRouteStrip({ strip, arrive = false }: { strip: RouteStrip; arrive?: boolean }) {
  const label = `${COPY.routeStrip}：${strip.stops.map((stop) => stop.name).join("、")}，下一站${strip.next}`;
  return (
    <div
      className={styles.routeStrip}
      role="img"
      aria-label={label}
      data-testid="orange-express-route"
      data-arrive={arrive ? "true" : "false"}
    >
      <div className={styles.routeTrack}>
        <span className={styles.routeRail} />
        <span className={styles.routeDone} style={{ width: `${strip.train}%` }} />
        {strip.stops.map((stop, index) => (
          <span
            key={stop.id}
            className={styles.routeStop}
            data-reached={stop.reached ? "true" : "false"}
            data-next={stop.next ? "true" : "false"}
            data-testid="orange-express-route-stop"
            style={{ left: `${stop.at}%`, "--i": index } as CSSProperties}
          >
            <LandmarkGlyph id={stop.landmark} className={styles.routeStamp} />
          </span>
        ))}
        <span
          className={styles.routeTrain}
          data-testid="orange-express-route-train"
          style={{ left: `${strip.train}%` }}
        >
          <XiaojuFace />
        </span>
      </div>
    </div>
  );
}
