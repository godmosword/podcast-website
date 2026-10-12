import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  OFFICIAL_MARKS,
  isOfficialMarkId,
  type OfficialMarkId,
} from "@/lib/official-marks";
import styles from "./OfficialMark.module.css";

type Props = {
  id: OfficialMarkId;
};

/** 官方標誌：原比例、原色，四周留白依品牌規範。連結文字已有名稱，這裡不重複讀出。 */
export function OfficialMark({ id }: Props) {
  const spec = OFFICIAL_MARKS[id];
  const slotStyle = {
    padding: spec.clearSpacePx,
    ["--mark-h" as string]: `${spec.heightPx}px`,
  } as CSSProperties;
  const imageStyle: CSSProperties = {
    height: spec.heightPx,
    width: "auto",
    maxWidth: "none",
  };

  return (
    <span className={styles.slot} style={slotStyle} aria-hidden>
      <Image
        src={spec.light.src}
        alt=""
        width={spec.light.width}
        height={spec.light.height}
        unoptimized
        className={spec.dark ? styles.day : styles.solo}
        style={imageStyle}
      />
      {spec.dark ? (
        <Image
          src={spec.dark.src}
          alt=""
          width={spec.dark.width}
          height={spec.dark.height}
          unoptimized
          className={styles.night}
          style={imageStyle}
        />
      ) : null}
    </span>
  );
}

type ConnectMarkProps = {
  icon: string;
  /** KKBOX、電子郵件等非官方檔才用。官方標誌不會套這個後備。 */
  fallback: ReactNode;
};

export function ConnectMark({ icon, fallback }: ConnectMarkProps) {
  if (isOfficialMarkId(icon)) return <OfficialMark id={icon} />;
  return fallback;
}
