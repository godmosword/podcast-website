"use client";

import {
  buildGoogleMapsNavUrl,
  type PlaygroundType,
} from "@/data/playgrounds";
import {
  formatAgeRangeLabel,
  listPlaceDecisionTags,
} from "@/lib/playground-distance";
import type { PlayMapCardProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

function typeDataAttr(type: PlaygroundType): string {
  switch (type) {
    case "公園":
      return "park";
    case "室內樂園":
      return "indoor-park";
    case "主題樂園":
      return "theme-park";
    case "博物館":
      return "museum";
    case "動物園":
      return "zoo";
    case "農場":
      return "farm";
    case "其他":
      return "other";
  }
}

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
  /* 類型原本只靠左側 4px 色條傳達（色彩單一編碼），補文字讓它可讀。 */
  const meta = [area, place.type, distanceLabel].filter(Boolean).join(" · ");

  return (
    <li hidden={hidden}>
      <article
        className={[styles.card, selected ? styles.cardSelected : ""]
          .filter(Boolean)
          .join(" ")}
        data-type={typeDataAttr(place.type)}
      >
        <button
          type="button"
          className={styles.cardMain}
          aria-expanded={selected}
          onClick={(event) => onSelect(place.id, event.currentTarget)}
        >
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
      </article>
    </li>
  );
}
