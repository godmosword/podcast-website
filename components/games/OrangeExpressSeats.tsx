"use client";

import type { CSSProperties } from "react";
import { LandmarkGlyph, RiderFace } from "@/components/games/OrangeExpressGlyphs";
import { SEAT_COLOR, seatsFor, seatsLabel } from "@/lib/games/orange-express/seats";
import type { RunState } from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";

/**
 * 駕駛台常駐的「接朋友」座位（PR-J2）：每站一組，上面是那一站的地標章、下面是要接的朋友。
 * 沒上車是虛線空位（朋友的臉淡淡的，看得出是誰）；上車那一刻臉彈進座位。下一站那組的章外一圈黃，
 * 取代原本的「下一站」站名牌。中間格太窄時只剩小圓點（上車的填朋友的代表色）。
 */
export function OrangeExpressSeats({ run }: { run: RunState }) {
  const seats = seatsFor(run);
  const atStation = run.phase === "stopped" || run.phase === "doors-open";
  return (
    <div
      className={styles.seats}
      role="img"
      aria-label={seatsLabel(seats, atStation)}
      data-testid="orange-express-seats"
      data-aboard={seats.aboard}
      data-total={seats.total}
    >
      {seats.groups.map((group) => (
        <span key={group.id} className={styles.seatGroup} data-next-stop={group.next ? "true" : "false"}>
          <LandmarkGlyph id={group.landmark} className={styles.seatStamp} />
          <span className={styles.seatRow}>
            {group.seats.map((seat) => (
              // 換 key 讓上車那一刻重新掛上、彈一下。
              <span
                key={`${seat.id}-${seat.aboard ? "on" : "off"}`}
                className={styles.seat}
                data-aboard={seat.aboard ? "true" : "false"}
                style={{ "--seat-color": SEAT_COLOR[seat.id] } as CSSProperties}
              >
                <RiderFace id={seat.id} />
              </span>
            ))}
          </span>
        </span>
      ))}
    </div>
  );
}
