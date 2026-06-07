import Link from "next/link";
import { storiesByNewest, allVehicles } from "@/data/stories";
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
      <Link href="/characters" className={styles.charsEntry}>
        <span className={styles.charsEntryEmoji} aria-hidden>
          🚗
        </span>
        <span className={styles.charsEntryText}>
          <span className={styles.charsEntryTitle}>認識車車朋友</span>
          <span className={styles.charsEntrySub}>
            聽過的車車會點亮你的收集車庫！
          </span>
        </span>
        <span className={styles.charsEntryArrow} aria-hidden>
          →
        </span>
      </Link>
      <FavoritesSection />
      <StoryFilter stories={stories} vehicles={allVehicles()} />
      <SiteFooter />
    </main>
  );
}
