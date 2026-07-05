import styles from "./ParentTrustStrip.module.css";

type ParentTrustStripProps = {
  variant?: "default" | "compact" | "dark";
  className?: string;
};

const TRUST_TEXT = "無廣告 · 不收孩子帳號 · 進度留在這台裝置 · 外連會清楚標示";

export default function ParentTrustStrip({
  variant = "default",
  className,
}: ParentTrustStripProps) {
  const classes = [styles.strip, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={classes} aria-label="家長安心資訊">
      <span>{TRUST_TEXT}</span>
      <a href="/legal#privacy">隱私說明</a>
    </aside>
  );
}
