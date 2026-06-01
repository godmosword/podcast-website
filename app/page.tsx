import {
  storiesByNewest,
  allVehicles,
  allTags,
} from "@/data/stories";
import StoryFilter from "@/components/StoryFilter";
import SiteFooter from "@/components/SiteFooter";
import styles from "./page.module.css";

export default function HomePage() {
  const stories = storiesByNewest();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot.png"
          alt="揮手的紅色小卡車"
          className={styles.mascot}
          width={200}
          height={150}
        />
        <h1 className={styles.title}>車車遊樂園</h1>
        <p className={styles.subtitle}>每天一個車車故事，陪孩子長大 🚗</p>
      </header>

      <StoryFilter
        stories={stories}
        vehicles={allVehicles()}
        tags={allTags()}
      />

      <SiteFooter />
    </main>
  );
}
