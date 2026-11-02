import { EventGlyph } from "@/components/games/OrangeExpressEventGlyphs";
import { EVENT_NAME } from "@/lib/games/orange-express/copy";
import { EVENT_KINDS, routeEvents } from "@/lib/games/orange-express/events";
import type { RunState } from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";

/**
 * 結算的事件章列（大司機，取代計數列）：每種事件一個章，遇到幾次用下面的小圓點表示（不寫數字）。
 * 遇到的都上色、不灰章；做到的那次圓點填黃，至少做到一次的章墊一塊黃底（形狀＋顏色，不只靠顏色）。
 */
export function OrangeExpressEventStamps({ stations, events }: Pick<RunState, "stations" | "events">) {
  const all = routeEvents(stations);
  const groups = EVENT_KINDS.map((kind) => {
    const these = all.filter((event) => event.kind === kind);
    const done = these.filter((event) => events[event.key] === "done").length;
    const scene = these[0] ? stations[these[0].stationIndex]!.scene : "field";
    return { kind, scene, these, done };
  }).filter((group) => group.these.length > 0);
  if (groups.length === 0) return null;
  return (
    <ul className={styles.eventStamps} data-testid="orange-express-event-stamps">
      {groups.map(({ kind, scene, these, done }) => (
        <li
          key={kind}
          className={styles.eventStamp}
          data-kind={kind}
          data-done={done > 0 ? "true" : "false"}
          aria-label={`${EVENT_NAME[kind]}：遇到 ${these.length} 次，做到 ${done} 次`}
        >
          <span className={styles.eventStampBadge} aria-hidden>
            <EventGlyph kind={kind} scene={scene} />
          </span>
          <span className={styles.eventDots} aria-hidden>
            {these.map((event) => (
              <span key={event.key} className={styles.eventDot} data-done={events[event.key] === "done" ? "true" : "false"} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}
