import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import {
  assertCollectionDefinitions,
  collectionPath,
  listCollectionDefinitions,
  resolveCollection,
} from "@/lib/playground-collections";
import { breadcrumbListJsonLd } from "@/lib/json-ld";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: "各地親子景點整理｜車車遊樂園" },
  description:
    "整理目前資料中達到收錄門檻的 15 個城市親子景點與 5 組免費景點，直接連到景點詳情與親子遊樂地圖。",
  alternates: { canonical: "/for-parents/play-map/collections" },
  openGraph: {
    title: "各地親子景點整理｜車車遊樂園",
    description:
      "依地區與需求整理的親子景點集合，連到景點詳情與親子遊樂地圖。",
    url: "/for-parents/play-map/collections",
    type: "website",
  },
};

function Breadcrumbs() {
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
        <li aria-current="page">各地親子景點整理</li>
      </ol>
    </nav>
  );
}

function CollectionLink({
  slug,
  title,
  count,
}: {
  slug: string;
  title: string;
  count: number;
}) {
  return (
    <li>
      <Link className={styles.collectionLink} href={collectionPath(slug)}>
        <span>
          <strong>{title}</strong>
          <small>{count} 個可以去的景點</small>
        </span>
        <span className={styles.linkArrow} aria-hidden>
          →
        </span>
      </Link>
    </li>
  );
}

export default function PlaygroundCollectionsIndexPage() {
  assertCollectionDefinitions();
  const cityCollections = listCollectionDefinitions("city");
  const intentCollections = listCollectionDefinitions().filter(
    (definition) => definition.family !== "city",
  );

  return (
    <main className={styles.main}>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "首頁", url: "/" },
          { name: "家長專區", url: "/for-parents" },
          { name: "親子遊樂地圖", url: "/for-parents/play-map" },
          {
            name: "各地親子景點整理",
            url: "/for-parents/play-map/collections",
          },
        ])}
      />

      <div className={styles.shell}>
        <Breadcrumbs />
        <Link className={styles.backLink} href="/for-parents/play-map">
          ← 回親子遊樂地圖
        </Link>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>親子遊樂地圖</p>
          <h1>各地親子景點整理</h1>
          <p>
            目前整理 {cityCollections.length} 個城市集合、{intentCollections.length} 組需求集合；每組都連到實際景點詳情頁。
          </p>
        </header>

        <section className={styles.section} aria-labelledby="city-heading">
          <div className={styles.sectionHeading}>
            <h2 id="city-heading">依地區找</h2>
            <span>{cityCollections.length} 組</span>
          </div>
          <ul className={styles.collectionGrid}>
            {cityCollections.map((definition) => {
              const resolved = resolveCollection(definition);
              return (
                <CollectionLink
                  key={definition.slug}
                  slug={definition.slug}
                  title={definition.title}
                  count={resolved.activeCount}
                />
              );
            })}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="intent-heading">
          <div className={styles.sectionHeading}>
            <h2 id="intent-heading">依需求找</h2>
            <span>{intentCollections.length} 組</span>
          </div>
          <ul className={styles.collectionGrid}>
            {intentCollections.map((definition) => {
              const resolved = resolveCollection(definition);
              return (
                <CollectionLink
                  key={definition.slug}
                  slug={definition.slug}
                  title={definition.title}
                  count={resolved.activeCount}
                />
              );
            })}
          </ul>
        </section>

        <p className={styles.note}>
          集合頁只列出目前可安排的地點；暫停營業景點仍保留在親子遊樂地圖與個別詳情頁。
        </p>
      </div>

      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
