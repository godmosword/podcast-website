import {
  storiesByNewest,
  allVehicles,
  allTags,
} from "@/data/stories";
import ContinueBanner from "@/components/ContinueBanner";
import FavoritesSection from "@/components/FavoritesSection";
import LatestHero from "@/components/LatestHero";
import SiteHeader from "@/components/SiteHeader";
import StoryFilter from "@/components/StoryFilter";
import SiteFooter from "@/components/SiteFooter";
import styles from "./page.module.css";

export default function HomePage() {
  const stories = storiesByNewest();
  const latest = stories[0];

  return (
    <main className={styles.main}>
      <SiteHeader />
      <ContinueBanner />
      {latest && <LatestHero story={latest} />}
      <FavoritesSection />
      <StoryFilter
        stories={stories}
        vehicles={allVehicles()}
        tags={allTags()}
      />
      <SiteFooter />
    </main>
  );
}
