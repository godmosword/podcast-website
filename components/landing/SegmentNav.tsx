"use client";

import { useEffect, useState } from "react";
import { useLandingScroll } from "./LandingScrollContext";
import styles from "./SegmentNav.module.css";

type SegmentNavItem = {
  anchorId: string;
  label: string;
};

type SegmentNavProps = {
  items: SegmentNavItem[];
};

/** 右側進度點：點擊跳到該段，捲動時以 IntersectionObserver 高亮目前段。 */
export default function SegmentNav({ items }: SegmentNavProps) {
  const landingScroll = useLandingScroll();
  const [activeId, setActiveId] = useState(items[0]?.anchorId ?? "");

  useEffect(() => {
    if (items.length === 0) return;
    const sections = items
      .map((it) => document.getElementById(it.anchorId))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const root = landingScroll?.scrollRootRef.current ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      {
        root,
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0, 0.5, 1],
      },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items, landingScroll]);

  if (items.length === 0) return null;

  function goTo(anchorId: string) {
    if (landingScroll) {
      landingScroll.scrollToSegment(anchorId);
      return;
    }
    document.getElementById(anchorId)?.scrollIntoView({ block: "start" });
  }

  return (
    <nav className={styles.nav} aria-label="專區導覽">
      <ul className={styles.list}>
        {items.map((it) => {
          const active = it.anchorId === activeId;
          return (
            <li key={it.anchorId}>
              <a
                href={`#${it.anchorId}`}
                className={`${styles.dot} ${active ? styles.active : ""}`}
                aria-label={it.label}
                aria-current={active ? "true" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(it.anchorId);
                }}
              >
                <span className={styles.dotLabel}>{it.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
