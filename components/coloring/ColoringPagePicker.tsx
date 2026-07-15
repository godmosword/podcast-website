"use client";

import Image from "next/image";
import type { ColoringPage } from "@/data/coloring-pages";
import {
  COLORING_BACK_TO_COVER,
  COLORING_PICKER_LEAD,
} from "@/lib/coloring/flow";
import styles from "./ColoringPagePicker.module.css";

type ColoringPagePickerProps = {
  characters: readonly ColoringPage[];
  scenes: readonly ColoringPage[];
  onSelect: (page: ColoringPage) => void;
  onBackToCover: () => void;
};

export function ColoringPagePicker({
  characters,
  scenes,
  onSelect,
  onBackToCover,
}: ColoringPagePickerProps) {
  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.backCover}
          onClick={onBackToCover}
          aria-label={COLORING_BACK_TO_COVER}
        >
          ← {COLORING_BACK_TO_COVER}
        </button>
      </div>
      <p className={styles.lead}>{COLORING_PICKER_LEAD}</p>
      <div className={styles.book}>
        <section className={styles.spread} aria-labelledby="coloring-chars">
          <h2 id="coloring-chars" className={styles.heading}>
            定裝人物
          </h2>
          <ul className={styles.grid}>
            {characters.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  className={styles.card}
                  onClick={() => onSelect(page)}
                  aria-label={`著色：${page.title}`}
                >
                  <span className={styles.thumb}>
                    <Image
                      src={page.previewSrc}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 46vw, 200px"
                      className={styles.thumbImg}
                    />
                  </span>
                  <span className={styles.cardTitle}>{page.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className={styles.spread} aria-labelledby="coloring-scenes">
          <h2 id="coloring-scenes" className={styles.heading}>
            故事場景
          </h2>
          <ul className={styles.grid}>
            {scenes.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  className={styles.card}
                  onClick={() => onSelect(page)}
                  aria-label={`著色：${page.title}`}
                >
                  <span className={styles.thumb}>
                    <Image
                      src={page.previewSrc}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 46vw, 200px"
                      className={styles.thumbImg}
                    />
                  </span>
                  <span className={styles.cardTitle}>{page.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
