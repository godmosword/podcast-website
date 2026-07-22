import Link from "next/link";
import type { Story } from "@/data/content";
import FamilyActivityCard from "@/components/story/FamilyActivityCard";
import ShowNotes from "@/components/story/ShowNotes";
import styles from "./ParentCoListenSection.module.css";

type Props = {
  stories: Story[];
};

/** 家長指南：每集共讀／親子活動／反思（從單集頁遷出，預設收合）。 */
export default function ParentCoListenSection({ stories }: Props) {
  if (stories.length === 0) return null;

  return (
    <section
      id="co-listen"
      className={styles.section}
      aria-labelledby="co-listen-heading"
    >
      <h2 id="co-listen-heading">每集共讀與延伸</h2>
      <p className={styles.lede}>
        聽完故事後，可依集數展開共讀提問、親子小活動與家長指引。單集頁保留播放與分享；深度內容集中在這裡。
      </p>
      <ul className={styles.list}>
        {stories.map((story) => (
          <li key={story.slug} className={styles.item}>
            <details className={styles.details}>
              <summary className={styles.summary}>
                EP {story.ep}　{story.title}
              </summary>
              <div className={styles.body}>
                {story.familyActivity ? (
                  <FamilyActivityCard
                    slug={story.slug}
                    familyActivity={story.familyActivity}
                    accent={story.color}
                  />
                ) : null}
                {story.parentGuide ? (
                  <ShowNotes slug={story.slug} parentGuide={story.parentGuide} />
                ) : null}
                {story.reflectionPrompt ? (
                  <div className={styles.reflection}>
                    <p className={styles.reflectionChild}>
                      {story.reflectionPrompt.child}
                    </p>
                    <p className={styles.reflectionParent}>
                      給家長：{story.reflectionPrompt.parentFollowUp}
                    </p>
                  </div>
                ) : null}
                <Link href={`/story/${story.slug}`} className={styles.storyLink}>
                  打開這一集 →
                </Link>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
