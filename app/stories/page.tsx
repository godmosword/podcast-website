import type { Metadata } from "next";
import { allTags, allVehicles, storiesByNewest } from "@/data/content";
import { HomeSectionList } from "@/components/home/HomeSectionRenderer";
import type { HomeSectionProps } from "@/components/home/HomeSectionRenderer";
import JsonLd from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { podcastSeriesJsonLd } from "@/lib/json-ld";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "全部故事",
  description:
    "車車遊樂園全部故事：看圖聽故事、睡前親子共讀，訂閱 Spotify 或 Apple Podcast 新集自動更新。",
  alternates: { canonical: "/stories" },
};

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
      <HomeSectionList props={sectionProps} />
      <SiteFooter layout="home" />
    </main>
  );
}
