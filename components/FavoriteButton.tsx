"use client";

import { useEffect, useState } from "react";
import { HeartIcon } from "@/components/decor/PlayerIcon";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { playSfx } from "@/lib/sfx";
import styles from "./FavoriteButton.module.css";

type FavoriteButtonProps = {
  slug: string;
};

type BurstParticle = {
  id: number;
  x: string;
  y: string;
};

const BURST_COUNT = 6;
const BURST_RADIUS = 22;

function createBurstParticles(): BurstParticle[] {
  return Array.from({ length: BURST_COUNT }, (_, index) => {
    const angle = (index / BURST_COUNT) * Math.PI * 2;
    return {
      id: Date.now() + index,
      x: `${Math.cos(angle) * BURST_RADIUS}px`,
      y: `${Math.sin(angle) * BURST_RADIUS}px`,
    };
  });
}

export default function FavoriteButton({ slug }: FavoriteButtonProps) {
  const [active, setActive] = useState(false);
  const [particles, setParticles] = useState<BurstParticle[]>([]);

  useEffect(() => {
    setActive(isFavorite(slug));
  }, [slug]);

  function handleClick() {
    const wasActive = active;
    const nextActive = toggleFavorite(slug).includes(slug);
    setActive(nextActive);

    if (!wasActive && nextActive) {
      // 正向回饋（STEM-P1）：溫和 collect 音在 reduced-motion 下保留（只關動畫）；
      // 取消收藏不出聲（低壓）。sfx 開關由 lib/sfx isSfxEnabled 內建處理。
      playSfx("collect");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        const burst = createBurstParticles();
        setParticles(burst);
        window.setTimeout(() => setParticles([]), 480);
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
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="star-burst-particle"
          style={
            {
              "--burst-x": particle.x,
              "--burst-y": particle.y,
            } as React.CSSProperties
          }
          aria-hidden
        >
          ✦
        </span>
      ))}
    </button>
  );
}
