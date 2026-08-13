"use client";

import { useEffect } from "react";
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
import { SHEET_BG_HINT_ID, type PlayMapSheetProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

function formatVerifiedDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
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

function needsCommercialNotice(place: Playground): boolean {
  return !place.free;
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
          <p className={styles.meta}>
            {place.city}
            {place.district ? ` · ${place.district}` : ""}
            {" · "}
            {place.type}
            {" · "}
            {formatAgeRangeLabel(place.ageRange)}
            {" · "}
            {place.free ? "免費" : "需購票"}
            {" · "}
            {place.indoor ? "室內" : "戶外"}
            {distanceLabel ? ` · ${distanceLabel}` : ""}
          </p>

          {place.tips ? (
            <p className={styles.tips}>
              <span className={styles.tipsLabel}>Tips</span>
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
            資料最後核對：{formatVerifiedDate(place.lastVerified)}
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
