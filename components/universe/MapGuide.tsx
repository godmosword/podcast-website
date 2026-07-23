import {
  ZONE_STATUS_META,
  type ZoneDef,
  type ZoneStatus,
} from "@/data/universe-zones";
import styles from "./MapGuide.module.css";

const STATUS_ORDER: ZoneStatus[] = ["open", "building", "coming", "planned"];

type MapGuideProps = {
  zones: readonly ZoneDef[];
};

/**
 * 地圖固定的「第一眼說明」：讓孩子不必等一次性泡泡，也能理解地圖怎麼玩。
 * 狀態數量由 zones 資料推導，新增島嶼時不需要同步修改 UI 文案或計數。
 */
export default function MapGuide({ zones }: MapGuideProps) {
  const counts = zones.reduce<Partial<Record<ZoneStatus, number>>>((acc, zone) => {
    acc[zone.status] = (acc[zone.status] ?? 0) + 1;
    return acc;
  }, {});
  const openCount = counts.open ?? 0;

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
      <p className={styles.instruction}>點一座島，看看現在能做什麼</p>
      <ul className={styles.legend} aria-label="島嶼狀態圖例">
        {STATUS_ORDER.map((status) => {
          const count = counts[status] ?? 0;
          if (count === 0) return null;
          const meta = ZONE_STATUS_META[status];
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
