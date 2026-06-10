import Link from "next/link";
import { getStory } from "@/data/content";
import { STARTER_EPISODE_SLUGS } from "@/data/starter-episodes";
import { storyCoverPath } from "@/lib/story-utils";
import StoryImage from "./StoryImage";
import styles from "./StarterEpisodes.module.css";

export default function StarterEpisodes() {
  const stories = STARTER_EPISODE_SLUGS.map((slug) => getStory(slug)).filter(
    (s): s is NonNullable<typeof s> => s != null,
  );
  if (stories.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="starter-heading">
      <h2 id="starter-heading" className={styles.heading}>
        第一次來？從這三集開始
      </h2>
      <p className={styles.lead}>
        精選適合入門的車車故事，每集約 5–8 分鐘，聽完再訂閱也不遲
      </p>
      <ul className={styles.list}>
        {stories.map((story) => (
          <li key={story.slug}>
            <Link href={`/story/${story.slug}`} className={styles.card}>
              <div
                className={styles.coverWrap}
                style={{ borderColor: story.color }}
              >
                <StoryImage
                  src={storyCoverPath(story.slug)}
                  alt=""
                  fill
                  className={styles.cover}
                />
              </div>
              <div className={styles.meta}>
                <span className={styles.ep}>EP {story.ep}</span>
                <span className={styles.title}>{story.title}</span>
                {story.ageRange && (
                  <span className={styles.age}>{story.ageRange}</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
