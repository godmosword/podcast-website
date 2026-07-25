"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ZONE_STATUS_META, type ZoneDef } from "@/data/universe-zones";
import type { LandingSegmentId } from "@/data/landing-segments";
import { getCarParkLinks } from "@/lib/universe-map";
import { notifyMailto } from "@/lib/contact";
import {
  trackUniverseSheetLink,
  trackUniverseWishSubmit,
  trackWishSubmitted,
} from "@/lib/analytics";
import type { ZoneStoriesBundle } from "@/lib/story-zone-query";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import ParentTrustStrip from "@/components/ParentTrustStrip";
import IconButton from "@/components/ui/IconButton";
import ZoneLandmark from "./ZoneLandmark";
import ZoneWishForm from "./ZoneWishForm";
import styles from "./ZoneSheet.module.css";

type ZoneSheetProps = {
  zone: ZoneDef | null;
  onClose: () => void;
  zoneStories?: ZoneStoriesBundle | null;
  /** 進度中樞：孩子已聽完的集數 slug（列表打星用）。 */
  completedSlugs?: ReadonlySet<string>;
};

/** 四段內容支柱的學齡前語意 emoji（純呈現；href 仍由 getCarParkLinks 單一資料源）。 */
const SEGMENT_EMOJI: Record<LandingSegmentId, string> = {
  stories: "📚",
  bedtime: "🌙",
  clay: "🎨",
  health: "🦺",
};

