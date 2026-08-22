"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ColoringPage } from "@/data/coloring-pages";
import { listColoringDrafts, type ColoringDraft } from "@/lib/coloring/draft-storage";
import {
  COLORING_BACK_TO_COVER,
  COLORING_GALLERY_HEADING,
  COLORING_PICKER_LEAD,
} from "@/lib/coloring/flow";
import styles from "./ColoringPagePicker.module.css";

type GalleryItem = {
  page: ColoringPage;
  src: string;
  revoke: boolean;
};

type ColoringPagePickerProps = {
  characters: readonly ColoringPage[];
  scenes: readonly ColoringPage[];
  onSelect: (page: ColoringPage) => void;
  onBackToCover: () => void;
};

function draftToSrc(draft: ColoringDraft): { src: string; revoke: boolean } {
  if (typeof draft === "string") return { src: draft, revoke: false };
  return { src: URL.createObjectURL(draft), revoke: true };
}

export function ColoringPagePicker({
  characters,
  scenes,
  onSelect,
  onBackToCover,
}: ColoringPagePickerProps) {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    const catalog = [...characters, ...scenes];
    void listColoringDrafts().then((entries) => {
      if (cancelled) return;
      const items: GalleryItem[] = [];
      for (const entry of entries) {
        const page = catalog.find((p) => p.id === entry.pageId);
        if (!page) continue;
        const { src, revoke } = draftToSrc(entry.draft);
        if (revoke) created.push(src);
        items.push({ page, src, revoke });
      }
      setGallery(items);
    });
    return () => {
      cancelled = true;
      for (const src of created) URL.revokeObjectURL(src);
    };
  }, [characters, scenes]);

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
      {gallery.length > 0 ? (
        <section className={styles.gallery} aria-labelledby="coloring-gallery">
          <h2 id="coloring-gallery" className={styles.heading}>
            {COLORING_GALLERY_HEADING}
          </h2>
          <ul className={styles.galleryList}>
            {gallery.map((item) => (
              <li key={item.page.id}>
                <button
                  type="button"
                  className={styles.galleryCard}
                  onClick={() => onSelect(item.page)}
                  aria-label={`繼續塗：${item.page.title}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- 本機草稿 blob／data URL */}
                  <img src={item.src} alt="" className={styles.galleryThumb} />
                  <span className={styles.galleryTitle}>{item.page.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
