import {
  STATUS_META,
  statusCounts,
  type ZoneStatus,
} from "@/data/universe";
import type { ZoneDef } from "@/data/universe-zones";
import styles from "./MapGuide.module.css";

const STATUS_ORDER: ZoneStatus[] = ["open", "building", "coming", "planned"];

type MapGuideProps = {
  zones: readonly ZoneDef[];
};

/**
 * 地圖固定的「第一眼說明」：讓孩子不必等一次性泡泡，也能理解地圖怎麼玩。
 * 狀態數量經 `statusCounts` 推導（與 `data/universe` 同源）。
 */
export default function MapGuide({ zones }: MapGuideProps) {
  const counts = statusCounts(zones);
  const openCount = counts.open;

  return (
    <aside
      id="universe-map-guide"
      className={styles.guide}
      aria-label="宇宙地圖探索提示"
    >
      <div className={styles.headingRow}>
        <strong className={styles.heading}>探險小抄</strong>
        <span className={styles.openCount}>
          {openCount} / {zones.length} 座可以玩
        </span>
      </div>
      <p className={styles.instruction}>點一座島飛過去，再點探索點</p>
      <ul className={styles.legend} aria-label="島嶼狀態圖例">
        {STATUS_ORDER.map((status) => {
          const count = counts[status];
          if (count === 0) return null;
          const meta = STATUS_META[status];
          return (
            <li key={status} className={styles.legendItem}>
              <span aria-hidden="true">{meta.icon}</span>
              <span>{meta.label}</span>
              <b>{count}</b>
            </li>
          );
        })}
      </ul>
      <p className={styles.gestureHint}>
        <span aria-hidden="true">↔</span> 拖曳探索
        <span aria-hidden="true">·</span>
        <span aria-hidden="true">⊕</span> 加減鍵縮放
      </p>
      <p className={styles.keyboardHint}>鍵盤也可探索</p>
    </aside>
  );
}
