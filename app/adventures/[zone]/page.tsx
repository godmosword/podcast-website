import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STATUS_META, ZONE_IDS, zoneById } from "@/data/universe";
import {
  buildZoneStoryPreviewsMap,
  zoneStoryTitleLines,
} from "@/lib/story-zone-query";
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
 * 互動選單已卸載——點島改飛鏡頭＋探索點；此頁只保留 GEO／無 JS fallback。
 * 未開放島渲染「敬請期待」而非 404。
 */
export default async function AdventuresZonePage({ params }: ZonePageProps) {
  const { zone: id } = await params;
  const zone = zoneById(id);
  if (!zone) notFound();

  const zoneStories = buildZoneStoryPreviewsMap()[zone.id] ?? null;
  const storyTitles =
    zoneStories && zoneStories.total > 0 ? zoneStoryTitleLines(zone.id) : [];
  const meta = STATUS_META[zone.status];

  return (
    <>
      {/* 爬蟲／無 JS fallback：島專屬文案（勿放全站統計句，避免五頁重複雜訊） */}
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
        {storyTitles.length > 0 ? (
          <>
            <h2>這個島的故事</h2>
            <ul>
              {storyTitles.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        ) : null}
      </article>
    </>
  );
}
