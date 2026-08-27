"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  buildPlayMapQueryString,
  parsePlayMapQuery,
} from "@/lib/playgrounds-query";
import PlayMap from "./PlayMap";

/** 靜態殼 fallback：不讀 URL，避免 searchParams 把整頁打成 dynamic。 */
export function PlayMapFallback() {
  return <PlayMap />;
}

function queryFromSearchParams(searchParams: {
  get(name: string): string | null;
}) {
  return parsePlayMapQuery({
    city: searchParams.get("city") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    indoor: searchParams.get("indoor") ?? undefined,
    outdoor: searchParams.get("outdoor") ?? undefined,
    free: searchParams.get("free") ?? undefined,
    rain: searchParams.get("rain") ?? undefined,
    parking: searchParams.get("parking") ?? undefined,
    stroller: searchParams.get("stroller") ?? undefined,
    energy: searchParams.get("energy") ?? undefined,
    view: searchParams.get("view") ?? undefined,
  });
}

/** 小型 client island：只在這裡解讀可分享的 filter URL。 */
export default function PlayMapClient() {
  const searchParams = useSearchParams();
  const query = queryFromSearchParams(searchParams);
  useEffect(() => {
    if (searchParams.get("view") !== "map") return;
    if (query.city) return;
    const qs = buildPlayMapQueryString(query);
    const next = qs
      ? `/for-parents/play-map?${qs}`
      : "/for-parents/play-map";
    window.history.replaceState(window.history.state, "", next);
    // 只在進頁做一次；定位到達後不得把使用者彈回地圖。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
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
  );
}
