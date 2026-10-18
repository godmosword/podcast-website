import Link from "next/link";
import { GamePlayIcon } from "@/components/games/GamePlayIcon";
import {
  formatDurationLabel,
  type ParentDashboardSnapshot,
} from "@/lib/for-parents/dashboard";
import styles from "./parent-dashboard.module.css";

type GameRow = ParentDashboardSnapshot["games"][number];

function playedThisWeek(game: GameRow): boolean {
  return game.weekSeconds > 0 || game.weekSessions > 0;
}

function gameDetail(game: GameRow): string {
  const record = game.played
    ? [
        game.medalStars > 0 ? `${game.medalStars} 顆關卡星` : null,
        game.bestScore != null ? `最佳 ${game.bestScore}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "已開始探索"
    : null;
  const week = playedThisWeek(game)
    ? `本週 ${formatDurationLabel(game.weekSeconds)} · ${game.weekSessions} 局`
    : null;
  return [record, week].filter(Boolean).join(" · ");
}

function totalsLine(snap: ParentDashboardSnapshot): string | null {
  const parts = [
    snap.gamesPlayedCount > 0 ? `玩過 ${snap.gamesPlayedCount} 款` : null,
    snap.totalMedalStars > 0 ? `關卡星星 ${snap.totalMedalStars} 顆` : null,
    snap.profileStars > 0 ? `累積星星 ${snap.profileStars} 顆` : null,
  ].filter(Boolean);
  return parts.length > 0 ? `${parts.join(" · ")}。用來看孩子探索了什麼，不比分數。` : null;
}

/** 小遊戲：只列玩過或本週有玩的遊戲；總數改成卡片底下一行小字。 */
export function ParentDashboardGames({ snap }: { snap: ParentDashboardSnapshot }) {
  const active = snap.games.filter((game) => game.played || playedThisWeek(game));
  const thisWeek = snap.games.filter(playedThisWeek);
  const weekSeconds = thisWeek.reduce((sum, game) => sum + game.weekSeconds, 0);
  const totals = totalsLine(snap);
  const meta =
    thisWeek.length > 0
      ? `這週玩了 ${thisWeek.length} 款，共 ${formatDurationLabel(weekSeconds)}`
      : active.length > 0
        ? "這週還沒玩"
        : null;

  return (
    <section className={styles.card} aria-labelledby="game-summary-heading">
      <div className={styles.cardHead}>
        <h2 id="game-summary-heading" className={styles.cardTitle}>
          小遊戲
        </h2>
        {meta ? <p className={styles.cardMeta}>{meta}</p> : null}
      </div>

      {active.length === 0 ? (
        <>
          <p className={styles.note}>
            還沒玩過小遊戲。玩過之後，這裡會列出每款玩了多久、拿到的星星和貼紙。
          </p>
          <Link href="/games" className={styles.quietLink}>
            去遊樂園
          </Link>
        </>
      ) : (
        <ul className={`${styles.rows} ${styles.gameList}`}>
          {active.map((game) => (
            <li key={game.gameId} className={styles.gameRow}>
              <span className={styles.gameIcon} aria-hidden="true">
                {game.gameType ? <GamePlayIcon gameType={game.gameType} size={28} /> : null}
              </span>
              <span className={styles.rowTitle}>{game.title}</span>
              <span className={styles.rowMeta}>{gameDetail(game)}</span>
            </li>
          ))}
        </ul>
      )}

      {totals ? <p className={styles.note}>{totals}</p> : null}

      {snap.stickerCount > 0 ? (
        <ul className={styles.stickerList} aria-label="獲得貼紙">
          {snap.stickerLabels.map((label) => (
            <li key={label} className={styles.sticker}>
              {label}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
