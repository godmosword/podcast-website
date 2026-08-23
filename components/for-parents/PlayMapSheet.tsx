"use client";

import Link from "next/link";
import { useEffect } from "react";
import DuduSprite from "@/components/dudu/DuduSprite";
import {
  buildGoogleMapsNavUrl,
  buildGoogleMapsPlaceUrl,
  type Playground,
  type PlaygroundSourceKind,
} from "@/data/playgrounds";
import {
  formatAgeRangeLabel,
  listPlaceDecisionTags,
} from "@/lib/playground-distance";
import { formatVerifiedMonthLabel } from "@/lib/playground-parent-voice";
import { SHEET_BG_HINT_ID, type PlayMapSheetProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

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

function needsCommercialNotice(place: Playground): boolean {
  return !place.free;
}

/**
 * full sheet 的關鍵事實。**車程放第一格**——那是家長打開詳情後最先要的決定依據；
 * 原本擠在一行 meta 的最後面，實際上最難掃到。
 */
function listFullSheetFacts(
  place: Playground,
  distanceLabel: string | null,
): string[] {
  const area = place.district ? `${place.city} ${place.district}` : place.city;
  return [
    ...(distanceLabel ? [distanceLabel] : []),
    area,
    place.type,
    formatAgeRangeLabel(place.ageRange),
    place.free ? "免費" : "需購票",
    place.indoor ? "室內" : "戶外",
  ];
}

function CoverageNote({ text }: { text: string }) {
  return (
    <p className={styles.coverageNote}>
      <span className={styles.coverageNoteLabel}>資料範圍</span>
      {text}
    </p>
  );
}

export function PlayMapSheet({
  place,
  variant,
  distanceLabel,
  onClose,
  onExpand,
  onShowOnMap,
  panelRef,
}: PlayMapSheetProps) {
  const compact = variant === "compact";
  const decisionTags = listPlaceDecisionTags(place);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, [panelRef, place.id, variant]);

  return (
    <aside
      ref={panelRef}
      className={styles.sheet}
      role="region"
      aria-label={`${place.name} 詳情`}
      aria-describedby={SHEET_BG_HINT_ID}
      tabIndex={-1}
      data-variant={variant}
    >
      <p id={SHEET_BG_HINT_ID} className={styles.sheetBgHint}>
        關閉後可繼續瀏覽地圖與列表，不需離開本頁。
      </p>
      <div className={styles.sheetHeader}>
        <span className={styles.sheetBrand} aria-hidden>
          <DuduSprite emotion="star" decorative />
        </span>
        <h2 className={styles.sheetTitle}>{place.name}</h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="關閉地點詳情"
        >
          關閉
        </button>
      </div>

      {/*
       * 休園警告排在所有內容之前，compact 與 full 都顯示。
       * 只寫在 coverageNote 不夠——那段在 full sheet 中段，家長可能先按了導航。
       */}
      {place.status === "temporarily-closed" ? (
        <p className={styles.closedNotice} role="alert">
          <span className={styles.closedNoticeLabel}>暫停營業</span>
          官方公告休園整修中，出發前請先電話確認是否已重新開放。
        </p>
      ) : null}

      {compact ? (
        <>
          {decisionTags.length > 0 ? (
            <ul className={styles.sheetTagList} aria-label="關鍵標籤">
              {decisionTags.map((tag) => (
                <li key={tag} className={styles.flag}>
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
          <p className={styles.address}>
            {place.address}
            {distanceLabel ? ` · ${distanceLabel}` : ""}
          </p>
          {place.coverageNote ? (
            <CoverageNote text={place.coverageNote} />
          ) : null}
          <div className={styles.actions}>
            <a
              className={styles.navButton}
              href={buildGoogleMapsNavUrl(place)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`開啟 Google 地圖導航前往 ${place.name}（另開視窗）`}
            >
              導航
            </a>
            <button
              type="button"
              className={styles.moreButton}
              onClick={onExpand}
            >
              更多
            </button>
          </div>
        </>
      ) : (
        <>
          <ul className={styles.sheetTagList} aria-label="關鍵資訊">
            {listFullSheetFacts(place, distanceLabel).map((fact) => (
              <li key={fact} className={styles.flag}>
                {fact}
              </li>
            ))}
          </ul>

          {place.tips ? (
            <p className={styles.tips}>
              <span className={styles.tipsLabel}>帶小孩時</span>
              {place.tips}
            </p>
          ) : null}

          {place.coverageNote ? (
            <CoverageNote text={place.coverageNote} />
          ) : null}

          {place.feeNote ? (
            <p className={styles.feeNote}>
              <span className={styles.feeNoteLabel}>收費</span>
              {place.feeNote}
            </p>
          ) : null}

          {needsCommercialNotice(place) ? (
            <p className={styles.volatilityNotice} role="note">
              票價與營業時間易變動，出發前請以官網為準。
            </p>
          ) : null}

          <p className={styles.address}>{place.address}</p>

          <p className={styles.verified}>
            {formatVerifiedMonthLabel(place.lastVerified)}
          </p>

          {place.sources.length > 0 ? (
            <details className={styles.sourcesDetails}>
              <summary className={styles.sourcesSummary}>資料來源</summary>
              <ul className={styles.sourcesList}>
                {place.sources.map((source) => (
                  <li key={`${source.kind}-${source.url}`}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${source.name}（${sourceKindLabel(source.kind)}，另開視窗）`}
                    >
                      {source.name}
                      <span className={styles.sourceKind}>
                        {sourceKindLabel(source.kind)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {/*
            出口分兩層：導航與完整資訊是家長真正要走的路，
            在地圖看／顯示位置／官網降成文字連結，不跟主要出口搶點擊。
            所有 aria-label 維持原字串（e2e 契約）。
          */}
          <div className={styles.actions}>
            <a
              className={styles.navButton}
              href={buildGoogleMapsNavUrl(place)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`開啟 Google 地圖導航前往 ${place.name}（另開視窗）`}
            >
              導航
            </a>
            <Link
              className={styles.moreButton}
              href={`/for-parents/play-map/${encodeURIComponent(place.id)}`}
            >
              查看完整資訊
            </Link>
          </div>

          <div className={styles.sheetSecondaryActions}>
            <button
              type="button"
              className={styles.moreButton}
              aria-label={`在地圖上看 ${place.name}`}
              onClick={(event) => onShowOnMap(place.id, event.currentTarget)}
            >
              在地圖看
            </button>
            <a
              className={styles.placeLink}
              href={buildGoogleMapsPlaceUrl(place)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`在 Google 地圖只顯示 ${place.name} 位置（另開視窗）`}
            >
              顯示位置
            </a>
            {place.officialUrl ? (
              <a
                className={styles.officialLink}
                href={place.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`開啟 ${place.name} 官網（另開視窗）`}
              >
                官網
              </a>
            ) : null}
          </div>
        </>
      )}
    </aside>
  );
}
