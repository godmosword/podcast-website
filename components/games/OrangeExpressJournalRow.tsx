"use client";

import { EventGlyph } from "@/components/games/OrangeExpressEventGlyphs";
import { LandmarkGlyph } from "@/components/games/OrangeExpressGlyphs";
import { EVENT_NAME, JOURNAL_LABEL, LANDMARK_NAME } from "@/lib/games/orange-express/copy";
import { JOURNAL_EVENT_KINDS, type OrangeExpressJournal } from "@/lib/games/orange-express/journal-record";
import type { LandmarkId } from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";

const LANDMARKS: readonly LandmarkId[] = ["ferris", "orange-tree", "house"];

/** 讀屏與點了朗讀的那一句：「沿途見聞：找到 N 個，共 7 個（…）」。 */
export function journalSummary(journal: OrangeExpressJournal): string {
  const got = journal.eventsDone.length + journal.landmarks.length;
  const names = [
    ...JOURNAL_EVENT_KINDS.filter((kind) => journal.eventsDone.includes(kind)).map((kind) => EVENT_NAME[kind]),
    ...LANDMARKS.filter((id) => journal.landmarks.includes(id)).map((id) => LANDMARK_NAME[id]),
  ];
  const total = JOURNAL_EVENT_KINDS.length + LANDMARKS.length;
  return `${JOURNAL_LABEL}：找到 ${got} 個，共 ${total} 個（${names.join("、")}）`;
}

/**
 * 標題的沿途見聞（PR-I3）：四種沿途事件做到過的、三站地標打過招呼的，各一枚小章，排在路線名旁邊（不多一列）。
 * 還沒拿到的是虛線空圈（不畫灰章：留一點「還有什麼」的好奇）。一枚都還沒有就不出。
 * 整排是一顆按鈕：不識字的孩子點了聽得到這排是什麼（設計審）。
 */
export function OrangeExpressJournalRow({
  journal,
  onSpeak,
}: {
  journal: OrangeExpressJournal;
  onSpeak: (text: string) => void;
}) {
  const got = journal.eventsDone.length + journal.landmarks.length;
  if (got === 0) return null;
  const label = journalSummary(journal);
  return (
    <button
      type="button"
      className={styles.journal}
      aria-label={label}
      data-testid="orange-express-journal"
      onClick={() => onSpeak(label)}
    >
      {JOURNAL_EVENT_KINDS.map((kind) => {
        const has = journal.eventsDone.includes(kind);
        return (
          <span key={kind} className={styles.journalStamp} data-got={has ? "true" : "false"} aria-hidden>
            {has ? <EventGlyph kind={kind} scene={kind === "race" ? "city" : "field"} /> : null}
          </span>
        );
      })}
      <span className={styles.journalGap} aria-hidden />
      {LANDMARKS.map((id) => {
        const has = journal.landmarks.includes(id);
        return (
          <span key={id} className={styles.journalStamp} data-got={has ? "true" : "false"} aria-hidden>
            {has ? <LandmarkGlyph id={id} /> : null}
          </span>
        );
      })}
    </button>
  );
}
