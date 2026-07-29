"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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

/** `/adventures/<zone>/<hotspot>` 時島 sheet 讓位給熱點 modal（inert）。 */
function isHotspotPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const segs = pathname.replace(/^\/adventures\/?/, "").split("/").filter(Boolean);
  return segs.length >= 2;
}

/**
 * `/adventures/[zone]` 島內 overlay：預設只顯示召喚把手；`?sheet=1` 或點把手才展開。
 * ✕／Esc 收合抽屜（清 `?sheet=1`），離島仍由再點同島／MapControls 負責。
 */
export default function ZoneIslandPage({
  zone,
  hotspots,
  zoneStories,
}: ZoneIslandPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const completedSlugs = useCompletedSlugs();
  const hotspotOpen = isHotspotPath(pathname);

  const sheetFromQuery = searchParams.get("sheet") === "1";
  const [expanded, setExpanded] = useState(sheetFromQuery);

  useEffect(() => {
    setExpanded(sheetFromQuery);
  }, [sheetFromQuery, zone.id]);

  const syncSheetQuery = useCallback(
    (open: boolean) => {
      // 一律以 zone.id 組路徑，避免換島／軟導航時 pathname 落後寫到舊島（對抗審 #10）。
      const base = `/adventures/${zone.id}`;
      const params = new URLSearchParams(
        // 只保留非 sheet 參數（若有）
        [...searchParams.entries()].filter(([k]) => k !== "sheet"),
      );
      if (open) {
        params.set("sheet", "1");
      }
      const qs = params.toString();
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    },
    [router, searchParams, zone.id],
  );

  const handleExpand = useCallback(() => {
    setExpanded(true);
    syncSheetQuery(true);
  }, [syncSheetQuery]);

  const handleCollapse = useCallback(() => {
    setExpanded(false);
    syncSheetQuery(false);
  }, [syncSheetQuery]);

  return (
    <ZoneSheet
      zone={zone}
      hotspots={hotspots}
      zoneStories={zoneStories}
      completedSlugs={completedSlugs}
      expanded={expanded}
      onExpand={handleExpand}
      onCollapse={handleCollapse}
      inert={hotspotOpen}
    />
  );
}
