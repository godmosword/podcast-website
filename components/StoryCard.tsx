import Link from "next/link";
import type { Story } from "@/data/content";
import { formatDate, storyCoverPath } from "@/lib/story-utils";
import StoryCoverMorph from "@/components/story/StoryCoverMorph";
import StoryProgressBadge from "@/components/story/StoryProgressBadge";
import { STORIES_CATALOG_COVER_SIZES } from "@/lib/stories-view";
import StoryImage from "./StoryImage";
import { TagChip } from "./Chip";
import StoryAge from "./StoryAge";
import Icon from "./ui/Icon";
import styles from "./StoryCard.module.css";

type StoryCardProps = {
  story: Story;
  /** 列表索引，用於進場依序彈入 */
  index?: number;
  /** list：橫式列表（預設）；grid：直式卡片 */
  variant?: "list" | "grid";
  /** 隱藏日期 / 時長 / 年齡（僅保留 EP）；首頁列表用 */
  hideMeta?: boolean;
  /** D4 fallback：列表封面 DOM 標記；同頁可能重複 slug 時關閉 */
  sharedCoverMorph?: boolean;
  /**
   * `/stories` 找故事目錄。桌機縮圖／完整只靠 `<html>` 旗標切 CSS，
   * 不走 variant，避免切換 remount。
   */
  catalog?: boolean;
  /** 覆寫封面 sizes；目錄卡預設用 `STORIES_CATALOG_COVER_SIZES` */
  coverSizes?: string;
};

export default function StoryCard({
  story,
  index = 0,
  variant = "list",
  hideMeta = false,
  sharedCoverMorph = true,
  catalog = false,
  coverSizes,
}: StoryCardProps) {
  const isGrid = variant === "grid";
  // 列表縮圖 96×96（≤480px 為 80×80）；grid 約 220px。避免預設 640px sizes。
  const thumbSizes =
    coverSizes ??
    (catalog
      ? STORIES_CATALOG_COVER_SIZES
      : isGrid
        ? "(max-width: 640px) 46vw, 220px"
        : "(max-width: 480px) 80px, 96px");
  const staggerClass = `scrollEnterStagger${(index % 3) + 1}`;

  return (
    <Link
      href={`/story/${story.slug}`}
      className={`${styles.card} ${isGrid ? styles.cardGrid : ""} ${catalog ? styles.catalogCard : ""} scrollEnter ${staggerClass} press-squash`}
    >
      <div
        className={`${styles.thumbWrap} ${isGrid ? styles.thumbWrapGrid : ""}`}
        style={{ backgroundColor: `${story.color}22` }}
      >
        {sharedCoverMorph ? (
          <StoryCoverMorph slug={story.slug}>
            <StoryImage
              src={storyCoverPath(story.slug)}
              alt=""
              fill
              sizes={thumbSizes}
              className={styles.thumb}
            />
          </StoryCoverMorph>
        ) : (
          <StoryImage
            src={storyCoverPath(story.slug)}
            alt=""
            fill
            sizes={thumbSizes}
            className={styles.thumb}
          />
        )}
        {/* 星章不受 hideMeta 控制：它是圖形獎勵而非 meta 文字，且首頁精簡列表
            正是最需要「哪些聽過」的地方。 */}
        <StoryProgressBadge slug={story.slug} />
      </div>

      <span className={`${styles.body} ${isGrid ? styles.bodyGrid : ""}`}>
        <span className={styles.meta}>
          <span
            className={`${styles.ep} marker`}
            style={{ ["--marker-color" as string]: story.color }}
          >
            EP {story.ep}
          </span>
          {!hideMeta && (
            <>
              <span>{formatDate(story.date)}</span>
              {story.duration && <span>{story.duration}</span>}
              <StoryAge ageRange={story.ageRange} />
            </>
          )}
        </span>

        <span className={styles.title} role="heading" aria-level={3}>
          {story.title}
        </span>

        {story.summary && <span className={styles.summary}>{story.summary}</span>}

        <span className={`${styles.footer} ${isGrid ? styles.footerGrid : ""}`}>
          {story.tags && story.tags.length > 0 && (
            <span className={styles.tags}>
              {story.tags.map((t) => (
                <TagChip key={t} color={story.color}>
                  {t}
                </TagChip>
              ))}
            </span>
          )}
          {/* 底色用 story.color 淡染，字色不覆寫（沿用 --ink）：story.color 為自由
              指定 hex，直接當前景色時對比僅 2.1–3.2:1，不過 WCAG AA。 */}
          <span
            className={styles.arrow}
            style={{ backgroundColor: `${story.color}1f` }}
            aria-hidden
          >
            <Icon name="play" size={12} />
          </span>
        </span>
      </span>
    </Link>
  );
}
