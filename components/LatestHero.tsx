import Link from "next/link";
import type { Story } from "@/data/stories";
import { storyCoverPath } from "@/lib/story-utils";
import StoryImage from "./StoryImage";
import styles from "./LatestHero.module.css";

type LatestHeroProps = {
  story: Story;
};

export default function LatestHero({ story }: LatestHeroProps) {
  return (
    <Link
      href={`/story/${story.slug}`}
      className={styles.hero}
      style={{ borderColor: story.color }}
    >
      <span className={styles.badge} style={{ color: story.color }}>
        ✨ 最新一集 EP {story.ep}
      </span>
      <div className={styles.coverWrap}>
        <StoryImage
          src={storyCoverPath(story.slug)}
          alt={`${story.title} 封面`}
          fill
          className={styles.cover}
          priority
        />
      </div>
      <span className={styles.title}>
        <span aria-hidden>{story.emoji}</span> {story.title}
      </span>
      {story.summary && (
        <span className={styles.summary}>{story.summary}</span>
      )}
      <span className={styles.cta} style={{ color: story.color }}>
        立即看故事 →
      </span>
    </Link>
  );
}
