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
        <div className={styles.scaffold} />
        <div className={styles.dust} />
      </div>
    );
  }

  if (status === "coming") {
    return (
      <div className={`${styles.overlay} ${styles.coming}`} aria-hidden="true">
        <div className={styles.comingFog} />
      </div>
    );
  }

  return null;
}
