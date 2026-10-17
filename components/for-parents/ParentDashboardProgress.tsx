"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import {
  formatActivityDate,
  type StoryProgressRow,
  type StoryProgressStatus,
} from "@/lib/for-parents/dashboard";
import styles from "./parent-dashboard.module.css";

/** 預設先列幾集聽過的，其餘按「看全部」展開。 */
const STORY_PROGRESS_PREVIEW = 8;

const GROUPS: { status: Exclude<StoryProgressStatus, "not-started">; title: string }[] = [
  { status: "in-progress", title: "聽到一半" },
  { status: "completed", title: "聽完了" },
];

function rowMeta(row: StoryProgressRow): string {
  return [
    row.plays > 0 ? `聽過 ${row.plays} 次` : null,
    row.lastDate ? formatActivityDate(row.lastDate) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** 故事進度：只列聽過的集數，分「聽到一半」「聽完了」，上方一條聽過／總集數。 */
export function ParentDashboardProgress({
  listened,
  total,
}: {
  listened: readonly StoryProgressRow[];
  total: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? listened : listened.slice(0, STORY_PROGRESS_PREVIEW);
  const unheard = Math.max(0, total - listened.length);
  const percent = total > 0 ? Math.round((listened.length / total) * 1000) / 10 : 0;

  return (
    <section className={styles.card} aria-labelledby="progress-heading">
      <div className={styles.cardHead}>
        <h2 id="progress-heading" className={styles.cardTitle}>
          故事進度
        </h2>
        <p className={styles.cardMeta}>
          {listened.length > 0 ? `聽過 ${listened.length} 集，共 ${total} 集` : `共 ${total} 集`}
        </p>
      </div>

      {listened.length === 0 ? (
        <>
          <p className={styles.note}>
            還沒有聽過的故事。聽過的集數會照「聽到一半」「聽完了」排在這裡。
          </p>
          <Link href="/stories" className={styles.quietLink}>
            去全部故事挑一集
          </Link>
        </>
      ) : (
        <>
          <div className={styles.meter} aria-hidden="true">
            <span className={styles.meterFill} style={{ width: `${percent}%` }} />
          </div>
          {GROUPS.map((group) => {
            const rows = visible.filter((row) => row.status === group.status);
            if (rows.length === 0) return null;
            const count = listened.filter((row) => row.status === group.status).length;
            const headingId = `progress-${group.status}`;
            return (
              <div key={group.status} role="group" aria-labelledby={headingId}>
                <h3 id={headingId} className={styles.groupTitle}>
                  {group.title} · {count}
                </h3>
                <ul className={styles.rows}>
                  {rows.map((row) => (
                    <li key={row.slug}>
                      <Link href={row.href} className={styles.row}>
                        <span className={styles.rowTitle}>{row.title}</span>
                        <span className={styles.rowMeta}>{rowMeta(row)}</span>
                        <span className={styles.rowEp}>EP {row.ep}</span>
                        <Icon name="chevron-right" size={16} className={styles.rowArrow} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {listened.length > STORY_PROGRESS_PREVIEW ? (
            <button
              type="button"
              className={styles.actionButton}
              aria-expanded={expanded}
              onClick={() => setExpanded((open) => !open)}
            >
              {expanded ? "收合" : "看全部"}
            </button>
          ) : null}
          {unheard > 0 ? (
            <Link href="/stories" className={styles.quietLink}>
              還有 {unheard} 集還沒聽，去全部故事
            </Link>
          ) : null}
        </>
      )}
    </section>
  );
}
