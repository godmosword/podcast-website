import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import { getStory } from "@/data/content";
import {
  buildGoogleMapsNavUrl,
  listPlaygrounds,
  type PlaygroundSourceKind,
} from "@/data/playgrounds";
import {
  breadcrumbListJsonLd,
  playgroundPlaceJsonLd,
} from "@/lib/json-ld";
import { formatAgeRangeLabel } from "@/lib/playground-distance";
import {
  isEasyParking,
  isStrollerFriendly,
} from "@/lib/playground-context";
import {
  playgroundDetailDescription,
  playgroundDetailPath,
  playgroundDetailTitle,
  playgroundFromRouteParam,
} from "@/lib/playground-detail";
import {
  formatNearbyDistanceLabel,
  resolveNearbyPlaces,
} from "@/lib/playground-nearby";
import { formatVerifiedMonthLabel } from "@/lib/playground-parent-voice";
import styles from "./page.module.css";

type PlaceDetailPageProps = {
  params: Promise<{ placeId: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return listPlaygrounds().map((place) => ({ placeId: place.id }));
}

export async function generateMetadata({
  params,
}: PlaceDetailPageProps): Promise<Metadata> {
  const { placeId } = await params;
  const place = playgroundFromRouteParam(placeId);

  if (!place) return { title: "找不到親子景點" };

  const title = playgroundDetailTitle(place);
  const description = playgroundDetailDescription(place);
  const url = playgroundDetailPath(place.id);

  return {
    // Use absolute to avoid the root layout appending the brand a second time.
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

function sourceKindLabel(kind: PlaygroundSourceKind): string {
  switch (kind) {
    case "official":
      return "官方";
    case "gov":
      return "政府";
    case "editorial":
      return "編輯";
  }
}

function Breadcrumbs({ placeName }: { placeName: string }) {
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
        <li aria-current="page">{placeName}</li>
      </ol>
    </nav>
  );
}

function DecisionFlags({
  place,
}: {
  place: NonNullable<ReturnType<typeof playgroundFromRouteParam>>;
}) {
  const flags = [
    place.free ? "免費" : "需購票",
    place.indoor ? "室內" : "戶外",
    `適合${formatAgeRangeLabel(place.ageRange)}`,
    ...(isEasyParking(place) ? ["停車方便"] : []),
    ...(isStrollerFriendly(place) ? ["推車友善"] : []),
  ];

  return (
    <ul className={styles.flags} aria-label="地點重點">
      {flags.map((flag) => (
        <li key={flag}>{flag}</li>
      ))}
    </ul>
  );
}

export default async function PlaygroundDetailPage({
  params,
}: PlaceDetailPageProps) {
  const { placeId } = await params;
  const place = playgroundFromRouteParam(placeId);

  if (!place) notFound();

  const nearby = resolveNearbyPlaces(place, listPlaygrounds(), 3);
  const relatedStories = (place.relatedEpisodes ?? [])
    .map((slug) => getStory(slug))
    .filter((story): story is NonNullable<ReturnType<typeof getStory>> => Boolean(story));
  const detailPath = playgroundDetailPath(place.id);

  return (
    <main className={styles.main}>
      <JsonLd data={playgroundPlaceJsonLd(place)} />
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "首頁", url: "/" },
          { name: "家長專區", url: "/for-parents" },
          { name: "親子遊樂地圖", url: "/for-parents/play-map" },
          { name: place.name, url: detailPath },
        ])}
      />

      <div className={styles.shell}>
        <Breadcrumbs placeName={place.name} />
        <Link href="/for-parents/play-map" className={styles.backLink}>
          ← 回親子遊樂地圖
        </Link>

        <article className={styles.article}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>
              {place.city}
              {place.district ? ` · ${place.district}` : ""}
              {` · ${place.type}`}
            </p>
            <h1 className={styles.title}>{place.name}</h1>
          </header>

          {place.status === "temporarily-closed" ? (
            <p className={styles.closedNotice} role="alert">
              <strong>暫停營業</strong>
              <span>
                目前資料顯示此地點暫停營業，出發前請先確認是否已重新開放。
              </span>
            </p>
          ) : null}

          <section
            className={styles.decisionSection}
            aria-labelledby="decision-heading"
          >
            <h2 id="decision-heading" className={styles.sectionTitle}>
              先看今天適不適合
            </h2>
            <DecisionFlags place={place} />
          </section>

          <section
            className={styles.parentNote}
            aria-labelledby="parent-note-heading"
          >
            <h2 id="parent-note-heading" className={styles.sectionTitle}>
              媽米帶孩子時會注意
            </h2>
            <p>{place.tips}</p>
          </section>

          <div className={styles.actions} aria-label="主要操作">
            <a
              className={styles.primaryAction}
              href={buildGoogleMapsNavUrl(place)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`開始導航前往 ${place.name}（另開視窗）`}
            >
              開始導航
            </a>
            {place.officialUrl ? (
              <a
                className={styles.secondaryAction}
                href={place.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`開啟 ${place.name} 官方網站（另開視窗）`}
              >
                官方網站 <span aria-hidden>↗</span>
              </a>
            ) : null}
          </div>

          {place.coverageNote ? (
            <p className={styles.coverageNote}>
              <strong>出發前注意</strong>
              <span>{place.coverageNote}</span>
            </p>
          ) : null}

          <section
            className={styles.infoSection}
            aria-labelledby="basic-info-heading"
          >
            <h2 id="basic-info-heading" className={styles.sectionTitle}>
              基本資訊
            </h2>
            <dl className={styles.facts}>
              <div>
                <dt>地點</dt>
                <dd>
                  {place.city}
                  {place.district ? ` · ${place.district}` : ""}
                </dd>
              </div>
              <div>
                <dt>類型</dt>
                <dd>{place.type}</dd>
              </div>
              <div>
                <dt>年齡</dt>
                <dd>{formatAgeRangeLabel(place.ageRange)}</dd>
              </div>
              <div>
                <dt>地址</dt>
                <dd>{place.address}</dd>
              </div>
              {place.feeNote ? (
                <div>
                  <dt>收費</dt>
                  <dd>{place.feeNote}</dd>
                </div>
              ) : null}
            </dl>
            {!place.free ? (
              <p className={styles.volatilityNote} role="note">
                票價與營業時間可能變動，出發前請以官方資訊為準。
              </p>
            ) : null}
          </section>

          <section
            className={styles.infoSection}
            aria-labelledby="facilities-heading"
          >
            <h2 id="facilities-heading" className={styles.sectionTitle}>
              現場設施
            </h2>
            <ul className={styles.facilities}>
              {place.facilities.map((facility) => (
                <li key={facility}>{facility}</li>
              ))}
            </ul>
          </section>

          {nearby.length > 0 ? (
            <section
              className={styles.infoSection}
              aria-labelledby="nearby-heading"
            >
              <h2 id="nearby-heading" className={styles.sectionTitle}>
                附近還能去哪裡？
              </h2>
              <ul className={styles.nearbyList}>
                {nearby.map(({ place: nearbyPlace, distanceKm }) => (
                  <li key={nearbyPlace.id}>
                    <Link href={playgroundDetailPath(nearbyPlace.id)}>
                      <span className={styles.nearbyName}>
                        {nearbyPlace.name}
                      </span>
                      <span className={styles.nearbyMeta}>
                        {nearbyPlace.city}
                        {nearbyPlace.district
                          ? ` · ${nearbyPlace.district}`
                          : ""}
                        {` · ${nearbyPlace.type}`}
                      </span>
                      <span className={styles.nearbyDistance}>
                        {formatNearbyDistanceLabel(distanceKm)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {relatedStories.length > 0 ? (
            <section
              className={styles.infoSection}
              aria-labelledby="related-stories-heading"
            >
              <h2 id="related-stories-heading" className={styles.sectionTitle}>
                相關故事
              </h2>
              <ul className={styles.inlineList}>
                {relatedStories.map((story) => (
                  <li key={story.slug}>
                    <Link href={`/story/${encodeURIComponent(story.slug)}`}>
                      {story.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section
            className={styles.verificationSection}
            aria-labelledby="verification-heading"
          >
            <h2 id="verification-heading" className={styles.sectionTitle}>
              資料最後核對日
            </h2>
            <p className={styles.verified}>
              {formatVerifiedMonthLabel(place.lastVerified)}
            </p>
            <details className={styles.sources}>
              <summary>查看資料來源</summary>
              <ul>
                {place.sources.map((source) => (
                  <li key={`${source.kind}-${source.url}`}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${source.name}（${sourceKindLabel(source.kind)}，另開視窗）`}
                    >
                      {source.name}
                      <span>{sourceKindLabel(source.kind)} · 另開視窗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        </article>
      </div>

      <SiteFooter compact />
    </main>
  );
}
