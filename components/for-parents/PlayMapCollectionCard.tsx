import Link from "next/link";
import type { Playground } from "@/data/playgrounds";
import { formatAgeRangeLabel } from "@/lib/playground-distance";
import { composeParentBlurb, clipParentVoice } from "@/lib/playground-parent-voice";
import { playgroundDetailPath } from "@/lib/playground-detail";
import Icon from "@/components/ui/Icon";
import { PlaygroundTypeBadge } from "./PlaygroundTypeBadge";
import styles from "./PlayMapCollectionCard.module.css";

type PlayMapCollectionCardProps = {
  place: Playground;
  deemphasizeFreeFlag?: boolean;
};

/**
 * 各地整理頁的景點卡，和地圖名單卡同一套語彙：類型圓章＋類型 → 名稱 → 家長 tips → 區 · 事實。
 * 事實是純文字、用中點接（不做成 pill，pill 會被讀成可點的篩選）。整張卡是一個連結。
 */
export function PlayMapCollectionCard({
  place,
  deemphasizeFreeFlag = false,
}: PlayMapCollectionCardProps) {
  // 整頁都是同一個縣市，卡上只寫區（和地圖名單卡一樣）。
  const area = place.district ?? place.city;
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
          <p className={styles.type}>
            <PlaygroundTypeBadge type={place.type} />
            <span>{place.type}</span>
          </p>
          <div className={styles.heading}>
            <h3>{place.name}</h3>
            <span className={styles.arrow}>
              <Icon name="arrow-right" size={22} />
            </span>
          </div>
          <p className={styles.excerpt}>{excerpt}</p>
          <div className={styles.meta}>
            <span>{area}</span>
            <ul className={styles.flags} role="list" aria-label={`${place.name}重點`}>
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
          </div>
        </article>
      </Link>
    </li>
  );
}
