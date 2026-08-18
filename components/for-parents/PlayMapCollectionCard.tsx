import Link from "next/link";
import type { Playground } from "@/data/playgrounds";
import { formatAgeRangeLabel } from "@/lib/playground-distance";
import { composeParentBlurb, clipParentVoice } from "@/lib/playground-parent-voice";
import { playgroundDetailPath } from "@/lib/playground-detail";
import styles from "./PlayMapCollectionCard.module.css";

type PlayMapCollectionCardProps = {
  place: Playground;
  deemphasizeFreeFlag?: boolean;
};

export function PlayMapCollectionCard({
  place,
  deemphasizeFreeFlag = false,
}: PlayMapCollectionCardProps) {
  const area = [place.city, place.district].filter(Boolean).join(" · ");
  const excerpt = clipParentVoice(composeParentBlurb(place), 88);
  const flags = [
    { label: place.free ? "免費" : "需購票", kind: "price" },
    { label: place.indoor ? "室內" : "戶外", kind: "environment" },
    { label: formatAgeRangeLabel(place.ageRange), kind: "age" },
  ];

  return (
    <li data-collection-card="true">
      <Link className={styles.card} href={playgroundDetailPath(place.id)}>
        <article>
          <div className={styles.heading}>
            <h3>{place.name}</h3>
            <span className={styles.arrow} aria-hidden>
              →
            </span>
          </div>
          <p className={styles.meta}>
            {area} · {place.type}
          </p>
          <ul className={styles.flags} aria-label={`${place.name}重點`}>
            {flags.map((flag) => (
              <li
                key={flag.label}
                data-redundant-flag={
                  deemphasizeFreeFlag && flag.kind === "price" && place.free
                    ? "true"
                    : undefined
                }
              >
                {flag.label}
              </li>
            ))}
          </ul>
          <p className={styles.excerpt}>{excerpt}</p>
        </article>
      </Link>
    </li>
  );
}
