import Link from "next/link";
import { ZONES, type ZoneId } from "@/data/universe-zones";
import styles from "./ZoneBadge.module.css";

type Props = {
  zoneId: ZoneId;
};

/** 單集頁：連到樂園地圖對應島嶼的深連結。 */
export default function ZoneBadge({ zoneId }: Props) {
  const zone = ZONES.find((z) => z.id === zoneId);
  if (!zone) return null;

  return (
    <Link
      href={`/adventures?zone=${zoneId}`}
      className={styles.badge}
      aria-label={`這個故事發生在${zone.name}，在樂園地圖上查看`}
    >
      <span aria-hidden="true">📍 </span>
      這個故事發生在 {zone.name}
    </Link>
  );
}
