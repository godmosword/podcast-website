import { moonPath, moonWebpPath } from "@/lib/universe/map-art-src";
import decor from "@/components/decor/decor.module.css";
import styles from "./LandingBedtimeLayer.module.css";

/**
 * 首頁睡前夜色疊層：依 `<html data-bedtime>` 顯示，不替換 hero 圖。
 * 月亮重用地圖黏土資產；純裝飾、不攔截點擊。
 */
export default function LandingBedtimeLayer() {
  return (
    <div className={styles.layer} aria-hidden>
      <div className={styles.veil} />
      <picture>
        <source srcSet={moonWebpPath()} type="image/webp" />
        <img
          className={`${styles.moon} ${decor.floatY}`}
          src={moonPath()}
          alt=""
          width={64}
          height={64}
          decoding="async"
          draggable={false}
        />
      </picture>
    </div>
  );
}
