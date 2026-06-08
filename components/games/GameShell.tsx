import type { CSSProperties, ReactNode, RefObject } from "react";
import RoughFrame from "@/components/decor/RoughFrame";
import styles from "./GameShell.module.css";

type GameShellProps = {
  frameColor: string;
  frameAccent?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  hud?: ReactNode;
  children: ReactNode;
  className?: string;
  shellRef?: RefObject<HTMLDivElement | null>;
};

export default function GameShell({
  frameColor,
  frameAccent = "var(--c-yellow)",
  title,
  subtitle,
  hud,
  children,
  className,
  shellRef,
}: GameShellProps) {
  const shellStyle: CSSProperties = {
    boxShadow: `var(--shadow-md), 0 6px 0 ${frameAccent}`,
  };

  return (
    <div
      ref={shellRef}
      className={`${styles.shell}${className ? ` ${className}` : ""}`}
      style={shellStyle}
    >
      <RoughFrame color={frameColor} rough={1} width={3} />

      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {hud ? <div className={styles.hud}>{hud}</div> : null}
      </header>

      {children}
    </div>
  );
}

export { styles as gameShellStyles };
