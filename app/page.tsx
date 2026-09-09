import type { Metadata } from "next";
import IntroOverlay from "@/components/landing/IntroOverlay";
import LandingHub from "@/components/landing/LandingHub";
import { HOME_PAGE_META_DESCRIPTION } from "@/lib/home-geo";
import { INTRO_GATE_INERT_SCRIPT } from "@/lib/intro-gate";
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
    <>
      {/* 3D 開場蓋在 Landing 上，不是導航（ADR-0004）。Landing 的 HTML 一字未改，
          canonical、JSON-LD 與內容全部留在原位，所以 SEO 沒有任何損失。 */}
      <IntroOverlay />
      <main className={styles.main} data-landing-root>
        <LandingHub />
      </main>
      {/* 必須放在 <main> 之後且是同步的：<head> 執行時 <main> 還不存在，而交給
          React effect 會在首次繪製到 hydration 之間留一個可以 Tab 到覆蓋層背後
          的窗口。 */}
      <script dangerouslySetInnerHTML={{ __html: INTRO_GATE_INERT_SCRIPT }} />
    </>
  );
}
