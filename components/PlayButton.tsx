import Link from "next/link";
import styles from "./PlayButton.module.css";

type PlayButtonProps = {
  href: string;
  color: string;
  children?: React.ReactNode;
  inline?: boolean;
};

export default function PlayButton({
  href,
  color,
  children = "▶ 開始看故事",
  inline = false,
}: PlayButtonProps) {
  return (
    <Link
      href={href}
      className={`${styles.button} ${inline ? styles.inline : ""}`}
      style={{ backgroundColor: color }}
    >
      {children}
    </Link>
  );
}
