"use client";

import { buildGoogleMapsNavUrl, type Playground } from "@/data/playgrounds";
import { composeParentBlurb } from "@/lib/playground-parent-voice";
import { playgroundTypeVisualKey } from "@/lib/playground-type-visual";
import type { PlayMapCardProps } from "./PlayMapContract";
import { PlaygroundTypeMark } from "./PlaygroundTypeMark";
import styles from "./PlayMap.module.css";

type CardBinaryFact = {
  label: string;
  kind: "fee" | "environment";
};

/**
 * 名單卡片只明示兩項二元事實，不靠「沒有標籤」讓使用者自己推。
 * 「需購票」＝資料未標免費，不代表票價、預約或一律收費。
 * 「戶外」＝非室內，不推導遮蔭／天氣／雨天適不適合。
 */
export function listPlayMapCardBinaryFacts(
  place: Pick<Playground, "free" | "indoor">,
): readonly CardBinaryFact[] {
  return [
    { label: place.free ? "免費" : "需購票", kind: "fee" },
    { label: place.indoor ? "室內" : "戶外", kind: "environment" },
  ];
}

export function PlayMapCard({
  place,
  variant = "default",
  selected,
  hovered,
  hoverCorrelationEnabled,
  hidden,
  distanceLabel,
  onHover,
  onBlur,
  onSelect,
  registerCardRef,
}: PlayMapCardProps) {
  const mapSheet = variant === "mapSheet";
  const cardFacts = listPlayMapCardBinaryFacts(place);
  const area = place.district ?? place.city;
  const meta = [area, place.type].filter(Boolean).join(" · ");
  const blurb = composeParentBlurb(place);

  return (
    <li
      id={mapSheet ? undefined : place.id}
      data-place-id={mapSheet ? place.id : undefined}
      ref={(element) => registerCardRef(place.id, element)}
      hidden={hidden}
      data-card-state={selected ? "selected" : hovered ? "hover-correlated" : "default"}
    >
      <article
        className={[
          styles.card,
          mapSheet ? styles.cardMapSheet : "",
          hovered && !selected ? styles.cardCorrelated : "",
          selected ? styles.cardSelected : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-type={playgroundTypeVisualKey(place.type)}
        onPointerEnter={
          hoverCorrelationEnabled ? () => onHover(place.id) : undefined
        }
        onPointerLeave={
          hoverCorrelationEnabled ? () => onBlur(place.id) : undefined
        }
        onFocus={
          hoverCorrelationEnabled ? () => onHover(place.id) : undefined
        }
        onBlur={(event) => {
          if (!hoverCorrelationEnabled) return;
          const nextTarget = event.relatedTarget;
          if (
            nextTarget instanceof Node &&
            event.currentTarget.contains(nextTarget)
          ) {
            return;
          }
          onBlur(place.id);
        }}
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
            <span className={styles.cardFlags}>
              {cardFacts.map((fact) => (
                <span key={fact.kind} className={styles.flag}>
                  {fact.label}
                </span>
              ))}
            </span>
            <span className={styles.cardBlurb}>{blurb}</span>
          </span>
        </button>
        {!mapSheet ? (
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
        ) : null}
      </article>
    </li>
  );
}
