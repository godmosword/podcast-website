/* eslint-disable @next/next/no-img-element -- Local IndexedDB Blob URLs cannot use the remote image optimizer. */
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import type { ColoringPage } from "@/data/coloring-pages";
import {
  listColoringArtworks,
  type ArtworkPreview,
} from "@/lib/coloring/artwork-storage";
import { ColoringArtworkViewer } from "./ColoringArtworkViewer";
import {
  COLORING_GALLERY_HEADING,
  COLORING_PICKER_CHARACTERS,
  COLORING_PICKER_LEAD,
  COLORING_PICKER_SCENES,
} from "@/lib/coloring/flow";
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
  const [artworks, setArtworks] = useState<
    (ArtworkPreview & { src: string })[]
  >([]);
  const [selected, setSelected] = useState<ArtworkPreview | null>(null);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const artworkUrls = useRef<string[]>([]);
  const returnFocus = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLParagraphElement>(null);
  const appendArtworks = (entries: ArtworkPreview[]) => {
    const items = entries.map((a) => {
      const src = URL.createObjectURL(a.thumbnailBlob);
      artworkUrls.current.push(src);
      return { ...a, src };
    });
    setArtworks((old) => [...old, ...items]);
    setHasMore(entries.length === 12);
  };
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      appendArtworks(
        await listColoringArtworks(12, artworks.at(-1)),
      );
    } catch {
      setError("作品暫時讀不到，請稍後再試。");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void listColoringArtworks()
      .then((entries) => {
        if (cancelled) return;
        const items = entries.map((a) => {
          const src = URL.createObjectURL(a.thumbnailBlob);
          artworkUrls.current.push(src);
          return { ...a, src };
        });
        setArtworks(items);
        setHasMore(entries.length === 12);
      })
      .catch(() => {
        if (!cancelled) setError("收藏暫時讀不到，請稍後再試。");
      });
    return () => {
      cancelled = true;
      for (const src of artworkUrls.current) URL.revokeObjectURL(src);
      artworkUrls.current = [];
    };
  }, []);

  return (
    <div className={styles.root}>
      {/* G-M7：「← 回封面」拿掉——唯一出口是抬頭的「← 回遊樂園」，封面只是入口 splash */}
      <p ref={heading} tabIndex={-1} className={styles.lead}>{COLORING_PICKER_LEAD}</p>
      {error ? <p role="status">{error}</p> : null}
      {artworks.length > 0 || hasMore ? (
        <section className={styles.gallery} aria-label="作品收藏">
          <h2 className={styles.heading}>{COLORING_GALLERY_HEADING}</h2>
          <p className={styles.localNote}>作品存在這台裝置</p>
          <ul className={styles.galleryList}>
            {artworks.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className={styles.galleryCard}
                  onClick={(e) => {
                    returnFocus.current = e.currentTarget;
                    setSelected(a);
                  }}
                  aria-label={`看作品：${a.title}`}
                >
                  <img
                    src={a.src}
                    alt=""
                    loading="lazy"
                    className={styles.galleryThumb}
                  />
                  <span className={styles.galleryTitle}>{a.title}</span>
                </button>
              </li>
            ))}
          </ul>
          {hasMore ? (
            <button type="button" disabled={loadingMore} onClick={loadMore}>
              更多作品
            </button>
          ) : null}
        </section>
      ) : null}
      {selected ? (
        <ColoringArtworkViewer
          preview={selected}
          onDelete={() => {
            const removed = artworks.find((a) => a.id === selected.id);
            if (removed) {
              URL.revokeObjectURL(removed.src);
              artworkUrls.current = artworkUrls.current.filter((src) => src !== removed.src);
            }
            setArtworks((current) => current.filter((a) => a.id !== selected.id));
            setSelected(null);
            heading.current?.focus();
          }}
          onClose={() => {
            setSelected(null);
            returnFocus.current?.focus();
          }}
        />
      ) : null}
      <div className={styles.book}>
        <section className={styles.spread} aria-labelledby="coloring-chars">
          <h2 id="coloring-chars" className={styles.heading}>
            {COLORING_PICKER_CHARACTERS}
          </h2>
          <ul className={styles.grid}>
            {characters.map((page) => (
              <PageCard key={page.id} page={page} onSelect={onSelect} />
            ))}
          </ul>
        </section>
        <section className={styles.spread} aria-labelledby="coloring-scenes">
          <h2 id="coloring-scenes" className={styles.heading}>
            {COLORING_PICKER_SCENES}
          </h2>
          <ul className={styles.grid}>
            {scenes.map((page) => (
              <PageCard key={page.id} page={page} onSelect={onSelect} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** 左上是線稿、右下是參考彩圖：一眼看到「塗完會像這樣」。 */
function PageCard({
  page,
  onSelect,
}: {
  page: ColoringPage;
  onSelect: (page: ColoringPage) => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={styles.card}
        onClick={() => onSelect(page)}
        aria-label={`著色：${page.title}`}
      >
        <span className={styles.thumb}>
          <Image
            src={page.lineArtSrc}
            alt=""
            fill
            sizes="(max-width: 640px) 46vw, 200px"
            className={`${styles.thumbImg} ${styles.lineThumb}`}
          />
          <Image
            src={page.referenceSrc}
            alt=""
            fill
            sizes="(max-width: 640px) 46vw, 200px"
            className={`${styles.thumbImg} ${styles.colorThumb}`}
          />
        </span>
        <span className={styles.cardTitle}>{page.title}</span>
      </button>
    </li>
  );
}
