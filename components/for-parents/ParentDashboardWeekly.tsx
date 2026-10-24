import {
  formatDurationLabel,
  minutesFromSeconds,
  type WeeklySummary,
} from "@/lib/for-parents/dashboard";
import styles from "./parent-dashboard.module.css";

function barHeight(seconds: number, maxSeconds: number): string {
  const ratio = Math.max(0.08, seconds / Math.max(1, maxSeconds));
  return `${Math.round(ratio * 100)}%`;
}

function dayLabel(day: WeeklySummary["days"][number]): string {
  const prefix = day.isToday ? "今天，" : "";
  return `${prefix}${day.label}，收聽 ${formatDurationLabel(day.storySeconds)}，遊戲 ${formatDurationLabel(day.gameSeconds)}`;
}

/** 本週摘要：兩個總數＋7 天長條（標分鐘、標今天）；沒紀錄時只留一句說明與空白軸。 */
export function ParentDashboardWeekly({ weekly }: { weekly: WeeklySummary }) {
  const hasActivity = weekly.storySeconds > 0 || weekly.gameSeconds > 0;
  const maxSeconds = Math.max(
    1,
    ...weekly.days.map((day) => Math.max(day.storySeconds, day.gameSeconds)),
  );
  const first = weekly.days[0];
  const last = weekly.days[weekly.days.length - 1];

  return (
    <section className={styles.card} aria-labelledby="weekly-heading">
      <div className={styles.cardHead}>
        <h2 id="weekly-heading" className={styles.cardTitle}>
          本週摘要
        </h2>
        {first?.label && last?.label ? (
          <p className={styles.cardMeta}>
            {first.label} – {last.label}
          </p>
        ) : null}
      </div>

      {hasActivity ? (
        <p className={styles.figures}>
          <span className={styles.figure}>
            <span className={`${styles.swatch} ${styles.swatchStory}`} aria-hidden="true" />
            收聽
            <b className={styles.figureValue}>{minutesFromSeconds(weekly.storySeconds)}</b>
            {`分鐘 · ${weekly.storiesTouched} 集`}
          </span>
          <span className={styles.figure}>
            <span className={`${styles.swatch} ${styles.swatchGame}`} aria-hidden="true" />
            遊戲
            <b className={styles.figureValue}>{minutesFromSeconds(weekly.gameSeconds)}</b>
            分鐘
          </span>
        </p>
      ) : (
        <p className={styles.note}>
          這週還沒有紀錄。聽完一集故事或玩一場小遊戲，這裡就會畫出每天的時間。
        </p>
      )}

      <ol
        className={`${styles.weekChart}${hasActivity ? "" : ` ${styles.weekChartEmpty}`}`}
        aria-label={hasActivity ? "這 7 天每天的收聽與遊戲時間" : undefined}
        aria-hidden={hasActivity ? undefined : true}
      >
        {weekly.days.map((day) => {
          const total = minutesFromSeconds(day.storySeconds + day.gameSeconds);
          return (
            <li
              key={day.date}
              className={`${styles.weekCol}${day.isToday ? ` ${styles.weekToday}` : ""}`}
              aria-label={dayLabel(day)}
            >
              <span className={styles.weekTotal} aria-hidden="true">
                {total > 0 ? total : ""}
              </span>
              <span className={styles.weekBars} aria-hidden="true">
                {day.storySeconds > 0 ? (
                  <span
                    className={`${styles.weekBar} ${styles.weekBarStory}`}
                    style={{ height: barHeight(day.storySeconds, maxSeconds) }}
                  />
                ) : null}
                {day.gameSeconds > 0 ? (
                  <span
                    className={`${styles.weekBar} ${styles.weekBarGame}`}
                    style={{ height: barHeight(day.gameSeconds, maxSeconds) }}
                  />
                ) : null}
              </span>
              <span className={styles.weekLabel} aria-hidden="true">
                {/* 掛載前的空軸沒有星期，留一格空白撐住列高，補上星期時長條不跳。 */}
                {day.isToday ? "今天" : day.weekday || " "}
              </span>
            </li>
          );
        })}
      </ol>

      {hasActivity ? (
        <p className={styles.note}>
          長條上的數字是那天的總分鐘。依這台裝置的紀錄整理，不是成績單。
        </p>
      ) : null}
    </section>
  );
}
