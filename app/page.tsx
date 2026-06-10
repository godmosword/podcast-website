import { allVehicles, storiesByNewest } from "@/data/content";
import HomeSubscribeBand from "@/components/HomeSubscribeBand";
import ContinueBanner from "@/components/ContinueBanner";
import FavoritesSection from "@/components/FavoritesSection";
import JsonLd from "@/components/JsonLd";
import LatestHero from "@/components/LatestHero";
import SiteHeader from "@/components/SiteHeader";
import StoryFilter from "@/components/StoryFilter";
import SiteFooter from "@/components/SiteFooter";
import StarterEpisodes from "@/components/StarterEpisodes";
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

  return (
    <main className={styles.main}>
      <JsonLd data={podcastSeriesJsonLd()} />
      <SiteHeader />
      <ContinueBanner />
      {latest && <LatestHero story={latest} />}
      <StarterEpisodes />
      <HomeSubscribeBand />
      <FavoritesSection />
      <p className={styles.audienceNote}>
        給 3–7 歲孩子與家長 · 每集 5–10 分鐘，適合睡前看圖聽故事
      </p>
      <StoryFilter
        stories={listStories}
        vehicles={vehicles}
        initialVehicle={initialVehicle}
      />
      <SiteFooter showPlatformSubscribe={false} />
    </main>
  );
}
