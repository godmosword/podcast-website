import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ZoneIslandPage from "@/components/universe/ZoneIslandPage";
import {
  STATUS_META,
  ZONE_IDS,
  universe,
  zoneById,
} from "@/data/universe";
import { zoneToDef } from "@/data/universe-zones";
import { buildZoneStoryPreviewsMap } from "@/lib/story-zone-query";
import { getSiteUrl } from "@/lib/site-url";

type ZonePageProps = {
  params: Promise<{ zone: string }>;
};

export function generateStaticParams() {
  return ZONE_IDS.map((zone) => ({ zone }));
}

export async function generateMetadata({
  params,
}: ZonePageProps): Promise<Metadata> {
  const { zone: id } = await params;
  const zone = zoneById(id);
  if (!zone) return {};

  const title = `${zone.name} · 車車宇宙`;
  const description = zone.tagline;
  const url = `${getSiteUrl()}/adventures/${zone.id}`;
  const open = zone.status === "open";

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: open ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url,
    },
  };
}

/**
 * L1 島內頁：SSR 真實 HTML（島名／tagline／狀態／連結／hotspots）。
 * 未開放島渲染「敬請期待」而非 404。
 */
export default async function AdventuresZonePage({ params }: ZonePageProps) {
  const { zone: id } = await params;
  const zone = zoneById(id);
  if (!zone) notFound();

  const def = zoneToDef(zone);
  const stories = buildZoneStoryPreviewsMap()[zone.id] ?? null;
  const meta = STATUS_META[zone.status];

  return (
    <>
      {/* 爬蟲／無 JS fallback：與 overlay 同源文案 */}
      <article className="sr-only">
        <h1>{zone.name}</h1>
        <p>
          {meta.label}：{zone.tagline}
        </p>
        {zone.childHint ? <p>{zone.childHint}</p> : null}
        {zone.exploreNote ? <p>{zone.exploreNote}</p> : null}
        {zone.status !== "open" ? <p>敬請期待</p> : null}
        <ul>
          {zone.links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
        {universe.zones.length > 0 ? (
          <p>
            車車宇宙共有 {universe.zones.length} 座島嶼。
          </p>
        ) : null}
      </article>

      <ZoneIslandPage
        zone={def}
        hotspots={zone.hotspots}
        zoneStories={stories}
      />
    </>
  );
}
