import {
  storiesByDate,
  allVehicles,
  allTags,
  filterStories,
} from "@/data/stories";
import ContinueBanner from "@/components/ContinueBanner";
import FavoritesSection from "@/components/FavoritesSection";
import SiteHeader from "@/components/SiteHeader";
import StoryFilter from "@/components/StoryFilter";
import SiteFooter from "@/components/SiteFooter";
import styles from "./page.module.css";

type HomePageProps = {
  searchParams: Promise<{ vehicle?: string; tag?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const vehicles = allVehicles();
  const tags = allTags();

  const activeVehicle =
    params.vehicle && vehicles.includes(params.vehicle)
      ? params.vehicle
      : null;
  const activeTag =
    params.tag && tags.includes(params.tag) ? params.tag : null;

  const allStories = storiesByDate();
  const stories = filterStories(allStories, activeVehicle, activeTag);

  return (
    <main className={styles.main}>
      <SiteHeader />
      <ContinueBanner />
      <FavoritesSection />
      <StoryFilter
        stories={stories}
        vehicles={vehicles}
        tags={tags}
        activeVehicle={activeVehicle}
        activeTag={activeTag}
      />
      <SiteFooter />
    </main>
  );
}
