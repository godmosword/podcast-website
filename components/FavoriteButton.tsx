"use client";

import { useEffect, useState } from "react";
import { HeartIcon } from "@/components/decor/PlayerIcon";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import styles from "./FavoriteButton.module.css";

type FavoriteButtonProps = {
  slug: string;
};

export default function FavoriteButton({ slug }: FavoriteButtonProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isFavorite(slug));
  }, [slug]);

  return (
    <button
      type="button"
      className={`${styles.btn} ${active ? styles.active : ""}`}
      aria-pressed={active}
      aria-label={active ? "取消收藏" : "加入最愛"}
      onClick={() => setActive(toggleFavorite(slug).includes(slug))}
    >
      <HeartIcon className={styles.icon} filled={active} />
      <span>{active ? "已收藏" : "加入最愛"}</span>
    </button>
  );
}
