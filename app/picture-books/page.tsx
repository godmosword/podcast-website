import type { Metadata } from "next";
import { STORY_FINDER_THEMES } from "@/data/episode-themes";
import JsonLd from "@/components/JsonLd";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { StoryFilterHost } from "@/components/StoryFilter";
import { StoriesIndexHeader } from "@/components/stories/StoriesIndexHeader";
import { pictureBookListJsonLd } from "@/lib/json-ld";
import { pageSocialMetadata } from "@/lib/page-social-metadata";
import {
  pictureBookCatalogSummary,
  pictureBookStories,
  pictureBookVehicles,
} from "@/lib/picture-books";
import styles from "../stories/page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const stories = pictureBookStories();
  const description = pictureBookCatalogSummary(stories);
  return {
    title: "繪本故事",
    description,
    alternates: { canonical: "/picture-books" },
    ...pageSocialMetadata({
      title: "繪本故事 · 車車遊樂園",
      description,
      url: "/picture-books",
      type: "website",
    }),
  };
}

export default function PictureBooksPage() {
  const stories = pictureBookStories();
  const lede = pictureBookCatalogSummary(stories);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <JsonLd data={pictureBookListJsonLd(stories)} />
        <StoriesIndexHeader
          lede={lede}
          title="繪本故事"
          titleClassName={styles.title}
        />
        <StoryFilterHost
          stories={stories}
          vehicles={pictureBookVehicles(stories)}
          tags={[...STORY_FINDER_THEMES]}
        />
        <div className={styles.brandHero}>
          <SiteHeader deferred />
        </div>
        <SiteFooter layout="home" />
      </main>
    </div>
  );
}
