import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharactersForStory } from "@/data/characters";
import { getStory, getRelated, getNextStory, getStories } from "@/data/content";
import { faqPageJsonLd, podcastEpisodeJsonLd } from "@/lib/json-ld";
import { lineShareUrl, storyLineShareText, storyShareUrl } from "@/lib/share-story";
import {
  familyActivityFaq,
  storyDefinitionSummary,
  storyFaqs,
  storyOutlineItems,
  storyParentExtension,
  storyPlainSummary,
} from "@/lib/story-geo";
import { storyDetailMetadata } from "@/lib/story-metadata";
import { storyCoverPath } from "@/lib/story-utils";
import FavoriteButton from "@/components/FavoriteButton";
import JsonLd from "@/components/JsonLd";
import ParentTrustStrip from "@/components/ParentTrustStrip";
import PlayButton from "@/components/PlayButton";
import ShareButton from "@/components/ShareButton";
import RelatedStories from "@/components/RelatedStories";
import FamilyActivityCard from "@/components/story/FamilyActivityCard";
import ZoneBadge from "@/components/story/ZoneBadge";
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
  const definitionSummary = storyDefinitionSummary(story);
  const plainSummary = storyPlainSummary(story);
  const outlineItems = storyOutlineItems(story);
  const characters = getCharactersForStory(story.slug);
  const parentExtension = storyParentExtension(story);
  const faqs = storyFaqs(story);
  // GEO：familyActivity 以 Q&A 形式併入 FAQPage JSON-LD（頁面可見文字由卡片提供）
  const activityFaq = familyActivityFaq(story);
  const jsonLdFaqs = activityFaq ? [...faqs, activityFaq] : faqs;

  return (
    <main className={styles.main}>
      <JsonLd data={podcastEpisodeJsonLd(story)} />
      <JsonLd data={faqPageJsonLd(jsonLdFaqs)} />
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
            {plainSummary && <p className={styles.summary}>{plainSummary}</p>}
          </section>

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

        <ParentTrustStrip className={styles.trustStrip} />

        {story.familyActivity && (
          <FamilyActivityCard
            slug={story.slug}
            familyActivity={story.familyActivity}
            accent={story.color}
          />
        )}

        <section className={styles.contentSection} aria-labelledby="outline-heading">
          <h2 id="outline-heading" className={styles.sectionHeading}>
            逐字稿與詳細大綱
          </h2>
          <ol className={styles.lines}>
            {outlineItems.map((line, i) => (
              <li key={`${story.slug}-outline-${i}`}>{line}</li>
            ))}
          </ol>
        </section>

        <section
          className={styles.contentSection}
          aria-labelledby="characters-heading"
        >
          <h2 id="characters-heading" className={styles.sectionHeading}>
            出場角色
          </h2>
          {characters.length > 0 ? (
            <ul className={styles.characterList}>
              {characters.map((character) => (
                <li key={character.id} className={styles.characterItem}>
                  <Link href={`/characters#${character.id}`}>
                    {character.name}
                  </Link>
                  <span>
                    {character.vehicle}，{character.personality}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.summary}>
              這一集以故事情境為主，聽完可以回到角色圖鑑認識更多車車朋友。
            </p>
          )}

          <Link href="/characters" className={styles.inlineLink}>
            看全部角色圖鑑
          </Link>
        </section>

        {story.reflectionPrompt && (
          <ReflectionPrompt
            slug={story.slug}
            child={story.reflectionPrompt.child}
            parentFollowUp={story.reflectionPrompt.parentFollowUp}
            accent={story.color}
          />
        )}

        <section className={styles.contentSection} aria-labelledby="parent-heading">
          <h2 id="parent-heading" className={styles.sectionHeading}>
            {parentExtension.heading}
          </h2>
          <ul className={styles.promptList}>
            {parentExtension.prompts.map((prompt, i) => (
              <li key={`${story.slug}-prompt-${i}`}>{prompt}</li>
            ))}
          </ul>
        </section>

        <section className={styles.contentSection} aria-labelledby="faq-heading">
          <h2 id="faq-heading" className={styles.sectionHeading}>
            常見問題
          </h2>
          <div className={styles.faqList}>
            {faqs.map((faq, i) => (
              <section key={`${story.slug}-faq-${i}`} className={styles.faqItem}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </section>
            ))}
          </div>
        </section>

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
