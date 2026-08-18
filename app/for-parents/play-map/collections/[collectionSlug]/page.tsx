import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import {
  PLAY_MAP_EDITORIAL_PICKS,
  type PlayMapEditorialIntent,
} from "@/data/play-map-editorial-picks";
import { resolvePlayMapEditorialPick } from "@/lib/play-map-editorial";
import {
  assertCollectionDefinitions,
  collectionDescription,
  collectionMapPath,
  collectionPath,
  isCollectionIndexable,
  listCollectionDefinitions,
  relatedCollections,
  resolveCollectionBySlug,
} from "@/lib/playground-collections";
import { breadcrumbListJsonLd, playgroundCollectionJsonLd } from "@/lib/json-ld";
import { PlayMapCollectionCard } from "@/components/for-parents/PlayMapCollectionCard";
import styles from "./page.module.css";

type CollectionPageProps = {
  params: Promise<{ collectionSlug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  assertCollectionDefinitions();
  return listCollectionDefinitions().map(({ slug: collectionSlug }) => ({
    collectionSlug,
  }));
}

function resolveIndexableCollection(slug: string) {
  const resolved = resolveCollectionBySlug(slug);
  if (!resolved || !isCollectionIndexable(resolved)) return undefined;
  return resolved;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { collectionSlug } = await params;
  const resolved = resolveIndexableCollection(collectionSlug);

  if (!resolved) {
    return { title: { absolute: "找不到親子景點集合" } };
  }

  const description = collectionDescription(resolved);
  const title = `${resolved.definition.title}｜車車遊樂園`;
  const url = collectionPath(resolved.definition.slug);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
  };
}

function Breadcrumbs({ title }: { title: string }) {
  return (
    <nav className={styles.breadcrumbs} aria-label="麵包屑">
      <ol>
        <li>
          <Link href="/">首頁</Link>
        </li>
        <li>
          <Link href="/for-parents">家長專區</Link>
        </li>
        <li>
          <Link href="/for-parents/play-map">親子遊樂地圖</Link>
        </li>
        <li>
          <Link href="/for-parents/play-map/collections">
            各地親子景點整理
          </Link>
        </li>
        <li aria-current="page">{title}</li>
      </ol>
    </nav>
  );
}

function editorialIntents(
  family: "city" | "free" | "indoor",
): readonly PlayMapEditorialIntent[] {
  if (family === "free") return ["free"];
  if (family === "indoor") return ["indoor"];
  return [];
}

export default async function PlaygroundCollectionPage({
  params,
}: CollectionPageProps) {
  const { collectionSlug } = await params;
  assertCollectionDefinitions();
  const resolved = resolveIndexableCollection(collectionSlug);

  if (!resolved) notFound();

  const { definition } = resolved;
  const editorialPick = resolvePlayMapEditorialPick({
    finalResults: resolved.places,
    scope: "city",
    activeIntents: editorialIntents(definition.family),
    picks: PLAY_MAP_EDITORIAL_PICKS,
  });
  const related = relatedCollections(definition);
  const detailUrl = collectionPath(definition.slug);
  const filterLabel =
    definition.family === "city"
      ? definition.city
      : `${definition.city}＋${definition.family === "free" ? "免費" : "室內"}`;

  return (
    <main className={styles.main}>
      <JsonLd data={playgroundCollectionJsonLd(resolved)} />
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "首頁", url: "/" },
          { name: "家長專區", url: "/for-parents" },
          { name: "親子遊樂地圖", url: "/for-parents/play-map" },
          {
            name: "各地親子景點整理",
            url: "/for-parents/play-map/collections",
          },
          { name: definition.title, url: detailUrl },
        ])}
      />

      <div className={styles.shell}>
        <Breadcrumbs title={definition.title} />
        <Link className={styles.backLink} href="/for-parents/play-map/collections">
          ← 回各地親子景點整理
        </Link>

        <article>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>{definition.cityDisplayName}</p>
            <h1>{definition.title}</h1>
            <p className={styles.summary}>{collectionDescription(resolved)}</p>
          </header>

          <div className={styles.actions}>
            <Link className={styles.mapAction} href={collectionMapPath(definition)}>
              在地圖上看
            </Link>
          </div>

          <section className={styles.section} aria-labelledby="places-heading">
            <div className={styles.sectionHeading}>
              <h2 id="places-heading">目前可安排的景點</h2>
              <span>{resolved.activeCount} 個</span>
            </div>
            <ul className={styles.cardGrid}>
              {resolved.places.map((place) => (
                <PlayMapCollectionCard key={place.id} place={place} />
              ))}
            </ul>
          </section>

          {editorialPick ? (
            <section
              className={`${styles.section} ${styles.editorial}`}
              aria-labelledby="editorial-heading"
            >
              <p className={styles.editorialEyebrow} id="editorial-heading">
                ⭐ 媽米先幫你看
              </p>
              <p className={styles.editorialName}>{editorialPick.place.name}</p>
              <p>{editorialPick.pick.reason}</p>
              <Link href={`/for-parents/play-map/${encodeURIComponent(editorialPick.place.id)}`}>
                查看景點詳情 →
              </Link>
            </section>
          ) : null}

          {related.length > 0 ? (
            <section className={styles.section} aria-labelledby="related-heading">
              <div className={styles.sectionHeading}>
                <h2 id="related-heading">也可以看看</h2>
              </div>
              <ul className={styles.relatedList}>
                {related.map((relatedDefinition) => (
                  <li key={relatedDefinition.slug}>
                    <Link href={collectionPath(relatedDefinition.slug)}>
                      {relatedDefinition.title} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section
            className={`${styles.section} ${styles.explanation}`}
            aria-labelledby="explanation-heading"
          >
            <h2 id="explanation-heading">資料與篩選方式</h2>
            <p>
              本頁依「{filterLabel}」的親子遊樂地圖條件整理，景點卡片連到各自的 PR7 詳情頁；暫停營業地點不列入本頁的 active 清單。
            </p>
            {resolved.matchingCount !== resolved.activeCount ? (
              <p>
                原始條件共找到 {resolved.matchingCount} 筆，其中 {resolved.activeCount} 筆目前可安排。
              </p>
            ) : null}
          </section>
        </article>
      </div>

      <SiteFooter
        compact
        showPlatformSubscribe={false}
        parentNote="給家長：資料為人工整理，出發前請再確認官網的營業時間與收費。"
      />
    </main>
  );
}
