import Link from "next/link";
import styles from "./PlayButton.module.css";

type PlayButtonProps = {
  href: string;
  color: string;
  children?: React.ReactNode;
  inline?: boolean;
  className?: string;
};

export default function PlayButton({
  href,
  color,
  children = "▶ 開始看故事",
  inline = false,
  className = "",
}: PlayButtonProps) {
  return (
    <Link
      href={href}
      className={`${styles.button} press-squash ${inline ? styles.inline : ""} ${className}`.trim()}
      style={{ backgroundColor: color }}
    >
      {children}
    </Link>
  );
}
