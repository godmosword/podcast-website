import type { ParentGuide } from "@/lib/geo-content-contract";
import styles from "./ShowNotes.module.css";

type Props = {
  slug: string;
  parentGuide: ParentGuide;
};

/** 家長共讀指引（較完整）；預設收合，不與 FamilyActivityCard 重複維護。 */
export default function ShowNotes({ slug, parentGuide }: Props) {
  const summaryId = `parent-guide-summary-${slug}`;
  const promptsId = `parent-guide-prompts-${slug}`;

  return (
    <details className={styles.wrap}>
      <summary className={styles.summary}>這集可以聊什麼（家長共讀指引）</summary>
      <div className={styles.body}>
        <p id={summaryId} className={styles.lede}>
          {parentGuide.summary}
        </p>
        <h3 className={styles.heading}>延伸提問與小活動</h3>
        <ul id={promptsId} className={styles.promptList}>
          {parentGuide.prompts.map((prompt, index) => (
            <li key={`${slug}-parent-guide-${index}`}>{prompt}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}
