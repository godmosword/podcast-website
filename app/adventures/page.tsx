import type { Metadata } from "next";
import { STATUS_META, universe } from "@/data/universe";
import { getCarParkLinks } from "@/lib/universe-map";
import { notifyMailto } from "@/lib/contact";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "車車宇宙 · 樂園地圖",
  description:
    "鳥瞰車車宇宙群島：車車樂園、恐龍島、英雄救援隊與未來夢想島。點島出發聽故事、玩黏土，更多島嶼陸續登場。",
  alternates: { canonical: "/adventures" },
  openGraph: {
    title: "車車宇宙 · 樂園地圖",
    description: "鳥瞰車車宇宙群島，點島出發探索故事與遊戲。",
    url: `${getSiteUrl()}/adventures`,
  },
};

/** L0 世界地圖：地圖 chrome 在 MapStage；本頁提供 SEO／a11y 文字清單。 */
export default function AdventuresPage() {
  const carParkLinks = getCarParkLinks();

  return (
    <>
      <h1 className="sr-only">車車宇宙樂園地圖</h1>

      {/* 無障礙 / SEO fallback：SVG 對爬蟲不透明，提供純文字島嶼清單 */}
      <nav className="sr-only" aria-label="島嶼清單">
        <ul>
          {universe.zones.map((zone) => {
            const meta = STATUS_META[zone.status];
            const isCarPark = (zone.subSegmentIds?.length ?? 0) > 0;
            return (
              <li key={zone.id}>
                {zone.name}（{meta.label}）：{zone.tagline}
                {isCarPark ? (
                  <ul>
                    {carParkLinks.map((link) => (
                      <li key={link.href}>
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
                  <a href={notifyMailto(zone.name)} tabIndex={-1}>
                    通知我「{zone.name}」開幕
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
