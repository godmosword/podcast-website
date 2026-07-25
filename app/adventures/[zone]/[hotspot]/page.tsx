import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HotspotModal from "@/components/universe/HotspotModal";
import { ZONE_IDS, zoneById } from "@/data/universe";
import { hotspotById } from "@/lib/universe/hotspot";
import { getSiteUrl } from "@/lib/site-url";

type Props = {
  params: Promise<{ zone: string; hotspot: string }>;
};

export function generateStaticParams() {
  return ZONE_IDS.flatMap((zoneId) => {
    const zone = zoneById(zoneId);
    if (!zone) return [];
    return zone.hotspots.map((hotspot) => ({
      zone: zoneId,
      hotspot: hotspot.id,
    }));
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zone: zoneId, hotspot: hotspotId } = await params;
  const found = hotspotById(zoneId, hotspotId);
  if (!found) return {};

  const title = `${found.hotspot.name} · ${found.zone.name}`;
  const description =
    found.hotspot.action.type === "locked"
      ? found.hotspot.action.hint
      : `${found.zone.name}的探索點：${found.hotspot.name}`;
  const url = `${getSiteUrl()}/adventures/${found.zone.id}/${found.hotspot.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots:
      found.zone.status === "open"
        ? undefined
        : { index: false, follow: true },
    openGraph: { title, description, url },
  };
}

/** 硬導航／分享連結：全頁熱點詳情（地圖仍由 layout 保活）。 */
export default async function AdventuresHotspotPage({ params }: Props) {
  const { zone: zoneId, hotspot: hotspotId } = await params;
  const found = hotspotById(zoneId, hotspotId);
  if (!found) notFound();

  return (
    <>
      <article className="sr-only">
        <h1>{found.hotspot.name}</h1>
        <p>{found.zone.name}</p>
        {found.hotspot.action.type === "locked" ? (
          <p>{found.hotspot.action.hint}</p>
        ) : null}
      </article>
      <HotspotModal zone={found.zone} hotspot={found.hotspot} mode="page" />
    </>
  );
}
