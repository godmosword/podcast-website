"use client";

import { buildGoogleMapsNavUrl } from "@/data/playgrounds";
import {
  formatAgeRangeLabel,
  listPlaceDecisionTags,
} from "@/lib/playground-distance";
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
  onShowOnMap,
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
  const meta = [area, place.type, distanceLabel].filter(Boolean).join(" · ");

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
          <span className={styles.cardText}>
            <span className={styles.cardName}>{place.name}</span>
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
          </span>
        </button>
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.cardMapBtn}
            aria-label={`在地圖上看 ${place.name}`}
            onClick={(event) => onShowOnMap(place.id, event.currentTarget)}
          >
            在地圖看
          </button>
          <a
            className={styles.cardNav}
            href={buildGoogleMapsNavUrl(place.lat, place.lng)}
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
