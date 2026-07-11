import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { IconName } from "@/data/icons";
import Icon from "./Icon";
import styles from "./IconButton.module.css";

export type IconButtonProps = {
  /** 圖示名稱；與 children 二擇一（children 優先）。 */
  icon?: IconName;
  iconSize?: number;
  /** soft：淺底（關閉鈕等）；預設透明。 */
  variant?: "ghost" | "soft";
  /** compact：36px（僅內嵌於已 ≥44px 父容器時使用）。 */
  size?: "md" | "compact";
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/** 圖示操作鈕：≥44px 觸控、hover／active／focus-visible 三態。 */
export default function IconButton({
  icon,
  iconSize = 20,
  variant = "ghost",
  size = "md",
  className = "",
  children,
  type = "button",
  ...rest
}: IconButtonProps) {
  const classes = [
    styles.root,
    variant === "soft" ? styles.soft : "",
    size === "compact" ? styles.compact : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {children ?? (icon ? <Icon name={icon} size={iconSize} /> : null)}
    </button>
  );
}
