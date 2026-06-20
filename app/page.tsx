import { allTags, allVehicles, storiesByNewest } from "@/data/content";
import { HomeSectionList } from "@/components/home/HomeSectionRenderer";
import type { HomeSectionProps } from "@/components/home/HomeSectionRenderer";
import JsonLd from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { podcastSeriesJsonLd } from "@/lib/json-ld";
import styles from "./page.module.css";

type HomePageProps = {
  searchParams: Promise<{ vehicle?: string; tag?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { vehicle: vehicleParam, tag: tagParam } = await searchParams;
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
