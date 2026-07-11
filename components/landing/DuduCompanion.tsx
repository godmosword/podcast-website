"use client";

import { useEffect, useState } from "react";
import DuduMoment from "@/components/dudu/DuduMoment";
import { useLandingScroll } from "./LandingScrollContext";
import {
  DUDU_EMOTIONS,
  type DuduEmotion,
  nextEmotion,
} from "@/data/dudu-emotions";
import styles from "./DuduCompanion.module.css";

type DuduCompanionItem = {
  anchorId: string;
  emotion: DuduEmotion;
};

type DuduCompanionProps = {
  items: DuduCompanionItem[];
  /** 頁尾錨點：進入視窗時夥伴淡出，避免擋住頁尾。 */
  footerId?: string;
};

/**
 * 角落表情夥伴：固定在右下角，捲動到不同 segment 時切換表情，
 * 點一下循環全部六款表情。整體 pointer-events 關閉、只有車身可點，不擋閱讀。
 */
export default function DuduCompanion({ items, footerId }: DuduCompanionProps) {
  const landingScroll = useLandingScroll();
  const [baseEmotion, setBaseEmotion] = useState<DuduEmotion>(
    items[0]?.emotion ?? "happy",
  );
  const [tapEmotion, setTapEmotion] = useState<DuduEmotion | null>(null);
  const [atFooter, setAtFooter] = useState(false);

  // 預載全部 sprite，點擊切換時不會閃白。
  useEffect(() => {
    DUDU_EMOTIONS.forEach((emotion) => {
      const img = new window.Image();
      img.src = `/landing/mascot/dudu-${emotion}.webp`;
    });
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const emotionByAnchor = new Map(items.map((it) => [it.anchorId, it.emotion]));
    const sections = items
      .map((it) => document.getElementById(it.anchorId))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const root = landingScroll?.scrollRootRef.current ?? null;

    const segmentObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const emotion = visible ? emotionByAnchor.get(visible.target.id) : undefined;
        if (emotion) {
          setBaseEmotion(emotion);
          setTapEmotion(null);
        }
      },
      { root, rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.5, 1] },
    );
    sections.forEach((el) => segmentObserver.observe(el));

    const footer = footerId ? document.getElementById(footerId) : null;
    const footerObserver = footer
      ? new IntersectionObserver(
          (entries) => setAtFooter(entries.some((e) => e.isIntersecting)),
          { root, threshold: 0.01 },
        )
      : null;
    if (footer && footerObserver) footerObserver.observe(footer);

    return () => {
      segmentObserver.disconnect();
      footerObserver?.disconnect();
    };
  }, [items, footerId, landingScroll]);

  if (items.length === 0) return null;

  const shown = tapEmotion ?? baseEmotion;

  return (
    <div className={styles.root}>
      <DuduMoment
        variant="companion"
        emotion={shown}
        label="嘟嘟小紅車"
        interactive
        hidden={atFooter}
        className={styles.companion}
        onInteract={() => setTapEmotion((prev) => nextEmotion(prev ?? baseEmotion))}
      />
    </div>
  );
}
