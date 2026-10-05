/* eslint-disable @next/next/no-img-element -- Local IndexedDB Blob URLs cannot use the remote image optimizer. */
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import type { ColoringPage } from "@/data/coloring-pages";
import { type ColoringDraftRecord } from "@/lib/coloring/draft-storage";
import { catalogColoringDrafts } from "@/lib/coloring/catalog-drafts";
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

type GalleryItem = {
  page: ColoringPage;
  src: string;
  revoke: boolean;
  key: string;
  current: boolean;
};

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
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
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
    const created: string[] = [];
    const catalog = [...characters, ...scenes];
    void catalogColoringDrafts(catalog)
      .then((entries: ColoringDraftRecord[]) => {
        if (cancelled) return;
        const items: GalleryItem[] = [];
        for (const entry of entries) {
          const page = catalog.find((p) => p.id === entry.pageId);
          if (!page || !entry.thumbnailBlob) continue;
          const src = URL.createObjectURL(entry.thumbnailBlob);
          created.push(src);
          items.push({
            page,
            src,
            revoke: true,
            key: entry.key,
            current: page.lineArtRevision === entry.lineArtRevision,
          });
        }
        setGallery(items);
      })
      .catch(() => {
        if (!cancelled)
          setError("草稿暫時讀不到，請重新整理後再試；作品仍保留。");
      });
    void listColoringArtworks()
      .then((entries) => {
        if (!cancelled) appendArtworks(entries);
      })
      .catch(() => {
        if (!cancelled) setError("收藏暫時讀不到，請稍後再試。");
      });
    return () => {
      cancelled = true;
      for (const src of [...created, ...artworkUrls.current])
        URL.revokeObjectURL(src);
      artworkUrls.current = [];
    };
  }, [characters, scenes]);

  return (
    <div className={styles.root}>
      {/* G-M7：「← 回封面」拿掉——唯一出口是抬頭的「← 回遊樂園」，封面只是入口 splash */}
      <p ref={heading} tabIndex={-1} className={styles.lead}>{COLORING_PICKER_LEAD}</p>
      {gallery.length > 0 ? (
        <section className={styles.gallery} aria-labelledby="coloring-gallery">
          <h2 id="coloring-gallery" className={styles.heading}>
            繼續塗
          </h2>
          <ul className={styles.galleryList}>
            {gallery.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={styles.galleryCard}
                  onClick={() => {
                    if (item.current) onSelect(item.page);
                  }}
                  disabled={!item.current}
                  aria-label={`繼續塗：${item.page.title}`}
                >
                  <img src={item.src} alt="" className={styles.galleryThumb} />
                  <span className={styles.galleryTitle}>
                    {item.page.title}
                    {!item.current ? " · 舊版本" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
              <li key={page.id}>
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
                  </span>
                  <span className={styles.cardTitle}>{page.title}</span>
                  {gallery.some((g) => g.page.id === page.id && g.current) ? (
                    <small>有草稿 · 可以繼續塗</small>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className={styles.spread} aria-labelledby="coloring-scenes">
          <h2 id="coloring-scenes" className={styles.heading}>
            {COLORING_PICKER_SCENES}
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
                      src={page.lineArtSrc}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 46vw, 200px"
                      className={`${styles.thumbImg} ${styles.lineThumb}`}
                    />
                  </span>
                  <span className={styles.cardTitle}>{page.title}</span>
                  {gallery.some((g) => g.page.id === page.id && g.current) ? (
                    <small>有草稿 · 可以繼續塗</small>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
