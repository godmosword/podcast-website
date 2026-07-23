"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ZONE_STATUS_META, type ZoneDef } from "@/data/universe-zones";
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

export default function ZoneSheet({
  zone,
  onClose,
  zoneStories,
  completedSlugs,
}: ZoneSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [wishOpen, setWishOpen] = useState(false);
  const [parentOpen, setParentOpen] = useState(false);
  const open = zone !== null;

  useFocusTrap(open, panelRef, { initialFocus: "container" });

  useEffect(() => {
    setWishOpen(false);
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
  const primaryCarParkLinks = carParkLinks.filter((link) => link.href === "/stories");
  const secondaryCarParkLinks = carParkLinks.filter((link) => link.href !== "/stories");
  const notifyHref = notifyMailto(zone.name);
  const wishPanelId = `${titleId}-wish`;
  const parentPanelId = `${titleId}-parent`;
  const hasStories = (zoneStories?.total ?? 0) > 0;
  const showCarParkPrimaryCta = isCarPark && !hasStories && primaryCarParkLinks.length > 0;
  const showParentDisclosure = isCarPark
    ? secondaryCarParkLinks.length > 0
    : true;

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

        {!isCarPark && zone.childHint ? (
          <p className={styles.childHint}>{zone.childHint}</p>
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
          </nav>
        ) : null}

        {zoneStories && zoneStories.total > 0 ? (
          <section className={styles.stories} aria-labelledby={`${titleId}-stories`}>
            <h3 id={`${titleId}-stories`} className={styles.storiesHeading}>
              {zone.status === "open" ? "這座島的故事" : "這座島已經有的故事"}
            </h3>
            <ul className={styles.storyList}>
              {zoneStories.previews.map((story) => (
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
                      <span className={styles.storyCardEp}>EP {story.ep}</span>
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

        {showCarParkPrimaryCta ? (
          <nav className={styles.links} aria-label={`${zone.name}入口`}>
            {primaryCarParkLinks.map((link) => (
              <a
                key={link.href}
                className={styles.linkBtnPrimary}
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

        {showParentDisclosure ? (
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
                {isCarPark ? (
                  <nav
                    className={styles.links}
                    aria-label={`${zone.name}更多入口`}
                  >
                    {secondaryCarParkLinks.map((link) => (
                      <a
                        key={link.href}
                        className={styles.linkBtn}
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
                ) : (
                  <>
                    {zone.exploreNote ? (
                      <p className={styles.exploreNote}>{zone.exploreNote}</p>
                    ) : null}

                    {zone.status === "building" &&
                    typeof zone.buildProgress === "number" ? (
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

                    {zone.status === "planned" ? (
                      <p className={styles.voteNote}>
                        這座島還在收集想法，不需要完成任務，也不急著做決定。
                      </p>
                    ) : null}

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

                    <ParentTrustStrip variant="compact" />

                    <div className={styles.wishDisclosure}>
                      <button
                        type="button"
                        className={styles.wishToggle}
                        aria-expanded={wishOpen}
                        {...(wishOpen ? { "aria-controls": wishPanelId } : {})}
                        onClick={() => setWishOpen((value) => !value)}
                      >
                        想留一句話
                      </button>

                      {wishOpen ? (
                        <div id={wishPanelId} className={styles.wishPanel}>
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
                  </>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
