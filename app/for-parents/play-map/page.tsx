import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import PlayMap from "@/components/for-parents/PlayMap";
import { listPlaygrounds } from "@/data/playgrounds";
import {
  breadcrumbListJsonLd,
  playgroundItemListJsonLd,
} from "@/lib/json-ld";
import { STATIC_PAGE_MODIFIED_DATES } from "@/lib/page-freshness";
import {
  parsePlayMapQuery,
  type RawPlayMapParams,
} from "@/lib/playgrounds-query";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "親子遊樂地圖：台灣 15 縣市適合 3–8 歲的公園與親子景點",
  description:
    "用地圖快速找適合 3–8 歲小孩的公園、博物館、動物園與農場；目前收錄台灣 15 縣市，可依附近、雨天、免費、好停車、推車、放電、戶外與室內情境篩選，並一鍵開啟 Google 地圖導航。",
  alternates: { canonical: "/for-parents/play-map" },
  other: {
    dateModified: STATIC_PAGE_MODIFIED_DATES["/for-parents/play-map"],
  },
  openGraph: {
    title: "親子遊樂地圖 · 車車遊樂園",
    description:
      "台灣 15 縣市親子遊樂地點地圖：公園、博物館、動物園與帶小孩時的實用筆記，幫家長快速規劃放電行程。",
    url: "/for-parents/play-map",
    type: "website",
  },
};

export default async function PlayMapPage({
  searchParams,
}: {
  searchParams: Promise<RawPlayMapParams>;
}) {
  const query = parsePlayMapQuery(await searchParams);

  return (
    <main className={styles.main}>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: "親子指南", url: "/for-parents" },
          { name: "親子遊樂地圖", url: "/for-parents/play-map" },
        ])}
      />
      <JsonLd data={playgroundItemListJsonLd(listPlaygrounds())} />
      {/* SiteNavBar（app/layout.tsx）已顯示品牌，此處不再放第二個字標。 */}
      <Suspense fallback={null}>
        <PlayMap
          initialCity={query.city}
          initialType={query.type}
          initialIndoorOnly={query.indoorOnly}
          initialOutdoorOnly={query.outdoorOnly}
          initialFreeOnly={query.freeOnly}
          initialRainyDayOnly={query.rainyDayOnly}
          initialParkingOnly={query.parkingOnly}
          initialStrollerFriendlyOnly={query.strollerFriendlyOnly}
          initialHighEnergyOnly={query.highEnergyOnly}
          initialView={query.view}
        />
      </Suspense>
      <div className={styles.collectionsLinkWrap}>
        <Link className={styles.collectionsLink} href="/for-parents/play-map/collections">
          看各地親子景點整理 <span aria-hidden>→</span>
        </Link>
      </div>
      <SiteFooter
        compact
        showPlatformSubscribe={false}
        parentNote="給家長：資料為人工整理，出發前請再確認官網的營業時間與收費。"
      />
    </main>
  );
}
