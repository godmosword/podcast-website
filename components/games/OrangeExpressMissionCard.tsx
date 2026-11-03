"use client";

import { OrangeExpressGoal } from "@/components/games/OrangeExpressGoal";
import { LandmarkGlyph, RiderFace } from "@/components/games/OrangeExpressGlyphs";
import type { MissionState } from "@/components/games/useOrangeExpressMission";
import { GOAL_NOW, missionLine } from "@/lib/games/orange-express/copy";
import type { RunGoal } from "@/lib/games/orange-express/journal";
import type { Station } from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";

/** 任務卡上要念的名字（不印名字的朋友不念；同一個名字只念一次）。 */
export function missionNames(stations: readonly Station[]): string[] {
  const names = stations.flatMap((station) =>
    station.passengers.filter((rider) => rider.showName !== false).map((rider) => rider.name),
  );
  return names.filter((name, index) => names.indexOf(name) === index);
}

/**
 * 開局任務卡（大司機）：每位朋友站在自己那一站的地標章旁邊，最後是回家的小房子，下面一句「今天要去接…回家」。
 * 收的時候往上縮進路線條（減少動態時只淡出）。不可點、不擋桿子。
 */
export function OrangeExpressMissionCard({
  stations,
  state,
  goal = null,
}: {
  stations: readonly Station[];
  state: Exclude<MissionState, null>;
  /** 上一趟留下的小目標（PR-I3）：卡片最下面一行「這次試試：…」，朗讀接在任務那句後面。 */
  goal?: RunGoal | null;
}) {
  const line = missionLine(missionNames(stations));
  // 同一位朋友只畫一次：臉跟念出來的名字對得上（PR-I4 設計審；資料現在不重複，留著當保險）。
  const seen = new Set<string>();
  const faces = stations.map((station) =>
    station.passengers.filter((rider) => {
      if (seen.has(rider.id)) return false;
      seen.add(rider.id);
      return true;
    }),
  );
  return (
    <div
      className={styles.mission}
      data-state={state}
      data-crowded={stations.some((station) => station.passengers.length > 1) ? "true" : "false"}
      data-testid="orange-express-mission"
      role="note"
    >
      <ol className={styles.missionStops} aria-hidden>
        {stations.map((station, index) => (
          <li key={station.id} className={styles.missionStop}>
            <span className={styles.missionStamp}>
              <LandmarkGlyph id={station.landmark} />
            </span>
            {faces[index]!.map((rider) => (
              <span key={rider.id} className={styles.missionFace}>
                <RiderFace id={rider.id} />
              </span>
            ))}
          </li>
        ))}
      </ol>
      <p className={styles.missionLine}>{line}</p>
      {goal ? <OrangeExpressGoal goal={goal} prefix={GOAL_NOW} testId="orange-express-mission-goal" /> : null}
    </div>
  );
}
