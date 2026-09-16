import Link from "next/link";
import type { Story } from "@/data/content";
import { storyCoverPath } from "@/lib/story-utils";
import StoryImage from "./StoryImage";
import Ribbon from "./decor/Ribbon";
import Sparkle from "./decor/Sparkle";
import decor from "./decor/decor.module.css";
import { storyDisplayTitle } from "@/lib/story-title";
import styles from "./LatestHero.module.css";

type LatestHeroProps = {
  story: Story;
};

export default function LatestHero({ story }: LatestHeroProps) {
  return (
    <Link
      href={`/story/${story.slug}`}
      className={styles.hero}
    >
      <div className={styles.topRow}>
        <Ribbon color={story.color}>NEW · EP {story.ep}</Ribbon>
      </div>

      <div className={styles.coverWrap}>
        {/* /stories LCP 是 SiteHeader hero-home；這裡不再 priority，避免雙 hero preload。 */}
        <StoryImage
          src={storyCoverPath(story.slug)}
          alt={`${storyDisplayTitle(story)} 封面`}
          fill
          className={styles.cover}
        />
        <Sparkle
          className={`${styles.sparkle} ${decor.sparkleAnim}`}
          size={22}
        />
      </div>

      <div className={styles.info}>
        <span className={styles.title} role="heading" aria-level={2}>
          {storyDisplayTitle(story)}
        </span>
        {story.summary && (
          <span className={styles.summary}>{story.summary}</span>
        )}
        {/* 美術審 H1 收尾：/stories 的唯一主行動，改吃 --cta-solid-*（暖深墨＋白字）；
            story.color 淡底留給列表 StoryCard 的 chip，主鈕不再是最弱的一顆。 */}
        <span className={styles.cta}>立即看故事 →</span>
      </div>
    </Link>
  );
}
