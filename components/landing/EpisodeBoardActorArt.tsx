import type { BoardActionId, BoardCharacterId } from "@/lib/episode-board-types";
import styles from "./EpisodeBoard.module.css";

const ROAMER_SRC: Partial<Record<BoardCharacterId, string>> = {
  "xiao-hong": "/adventures/roamers/xiao-hong.webp",
  "monster-truck": "/adventures/roamers/monster-truck.webp",
  "a-ku": "/adventures/roamers/a-ku.webp",
};

type Props = {
  character: BoardCharacterId;
  action: BoardActionId;
};

/** 有宇宙地圖漫遊圖的角色直接用那張黏土車；其餘依角色設定畫圓角車身。 */
export default function EpisodeBoardActorArt({ character, action }: Props) {
  const src = ROAMER_SRC[character];
  return (
    <span className={styles.figure} data-character={character} data-action={action} aria-hidden="true">
      <span className={styles.figureShadow} />
      {src ? (
        // 宇宙地圖既有的漫遊車黏土圖，不是這頁的 LCP。
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.figureImg} src={src} alt="" draggable={false} decoding="async" />
      ) : (
        <ClayBody character={character} action={action} />
      )}
    </span>
  );
}

function ClayBody({ character, action }: Props) {
  return (
    <svg className={styles.figureSvg} viewBox="0 0 48 48">
      <ellipse cx="24" cy="34" rx="14" ry="7" className={styles.body} />
      <circle cx="14" cy="36" r="4" className={styles.wheel} />
      <circle cx="34" cy="36" r="4" className={styles.wheel} />
      <circle cx="14" cy="36" r="1.6" className={styles.hub} />
      <circle cx="34" cy="36" r="1.6" className={styles.hub} />
      {character === "duo-duo" ? (
        <>
          <circle cx="16" cy="18" r="2.2" className={styles.spike} />
          <circle cx="22" cy="15" r="2.2" className={styles.spike} />
          <circle cx="28" cy="16" r="2.2" className={styles.spike} />
        </>
      ) : null}
      {character === "an-an" ? <circle cx="24" cy="30" r="3.2" className={styles.cross} /> : null}
      {character === "xiang-xiang" ? (
        <path d="M10 22 H38 Q34 16 24 16 Q14 16 10 22" className={styles.awning} />
      ) : null}
      {character === "lan-ba-shi" ? <rect x="16" y="20" width="16" height="6" rx="2" className={styles.window} /> : null}
      {character === "diao-che" ? (
        <path d="M30 28 Q40 16 36 10" className={`${styles.boom} ${styles.swing}`} />
      ) : null}
      {character === "dong-dong" ? (
        <path d="M32 28 Q42 18 40 12" className={`${styles.boom} ${styles.swing}`} />
      ) : null}
      {character === "ling-ling" || action === "sweep" ? (
        <>
          <circle cx="10" cy="38" r="3" className={`${styles.brush} ${styles.spin}`} />
          <circle cx="18" cy="40" r="2.4" className={`${styles.brush} ${styles.spin}`} />
        </>
      ) : null}
      {character === "watt" ? (
        <>
          <circle cx="24" cy="16" r="6" className={styles.body} />
          <circle cx="24" cy="8" r="1.6" className={styles.spike} />
        </>
      ) : null}
      {character === "xiao-hong" ? (
        <>
          <circle cx="18" cy="30" r="4" className={styles.badge} />
          <text x="18" y="32" textAnchor="middle" className={styles.badgeText}>
            2
          </text>
        </>
      ) : null}
      <ellipse cx="26" cy="24" rx="8" ry="5" className={styles.window} />
      <circle cx="23" cy="24" r="1.3" className={styles.eye} />
      <circle cx="29" cy="24" r="1.3" className={styles.eye} />
      {action === "brush-teeth" ? (
        <g className={styles.swing}>
          <path d="M30 20 L40 12" className={styles.brushStick} />
          <rect x="38" y="8" width="6" height="5" rx="2" className={styles.brush} />
        </g>
      ) : null}
    </svg>
  );
}
