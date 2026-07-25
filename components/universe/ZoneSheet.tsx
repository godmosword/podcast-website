"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { STATUS_META, type Hotspot } from "@/data/universe";
import type { ZoneDef } from "@/data/universe-zones";
import type { LandingSegmentId } from "@/data/landing-segments";
import { getCarParkLinks } from "@/lib/universe-map";
import { notifyMailto } from "@/lib/contact";
import {
  trackUniverseSheetLink,
  trackUniverseWishSubmit,
  trackWishSubmitted,
} from "@/lib/analytics";
import { hotspotDetailHref } from "@/lib/universe/hotspot";
import type { ZoneStoriesBundle } from "@/lib/story-zone-query";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import ParentTrustStrip from "@/components/ParentTrustStrip";
import IconButton from "@/components/ui/IconButton";
import ZoneLandmark from "./ZoneLandmark";
import ZoneWishForm from "./ZoneWishForm";
import { useUniverseCameraGate } from "./UniverseCameraGateContext";
import styles from "./ZoneSheet.module.css";

type ZoneSheetProps = {
  zone: ZoneDef | null;
  onClose: () => void;
  zoneStories?: ZoneStoriesBundle | null;
  /** 進度中樞：孩子已聽完的集數 slug（列表打星用）。 */
  completedSlugs?: ReadonlySet<string>;
  /** 島內熱點清單（與地圖座標層同源；點擊開 @modal）。 */
  hotspots?: readonly Hotspot[];
  /** 進入島後把焦點移到島名 h1。 */
  focusOnMount?: boolean;
  /** 熱點 modal 開啟時關閉 sheet 的 focus trap，避免雙 trap。 */
  suppressFocusTrap?: boolean;
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
  onClose,
  zoneStories,
  completedSlugs,
  hotspots = [],
  focusOnMount = false,
  suppressFocusTrap = false,
  inert = false,
}: ZoneSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const [parentOpen, setParentOpen] = useState(false);
  const { sheetReady } = useUniverseCameraGate();
  const open = zone !== null;
  const interactive = open && sheetReady && !suppressFocusTrap;
  const escClosable = open && !suppressFocusTrap;

  useFocusTrap(interactive, panelRef, {
    initialFocus: "container",
  });

  // 換島重置家長折疊，避免上一座島的展開狀態殘留。
  useEffect(() => {
    setParentOpen(false);
  }, [zone?.id]);

  useEffect(() => {
    if (!escClosable) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [escClosable, onClose]);

  // 鏡頭飛抵後才聚焦島名，避免 SR 念看不見的內容。
  useEffect(() => {
    if (!open || !sheetReady || !focusOnMount || suppressFocusTrap) return;
    titleRef.current?.focus();
  }, [open, sheetReady, focusOnMount, zone?.id, suppressFocusTrap]);

  if (!zone) return null;

  const meta = STATUS_META[zone.status];
  const isCarPark = (zone.subSegmentIds?.length ?? 0) > 0;
  const carParkLinks = isCarPark ? getCarParkLinks() : [];
  const notifyHref = notifyMailto(zone.name);
  const parentPanelId = `${titleId}-parent`;
  const wishPanelId = `${titleId}-wish`;
  const showBuildProgress =
    !isCarPark &&
    zone.status === "building" &&
    typeof zone.buildProgress === "number";
  const isLocked = zone.status !== "open";

  const overlayClass = [
    styles.overlay,
    !sheetReady ? styles.overlayHidden : styles.overlayPassthrough,
    sheetReady && inert ? styles.overlayInertPassthrough : "",
  ]
    .filter(Boolean)
    .join(" ");
  const sheetClass = [
    styles.sheet,
    sheetReady ? styles.sheetAnimate : styles.sheetHidden,
  ]
    .filter(Boolean)
    .join(" ");
  const sheetInert = inert || !sheetReady;

  return (
    <div
      className={overlayClass}
      role="presentation"
      {...(sheetInert ? { inert: true } : {})}
    >
      <div
        ref={panelRef}
        className={sheetClass}
        role="dialog"
        aria-modal={sheetInert ? undefined : true}
        aria-labelledby={titleId}
        aria-hidden={!sheetReady}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {sheetReady ? (
          <p className="sr-only" aria-live="polite">
            已進入{zone.name}
          </p>
        ) : null}

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
            <h1
              id={titleId}
              ref={titleRef}
              className={styles.title}
              tabIndex={-1}
            >
              {zone.name}
            </h1>
            <span
              className={styles.pill}
              style={{ background: meta.pillBg, color: meta.pillInk }}
            >
              {meta.label}
            </span>
          </div>
        </div>

        <p className={styles.tagline}>{zone.teaser}</p>

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

            {isLocked ? (
              <p className={styles.comingSoon}>敬請期待</p>
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
          </>
        ) : null}

        {hotspots.length > 0 ? (
          <nav className={styles.hotspots} aria-label={`${zone.name}探索點`}>
            <h2 className={styles.hotspotsHeading}>探索點</h2>
            <ul className={styles.hotspotList}>
              {hotspots.map((spot) => {
                const href = hotspotDetailHref(zone.id, spot);
                const action = spot.action;
                const locked = action.type === "locked";
                return (
                  <li key={spot.id}>
                    <Link
                      className={
                        locked ? styles.hotspotLocked : styles.hotspotLink
                      }
                      href={href}
                      prefetch
                      scroll={false}
                    >
                      {locked
                        ? `${spot.name}（${action.hint}）`
                        : spot.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
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

        <button
          type="button"
          className={styles.homeBtn}
          onClick={onClose}
          aria-label="回樂園"
        >
          回樂園
        </button>

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
