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
    <main>
      <link
        rel="preload"
        as="image"
        type="image/webp"
        href={carParkTilePreload.webpSrc}
        imageSrcSet={carParkTilePreload.webpSrcSet}
        imageSizes={carParkTilePreload.sizes}
      />
      <link
        rel="preload"
        as="image"
        href={carParkTilePreload.src}
        imageSrcSet={carParkTilePreload.srcSet}
        imageSizes={carParkTilePreload.sizes}
      />
      <UniverseMap zoneStoryPreviewsMap={zoneStoryPreviewsMap}>
        {children}
      </UniverseMap>
      {modal}
    </main>
  );
}
