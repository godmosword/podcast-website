"use client";

import { useState } from "react";
import Link from "next/link";
import { GamePlayIcon } from "@/components/games/GamePlayIcon";
import ParentTrustStrip from "@/components/ParentTrustStrip";
import { useParentDashboard } from "@/hooks/useParentDashboard";
import { clearActivityLog } from "@/lib/activity-log";
import {
  formatActivityDate,
  formatDurationLabel,
  formatWeeklySummaryLine,
  type ParentStoryRow,
  type StoryProgressStatus,
} from "@/lib/for-parents/dashboard";
import {
  saveGameKitSettingsToStore,
  setSfxEnabledInStore,
} from "@/lib/progress-store";
import { storyDisplayTitle } from "@/lib/story-title";
import styles from "./parent-dashboard.module.css";

const STORY_PROGRESS_PREVIEW = 8;

const PROGRESS_LABEL: Record<StoryProgressStatus, string> = {
  completed: "聽完了",
  "in-progress": "聽到一半",
  "not-started": "還沒聽",
};

const REASON_LABEL: Record<ParentStoryRow["reason"], string> = {
  continue: "繼續收聽中",
  favorite: "已收藏",
  completed: "聽完了",
  reflection: "聊過互動提問",
};

function barHeight(seconds: number, maxSeconds: number): string {
  if (seconds <= 0 || maxSeconds <= 0) return "2px";
  const ratio = Math.max(0.08, seconds / maxSeconds);
  return `${Math.round(ratio * 100)}%`;
}

function WeeklySummaryCard() {
  const snap = useParentDashboard();
  const maxSeconds = Math.max(
    1,
    ...snap.weekly.days.map((day) => Math.max(day.storySeconds, day.gameSeconds)),
  );

  return (
    <section className={styles.card} aria-labelledby="weekly-heading">
      <h2 id="weekly-heading" className={styles.cardTitle}>
        本週摘要
      </h2>
      <p className={styles.cardHint}>
        依這台裝置的收聽與遊戲時間整理，不是成績單。
      </p>
      <p className={styles.summaryLine}>{formatWeeklySummaryLine(snap.weekly)}</p>
      <ul className={styles.weekChart}>
        {snap.weekly.days.map((day) => (
          <li
            key={day.date}
            className={styles.weekCol}
            aria-label={`${day.label}，收聽 ${formatDurationLabel(day.storySeconds)}，遊戲 ${formatDurationLabel(day.gameSeconds)}`}
          >
            <div className={styles.weekBars} aria-hidden="true">
              <span
                className={`${styles.weekBar} ${styles.weekBarStory}`}
                style={{ height: barHeight(day.storySeconds, maxSeconds) }}
              />
              <span
                className={`${styles.weekBar} ${styles.weekBarGame}`}
                style={{ height: barHeight(day.gameSeconds, maxSeconds) }}
              />
            </div>
            <span className={styles.weekLabel} aria-hidden="true">
              {day.weekday}
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchStory}`} aria-hidden="true" />
          收聽
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchGame}`} aria-hidden="true" />
          遊戲
        </span>
      </p>
    </section>
  );
}

function StoryProgressCard() {
  const snap = useParentDashboard();
  const [expanded, setExpanded] = useState(false);
  const rows = expanded
    ? snap.storyProgress
    : snap.storyProgress.slice(0, STORY_PROGRESS_PREVIEW);
  const canToggle = snap.storyProgress.length > STORY_PROGRESS_PREVIEW;

  return (
    <section className={styles.card} aria-labelledby="progress-heading">
      <h2 id="progress-heading" className={styles.cardTitle}>
        故事進度
      </h2>
      <p className={styles.cardHint}>
        看哪些集聽完、哪些聽到一半。次數只算這台裝置最近 90 天。
      </p>
      {rows.length === 0 ? (
        <p className={styles.empty}>目前沒有故事可以顯示。</p>
      ) : (
        <ul className={styles.storyList}>
          {rows.map((row) => (
            <li key={row.slug}>
              <Link href={row.href} className={styles.storyLink}>
                <span>
                  {row.title}
                  <span className={styles.reason}>
                    {PROGRESS_LABEL[row.status]}
                    {row.plays > 0 ? ` · 聽過 ${row.plays} 次` : ""}
                    {row.lastDate ? ` · ${formatActivityDate(row.lastDate)}` : ""}
                  </span>
                </span>
                <span className={styles.storyEp}>EP {row.ep}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {canToggle ? (
        <button
          type="button"
          className={styles.actionButton}
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? "收合" : "看全部"}
        </button>
      ) : null}
    </section>
  );
}

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
            <span className={styles.gameIcon} aria-hidden>
              {game.gameType ? <GamePlayIcon gameType={game.gameType} size={28} /> : null}
            </span>
            <span className={styles.gameMeta}>
              <span className={styles.gameTitle}>{game.title}</span>
              <span className={styles.gameDetail}>
                {[
                  game.played
                    ? [
                        game.medalStars > 0 ? `${game.medalStars} 顆關卡星` : null,
                        game.bestScore != null ? `最佳 ${game.bestScore}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "已開始探索"
                    : game.weekSeconds > 0 || game.weekSessions > 0
                      ? null
                      : "還沒玩過",
                  game.weekSeconds > 0 || game.weekSessions > 0
                    ? `本週 ${formatDurationLabel(game.weekSeconds)} · ${game.weekSessions} 局`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
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
                <span>{storyDisplayTitle(story)}</span>
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
        <ClearActivityControl />
      </div>
    </section>
  );
}

function ClearActivityControl() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div className={`${styles.settingRow} ${styles.clearRow}`}>
        <div>
          <span className={styles.settingLabel}>活動紀錄</span>
          <span className={styles.settingHint}>
            只清除這台裝置上的收聽與遊戲時間
          </span>
        </div>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => setConfirming(true)}
        >
          清除活動紀錄
        </button>
      </div>
    );
  }

  return (
    <div className={styles.confirmBlock}>
      <p className={styles.settingHint}>
        會清掉這台裝置上的收聽與遊戲時間。收藏、星星和聽完紀錄會保留。
      </p>
      <div className={styles.confirmActions}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => setConfirming(false)}
        >
          取消
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.actionButtonStrong}`}
          onClick={() => {
            clearActivityLog();
            setConfirming(false);
          }}
        >
          確定清除
        </button>
      </div>
    </div>
  );
}

/** STEM-P3 家長儀表板（讀 localStorage，無後端）。 */
export function ParentDashboard() {
  return (
    <div className={styles.parentDashboard}>
      <ParentTrustStrip variant="compact" />
      <div className={styles.grid}>
        <div className={styles.gridWide}>
          <WeeklySummaryCard />
        </div>
        <div className={styles.gridWide}>
          <StoryProgressCard />
        </div>
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
