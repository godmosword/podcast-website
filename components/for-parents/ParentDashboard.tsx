"use client";

import Link from "next/link";
import ParentTrustStrip from "@/components/ParentTrustStrip";
import { useParentDashboard } from "@/hooks/useParentDashboard";
import type { ParentStoryRow } from "@/lib/for-parents/dashboard";
import {
  saveGameKitSettingsToStore,
  setSfxEnabledInStore,
} from "@/lib/progress-store";
import styles from "./parent-dashboard.module.css";

const REASON_LABEL: Record<ParentStoryRow["reason"], string> = {
  continue: "繼續收聽中",
  favorite: "已收藏",
  completed: "聽完了",
  reflection: "聊過互動提問",
};

function GameProgressSummary() {
  const snap = useParentDashboard();

  return (
    <section className={styles.card} aria-labelledby="game-summary-heading">
      <h2 id="game-summary-heading" className={styles.cardTitle}>
        小遊戲探索摘要
      </h2>
      <p className={styles.cardHint}>
        用星星與貼紙呈現探索成果，不是成績單。資料只存在這台裝置。
      </p>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{snap.gamesPlayedCount}</span>
          <span className={styles.statLabel}>玩過的遊戲</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{snap.totalMedalStars}</span>
          <span className={styles.statLabel}>關卡星星</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{snap.profileStars}</span>
          <span className={styles.statLabel}>累積星星</span>
        </div>
      </div>
      <ul className={styles.gameList}>
        {snap.games.map((game) => (
          <li
            key={game.gameId}
            className={`${styles.gameRow}${game.played ? "" : ` ${styles.notPlayed}`}`}
          >
            <span className={styles.gameEmoji} aria-hidden>
              {game.emoji}
            </span>
            <span className={styles.gameMeta}>
              <span className={styles.gameTitle}>{game.title}</span>
              <span className={styles.gameDetail}>
                {game.played
                  ? [
                      game.medalStars > 0 ? `${game.medalStars} 顆關卡星` : null,
                      game.bestScore != null
                        ? `探索紀錄 ${game.bestScore}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "已開始探索"
                  : "還沒玩過"}
              </span>
            </span>
          </li>
        ))}
      </ul>
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

function RecentListeningCard() {
  const snap = useParentDashboard();

  return (
    <section className={styles.card} aria-labelledby="recent-heading">
      <h2 id="recent-heading" className={styles.cardTitle}>
        最近的故事
      </h2>
      {snap.recentStories.length === 0 ? (
        <p className={styles.empty}>還沒有收聽紀錄，可以先從一集車車故事開始。</p>
      ) : (
        <ul className={styles.storyList}>
          {snap.recentStories.map((row) => (
            <li key={`${row.slug}-${row.reason}`}>
              <Link href={row.href} className={styles.storyLink}>
                <span>
                  {row.title}
                  <span className={styles.reason}>{REASON_LABEL[row.reason]}</span>
                </span>
                <span className={styles.storyEp}>EP {row.ep}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecommendedStoriesCard() {
  const snap = useParentDashboard();

  return (
    <section className={styles.card} aria-labelledby="recommend-heading">
      <h2 id="recommend-heading" className={styles.cardTitle}>
        推薦共讀故事
      </h2>
      <p className={styles.cardHint}>
        依收藏與尚未聽完的集數挑選，方便下一場親子共聽。
      </p>
      {snap.recommendedStories.length === 0 ? (
        <p className={styles.empty}>太棒了，目前標記聽完的集數都已探索過！</p>
      ) : (
        <ul className={styles.storyList}>
          {snap.recommendedStories.map((story) => (
            <li key={story.slug}>
              <Link
                href={`/story/${story.slug}`}
                className={styles.storyLink}
              >
                <span>{story.title}</span>
                <span className={styles.storyEp}>EP {story.ep}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ParentQuickSettings() {
  const snap = useParentDashboard();

  return (
    <section className={styles.card} aria-labelledby="settings-heading">
      <h2 id="settings-heading" className={styles.cardTitle}>
        家長快速設定
      </h2>
      <div className={styles.settings}>
        <div className={styles.settingRow}>
          <div>
            <span className={styles.settingLabel}>兒童模式</span>
            <span className={styles.settingHint}>簡化遊戲介面，減少干擾選項</span>
          </div>
          <button
            type="button"
            className={`${styles.toggle}${snap.kidsMode ? ` ${styles.toggleOn}` : ""}`}
            role="switch"
            aria-checked={snap.kidsMode}
            aria-label="兒童模式"
            onClick={() =>
              saveGameKitSettingsToStore({ kidsMode: !snap.kidsMode })
            }
          >
            <span className={styles.toggleKnob} aria-hidden />
          </button>
        </div>
        <div className={styles.settingRow}>
          <div>
            <span className={styles.settingLabel}>遊戲音效</span>
            <span className={styles.settingHint}>關閉後故事與遊戲音效會靜音</span>
          </div>
          <button
            type="button"
            className={`${styles.toggle}${snap.sfxEnabled ? ` ${styles.toggleOn}` : ""}`}
            role="switch"
            aria-checked={snap.sfxEnabled}
            aria-label="遊戲音效"
            onClick={() => setSfxEnabledInStore(!snap.sfxEnabled)}
          >
            <span className={styles.toggleKnob} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}

/** STEM-P3 家長儀表板（讀 localStorage，無後端）。 */
export function ParentDashboard() {
  return (
    <div className={styles.parentDashboard}>
      <ParentTrustStrip variant="compact" />
      <div className={styles.grid}>
        <div className={styles.gridWide}>
          <GameProgressSummary />
        </div>
        <RecentListeningCard />
        <RecommendedStoriesCard />
        <div className={styles.gridWide}>
          <ParentQuickSettings />
        </div>
      </div>
    </div>
  );
}
