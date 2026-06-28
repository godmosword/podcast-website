import type { ThemePreference } from "@/lib/theme";
import styles from "./SkyBodies.module.css";

const STARS = [
  { cx: 120, cy: 48, r: 1.8, delay: "0s" },
  { cx: 280, cy: 72, r: 1.4, delay: "0.8s" },
  { cx: 520, cy: 36, r: 2, delay: "1.2s" },
  { cx: 780, cy: 58, r: 1.6, delay: "0.4s" },
  { cx: 920, cy: 90, r: 1.3, delay: "1.6s" },
] as const;

type Props = {
  daylight: ThemePreference;
  reduced: boolean;
  paused: boolean;
};

export default function SkyBodies({ daylight, reduced, paused }: Props) {
  const isNight = daylight === "night";
  const rootClass = [styles.bodies, isNight ? styles.night : ""].filter(Boolean).join(" ");

  return (
    <div
      className={rootClass}
      data-paused={paused || undefined}
      aria-hidden="true"
    >
      <div className={styles.sun} />
      <div className={styles.moon} />
      <svg className={styles.stars} viewBox="0 0 1000 720" width="100%" height="100%">
        {STARS.map((s, i) => (
          <circle
            key={i}
            className={reduced ? styles.star : `${styles.star} ${styles.starTwinkle}`}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            style={reduced ? undefined : { animationDelay: s.delay }}
          />
        ))}
      </svg>
    </div>
  );
}
