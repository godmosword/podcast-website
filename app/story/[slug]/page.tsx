import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStory, getRelated, getNextStory, stories } from "@/data/stories";
import { podcastEpisodeJsonLd } from "@/lib/json-ld";
import { lineShareUrl, storyLineShareText, storyShareUrl } from "@/lib/share-story";
import { storyDetailMetadata } from "@/lib/story-metadata";
import { storyCoverPath } from "@/lib/story-utils";
import FavoriteButton from "@/components/FavoriteButton";
import JsonLd from "@/components/JsonLd";
import PlatformLinks from "@/components/PlatformLinks";
import PlayButton from "@/components/PlayButton";
import ShareButton from "@/components/ShareButton";
import RelatedStories from "@/components/RelatedStories";
import SiteFooter from "@/components/SiteFooter";
import StoryImage from "@/components/StoryImage";
import StoryMeta, { StoryTags } from "@/components/StoryMeta";
import styles from "./page.module.css";

export function generateStaticParams() {
  return stories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) {
    return { title: "找不到故事" };
  }
  return storyDetailMetadata(story);
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = getStory(slug);

  if (!story) {
    notFound();
  }

  const related = getRelated(slug, 3);
  const nextStory = getNextStory(slug);

  return (
    <main className={styles.main}>
      <JsonLd data={podcastEpisodeJsonLd(story)} />
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <article>
        <div className={styles.hero}>
          <div className={styles.coverWrap} style={{ borderColor: story.color }}>
            <StoryImage
              src={storyCoverPath(story.slug)}
              alt={`${story.title} 封面`}
              fill
              className={styles.cover}
              priority
            />
          </div>

          <StoryMeta story={story} showTags={false} />

          <h1 className={styles.title}>{story.title}</h1>

          <StoryTags story={story} />
        </div>

        <div className={styles.playWrap}>
          <PlayButton
            href={`/story/${story.slug}/play`}
            color={story.color}
          />
          <ShareButton
            leading={<FavoriteButton slug={story.slug} />}
            shareUrl={storyShareUrl(story.slug)}
            lineUrl={lineShareUrl(
              storyLineShareText({
                ep: story.ep,
                title: story.title,
                slug: story.slug,
                summary: story.summary,
              }),
            )}
          />
        </div>

        {story.summary && (
          <section
            className={styles.summarySection}
            style={{ borderLeftColor: story.color }}
          >
            <h2 className={styles.sectionHeading}>故事大綱</h2>
            <p className={styles.summary}>{story.summary}</p>
          </section>
        )}

        <PlatformLinks accent={story.color} />

        {nextStory && (
          <p className={styles.nextHint}>
            聽完這集可以接著聽{" "}
            <Link href={`/story/${nextStory.slug}`} style={{ color: story.color }}>
              EP {nextStory.ep} {nextStory.title}
            </Link>
          </p>
        )}

        <RelatedStories stories={related} />
      </article>

      <SiteFooter />
    </main>
  );
}
