import type { Metadata } from "next";
import { allTags, allVehicles, storiesByNewest } from "@/data/content";
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
    allTags().length,
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
  const tags = allTags();
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
        {/* 美術審 M3：≥768 hero 與頁標題並排成頁首列，420px 直式圖不再孤懸在 1100 欄裡。 */}
        <div className={styles.headerBand}>
          <SiteHeader />
          <StoriesIndexHeader lede={lede} titleClassName={styles.title} />
        </div>
        <HomeSectionList props={sectionProps} />
        <SiteFooter layout="home" />
      </main>
    </div>
  );
}
