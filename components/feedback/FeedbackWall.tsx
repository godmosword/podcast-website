"use client";

import { useEffect, useState } from "react";
import {
  feedbackAvatarColor,
  feedbackAvatarInitial,
  type FeedbackAvatarColor,
} from "@/lib/feedback-avatar";
import {
  FEEDBACK_DEMO_MARKER,
  FEEDBACK_DEMO_MESSAGE,
  FEEDBACK_DEMO_NICKNAME,
  FEEDBACK_DEMO_NOTE,
  FEEDBACK_EMPTY_CTA,
  FEEDBACK_LOADING_LABEL,
  FEEDBACK_WALL_COUNT,
  FEEDBACK_WALL_HEADING,
} from "@/lib/feedback-copy";
import { FEEDBACK_MESSAGE_FIELD_ID } from "./FeedbackForm";
import styles from "./FeedbackWall.module.css";

export type FeedbackWallMessage = {
  id: number | string;
  nickname: string;
  message: string;
  createdAt: string;
};

type Props = {
  messageFieldId?: string;
};

const AVATAR_CLASS: Record<FeedbackAvatarColor, string> = {
  pink: styles.avatarPink,
  yellow: styles.avatarYellow,
  mint: styles.avatarMint,
  sky: styles.avatarSky,
  teal: styles.avatarTeal,
  lilac: styles.avatarLilac,
};

function formatZhTwDate(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-TW");
}

function MessageRow({
  nickname,
  message,
  createdAt,
}: Pick<FeedbackWallMessage, "nickname" | "message" | "createdAt">) {
  const color = feedbackAvatarColor(nickname);
  const initial = feedbackAvatarInitial(nickname);

  return (
    <>
      <div className={`${styles.avatar} ${AVATAR_CLASS[color]}`} aria-hidden>
        {initial}
      </div>
      <div className={styles.content}>
        <div className={styles.meta}>
          <p className={styles.nickname}>{nickname}</p>
          <time className={styles.date} dateTime={createdAt}>
            {formatZhTwDate(createdAt)}
          </time>
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </>
  );
}

export default function FeedbackWall({
  messageFieldId = FEEDBACK_MESSAGE_FIELD_ID,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [messages, setMessages] = useState<FeedbackWallMessage[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/feedback", { method: "GET" });
        if (!res.ok) throw new Error("load failed");
        const data = (await res.json()) as {
          available?: boolean;
          messages?: FeedbackWallMessage[];
        };
        if (!cancelled) {
          setAvailable(data.available === true);
          setMessages(Array.isArray(data.messages) ? data.messages : []);
        }
      } catch {
        if (!cancelled) {
          setAvailable(false);
          setMessages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function focusMessageField() {
    document.getElementById(messageFieldId)?.focus();
  }

  const count = messages.length;

  return (
    <section className={styles.section} aria-labelledby="feedback-wall-heading">
      <div className={styles.headingRow}>
        <h2 id="feedback-wall-heading" className={styles.heading}>
          {FEEDBACK_WALL_HEADING}
        </h2>
        {!loading ? (
          <p className={styles.count}>{FEEDBACK_WALL_COUNT(count)}</p>
        ) : null}
      </div>

      {loading ? (
        <p className={styles.loading} role="status">
          {FEEDBACK_LOADING_LABEL}
        </p>
      ) : null}

      <div className={styles.demo} aria-label="示範留言">
        <p className={styles.demoMarker}>{FEEDBACK_DEMO_MARKER}</p>
        <div className={styles.demoBody}>
          <MessageRow
            nickname={FEEDBACK_DEMO_NICKNAME}
            message={FEEDBACK_DEMO_MESSAGE}
            createdAt="2026-09-01T00:00:00.000Z"
          />
        </div>
        {count === 0 ? (
          <>
            <p className={styles.demoNote}>{FEEDBACK_DEMO_NOTE}</p>
            {available ? (
              <button
                type="button"
                className={styles.emptyCta}
                onClick={focusMessageField}
              >
                {FEEDBACK_EMPTY_CTA}
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      {!loading && count > 0 ? (
        <ul className={styles.list} role="list">
          {messages.map((item) => (
            <li key={item.id} className={styles.item}>
              <MessageRow
                nickname={item.nickname}
                message={item.message}
                createdAt={item.createdAt}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