export default function ZoneSheet({
  zone,
  onClose,
  zoneStories,
  completedSlugs,
}: ZoneSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [parentOpen, setParentOpen] = useState(false);
  const open = zone !== null;

  useFocusTrap(open, panelRef, { initialFocus: "container" });

  // 換島重置家長折疊，避免上一座島的展開狀態殘留。
  useEffect(() => {
    setParentOpen(false);
  }, [zone?.id]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!zone) return null;

  const meta = ZONE_STATUS_META[zone.status];
  const isCarPark = (zone.subSegmentIds?.length ?? 0) > 0;
  const carParkLinks = isCarPark ? getCarParkLinks() : [];
  const notifyHref = notifyMailto(zone.name);
  const parentPanelId = `${titleId}-parent`;
  const wishPanelId = `${titleId}-wish`;
  const showBuildProgress =
    !isCarPark &&
    zone.status === "building" &&
    typeof zone.buildProgress === "number";

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton
          type="button"
          className={styles.close}
          variant="soft"
          icon="close"
          iconSize={20}
          onClick={onClose}
          aria-label="關閉"
        />

        <div className={styles.header}>
          <span className={styles.landmark} aria-hidden="true">
            <ZoneLandmark zoneId={zone.id} status={zone.status} artTile={zone.artTile} />
          </span>
          <div>
            <h2 id={titleId} className={styles.title}>
              {zone.name}
            </h2>
            <span
              className={styles.pill}
              style={{ background: meta.pillBg, color: meta.pillInk }}
            >
              {meta.label}
            </span>
          </div>
        </div>

        {/* ── 未開放島：首屏直接說清楚（不再藏進「給爸爸媽媽」雙層折疊） ── */}
        {!isCarPark ? (
          <>
            {zone.childHint ? (
              <p className={styles.childHint}>{zone.childHint}</p>
            ) : null}

            {showBuildProgress ? (
              <div
                className={styles.progress}
                role="progressbar"
                aria-valuenow={zone.buildProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="建造進度"
              >
                <div
                  className={styles.progressBar}
                  style={{ width: `${zone.buildProgress}%` }}
                />
                <span className={styles.progressLabel}>
                  建造進度 {zone.buildProgress}%
                </span>
              </div>
            ) : null}

            {/* 整句說明移入「給爸爸媽媽」；兒童首屏靠 childHint＋進度條＋大按鈕承載，少字更直觀 */}
            <nav className={styles.links} aria-label={`${zone.name}入口`}>
              <a
                className={styles.linkBtnPrimary}
                href="/stories"
                onClick={() => trackUniverseSheetLink(zone.id, "/stories")}
              >
                去聽車車故事
              </a>
            </nav>
          </>
        ) : null}

        {/* ── 故事清單（開放島與已有故事的鎖島共用）；第一集標「最新」 ── */}
        {zoneStories && zoneStories.total > 0 ? (
          <section className={styles.stories} aria-labelledby={`${titleId}-stories`}>
            <h3 id={`${titleId}-stories`} className={styles.storiesHeading}>
              {zone.status === "open" ? "這座島的故事" : "這座島已經有的故事"}
            </h3>
            <ul className={styles.storyList}>
              {zoneStories.previews.map((story, index) => (
                <li key={story.slug}>
                  <a
                    className={styles.storyCard}
                    href={`/story/${story.slug}`}
                    onClick={() =>
                      trackUniverseSheetLink(zone.id, `/story/${story.slug}`)
                    }
                  >
                    <span className={styles.storyCardEmoji} aria-hidden="true">
                      {story.emoji}
                    </span>
                    <span className={styles.storyCardBody}>
                      <span className={styles.storyCardEp}>
                        EP {story.ep}
                        {index === 0 ? (
                          <span className={styles.storyCardNew}>最新</span>
                        ) : null}
                      </span>
                      <span className={styles.storyCardTitle}>{story.title}</span>
                    </span>
                    {completedSlugs?.has(story.slug) ? (
                      <span
                        className={styles.storyCardDone}
                        role="img"
                        aria-label="已聽完"
                      >
                        ⭐
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
            {zoneStories.total > zoneStories.previews.length ? (
              <a
                className={styles.storiesMore}
                href="/stories"
                onClick={() => trackUniverseSheetLink(zone.id, "/stories")}
              >
                更多故事（共 {zoneStories.total} 集）
              </a>
            ) : null}
          </section>
        ) : null}

        {/* ── 開放島（車車樂園）：四段內容支柱前置、平權可見 ── */}
        {isCarPark ? (
          <nav className={styles.segmentGrid} aria-label={`${zone.name}入口`}>
            {carParkLinks.map((link) => (
              <a
                key={link.id}
                className={
                  link.id === "stories"
                    ? `${styles.segmentTile} ${styles.segmentTilePrimary}`
                    : styles.segmentTile
                }
                href={link.href}
                onClick={() => trackUniverseSheetLink(zone.id, link.href)}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <span className={styles.segmentEmoji} aria-hidden="true">
                  {SEGMENT_EMOJI[link.id]}
                </span>
                <span className={styles.segmentLabel}>
                  {link.label}
                  {link.external ? <span aria-hidden="true"> ↗</span> : null}
                </span>
              </a>
            ))}
          </nav>
        ) : null}

        {/* ── 未開放島：溫和導向（softLinks），首屏直接呈現 ── */}
        {!isCarPark ? (
          <>
            {zone.softLinks && zone.softLinks.length > 0 ? (
              <nav
                className={styles.softLinks}
                aria-label={`${zone.name}可以先逛`}
              >
                {zone.softLinks.map((link) => (
                  <a
                    key={link.href}
                    className={styles.softLink}
                    href={link.href}
                    onClick={() => trackUniverseSheetLink(zone.id, link.href)}
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {link.label}
                    {link.external ? <span aria-hidden="true"> ↗</span> : null}
                  </a>
                ))}
              </nav>
            ) : null}
          </>
        ) : null}

        {/* ── 「給爸爸媽媽」（單層折疊）：只留家長內容——安心資訊 + 鎖島許願 ── */}
        <div className={styles.parentDisclosure}>
          <button
            type="button"
            className={styles.wishToggle}
            aria-expanded={parentOpen}
            {...(parentOpen ? { "aria-controls": parentPanelId } : {})}
            onClick={() => setParentOpen((value) => !value)}
          >
            給爸爸媽媽
          </button>

          {parentOpen ? (
            <div id={parentPanelId} className={styles.parentPanel}>
              {!isCarPark && zone.exploreNote ? (
                <p className={styles.exploreNote}>{zone.exploreNote}</p>
              ) : null}

              {!isCarPark && zone.status === "planned" ? (
                <p className={styles.voteNote}>
                  這座島還在收集想法，不需要完成任務，也不急著做決定。
                </p>
              ) : null}

              <ParentTrustStrip variant="compact" />

              {!isCarPark ? (
                <div className={styles.wishPanel} id={wishPanelId}>
                  <p className={styles.wishHeading}>想留一句話</p>
                  <ZoneWishForm
                    zoneId={zone.id}
                    fallbackHref={notifyHref}
                    onSubmitSuccess={({ hasEmail, category }) => {
                      trackWishSubmitted(category);
                      if (category === "feature") {
                        trackUniverseWishSubmit(zone.id, hasEmail);
                      }
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
