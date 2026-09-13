import type { ReactNode } from "react";
import UniverseMap from "@/components/universe/UniverseMap";
import { buildZoneStoryPreviewsMap } from "@/lib/story-zone-query";
import { getZoneArtSrcSet } from "@/lib/universe/zone-art-src";

const carParkTilePreload = getZoneArtSrcSet("car-park");

/**
 * 樂園地圖 layout：MapStage（UniverseMap）持續掛載；
 * 子路由（世界／島）只換 children；@modal 攔截熱點詳情。
 */
export default function AdventuresLayout({
  children,
  modal = null,
}: {
  children: ReactNode;
  modal?: ReactNode;
}) {
  const zoneStoryPreviewsMap = buildZoneStoryPreviewsMap();

  return (
    // 宇宙地圖首屏幾乎沒有長文，卻要跟兩支合計 895KB 的中文字型搶頻寬——
    // 在 1.6Mbps 量到 LCP 4468ms。沿用 /stories 既有的延後品牌字型機制：
    // 先用系統 CJK 完成首次 layout，SiteNavBar 的 idle callback 確認 fonts.load
    // 之後才切回品牌字（見 app/globals.css 的 data-deferred-brand-font 區塊）。
    <main data-deferred-brand-font="universe-map">
      <link
        rel="preload"
        as="image"
        type="image/webp"
        href={carParkTilePreload.webpSrc}
        imageSrcSet={carParkTilePreload.webpSrcSet}
        imageSizes={carParkTilePreload.sizes}
      />
      <UniverseMap zoneStoryPreviewsMap={zoneStoryPreviewsMap}>
        {children}
      </UniverseMap>
      {modal}
    </main>
  );
}
