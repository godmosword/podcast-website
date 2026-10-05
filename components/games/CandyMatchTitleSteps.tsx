import { IconSparkle, IconStar } from "@/components/games/ClayIcons";
import { PieceArt } from "@/components/games/CandyMatchPieceArt";
import styles from "./CandyMatchTitleSteps.module.css";

/** 換位置的雙向箭頭；比 IconSwap 少了自帶的方塊，夾在兩個角色圖案中間才不重複 */
function SwapArrows() {
  return (
    <svg viewBox="0 0 24 24" className={styles.swap} aria-hidden focusable="false">
      <path
        d="M5 9h13l-3.5-3.5M19 15H6l3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 標題頁三步驟圖解：3–7 歲多半還不識字，用圖示範「換位置 → 排成三個 → 消掉拿星星」。
 * 圖全部 aria-hidden，讀屏只唸每步的短動詞。
 */
export function CandyMatchTitleSteps() {
  return (
    <ol className={styles.steps} aria-label="玩法三步驟">
      <li className={styles.step}>
        <span className={styles.art} aria-hidden>
          <span className={styles.piece}>
            <PieceArt piece={1} size="100%" />
          </span>
          <SwapArrows />
          <span className={styles.piece}>
            <PieceArt piece={0} size="100%" />
          </span>
        </span>
        <span className={styles.label}>找一找</span>
      </li>
      <li className={styles.step}>
        <span className={`${styles.art} ${styles.row}`} aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className={styles.piece}>
              <PieceArt piece={0} size="100%" />
            </span>
          ))}
        </span>
        <span className={styles.label}>排一排</span>
      </li>
      <li className={styles.step}>
        <span className={styles.art} aria-hidden>
          <span className={styles.sparkle}>
            <IconSparkle size={24} />
          </span>
          <span className={styles.star}>
            <IconStar size={24} />
          </span>
          <span className={styles.sparkle}>
            <IconSparkle size={24} />
          </span>
        </span>
        <span className={styles.label}>消一消</span>
      </li>
    </ol>
  );
}
