"use client";

import { useRouter } from "next/navigation";
import {
  catalogEpisodeLabel,
  type CatalogEpisodeOption,
} from "@/lib/character-catalog";
import { playSfx } from "@/lib/sfx";
import styles from "./CharacterCard.module.css";

type CharacterEpisodeSelectProps = {
  characterName: string;
  episodes: CatalogEpisodeOption[];
};

export default function CharacterEpisodeSelect({
  characterName,
  episodes,
}: CharacterEpisodeSelectProps) {
  const router = useRouter();

  if (episodes.length === 0) return null;

  return (
    <label className={styles.episodeSelect}>
      <span className={styles.episodeSelectWrap}>
        <select
          className={styles.episodeSelectControl}
          defaultValue=""
          aria-label={`${characterName}的出場故事`}
          onChange={(event) => {
            const slug = event.target.value;
            if (!slug) return;
            playSfx("tap");
            router.push(`/story/${slug}`);
            event.target.value = "";
          }}
        >
          <option value="" disabled>
            出場故事
          </option>
          {episodes.map((episode) => (
            <option key={episode.slug} value={episode.slug}>
              {catalogEpisodeLabel(episode)}
            </option>
          ))}
        </select>
        <span className={styles.episodeSelectArrow} aria-hidden>
          ▾
        </span>
      </span>
    </label>
  );
}
