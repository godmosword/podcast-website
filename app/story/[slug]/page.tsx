import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharactersForStory } from "@/data/characters";
import { getStory, getRelated, getNextStory, getStories } from "@/data/content";
import { breadcrumbListJsonLd, faqPageJsonLd, podcastEpisodeJsonLd } from "@/lib/json-ld";
import { lineShareUrl, storyLineShareText, storyShareUrl } from "@/lib/share-story";
import {
  familyActivityFaq,
  storyDefinitionSummary,
  storyFaqs,
} from "@/lib/story-geo";
import { storyDetailMetadata } from "@/lib/story-metadata";
import { hasFullTranscript } from "@/lib/transcript";
import { storyDisplayTitle, storySubtitle } from "@/lib/story-title";
import { storyCoverPath } from "@/lib/story-utils";
import FavoriteButton from "@/components/FavoriteButton";
import JsonLd from "@/components/JsonLd";
import PlayButton from "@/components/PlayButton";
import ShareButton from "@/components/ShareButton";
import RelatedStories from "@/components/RelatedStories";
import CharacterCastBar from "@/components/characters/CharacterCastBar";
import ZoneBadge from "@/components/story/ZoneBadge";
import SiteFooter from "@/components/SiteFooter";
import StoryCoverMorph from "@/components/story/StoryCoverMorph";
import StoryImage from "@/components/StoryImage";
import StoryMeta from "@/components/StoryMeta";
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
  const definitionSummary = storyDefinitionSummary(story);
  const sceneCaptions = (story.captions ?? []).filter((line) => line.trim().length > 0);
  const characters = getCharactersForStory(story.slug);
  const faqs = storyFaqs(story);
  const storyHasFullTranscript = hasFullTranscript(story);
  // GEO：familyActivity 以 Q&A 併入 FAQPage（可見文案改掛家長指南）
  const activityFaq = familyActivityFaq(story);
  const jsonLdFaqs = activityFaq ? [...faqs, activityFaq] : faqs;
  const hasParentCoListen =
    Boolean(story.familyActivity) ||
    Boolean(story.parentGuide) ||
    Boolean(story.reflectionPrompt);

  const subtitle = storySubtitle(story);

  return (
    <main className={styles.main} data-deferred-brand-font="story-detail">
      <JsonLd data={podcastEpisodeJsonLd(story)} />
      <JsonLd data={faqPageJsonLd(jsonLdFaqs)} />
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: "全部故事", url: "/stories" },
          { name: story.title, url: `/story/${story.slug}` },
        ])}
      />
      <Link href="/stories" className={styles.back}>
        ← 回故事屋
      </Link>

      <article className={styles.article}>
        <div className={styles.hero}>
          <h1 className={styles.title}>{storyDisplayTitle(story)}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}

          <div className={styles.coverWrap} style={{ borderColor: story.color }}>
            <StoryCoverMorph slug={story.slug}>
              <StoryImage
                src={storyCoverPath(story.slug)}
                alt={`${storyDisplayTitle(story)} 封面`}
                fill
                className={styles.cover}
                priority
              />
            </StoryCoverMorph>
          </div>

          <StoryMeta story={story} showTags={false} className={styles.heroMeta} />
        </div>

        <div className={styles.actions}>
          <PlayButton
            href={`/story/${story.slug}/play`}
            color={story.color}
            className={styles.playMain}
            label={`開始看故事：${storyDisplayTitle(story)}`}
          />
          <ShareButton
            storySlug={story.slug}
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
            appearance="quiet"
          />
        </div>

        <section
          className={styles.introSection}
          aria-labelledby="story-intro-heading"
        >
          <h2 id="story-intro-heading" className={styles.sectionHeading}>
            本集介紹
          </h2>
          <p className={styles.definition}>{definitionSummary}</p>
        </section>

        {hasParentCoListen ? (
          <p className={styles.parentCta}>
            <Link href="/for-parents#co-listen">給爸媽：一起聊聊 →</Link>
          </p>
        ) : null}

        {sceneCaptions.length > 0 ? (
          <details className={`${styles.contentSection} ${styles.outline}`}>
            <summary className={styles.outlineSummary}>故事大綱</summary>
            <ol className={styles.lines}>
              {sceneCaptions.map((line, i) => (
                <li key={`${story.slug}-caption-${i}`}>{line}</li>
              ))}
            </ol>
            {storyHasFullTranscript ? (
              <Link
                href={`/story/${story.slug}/transcript.vtt`}
                className={styles.inlineLink}
              >
                下載逐字稿
              </Link>
            ) : null}
          </details>
        ) : null}

        {characters.length > 0 ? (
          <section
            className={styles.contentSection}
            aria-labelledby="characters-heading"
          >
            <h2 id="characters-heading" className={styles.sectionHeading}>
              出場角色
            </h2>
            <CharacterCastBar characters={characters} />
          </section>
        ) : null}

        <RelatedStories
          stories={related}
          nextStory={nextStory}
          zone={story.zoneId ? <ZoneBadge zoneId={story.zoneId} /> : null}
        />
      </article>

      <SiteFooter compact campaign={story.slug} />
    </main>
  );
}
