"use client";

import { useEffect, useState } from "react";
import StarBurst from "@/components/celebration/StarBurst";
import { HeartIcon } from "@/components/decor/PlayerIcon";
import { useCelebrationBurst } from "@/hooks/useCelebrationBurst";
import { requestCelebration } from "@/lib/celebration";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { playSfx } from "@/lib/sfx";
import styles from "./FavoriteButton.module.css";

type FavoriteButtonProps = {
  slug: string;
};

export default function FavoriteButton({ slug }: FavoriteButtonProps) {
  const [active, setActive] = useState(false);
  const { particles, fire } = useCelebrationBurst();

  useEffect(() => {
    setActive(isFavorite(slug));
  }, [slug]);

  function handleClick() {
    const wasActive = active;
    const nextActive = toggleFavorite(slug).includes(slug);
    setActive(nextActive);

    if (!wasActive && nextActive) {
      const decision = requestCelebration("favorite_added");
      if (!decision.allowed) return;

      if (decision.playSfx) playSfx(decision.playSfx);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced && decision.particleCount > 0) {
        fire({ count: decision.particleCount });
      }
    }
  }

  return (
    <button
      type="button"
      className={`${styles.btn} press-squash star-burst-wrap ${active ? styles.active : ""}`}
      aria-pressed={active}
      aria-label={active ? "取消收藏" : "加入最愛"}
      onClick={handleClick}
    >
      <HeartIcon size={26} filled={active} />
      <StarBurst particles={particles} />
    </button>
  );
}
