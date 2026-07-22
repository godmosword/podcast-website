import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharactersForStory } from "@/data/characters";
import { getStory, getRelated, getNextStory, getStories } from "@/data/content";
import { breadcrumbListJsonLd, faqPageJsonLd, podcastEpisodeJsonLd } from "@/lib/json-ld";
import { lineShareUrl, storyLineShareText, storyShareUrl } from "@/lib/share-story";
import {
  familyActivityFaq,
  storyCharactersTeaser,
  storyDefinitionSummary,
  storyFaqs,
  storyOutlineItems,
  storyOutlinePreviewItems,
} from "@/lib/story-geo";
import { storyDetailMetadata } from "@/lib/story-metadata";
import { hasFullTranscript } from "@/lib/transcript";
import { storyCoverPath } from "@/lib/story-utils";
import FavoriteButton from "@/components/FavoriteButton";
import JsonLd from "@/components/JsonLd";
import PlayButton from "@/components/PlayButton";
import ShareButton from "@/components/ShareButton";
import RelatedStories from "@/components/RelatedStories";
import ZoneBadge from "@/components/story/ZoneBadge";
import SiteFooter from "@/components/SiteFooter";
import StoryCoverMorph from "@/components/story/StoryCoverMorph";
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
  const definitionSummary = storyDefinitionSummary(story);
  const outlinePreviewItems = storyOutlinePreviewItems(story);
  const outlineItems = storyOutlineItems(story);
  const hasFullOutline = outlineItems.length > outlinePreviewItems.length;
  const characters = getCharactersForStory(story.slug);
  const charactersTeaser = storyCharactersTeaser(characters);
  const faqs = storyFaqs(story);
  const storyHasFullTranscript = hasFullTranscript(story);
  const showOutlineDetails = hasFullOutline;
  // GEO：familyActivity 以 Q&A 併入 FAQPage（可見文案改掛家長指南）
  const activityFaq = familyActivityFaq(story);
  const jsonLdFaqs = activityFaq ? [...faqs, activityFaq] : faqs;
  const hasParentCoListen =
    Boolean(story.familyActivity) ||
    Boolean(story.parentGuide) ||
    Boolean(story.reflectionPrompt);

  return (
    <main className={styles.main}>
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

      <article>
        <div className={styles.hero}>
          <h1 className={styles.title}>{story.title}</h1>

          <section
            className={styles.introSection}
            aria-labelledby="story-intro-heading"
          >
            <h2 id="story-intro-heading" className={styles.sectionHeading}>
              本集介紹
            </h2>
            <p className={styles.definition}>{definitionSummary}</p>
          </section>

          <div className={styles.coverWrap} style={{ borderColor: story.color }}>
            <StoryCoverMorph slug={story.slug}>
              <StoryImage
                src={storyCoverPath(story.slug)}
                alt={`${story.title} 封面`}
                fill
                className={styles.cover}
                priority
              />
            </StoryCoverMorph>
          </div>

          <StoryMeta story={story} showTags={false} />

          {story.zoneId ? <ZoneBadge zoneId={story.zoneId} /> : null}

          <StoryTags story={story} />
        </div>

        <div className={styles.actions}>
          <PlayButton
            href={`/story/${story.slug}/play`}
            color={story.color}
            className={styles.playMain}
            label={`開始看故事：${story.title}`}
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
          />
        </div>

        {hasParentCoListen ? (
          <p className={styles.parentCta}>
            <Link href="/for-parents#co-listen">家長共讀與延伸 →</Link>
          </p>
        ) : null}

        <section className={styles.contentSection} aria-labelledby="outline-heading">
          <h2 id="outline-heading" className={styles.sectionHeading}>
            故事大綱
          </h2>
          <ol className={styles.lines}>
            {outlinePreviewItems.map((line, i) => (
              <li key={`${story.slug}-outline-preview-${i}`}>{line}</li>
            ))}
          </ol>
          {showOutlineDetails && (
            <details className={styles.expandable}>
              <summary>看詳細故事大綱</summary>
              <ol className={styles.lines}>
                {outlineItems.map((line, i) => (
                  <li key={`${story.slug}-outline-${i}`}>{line}</li>
                ))}
              </ol>
            </details>
          )}
          {storyHasFullTranscript && (
            <Link
              href={`/story/${story.slug}/transcript.vtt`}
              className={styles.inlineLink}
            >
              下載完整逐字稿（WebVTT）
            </Link>
          )}
        </section>

        <section
          className={styles.contentSection}
          aria-labelledby="characters-heading"
        >
          <h2 id="characters-heading" className={styles.sectionHeading}>
            出場角色
          </h2>
          <p className={styles.teaser}>{charactersTeaser}</p>
          <Link href="/characters" className={styles.inlineLink}>
            看角色圖鑑
          </Link>
        </section>

        <section className={styles.contentSection} aria-labelledby="faq-heading">
          <h2 id="faq-heading" className={styles.sectionHeading}>
            常見問題
          </h2>
          <details className={styles.expandable}>
            <summary>展開 {faqs.length} 個常見問題</summary>
            <div className={styles.faqList}>
              {faqs.map((faq, i) => (
                <section key={`${story.slug}-faq-${i}`} className={styles.faqItem}>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </section>
              ))}
            </div>
          </details>
        </section>

        <RelatedStories
          stories={related}
          nextStory={nextStory}
          accent={story.color}
        />
      </article>

      <SiteFooter compact campaign={story.slug} />
    </main>
  );
}
