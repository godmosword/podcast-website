import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import JsonLd from "@/components/JsonLd";
import PlayMapLoader from "@/components/for-parents/PlayMapLoader";
import { breadcrumbListJsonLd } from "@/lib/json-ld";
import { STATIC_PAGE_MODIFIED_DATES } from "@/lib/page-freshness";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "親子遊樂地圖：桃園附近適合 3–8 歲的公園與室內樂園",
  description:
    "用地圖快速找適合 3–8 歲小孩的公園、室內樂園與雨天備案；可依城市、室內、免費篩選，並一鍵開啟 Google 地圖導航。",
  alternates: { canonical: "/for-parents/play-map" },
  other: {
    dateModified: STATIC_PAGE_MODIFIED_DATES["/for-parents/play-map"],
  },
  openGraph: {
    title: "親子遊樂地圖 · 車車遊樂園",
    description:
      "桃園為主的親子遊樂地點地圖：公園、室內樂園與實用 Tips，幫家長快速規劃放電行程。",
    url: "/for-parents/play-map",
    type: "website",
  },
};

export default function PlayMapPage() {
  return (
    <main className={styles.main}>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: "親子指南", url: "/for-parents" },
          { name: "親子遊樂地圖", url: "/for-parents/play-map" },
        ])}
      />
      <SiteHeader />

      <header className={styles.header}>
        <p className={styles.eyebrow}>親子指南</p>
        <h1 className={styles.title}>親子遊樂地圖</h1>
        <p className={styles.lede}>
          找適合 3–8 歲的公園與室內樂園，看 Tips、一鍵導航。目前先收錄桃園，其他縣市陸續補上。
        </p>
        <Link href="/for-parents" className={styles.backLink}>
          ← 回到親子指南
        </Link>
      </header>

      <PlayMapLoader />

      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
