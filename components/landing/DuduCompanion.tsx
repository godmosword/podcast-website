"use client";

import { useEffect, useRef, useState } from "react";
import { useLandingScroll } from "./LandingScrollContext";
import {
  DUDU_EMOTIONS,
  DUDU_EMOTION_LABEL,
  type DuduEmotion,
  emotionSrc,
  nextTapEmotion,
} from "./dudu-emotions";
import styles from "./DuduCompanion.module.css";

export type DuduCompanionItem = {
  anchorId: string;
  emotion: DuduEmotion;
};

type DuduCompanionProps = {
  items: DuduCompanionItem[];
  /** 頁尾錨點：進入視窗時夥伴淡出，避免擋住頁尾。 */
  footerId?: string;
};

const REACTION_MS = 1600;

/**
 * 角落表情夥伴：固定在右下角，捲動到不同 segment 時切換表情，
 * 點一下會播放彩蛋表情。整體 pointer-events 關閉、只有車身可點，不擋閱讀。
 */
export default function DuduCompanion({ items, footerId }: DuduCompanionProps) {
  const landingScroll = useLandingScroll();
  const [baseEmotion, setBaseEmotion] = useState<DuduEmotion>(
    items[0]?.emotion ?? "happy",
  );
  const [reaction, setReaction] = useState<DuduEmotion | null>(null);
  const [atFooter, setAtFooter] = useState(false);
  const reactionTimer = useRef<number | null>(null);

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
        if (emotion) setBaseEmotion(emotion);
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

  useEffect(
    () => () => {
      if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    },
    [],
  );

  if (items.length === 0) return null;

  const shown = reaction ?? baseEmotion;

  function handleTap() {
    const next = nextTapEmotion(reaction);
    setReaction(next);
    if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => setReaction(null), REACTION_MS);
  }

  return (
    <div
      className={`${styles.root} ${atFooter ? styles.hidden : ""}`}
      aria-hidden
    >
      <button
        type="button"
        className={styles.car}
        onClick={handleTap}
        tabIndex={-1}
        aria-label={`嘟嘟小紅車：${DUDU_EMOTION_LABEL[shown]}`}
      >
        {DUDU_EMOTIONS.map((emotion) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={emotion}
            src={emotionSrc(emotion)}
            alt=""
            loading="lazy"
            decoding="async"
            className={`${styles.sprite} ${
              emotion === shown ? styles.spriteActive : ""
            }`}
          />
        ))}
      </button>
    </div>
  );
}
