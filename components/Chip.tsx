import styles from "./Chip.module.css";

type ChipButtonProps = {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  buttonRef?: React.Ref<HTMLButtonElement>;
};

export function ChipButton({
  active = false,
  onClick,
  children,
  className = "",
  buttonRef,
}: ChipButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={`${styles.chip} press-squash ${active ? `${styles.active} ${styles.chipPop}` : ""} ${className}`.trim()}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

type TagChipProps = {
  children: React.ReactNode;
  color?: string;
  variant?: "tag" | "vehicle";
};

export function TagChip({ children, color, variant = "tag" }: TagChipProps) {
  if (variant === "vehicle" && color) {
    return (
      <span
        className={styles.vehicle}
        style={{ color, backgroundColor: `${color}1f` }}
      >
        {children}
      </span>
    );
  }

  if (color) {
    return (
      <span
        className={styles.tag}
        style={{ color, backgroundColor: `${color}1f` }}
      >
        {children}
      </span>
    );
  }

  return <span className={styles.tag}>{children}</span>;
}
