"use client";

import { useEffect, useId, useRef } from "react";
import { ZONE_STATUS_META, type ZoneDef } from "@/data/universe-zones";
import { getCarParkLinks } from "@/lib/universe-map";
import { notifyMailto } from "@/lib/contact";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import ZoneLandmark from "./ZoneLandmark";
import styles from "./ZoneSheet.module.css";

type ZoneSheetProps = {
  zone: ZoneDef | null;
  onClose: () => void;
};

export default function ZoneSheet({ zone, onClose }: ZoneSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const open = zone !== null;

  useFocusTrap(open, panelRef);

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

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="關閉"
        >
          ✕
        </button>

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

        <p className={styles.teaser}>{zone.teaser}</p>

        {isCarPark ? (
          <nav className={styles.links} aria-label={`${zone.name}入口`}>
            {carParkLinks.map((link) => (
              <a
                key={link.href}
                className={styles.linkBtn}
                href={link.href}
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
          <div className={styles.stub}>
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
              <p className={styles.voteNote}>之後開放投票，由你決定下一站。</p>
            ) : null}

            <a className={styles.notifyBtn} href={notifyHref}>
              🔔 通知我開幕
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
