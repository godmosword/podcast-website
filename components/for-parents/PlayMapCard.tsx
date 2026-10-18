"use client";

import { buildGoogleMapsNavUrl, type Playground } from "@/data/playgrounds";
import { composeParentBlurb } from "@/lib/playground-parent-voice";
import Icon from "@/components/ui/Icon";
import type { PlayMapCardProps } from "./PlayMapContract";
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
 * 純文字卡：名稱＋車程 → 區 · 類型 · 免費 · 戶外 → 家長筆記，右上一顆導航。
 * 類型插畫、類型色框已移除（43 張公園卡同一張圖，不帶資訊）；
 * 事實寫成文字而不是 pill，免得看起來像能點的篩選 chip。
 *
 * 導航必須是 cardMain button 的**兄弟節點**，不能包在 button 裡（巢狀互動元素）。
 */
export function PlayMapCard({
  place,
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
  const meta = [area, place.type].filter(Boolean).join(" · ");
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
          <span className={styles.cardHead}>
            <span className={styles.cardName}>{place.name}</span>
            {closed ? (
              <span className={styles.cardClosed}>暫停營業</span>
            ) : distanceLabel ? (
              <span className={styles.cardDistance}>{distanceLabel}</span>
            ) : null}
          </span>
          <span className={styles.cardMeta}>
            {meta}
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
          <span className={styles.cardBlurb}>{blurb}</span>
        </button>
        <a
          className={styles.cardNav}
          href={buildGoogleMapsNavUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`導航前往 ${place.name}（另開視窗）`}
        >
          導航
          <Icon name="external" size={16} />
        </a>
      </article>
    </li>
  );
}
