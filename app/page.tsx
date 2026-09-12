import type { Metadata } from "next";
import IntroOverlay from "@/components/landing/IntroOverlay";
import LandingHub from "@/components/landing/LandingHub";
import { HOME_PAGE_META_DESCRIPTION } from "@/lib/home-geo";
import { INTRO_GATE_INERT_SCRIPT, INTRO_PORTAL_ENABLED } from "@/lib/intro-gate";
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
      {/* 3D 開場蓋在 Landing 上，不是導航（ADR-0004）。產品關掉時不掛覆蓋層，
          元件仍留著；Landing 的 HTML／canonical／JSON-LD 一字未改。 */}
      {INTRO_PORTAL_ENABLED ? <IntroOverlay /> : null}
      <main className={styles.main} data-landing-root>
        <LandingHub />
      </main>
      {/* 必須放在 <main> 之後且是同步的：<head> 執行時 <main> 還不存在，而交給
          React effect 會在首次繪製到 hydration 之間留一個可以 Tab 到覆蓋層背後
          的窗口。產品關掉開場時不必掛這支 script。 */}
      {INTRO_PORTAL_ENABLED ? (
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE_INERT_SCRIPT }} />
      ) : null}
    </>
  );
}
