import styles from "./BlockDropReadyDemo.module.css";

const COLS = 6;
const ROWS = 4;
/** 底列的缺口在第 4 格（index 3），落下的方塊要填的位置 */
const GAP_COL = 3;
const ROW_COLORS = ["#ffb4cf", "#ffd34d", "#b9f3db", "#8ddff0", "#c9b4ff"] as const;

/**
 * 方塊 ready 面的無字玩法示範（兒童減法審）：
 * 一顆方塊掉進底列缺口 → 整列亮一下 → 消掉 → 重來。純 CSS 迴圈，reduced-motion 時停在「排滿」那一格。
 */
export function BlockDropReadyDemo() {
  return (
    <div className={styles.well} role="img" aria-label="方塊掉下來，排滿一行就消掉">
      {Array.from({ length: ROWS * COLS }).map((_, i) => (
        <span key={i} className={styles.cell} />
      ))}
      {Array.from({ length: COLS }).map((_, c) =>
        c === GAP_COL ? null : (
          <span
            key={`b${c}`}
            className={styles.bottom}
            style={{
              gridColumn: c + 1,
              gridRow: ROWS,
              background: ROW_COLORS[c % ROW_COLORS.length],
            }}
          />
        ),
      )}
      <span className={styles.faller} style={{ gridColumn: GAP_COL + 1, gridRow: 1 }} />
    </div>
  );
}
