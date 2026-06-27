import type { Metadata } from "next";
import UniverseMap from "@/components/universe/UniverseMap";
import { ZONE_STATUS_META, ZONES } from "@/data/universe-zones";
import { getCarParkLinks } from "@/lib/universe-map";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "車車宇宙 · 樂園地圖",
  description:
    "鳥瞰車車宇宙群島：車車樂園、恐龍島、英雄救援隊與未來園區。點島出發聽故事、玩黏土，更多園區陸續登場。",
  openGraph: {
    title: "車車宇宙 · 樂園地圖",
    description: "鳥瞰車車宇宙群島，點島出發探索故事與遊戲。",
    url: `${getSiteUrl()}/adventures`,
  },
};

const NOTIFY_EMAIL = "bonboncarstory@gmail.com";

export default function AdventuresPage() {
  const carParkLinks = getCarParkLinks();

  return (
    <main>
      <h1 className="sr-only">車車宇宙樂園地圖</h1>

      <UniverseMap />

      {/* 無障礙 / SEO fallback：SVG 對爬蟲不透明，提供純文字島嶼清單 */}
      <nav className="sr-only" aria-label="島嶼清單">
        <ul>
          {ZONES.map((zone) => {
            const meta = ZONE_STATUS_META[zone.status];
            const isCarPark = (zone.subSegmentIds?.length ?? 0) > 0;
            return (
              <li key={zone.id}>
                {zone.name}（{meta.label}）：{zone.teaser}
                {isCarPark ? (
                  <ul>
                    {carParkLinks.map((link) => (
                      <li key={link.href}>
                        {/* tabIndex -1：鍵盤使用者改用地圖上可見的島嶼 button；
                            此處純供報讀器瀏覽模式與爬蟲，避免 Tab 落在不可見元素 */}
                        <a
                          href={link.href}
                          tabIndex={-1}
                          {...(link.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <a
                    href={`mailto:${NOTIFY_EMAIL}?subject=${encodeURIComponent(
                      `通知我-${zone.name}`,
                    )}`}
                    tabIndex={-1}
                  >
                    通知我「{zone.name}」開幕
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </main>
  );
}
