import type { Metadata } from "next";
import { allVehicles, storiesByNewest } from "@/data/content";
import { STORY_FINDER_THEMES } from "@/data/episode-themes";
import { HomeSectionList } from "@/components/home/HomeSectionRenderer";
import type { HomeSectionProps } from "@/components/home/HomeSectionRenderer";
import JsonLd from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { podcastSeriesJsonLd } from "@/lib/json-ld";
import { StoriesIndexHeader } from "@/components/stories/StoriesIndexHeader";
import { storiesCatalogSummary } from "@/lib/stories-geo";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const stories = storiesByNewest();
  const description = storiesCatalogSummary(
    stories,
    STORY_FINDER_THEMES.length,
    allVehicles().length,
  );
  return {
    title: "全部故事",
    description,
    alternates: { canonical: "/stories" },
    openGraph: {
      title: "全部故事 · 車車遊樂園",
      description,
      url: "/stories",
      type: "website",
    },
  };
}

export default function StoriesPage() {
  const vehicles = allVehicles();
  const tags = [...STORY_FINDER_THEMES];
  const stories = storiesByNewest();
  const latest = stories[0];
  const lede = storiesCatalogSummary(stories, tags.length, vehicles.length);

  const sectionProps: HomeSectionProps = {
    latest,
    listStories: stories,
    featuredStorySlug: latest?.slug ?? null,
    vehicles,
    tags,
  };

  return (
    <div className={styles.page}>
      <main className={styles.main} data-deferred-brand-font="stories">
        <JsonLd data={podcastSeriesJsonLd()} />
        <SiteHeader />
        <StoriesIndexHeader lede={lede} titleClassName={styles.title} />
        <HomeSectionList props={sectionProps} />
        <SiteFooter layout="home" />
      </main>
    </div>
  );
}
