import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStory, getRelated, getNextStory, getStories } from "@/data/content";
import { podcastEpisodeJsonLd } from "@/lib/json-ld";
import { lineShareUrl, storyLineShareText, storyShareUrl } from "@/lib/share-story";
import { storyDetailMetadata } from "@/lib/story-metadata";
import { storyCoverPath } from "@/lib/story-utils";
import { hasTranscript } from "@/lib/transcript";
import FavoriteButton from "@/components/FavoriteButton";
import JsonLd from "@/components/JsonLd";
import PlayButton from "@/components/PlayButton";
import ShareButton from "@/components/ShareButton";
import RelatedStories from "@/components/RelatedStories";
import ReflectionPrompt from "@/components/story/ReflectionPrompt";
import SubscriptionCTA from "@/components/SubscriptionCTA";
import SiteFooter from "@/components/SiteFooter";
import StoryImage from "@/components/StoryImage";
import StoryMeta, { StoryTags } from "@/components/StoryMeta";
import styles from "./page.module.css";

export function generateStaticParams() {
  return getStories().map((story) => ({ slug: story.slug }));
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
      <Link href="/stories" className={styles.back}>
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

        <div className={styles.actions}>
          <PlayButton
            href={`/story/${story.slug}/play`}
            color={story.color}
            className={styles.playMain}
            label={`開始看故事：${story.title}`}
          />
          <SubscriptionCTA accent={story.color} />
          <ShareButton
            shareUrl={storyShareUrl(story.slug)}
            lineUrl={lineShareUrl(
              storyLineShareText({
                ep: story.ep,
                title: story.title,
                slug: story.slug,
                summary: story.summary,
              }),
            )}
            leading={<FavoriteButton slug={story.slug} />}
            className={styles.shareRow}
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

        {story.reflectionPrompt && (
          <ReflectionPrompt
            slug={story.slug}
            child={story.reflectionPrompt.child}
            parentFollowUp={story.reflectionPrompt.parentFollowUp}
            accent={story.color}
          />
        )}

        {hasTranscript(story) && (
          <section className={styles.transcript} aria-labelledby="transcript-heading">
            <details>
              <summary id="transcript-heading">逐字稿</summary>
              <ol className={styles.lines}>
                {(story.captions ?? []).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </details>
          </section>
        )}

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

      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
