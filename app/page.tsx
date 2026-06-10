import { allVehicles, storiesByNewest } from "@/data/content";
import { HomeSectionList } from "@/components/home/HomeSectionRenderer";
import type { HomeSectionProps } from "@/components/home/HomeSectionRenderer";
import JsonLd from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { podcastSeriesJsonLd } from "@/lib/json-ld";
import styles from "./page.module.css";

type HomePageProps = {
  searchParams: Promise<{ vehicle?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { vehicle: vehicleParam } = await searchParams;
  const vehicles = allVehicles();
  const initialVehicle =
    vehicleParam && vehicles.includes(vehicleParam) ? vehicleParam : null;

  const stories = storiesByNewest();
  const latest = stories[0];
  // 最新集已在 LatestHero 展示，列表排除以避免重複
  const listStories = latest
    ? stories.filter((s) => s.slug !== latest.slug)
    : stories;

  const sectionProps: HomeSectionProps = {
    latest,
    listStories,
    vehicles,
    initialVehicle,
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
