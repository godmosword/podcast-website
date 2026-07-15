"use client";

import Image from "next/image";
import type { ColoringPage } from "@/data/coloring-pages";
import styles from "./ColoringPagePicker.module.css";

type ColoringPagePickerProps = {
  characters: readonly ColoringPage[];
  scenes: readonly ColoringPage[];
  onSelect: (page: ColoringPage) => void;
};

export function ColoringPagePicker({
  characters,
  scenes,
  onSelect,
}: ColoringPagePickerProps) {
  return (
    <div className={styles.root}>
      <p className={styles.lead}>選一張喜歡的圖，開始塗顏色吧！</p>
      <section aria-labelledby="coloring-chars">
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
                    sizes="(max-width: 640px) 42vw, 180px"
                    className={styles.thumbImg}
                  />
                </span>
                <span className={styles.cardTitle}>{page.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="coloring-scenes">
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
                    sizes="(max-width: 640px) 42vw, 180px"
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
  );
}
