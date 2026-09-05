import { FEEDBACK_LOADING_LABEL, FEEDBACK_WALL_HEADING } from "@/lib/feedback-copy";
import styles from "./FeedbackWall.module.css";

export default function FeedbackWallSkeleton() {
  return (
    <section className={styles.section} aria-labelledby="feedback-wall-heading">
      <div className={styles.headingRow}>
        <h2 id="feedback-wall-heading" className={styles.heading}>
          {FEEDBACK_WALL_HEADING}
        </h2>
      </div>
      <p className={styles.loading} role="status">
        {FEEDBACK_LOADING_LABEL}
      </p>
      <div className={styles.skeleton} aria-hidden />
    </section>
  );
}
