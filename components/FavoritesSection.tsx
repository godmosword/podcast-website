"use client";

import { useEffect, useState } from "react";
import { getStory, stories } from "@/data/stories";
import { getFavorites } from "@/lib/favorites";
import StoryCard from "./StoryCard";
import styles from "./FavoritesSection.module.css";

export default function FavoritesSection() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(getFavorites());
  }, []);

  const favoriteStories = slugs
    .map((slug) => getStory(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  if (favoriteStories.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>❤️ 常聽的故事</h2>
      <ul className={styles.list}>
        {favoriteStories.map((story, i) => (
          <li key={story.slug}>
            <StoryCard story={story} index={i} />
          </li>
        ))}
      </ul>
      <p className={styles.hint}>
        在故事頁點「加入最愛」即可收藏。共 {stories.length} 則故事可探索。
      </p>
    </section>
  );
}
