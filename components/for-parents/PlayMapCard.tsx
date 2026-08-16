"use client";

import { buildGoogleMapsNavUrl } from "@/data/playgrounds";
import {
  formatAgeRangeLabel,
  listPlaceDecisionTags,
} from "@/lib/playground-distance";
import { composeParentBlurb } from "@/lib/playground-parent-voice";
import { playgroundTypeVisualKey } from "@/lib/playground-type-visual";
import type { PlayMapCardProps } from "./PlayMapContract";
import { PlaygroundTypeMark } from "./PlaygroundTypeMark";
import styles from "./PlayMap.module.css";

export function PlayMapCard({
  place,
  selected,
  hidden,
  distanceLabel,
  onSelect,
}: PlayMapCardProps) {
  /*
   * 年齡標籤在卡片層過濾掉：全站每筆都是同一個區間，73 張卡重複講 73 次是噪音，
   * 改由 toolbar 講一次。lib 的 listPlaceDecisionTags 不動，詳情 sheet 維持顯示。
   */
  const ageLabel = formatAgeRangeLabel(place.ageRange);
  const decisionTags = listPlaceDecisionTags(place).filter(
    (tag) => tag !== ageLabel,
  );
  const area = place.district ?? place.city;
  const meta = [area, place.type].filter(Boolean).join(" · ");
  const blurb = composeParentBlurb(place);

  return (
    <li hidden={hidden}>
      <article
        className={[styles.card, selected ? styles.cardSelected : ""]
          .filter(Boolean)
          .join(" ")}
        data-type={playgroundTypeVisualKey(place.type)}
      >
        <button
          type="button"
          className={styles.cardMain}
          aria-expanded={selected}
          aria-label={`${place.name}，查看詳情`}
          onClick={(event) => onSelect(place.id, event.currentTarget)}
        >
          <PlaygroundTypeMark type={place.type} />
          <span className={styles.cardBody}>
            <span className={styles.cardHead}>
              <span className={styles.cardName}>{place.name}</span>
              {distanceLabel ? (
                <span className={styles.cardDistance}>{distanceLabel}</span>
              ) : null}
            </span>
            {place.status === "temporarily-closed" ? (
              <span className={styles.cardClosed}>暫停營業</span>
            ) : null}
            <span className={styles.cardMeta}>{meta}</span>
            {decisionTags.length > 0 ? (
              <span className={styles.cardFlags}>
                {decisionTags.map((tag) => (
                  <span key={tag} className={styles.flag}>
                    {tag}
                  </span>
                ))}
              </span>
            ) : null}
            <span className={styles.cardBlurb}>{blurb}</span>
            <span className={styles.cardDetailsCta}>
              查看家長筆記 <span aria-hidden>→</span>
            </span>
          </span>
        </button>
        <div className={styles.cardActions}>
          <a
            className={styles.cardNav}
            href={buildGoogleMapsNavUrl(place)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`導航前往 ${place.name}（另開視窗）`}
          >
            導航
          </a>
        </div>
      </article>
    </li>
  );
}
