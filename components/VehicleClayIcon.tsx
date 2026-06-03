import { getVehicleCoverPath } from "@/data/stories";
import styles from "./VehicleClayIcon.module.css";

type VehicleClayIconProps = {
  vehicle: string;
  size?: number;
  className?: string;
};

/** 車種代表圖：取該車種第一則故事的黏土風封面縮圖。 */
export default function VehicleClayIcon({
  vehicle,
  size = 22,
  className = "",
}: VehicleClayIconProps) {
  const src = getVehicleCoverPath(vehicle);
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`${styles.icon} ${className}`.trim()}
      aria-hidden
    />
  );
}
