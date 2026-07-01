import type { ZoneStatus } from "@/data/universe-zones";
import styles from "./StatusOverlay.module.css";

type Props = {
  status: ZoneStatus;
  paused: boolean;
  transition?: string | null;
};

/** 島上狀態持續態 overlay（building / coming） */
export default function StatusOverlay({ status, paused, transition }: Props) {
  if (status === "open" || status === "planned") return null;

  const exiting =
    transition === "building-to-open" ? styles.overlayExit : undefined;

  if (status === "building") {
    return (
      <div
        className={[styles.overlay, styles.building, exiting].filter(Boolean).join(" ")}
        data-paused={paused || undefined}
        aria-hidden="true"
      >
        <div className={styles.dust} />
      </div>
    );
  }

  // coming：沉睡感由島圖 filter 表現（見 ZoneIsland.module.css），
  // 不再用矩形 fog/backdrop overlay，避免在透明島四周的 clay 海上露出方框。
  return null;
}
