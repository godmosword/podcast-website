import TapHand from "@/components/ui/TapHand";
import styles from "./orange-express.module.css";

/**
 * 「按這裡」的手指（PR-J1）：只畫在 nextAction 指的那一個控制上，用全站共用的 TapHand（STYLE-BIBLE §3）。
 * 指尖落在目標裡、手身不壓到別顆可點的東西，手指不接收點擊。
 * at：notch 在桿格左緣、手身伸到桿槽（同一根桿）；lever 在握把上，再加一個方向箭頭（點握把不會換檔，
 * 不會讓桿跳到中間那格）；button 在按鈕裡偏右，手身往右下、不碰旁邊的按鈕。
 */
export function OrangeExpressNextHand({
  at,
  dir = null,
}: {
  at: "notch" | "lever" | "button";
  dir?: "up" | "down" | null;
}) {
  return (
    <span
      className={styles.nextHand}
      data-at={at}
      data-dir={dir ?? undefined}
      data-testid="orange-express-next-hand"
      aria-hidden
    >
      {at === "lever" && dir ? (
        <svg className={styles.nextArrow} viewBox="0 0 24 24" focusable="false">
          <path
            d="M12 2.5l8.5 9.5H15v9.5H9V12H3.5z"
            fill="rgb(255, 216, 102)"
            stroke="rgb(58, 46, 40)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      <TapHand className={styles.nextHandSvg} />
    </span>
  );
}
