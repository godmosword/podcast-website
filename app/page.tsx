import { storiesByNewest, allVehicles, allTags } from "@/data/stories";
import ContinueBanner from "@/components/ContinueBanner";
import FavoritesSection from "@/components/FavoritesSection";
import SiteHeader from "@/components/SiteHeader";
import StoryFilter from "@/components/StoryFilter";
import SiteFooter from "@/components/SiteFooter";
import styles from "./page.module.css";

export default function HomePage() {
  const stories = storiesByNewest();

  return (
    <main className={styles.main}>
      <SiteHeader />
      <ContinueBanner />
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
