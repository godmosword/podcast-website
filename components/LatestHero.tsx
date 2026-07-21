import Link from "next/link";
import type { Story } from "@/data/content";
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
        borderColor: `${story.color}33`,
        // 色環走 CSS 變數，讓 elev 階梯回到 stylesheet（見 .hero / .hero:hover）。
        ["--hero-ring" as string]: `${story.color}14`,
      }}
    >
      <div className={styles.topRow}>
        <Ribbon color={story.color}>NEW · EP {story.ep}</Ribbon>
      </div>

      <div className={styles.coverWrap}>
        <StoryImage
          src={storyCoverPath(story.slug)}
          alt={`${story.title} 封面`}
          fill
          className={styles.cover}
          priority
        />
        <Sparkle
          className={`${styles.sparkle} ${decor.sparkleAnim}`}
          size={22}
        />
      </div>

      <span className={styles.title}>{story.title}</span>
      {story.summary && (
        <span className={styles.summary}>{story.summary}</span>
      )}
      {/* 同 StoryCard：story.color 僅供淡底，字色不覆寫以保 AA 對比。 */}
      <span
        className={styles.cta}
        style={{ backgroundColor: `${story.color}22` }}
      >
        立即看故事 →
      </span>
    </Link>
  );
}
