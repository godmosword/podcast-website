"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Hotspot } from "@/data/universe";
import type { ZoneDef } from "@/data/universe-zones";
import type { LandingSegmentId } from "@/data/landing-segments";
import { getCarParkLinks } from "@/lib/universe-map";
import { notifyMailto } from "@/lib/contact";
import {
  trackUniverseSheetLink,
  trackUniverseWishSubmit,
  trackWishSubmitted,
} from "@/lib/analytics";
import {
  hotspotDetailHref,
  sortHotspotsForDisplay,
} from "@/lib/universe/hotspot";
import type { ZoneStoriesBundle } from "@/lib/story-zone-query";
import ParentTrustStrip from "@/components/ParentTrustStrip";
import IconButton from "@/components/ui/IconButton";
import ZoneWishForm from "./ZoneWishForm";
import { useUniverseCameraGate } from "./UniverseCameraGateContext";
import styles from "./ZoneSheet.module.css";

type ZoneSheetProps = {
  zone: ZoneDef | null;
  /** 抽屜是否展開；false 時只顯示召喚把手。 */
  expanded: boolean;
  onExpand: () => void;
  /** ✕／Esc：收合抽屜（非離島）。 */
  onCollapse: () => void;
  zoneStories?: ZoneStoriesBundle | null;
  /** 進度中樞：孩子已聽完的集數 slug（列表打星用）。 */
  completedSlugs?: ReadonlySet<string>;
  /** 島內熱點清單（與地圖座標層同源；點擊開 @modal）。 */
  hotspots?: readonly Hotspot[];
  /** 熱點 modal 開啟時標記 inert，避免背景可聚焦。 */
  inert?: boolean;
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
  expanded,
  onExpand,
  onCollapse,
  zoneStories,
  completedSlugs,
  hotspots = [],
  inert = false,
}: ZoneSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const explorePanelRef = useRef<HTMLDivElement>(null);
  const wasExpandedRef = useRef(false);
  const titleId = useId();
  const [parentOpen, setParentOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const { sheetReady } = useUniverseCameraGate();
  const open = zone !== null;
  const escClosable = open && expanded && sheetReady && !inert;

  // 換島重置折疊，避免上一座島的展開狀態殘留。
  useEffect(() => {
    setParentOpen(false);
    setExploreOpen(false);
    wasExpandedRef.current = false;
  }, [zone?.id]);

  useEffect(() => {
    if (!escClosable) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCollapse();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [escClosable, onCollapse]);

  // 展開→焦點進面板；收合→焦點還把手（非模態仍需 focus move）。
  useEffect(() => {
    if (!sheetReady || inert) return;
    if (expanded) {
      wasExpandedRef.current = true;
      panelRef.current?.focus();
      return;
    }
    if (wasExpandedRef.current) {
      handleRef.current?.focus();
    }
  }, [expanded, sheetReady, inert, zone?.id]);

  // 次層展開後捲入可視區，避免 40vh 盒底「按了沒反應」。
  useEffect(() => {
    if (!exploreOpen || !explorePanelRef.current) return;
    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    explorePanelRef.current.scrollIntoView({
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [exploreOpen]);

  if (!zone) return null;

  const isCarPark = (zone.subSegmentIds?.length ?? 0) > 0;
  const carParkLinks = isCarPark ? getCarParkLinks() : [];
  const notifyHref = notifyMailto(zone.name);
  const parentPanelId = `${titleId}-parent`;
  const explorePanelId = `${titleId}-explore`;
  const wishPanelId = `${titleId}-wish`;
  const isLocked = zone.status !== "open";
  const displayHotspots = sortHotspotsForDisplay(hotspots);

  const overlayClass = [
    styles.overlay,
    expanded ? styles.overlayScrim : "",
    !sheetReady ? styles.overlayHidden : styles.overlayPassthrough,
    sheetReady && inert ? styles.overlayInertPassthrough : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleClass = [
    styles.summonHandle,
    sheetReady ? styles.summonHandleReady : styles.summonHandleHidden,
  ]
    .filter(Boolean)
    .join(" ");

  const sheetClass = [
    styles.sheet,
    sheetReady && expanded ? styles.sheetAnimate : styles.sheetHidden,
  ]
    .filter(Boolean)
    .join(" ");

  const sheetInert = inert || !sheetReady;

  if (!expanded) {
    return (
      <div
        className={overlayClass}
        role="presentation"
        {...(!sheetReady || inert ? { inert: true } : {})}
      >
        <button
          ref={handleRef}
          type="button"
          className={handleClass}
          onClick={onExpand}
          aria-label="來這裡逛逛"
          aria-expanded="false"
          disabled={!sheetReady || inert}
        >
          <span className={styles.summonHandleGlyph} aria-hidden="true">
            👋
          </span>
          <span>來這裡逛逛</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={overlayClass}
      role="presentation"
      {...(sheetInert ? { inert: true } : {})}
    >
      <div
        ref={panelRef}
        id={`${titleId}-panel`}
        className={sheetClass}
        role="region"
        aria-label={zone.name}
        aria-hidden={!sheetReady}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {sheetReady ? (
          <p className="sr-only" aria-live="polite">
            已打開{zone.name}的探索抽屜
          </p>
        ) : null}

        <IconButton
          type="button"
          className={styles.close}
          variant="soft"
          icon="close"
          iconSize={20}
          onClick={onCollapse}
          aria-label="關閉"
        />

        {!isCarPark && zone.childHint ? (
          <p className={styles.childHint}>{zone.childHint}</p>
        ) : null}

        {zoneStories && zoneStories.total > 0 ? (
          <section className={styles.stories} aria-labelledby={`${titleId}-stories`}>
            <h2 id={`${titleId}-stories`} className="sr-only">
              {zone.status === "open" ? "這座島的故事" : "這座島已經有的故事"}
            </h2>
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

        {!isCarPark ? (
          <nav className={styles.links} aria-label={`${zone.name}入口`}>
            <a
              className={styles.linkBtnPrimary}
              href="/stories"
              onClick={() => trackUniverseSheetLink(zone.id, "/stories")}
            >
              去聽車車故事
            </a>
            {isLocked ? (
              <a
                className={styles.linkBtnSecondary}
                href={notifyHref}
                onClick={() => trackUniverseSheetLink(zone.id, notifyHref)}
              >
                通知我開幕
              </a>
            ) : null}
          </nav>
        ) : null}

        {displayHotspots.length > 0 ||
        (isCarPark && carParkLinks.length > 0) ||
        (!isCarPark && zone.softLinks && zone.softLinks.length > 0) ? (
          <div className={styles.exploreDisclosure}>
            <button
              type="button"
              className={styles.exploreToggle}
              aria-expanded={exploreOpen}
              {...(exploreOpen ? { "aria-controls": explorePanelId } : {})}
              onClick={() => setExploreOpen((value) => !value)}
            >
              看看這座島有什麼
            </button>

            {exploreOpen ? (
              <div
                ref={explorePanelRef}
                id={explorePanelId}
                className={styles.explorePanel}
              >
                {displayHotspots.length > 0 ? (
                  <nav
                    className={styles.hotspots}
                    aria-label={`${zone.name}探索點`}
                  >
                    <h2 className={styles.hotspotsHeading}>
                      探索這座島・共 {displayHotspots.length} 個地點
                    </h2>
                    <ul className={styles.hotspotList}>
                      {displayHotspots.map((spot) => {
                        const href = hotspotDetailHref(zone.id, spot);
                        const action = spot.action;
                        const locked = action.type === "locked";
                        const icon =
                          locked ? "·" : action.type === "story" ? "✦" : "↗";
                        const className = [
                          locked ? styles.hotspotLocked : styles.hotspotLink,
                          spot.featured ? styles.hotspotFeatured : "",
                        ]
                          .filter(Boolean)
                          .join(" ");
                        return (
                          <li key={spot.id}>
                            <Link
                              className={className}
                              href={href}
                              prefetch
                              scroll={false}
                              data-featured={spot.featured || undefined}
                            >
                              <span
                                className={styles.hotspotIcon}
                                aria-hidden="true"
                              >
                                {icon}
                              </span>
                              <span className={styles.hotspotName}>
                                {spot.name}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                ) : null}

                {isCarPark ? (
                  <nav
                    className={styles.segmentGrid}
                    aria-label={`${zone.name}入口`}
                  >
                    {carParkLinks.map((link) => (
                      <a
                        key={link.id}
                        className={
                          link.id === "stories"
                            ? `${styles.segmentTile} ${styles.segmentTilePrimary}`
                            : styles.segmentTile
                        }
                        href={link.href}
                        onClick={() =>
                          trackUniverseSheetLink(zone.id, link.href)
                        }
                        {...(link.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        <span className={styles.segmentEmoji} aria-hidden="true">
                          {SEGMENT_EMOJI[link.id]}
                        </span>
                        <span className={styles.segmentLabel}>
                          {link.label}
                          {link.external ? (
                            <span aria-hidden="true"> ↗</span>
                          ) : null}
                        </span>
                      </a>
                    ))}
                  </nav>
                ) : null}

                {!isCarPark && zone.softLinks && zone.softLinks.length > 0 ? (
                  <nav
                    className={styles.softLinks}
                    aria-label={`${zone.name}可以先逛`}
                  >
                    {zone.softLinks.map((link) => (
                      <a
                        key={link.href}
                        className={styles.softLink}
                        href={link.href}
                        onClick={() =>
                          trackUniverseSheetLink(zone.id, link.href)
                        }
                        {...(link.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {link.label}
                        {link.external ? (
                          <span aria-hidden="true"> ↗</span>
                        ) : null}
                      </a>
                    ))}
                  </nav>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

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
