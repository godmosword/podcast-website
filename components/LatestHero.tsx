import Link from "next/link";
import type { Story } from "@/data/content";
import { storyCoverPath } from "@/lib/story-utils";
import StoryImage from "./StoryImage";
import Ribbon from "./decor/Ribbon";
import Sparkle from "./decor/Sparkle";
import Doodle from "./decor/Doodle";
import RoughFrame from "./decor/RoughFrame";
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
        boxShadow: `var(--shadow-md), 0 6px 0 ${story.color}`,
      }}
    >
      <RoughFrame color={story.color} rough={2} width={4} />
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
      <span
        className={`${styles.cta} marker`}
        style={{ ["--marker-color" as string]: story.color }}
      >
        立即看故事 →
      </span>

      <Doodle
        kind="loop"
        size={40}
        color="var(--c-yellow)"
        className={`${decor.doodle} ${decor.doodleBR} ${decor.tiltC}`}
      />
      <Doodle
        kind="dots"
        size={28}
        color="var(--c-pink)"
        className={`${decor.doodle} ${decor.doodleTR}`}
        style={{ top: "-12px", right: "-8px" }}
      />
      <Doodle
        kind="squiggle"
        size={34}
        color="var(--c-mint)"
        className={`${decor.doodle} ${decor.doodleBL} ${decor.tiltA}`}
        style={{ left: "-10px", bottom: "-14px" }}
      />
    </Link>
  );
}
