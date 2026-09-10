import type { FeedbackPublicDto } from "@/lib/feedback-db";
import {
  feedbackAvatarColor,
  feedbackAvatarInitial,
  type FeedbackAvatarColor,
} from "@/lib/feedback-avatar";
import { FEEDBACK_WALL_COUNT, FEEDBACK_WALL_HEADING } from "@/lib/feedback-copy";
import { canShowPublicFeedbackList } from "@/lib/feedback-wall";
import styles from "./FeedbackWall.module.css";

export type FeedbackWallViewProps = {
  messages: readonly FeedbackPublicDto[];
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
}: Pick<FeedbackPublicDto, "nickname" | "message" | "createdAt">) {
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

export default function FeedbackWallView({ messages }: FeedbackWallViewProps) {
  const publicMessages = messages.map((item) => ({
    id: item.id,
    nickname: item.nickname,
    message: item.message,
    createdAt: item.createdAt,
  }));
  const showList = canShowPublicFeedbackList(publicMessages.length);

  return (
    <section className={styles.section} aria-labelledby="feedback-wall-heading">
      <div className={styles.headingRow}>
        <h2 id="feedback-wall-heading" className={styles.heading}>
          {FEEDBACK_WALL_HEADING}
        </h2>
        {showList ? (
          <p className={styles.count}>{FEEDBACK_WALL_COUNT(publicMessages.length)}</p>
        ) : null}
      </div>

      {showList ? (
        <ul className={styles.list} role="list">
          {publicMessages.map((item) => (
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
