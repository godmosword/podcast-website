import type { Metadata } from "next";
import { allTags, allVehicles, storiesByNewest } from "@/data/content";
import { HomeSectionList } from "@/components/home/HomeSectionRenderer";
import type { HomeSectionProps } from "@/components/home/HomeSectionRenderer";
import JsonLd from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { podcastSeriesJsonLd } from "@/lib/json-ld";
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

type StoriesPageProps = {
  searchParams: Promise<{ vehicle?: string; tag?: string; q?: string }>;
};

export default async function StoriesPage({ searchParams }: StoriesPageProps) {
  const {
    vehicle: vehicleParam,
    tag: tagParam,
    q: queryParam,
  } = await searchParams;
  const vehicles = allVehicles();
  const tags = allTags();
  const initialVehicle =
    vehicleParam && vehicles.includes(vehicleParam) ? vehicleParam : null;
  const initialTag = tagParam && tags.includes(tagParam) ? tagParam : null;

  const stories = storiesByNewest();
  const latest = stories[0];
  const lede = storiesCatalogSummary(stories, tags.length, vehicles.length);

  const sectionProps: HomeSectionProps = {
    latest,
    listStories: stories,
    featuredStorySlug: latest?.slug ?? null,
    vehicles,
    tags,
    initialVehicle,
    initialTag,
    initialQuery: queryParam ?? "",
  };

  return (
    <main className={styles.main}>
      <JsonLd data={podcastSeriesJsonLd()} />
      <SiteHeader />
      <p className={styles.lede}>{lede}</p>
      <HomeSectionList props={sectionProps} />
      <SiteFooter layout="home" />
    </main>
  );
}
