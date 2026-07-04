import type { FamilyActivity } from "@/data/family-activities";
import styles from "./FamilyActivityCard.module.css";

type Props = {
  slug: string;
  familyActivity: FamilyActivity;
  accent?: string;
};

/** 「聽完聊一聊」親子延伸卡片；無資料時由父層不渲染。 */
export default function FamilyActivityCard({ slug, familyActivity, accent }: Props) {
  const headingId = `family-activity-${slug}`;

  return (
    <section
      className={styles.wrap}
      style={accent ? { ["--accent" as string]: accent } : undefined}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className={styles.heading}>
        <span aria-hidden="true">🏡 </span>聽完聊一聊
      </h2>
      <p className={styles.question}>{familyActivity.question}</p>
      {familyActivity.activity ? (
        <p className={styles.activity}>
          <span className={styles.activityLabel}>延伸小活動：</span>
          {familyActivity.activity}
        </p>
      ) : null}
    </section>
  );
}
