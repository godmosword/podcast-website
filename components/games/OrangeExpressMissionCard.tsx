"use client";

import { LandmarkGlyph, RiderFace } from "@/components/games/OrangeExpressGlyphs";
import type { MissionState } from "@/components/games/useOrangeExpressMission";
import { missionLine } from "@/lib/games/orange-express/copy";
import type { Station } from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";

/** 任務卡上要念的名字（不印名字的朋友不念）。 */
export function missionNames(stations: readonly Station[]): string[] {
  return stations.flatMap((station) =>
    station.passengers.filter((rider) => rider.showName !== false).map((rider) => rider.name),
  );
}

/**
 * 開局任務卡（大司機）：每位朋友站在自己那一站的地標章旁邊，最後是回家的小房子，下面一句「今天要去接…回家」。
 * 收的時候往上縮進路線條（減少動態時只淡出）。不可點、不擋桿子。
 */
export function OrangeExpressMissionCard({
  stations,
  state,
}: {
  stations: readonly Station[];
  state: Exclude<MissionState, null>;
}) {
  const line = missionLine(missionNames(stations));
  return (
    <div className={styles.mission} data-state={state} data-testid="orange-express-mission" role="note">
      <ol className={styles.missionStops} aria-hidden>
        {stations.map((station) => (
          <li key={station.id} className={styles.missionStop}>
            <span className={styles.missionStamp}>
              <LandmarkGlyph id={station.landmark} />
            </span>
            {station.passengers.map((rider) => (
              <span key={rider.id} className={styles.missionFace}>
                <RiderFace id={rider.id} />
              </span>
            ))}
          </li>
        ))}
      </ol>
      <p className={styles.missionLine}>{line}</p>
    </div>
  );
}
