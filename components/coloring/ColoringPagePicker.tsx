/* eslint-disable @next/next/no-img-element -- Local IndexedDB Blob URLs cannot use the remote image optimizer. */
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import type { ColoringPage } from "@/data/coloring-pages";
import {
  listColoredPageIds,
  listColoringArtworks,
  type ArtworkPreview,
} from "@/lib/coloring/artwork-storage";
import { playSfx } from "@/lib/sfx";
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
  const [colored, setColored] = useState<ReadonlySet<string>>(new Set());
  const [revealedId, setRevealedId] = useState<string | null>(null);
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

  const refreshColored = (isLive: () => boolean = () => true) => {
    void listColoredPageIds()
      .then((ids) => {
        if (isLive()) setColored(ids);
      })
      .catch(() => {
        /* 讀不到就不貼星星，不影響選頁 */
      });
  };
  useEffect(() => {
    let live = true;
    refreshColored(() => live);
    return () => {
      live = false;
    };
  }, []);

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
            refreshColored();
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
              <PageCard
                key={page.id}
                page={page}
                colored={colored.has(page.id)}
                revealedId={revealedId}
                onReveal={setRevealedId}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </section>
        <section className={styles.spread} aria-labelledby="coloring-scenes">
          <h2 id="coloring-scenes" className={styles.heading}>
            {COLORING_PICKER_SCENES}
          </h2>
          <ul className={styles.grid}>
            {scenes.map((page) => (
              <PageCard
                key={page.id}
                page={page}
                colored={colored.has(page.id)}
                revealedId={revealedId}
                onReveal={setRevealedId}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** 線稿像一頁紙蓋在參考彩圖上，右下角掀起：一眼看到「塗完會像這樣」。 */
function PageCard({
  page,
  colored,
  revealedId,
  onReveal,
  onSelect,
}: {
  page: ColoringPage;
  colored: boolean;
  revealedId: string | null;
  onReveal: (id: string) => void;
  onSelect: (page: ColoringPage) => void;
}) {
  const coloredId = `colored-${page.id}`;
  const revealed = revealedId === page.id;
  return (
    <li>
      <button
        type="button"
        className={styles.card}
        data-revealed={revealed ? "true" : "false"}
        aria-pressed={revealed}
        onClick={() => {
          playSfx(revealed ? "tap" : "flip");
          if (!revealed) {
            onReveal(page.id);
            return;
          }
          onSelect(page);
        }}
        aria-label={`著色：${page.title}`}
        aria-describedby={colored ? coloredId : undefined}
      >
        <span className={styles.thumb}>
          <Image
            src={page.referenceSrc}
            alt=""
            fill
            sizes="(max-width: 640px) 46vw, 200px"
            className={`${styles.thumbImg} ${styles.colorThumb}`}
          />
          <Image
            src={page.lineArtSrc}
            alt=""
            fill
            sizes="(max-width: 640px) 46vw, 200px"
            className={`${styles.thumbImg} ${styles.lineThumb}`}
          />
          {colored ? (
            <svg className={styles.coloredStar} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2 6.1 20.4l1.3-6.5L2.5 9.3l6.6-.8z" />
            </svg>
          ) : null}
        </span>
        <span className={styles.cardTitle}>{page.title}</span>
        {colored ? (
          <span id={coloredId} className={styles.srOnly}>
            塗過
          </span>
        ) : null}
      </button>
    </li>
  );
}
