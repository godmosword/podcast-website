import Link from "next/link";
import type { Story } from "@/data/stories";
import { storyCoverPath } from "@/lib/story-utils";
import StoryImage from "./StoryImage";
import Ribbon from "./decor/Ribbon";
import Sparkle from "./decor/Sparkle";
import decor from "./decor/decor.module.css";
import styles from "./LatestHero.module.css";

type LatestHeroProps = {
  story: Story;
};

export default function LatestHero({ story }: LatestHeroProps) {
  return (
    <Link
      href={`/story/${story.slug}`}
      className={styles.hero}
      style={{
        borderColor: story.color,
        boxShadow: `var(--shadow-md), 0 6px 0 ${story.color}`,
      }}
    >
      <div className={styles.topRow}>
        <Ribbon color={story.color}>✨ 最新一集 EP {story.ep}</Ribbon>
      </div>

      <div className={styles.coverWrap}>
        <StoryImage
          src={storyCoverPath(story.slug)}
          alt={`${story.title} 封面`}
          fill
          className={styles.cover}
          priority
        />
        <span
          className={styles.emojiSticker}
          style={{ backgroundColor: story.color }}
          aria-hidden
        >
          {story.emoji}
        </span>
        <Sparkle
          className={`${styles.sparkle} ${decor.sparkleAnim}`}
          size={22}
        />
      </div>

      <span className={styles.title}>{story.title}</span>
      {story.summary && (
        <span className={styles.summary}>{story.summary}</span>
      )}
      <span className={styles.cta} style={{ color: story.color }}>
        立即看故事 →
      </span>
    </Link>
  );
}
