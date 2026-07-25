"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Hotspot } from "@/data/universe";
import type { ZoneDef } from "@/data/universe-zones";
import type { ZoneStoriesBundle } from "@/lib/story-zone-query";
import { useCompletedSlugs } from "@/hooks/useZoneProgress";
import ZoneSheet from "./ZoneSheet";

type ZoneIslandPageProps = {
  zone: ZoneDef;
  hotspots: readonly Hotspot[];
  zoneStories?: ZoneStoriesBundle | null;
};

/** `/adventures/<zone>/<hotspot>` 時島 sheet 讓位給熱點 modal（focus／inert）。 */
function isHotspotPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const segs = pathname.replace(/^\/adventures\/?/, "").split("/").filter(Boolean);
  return segs.length >= 2;
}

/**
 * `/adventures/[zone]` 島內 overlay（client 島）：關閉／Esc／回樂園 → 回世界地圖路由。
 * 內容仍由 Server page 傳入，可 SSR 出真實 HTML。
 */
export default function ZoneIslandPage({
  zone,
  hotspots,
  zoneStories,
}: ZoneIslandPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const completedSlugs = useCompletedSlugs();
  const hotspotOpen = isHotspotPath(pathname);

  return (
    <ZoneSheet
      zone={zone}
      hotspots={hotspots}
      zoneStories={zoneStories}
      completedSlugs={completedSlugs}
      focusOnMount={!hotspotOpen}
      suppressFocusTrap={hotspotOpen}
      inert={hotspotOpen}
      onClose={() => {
        router.push("/adventures");
      }}
    />
  );
}
