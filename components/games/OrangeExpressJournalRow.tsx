"use client";

import type { CSSProperties } from "react";
import { EventGlyph } from "@/components/games/OrangeExpressEventGlyphs";
import { LandmarkGlyph } from "@/components/games/OrangeExpressGlyphs";
import { EVENT_NAME, JOURNAL_LABEL, LANDMARK_NAME } from "@/lib/games/orange-express/copy";
import type { JournalStamps } from "@/lib/games/orange-express/journal";
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
 * fresh：剛開完那一趟新拿到的章，回標題時蓋章似地彈一下（減少動態時只多一圈亮框）。
 */
export function OrangeExpressJournalRow({
  journal,
  fresh = null,
  reduced = false,
  onSpeak,
}: {
  journal: OrangeExpressJournal;
  fresh?: JournalStamps | null;
  reduced?: boolean;
  onSpeak: (text: string) => void;
}) {
  const got = journal.eventsDone.length + journal.landmarks.length;
  if (got === 0) return null;
  const label = journalSummary(journal);
  // 新章照排列順序一枚接一枚蓋：第幾枚新章決定延遲（CSS --fresh-i）。
  const freshOrder: string[] = [
    ...JOURNAL_EVENT_KINDS.filter((kind) => fresh?.events.includes(kind)),
    ...LANDMARKS.filter((id) => fresh?.landmarks.includes(id)),
  ];
  const freshProps = (key: string) => {
    const index = freshOrder.indexOf(key);
    if (index < 0) return {};
    return { "data-fresh": "true", style: { "--fresh-i": index } as CSSProperties };
  };
  return (
    <button
      type="button"
      className={styles.journal}
      aria-label={label}
      data-testid="orange-express-journal"
      data-reduced={reduced ? "true" : "false"}
      onClick={() => onSpeak(label)}
    >
      {JOURNAL_EVENT_KINDS.map((kind) => {
        const has = journal.eventsDone.includes(kind);
        return (
          <span
            key={kind}
            className={styles.journalStamp}
            data-got={has ? "true" : "false"}
            {...freshProps(kind)}
            aria-hidden
          >
            {has ? <EventGlyph kind={kind} scene={kind === "race" ? "city" : "field"} /> : null}
          </span>
        );
      })}
      <span className={styles.journalGap} aria-hidden />
      {LANDMARKS.map((id) => {
        const has = journal.landmarks.includes(id);
        return (
          <span
            key={id}
            className={styles.journalStamp}
            data-got={has ? "true" : "false"}
            {...freshProps(id)}
            aria-hidden
          >
            {has ? <LandmarkGlyph id={id} /> : null}
          </span>
        );
      })}
    </button>
  );
}
