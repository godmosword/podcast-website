import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import JsonLd from "@/components/JsonLd";
import PlayMap from "@/components/for-parents/PlayMap";
import { breadcrumbListJsonLd } from "@/lib/json-ld";
import { STATIC_PAGE_MODIFIED_DATES } from "@/lib/page-freshness";
import { DEFAULT_PLAY_MAP_CITY } from "@/lib/playground-coverage";
import { filterPlaygrounds } from "@/lib/playgrounds-query";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "親子遊樂地圖：北北基桃與中台灣適合 3–8 歲的公園與室內樂園",
  description:
    "用地圖快速找適合 3–8 歲小孩的公園、室內樂園與雨天備案；目前收錄北北基桃與竹苗中彰投雲，可依縣市、室內、免費篩選，並一鍵開啟 Google 地圖導航。",
  alternates: { canonical: "/for-parents/play-map" },
  other: {
    dateModified: STATIC_PAGE_MODIFIED_DATES["/for-parents/play-map"],
  },
  openGraph: {
    title: "親子遊樂地圖 · 車車遊樂園",
    description:
      "北北基桃與中台灣核心親子遊樂地點地圖：公園、室內樂園與實用 Tips，幫家長快速規劃放電行程。",
    url: "/for-parents/play-map",
    type: "website",
  },
};

export default function PlayMapPage() {
  const initialPlaces = filterPlaygrounds({ city: DEFAULT_PLAY_MAP_CITY });

  return (
    <main className={styles.main}>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: "親子指南", url: "/for-parents" },
          { name: "親子遊樂地圖", url: "/for-parents/play-map" },
        ])}
      />
      <SiteHeader variant="compact" />
      <PlayMap
        defaultCity={DEFAULT_PLAY_MAP_CITY}
        initialPlaces={initialPlaces}
      />
      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
