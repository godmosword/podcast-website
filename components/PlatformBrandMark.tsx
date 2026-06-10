import Image from "next/image";
import type { PlatformIcon } from "@/lib/platforms";
import { getPlatformMark } from "@/lib/brand-assets";
import styles from "./PlatformBrandMark.module.css";

type Props = {
  icon: PlatformIcon;
  label: string;
  className?: string;
};

/**
 * 收聽平台官方品牌資產。禁止改為手繪 SVG — 見 lib/BRAND-ASSETS-HARD-RULES.md。
 */
export default function PlatformBrandMark({ icon, label, className }: Props) {
  const mark = getPlatformMark(icon);
  const wrapClass = [
    styles.wrap,
    mark.background === "white" ? styles.wrapWhite : styles.wrapTransparent,
    mark.wide ? styles.wrapWide : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={wrapClass}>
      <Image
        src={mark.src}
        alt=""
        width={mark.width}
        height={mark.height}
        className={styles.image}
        style={{ height: mark.displayHeight, width: "auto" }}
        aria-hidden
      />
    </span>
  );
}
