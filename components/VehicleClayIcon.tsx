import { getVehicleCoverPath } from "@/data/content";
import styles from "./VehicleClayIcon.module.css";

type VehicleClayIconProps = {
  vehicle: string;
  size?: number;
  className?: string;
};

/** 選單圖示用角色定裝，不用該車種的故事封面。 */
const PORTRAIT_ICON: Record<string, string> = {
  遊園車: "/characters/噗噗豬.jpg",
};

/** 車種代表圖：指定車種用角色定裝，其餘取該車種第一則故事封面。 */
export default function VehicleClayIcon({
  vehicle,
  size = 22,
  className = "",
}: VehicleClayIconProps) {
  const src = PORTRAIT_ICON[vehicle] ?? getVehicleCoverPath(vehicle);
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
