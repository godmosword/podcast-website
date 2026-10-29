"use client";

import { useEffect, useMemo, useState } from "react";
import DuduMoment from "@/components/dudu/DuduMoment";
import { useLandingScroll } from "./LandingScrollContext";
import { useActiveLandingAnchor } from "./useActiveLandingAnchor";
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
  /** 這一段出現時把夥伴藏起來，避免蓋住車車的點擊範圍。 */
  hideAnchorId?: string;
};

/**
 * 角落表情夥伴：固定在右下角，捲動到不同 segment 時切換表情，
 * 點一下循環全部六款表情。整體 pointer-events 關閉、只有車身可點，不擋閱讀。
 */
export default function DuduCompanion({
  items,
  footerId,
  hideAnchorId,
}: DuduCompanionProps) {
  const landingScroll = useLandingScroll();
  const anchorIds = useMemo(() => items.map((it) => it.anchorId), [items]);
  const watchIds = useMemo(
    () => (hideAnchorId ? [...anchorIds, hideAnchorId] : anchorIds),
    [anchorIds, hideAnchorId],
  );
  const activeAnchorId = useActiveLandingAnchor(watchIds);
  const hiddenByBoard = Boolean(hideAnchorId && activeAnchorId === hideAnchorId);
  const baseEmotion: DuduEmotion =
    items.find((it) => it.anchorId === activeAnchorId)?.emotion ??
    items[0]?.emotion ??
    "happy";
  // 點出來的表情只留在點的那一段；換段就回到該段的表情。
  const [tap, setTap] = useState<{ anchorId: string | null; emotion: DuduEmotion } | null>(
    null,
  );
  const tapEmotion = tap && tap.anchorId === activeAnchorId ? tap.emotion : null;
  const [atFooter, setAtFooter] = useState(false);

  // 預載全部 sprite，點擊切換時不會閃白。
  useEffect(() => {
    DUDU_EMOTIONS.forEach((emotion) => {
      const img = new window.Image();
      img.src = `/landing/mascot/dudu-${emotion}.webp`;
    });
  }, []);

  useEffect(() => {
    const footer = footerId ? document.getElementById(footerId) : null;
    if (!footer) return;
    const footerObserver = new IntersectionObserver(
      (entries) => setAtFooter(entries.some((e) => e.isIntersecting)),
      { root: landingScroll?.scrollRootRef.current ?? null, threshold: 0.01 },
    );
    footerObserver.observe(footer);
    return () => footerObserver.disconnect();
  }, [footerId, landingScroll]);

  if (items.length === 0) return null;

  const shown = tapEmotion ?? baseEmotion;

  return (
    <div className={styles.root}>
      <DuduMoment
        variant="companion"
        emotion={shown}
        label="小紅豆金龜車"
        interactive
        hidden={atFooter || hiddenByBoard}
        className={styles.companion}
        onInteract={() =>
          setTap({ anchorId: activeAnchorId, emotion: nextEmotion(tapEmotion ?? baseEmotion) })
        }
      />
    </div>
  );
}
