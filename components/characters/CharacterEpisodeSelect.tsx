"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  catalogEpisodeLabel,
  type CatalogEpisodeOption,
} from "@/lib/character-catalog";
import { playSfx } from "@/lib/sfx";
import Icon from "@/components/ui/Icon";
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

  // 只出場一集：直接連過去，不讓孩子點開只有一個選項的下拉。
  if (episodes.length === 1) {
    const [episode] = episodes;
    const label = catalogEpisodeLabel(episode);
    return (
      <div className={styles.episodeSelect}>
        <Link
          href={`/story/${episode.slug}`}
          className={`${styles.episodeSelectControl} ${styles.episodeLink}`}
          aria-label={`聽 ${label}（${characterName}的出場故事）`}
          title={label}
          onClick={() => playSfx("tap")}
        >
          聽 EP {episode.ep}
          <span className={styles.episodeSelectArrow} aria-hidden>
            <Icon name="chevron-right" size={16} />
          </span>
        </Link>
      </div>
    );
  }

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
          <Icon name="chevron-down" size={16} />
        </span>
      </span>
    </label>
  );
}
