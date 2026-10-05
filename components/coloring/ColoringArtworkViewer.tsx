/* eslint-disable @next/next/no-img-element -- Local IndexedDB Blob URLs cannot use the remote image optimizer. */
"use client";
import { useEffect, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  loadColoringArtwork,
  type ArtworkPreview,
  type ColoringArtwork,
} from "@/lib/coloring/artwork-storage";
import {
  downloadColoringBlob,
  shareColoringBlob,
  printColoringImage,
} from "@/lib/coloring/export-actions";
import styles from "./ColoringPagePicker.module.css";
export function ColoringArtworkViewer({
  preview,
  onClose,
}: {
  preview: ArtworkPreview;
  onClose: () => void;
}) {
  const [art, setArt] = useState<ColoringArtwork | null>(null),
    [url, setUrl] = useState(""),
    [error, setError] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(true, panel);
  useEffect(() => {
    let cancelled = false;
    let src = "";
    void loadColoringArtwork(preview.id)
      .then((a) => {
        if (cancelled) return;
        if (!a) throw new Error();
        src = URL.createObjectURL(a.compositeBlob);
        setUrl(src);
        setArt(a);
      })
      .catch(() => {
        if (!cancelled) setError("作品暫時讀不到，請稍後再試。");
      });
    return () => {
      cancelled = true;
      if (src) URL.revokeObjectURL(src);
    };
  }, [preview.id]);
  return (
    <div
      className={styles.viewerBackdrop}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        className={styles.viewer}
        role="dialog"
        aria-modal="true"
        aria-label="收藏作品"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <button type="button" onClick={onClose}>
          關閉
        </button>
        <h2>{preview.title}</h2>
        {url ? (
          <img src={url} alt={`${preview.title}完成作品`} />
        ) : (
          <p role="status">{error || "載入作品中…"}</p>
        )}
        {art ? (
          <div className={styles.viewerActions}>
            <button
              type="button"
              onClick={() => downloadColoringBlob(art.compositeBlob, art.title)}
            >
              存圖片
            </button>
            <button
              type="button"
              onClick={() =>
                void shareColoringBlob(art.compositeBlob, art.title).catch(() =>
                  setError("分享暫時無法開啟，可以先存圖片。"),
                )
              }
            >
              分享作品
            </button>
            <button
              type="button"
              onClick={() =>
                void printColoringImage(art.compositeBlob, art.title).catch(
                  () => setError("列印暫時無法開啟。"),
                )
              }
            >
              列印作品
            </button>
          </div>
        ) : null}
        <p role="status">{error}</p>
        <small>作品存在這台裝置</small>
      </div>
    </div>
  );
}
