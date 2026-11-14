import Link from "next/link";
import type { Story } from "@/data/content";
import { storyCoverPath } from "@/lib/story-utils";
import StoryImage from "./StoryImage";
import Ribbon from "./decor/Ribbon";
import Sparkle from "./decor/Sparkle";
import decor from "./decor/decor.module.css";
import { storyDisplayTitle } from "@/lib/story-title";
import Icon from "@/components/ui/Icon";
import styles from "./LatestHero.module.css";

type LatestHeroProps = {
  story: Story;
  /** 這張封面是頁面第一屏最大的圖（/stories）時設 true，讓它優先下載。 */
  priority?: boolean;
};

export default function LatestHero({ story, priority = false }: LatestHeroProps) {
  return (
    <Link
      href={`/story/${story.slug}`}
      className={styles.hero}
    >
      <div className={styles.topRow}>
        <Ribbon color={story.color}>NEW · EP {story.ep}</Ribbon>
      </div>

      <div className={styles.coverWrap}>
        {/* 同一頁只能有一張優先下載的大圖：由頁面決定是這張還是 SiteHeader 的品牌大圖。 */}
        <StoryImage
          priority={priority}
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
        <span className={styles.cta}>立即看故事<Icon name="arrow-right" size={16} className="icon-trail" /></span>
      </div>
    </Link>
  );
}
