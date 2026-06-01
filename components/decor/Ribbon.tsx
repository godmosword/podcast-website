import type { CSSProperties, ReactNode } from "react";
import styles from "./decor.module.css";

type RibbonProps = {
  children: ReactNode;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

/** 彩帶標籤（如「最新一集」）。color 控制底色與尾端三角。 */
export default function Ribbon({ children, color, className, style }: RibbonProps) {
  return (
    <span
      className={`${styles.ribbon} ${className ?? ""}`}
      style={color ? { background: color, color, ...style } : style}
    >
      <span style={{ color: "#fff" }}>{children}</span>
    </span>
  );
}
