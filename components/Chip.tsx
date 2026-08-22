import styles from "./Chip.module.css";

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
        style={{
          backgroundColor: `${color}1f`,
          borderColor: color,
        }}
      >
        {children}
      </span>
    );
  }

  if (color) {
    return (
      <span
        className={styles.tag}
        style={{
          backgroundColor: `${color}1f`,
          borderColor: `${color}55`,
        }}
      >
        {children}
      </span>
    );
  }

  return <span className={styles.tag}>{children}</span>;
}
