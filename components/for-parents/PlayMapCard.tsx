"use client";

import { buildGoogleMapsNavUrl, type Playground } from "@/data/playgrounds";
import { composeParentBlurb } from "@/lib/playground-parent-voice";
import Icon from "@/components/ui/Icon";
import type { PlayMapCardProps } from "./PlayMapContract";
import { PlaygroundTypeBadge } from "./PlaygroundTypeBadge";
import styles from "./PlayMapCard.module.css";

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

/**
 * 卡片：類型圓章＋類型 → 名稱 → 「為什麼適合」理由（資料原詞）→ 家長 tips 兩行 → 區 · 事實。
 * 整張卡（cardMain）開詳情 sheet；導航是 soft 鈕＋橘色箭頭，放右下。
 *
 * 導航必須是 cardMain button 的**兄弟節點**，不能包在 button 裡（巢狀互動元素）。
 */
export function PlayMapCard({
  place,
  reason,
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
  const cardFacts = listPlayMapCardBinaryFacts(place);
  const area = place.district ?? place.city;
  const blurb = composeParentBlurb(place, undefined, { includeFacilities: false });
  const closed = place.status === "temporarily-closed";

  return (
    <li
      id={place.id}
      ref={(element) => registerCardRef(place.id, element)}
      hidden={hidden}
      data-card-state={selected ? "selected" : hovered ? "hover-correlated" : "default"}
    >
      <article
        className={[
          styles.card,
          hovered && !selected ? styles.cardCorrelated : "",
          selected ? styles.cardSelected : "",
        ]
          .filter(Boolean)
          .join(" ")}
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
          <span className={styles.cardType}>
            <PlaygroundTypeBadge type={place.type} />
            <span className={styles.cardTypeLabel}>{place.type}</span>
            {closed ? (
              <span className={styles.cardClosed}>暫停營業</span>
            ) : distanceLabel ? (
              <span className={styles.cardDistance}>{distanceLabel}</span>
            ) : null}
          </span>
          <span className={styles.cardName}>{place.name}</span>
          {reason ? (
            <span className={styles.cardReason} data-card-reason>
              {reason}
            </span>
          ) : null}
          <span className={styles.cardBlurb}>{blurb}</span>
          <span className={styles.cardMeta}>
            {area}
            {cardFacts.map((fact) => (
              <span
                key={fact.kind}
                className={styles.cardFact}
                data-card-fact={fact.kind}
              >
                {fact.label}
              </span>
            ))}
          </span>
        </button>
        <a
          className={styles.cardNav}
          href={buildGoogleMapsNavUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`導航前往 ${place.name}（另開視窗）`}
        >
          導航
          <span className={styles.cardNavArrow} aria-hidden>
            <Icon name="arrow-right" size={14} />
          </span>
        </a>
      </article>
    </li>
  );
}
