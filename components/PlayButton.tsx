import Link from "next/link";
import styles from "./PlayButton.module.css";

type PlayButtonProps = {
  href: string;
  color: string;
  children?: React.ReactNode;
  inline?: boolean;
  className?: string;
  /** 螢幕閱讀器用的明確標籤（覆寫含 ▶ 符號的可見文字）。 */
  label?: string;
};

export default function PlayButton({
  href,
  color,
  children = "▶ 開始看故事",
  inline = false,
  className = "",
  label,
}: PlayButtonProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`${styles.button} press-squash ${inline ? styles.inline : ""} ${className}`.trim()}
      style={{ backgroundColor: color }}
    >
      {children}
    </Link>
  );
}
