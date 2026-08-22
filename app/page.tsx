import type { Metadata } from "next";
import LandingHub from "@/components/landing/LandingHub";
import { HOME_PAGE_META_DESCRIPTION } from "@/lib/home-geo";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "車車遊樂園 · 親子故事與手作",
  description: HOME_PAGE_META_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "車車遊樂園",
    description: HOME_PAGE_META_DESCRIPTION,
    url: "/",
  },
};

export default function HomePage() {
  return (
    <main className={styles.main} data-landing-root>
      <LandingHub />
    </main>
  );
}
