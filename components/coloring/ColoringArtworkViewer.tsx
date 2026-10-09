/* eslint-disable @next/next/no-img-element -- Local IndexedDB Blob URLs cannot use the remote image optimizer. */
"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "@/components/ui/Icon";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  loadColoringArtwork,
  deleteColoringArtwork,
  type ArtworkPreview,
  type ColoringArtwork,
} from "@/lib/coloring/artwork-storage";
import {
  downloadColoringBlob,
  shareColoringBlob,
  printColoringImage,
} from "@/lib/coloring/export-actions";
import styles from "./ColoringPagePicker.module.css";

const LINE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** 跟漢堡抽屜同一種 24px 細線圖，不用另一套填色圖示。 */
function LineIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden focusable="false">
      {children}
    </svg>
  );
}

function SaveIcon() {
  return (
    <LineIcon>
      <path d="M12 4v9M8.2 10.2 12 14l3.8-3.8M5 18.5h14" {...LINE} />
    </LineIcon>
  );
}

function ShareIcon() {
  return (
    <LineIcon>
      <circle cx="7" cy="12" r="2.2" {...LINE} />
      <circle cx="17" cy="7" r="2.2" {...LINE} />
      <circle cx="17" cy="17" r="2.2" {...LINE} />
      <path d="m9 11 6-3M9 13l6 3" {...LINE} />
    </LineIcon>
  );
}

function PrintIcon() {
  return (
    <LineIcon>
      <path d="M7 8V4.5h10V8" {...LINE} />
      <path d="M7 16H5.5A1.5 1.5 0 0 1 4 14.5v-4A1.5 1.5 0 0 1 5.5 9h13A1.5 1.5 0 0 1 20 10.5v4a1.5 1.5 0 0 1-1.5 1.5H17" {...LINE} />
      <path d="M7 13.5h10V20H7z" {...LINE} />
    </LineIcon>
  );
}

function TrashIcon() {
  return (
    <LineIcon>
      <path d="M5 7h14M9 7V5h6v2M7.5 7l.8 12h7.4l.8-12" {...LINE} />
    </LineIcon>
  );
}

export function ColoringArtworkViewer({
  preview,
  onClose,
  onDelete,
}: {
  preview: ArtworkPreview;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [art, setArt] = useState<ColoringArtwork | null>(null),
    [url, setUrl] = useState(""),
    [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
        <div className={styles.viewerHead}>
          <h2>{preview.title}</h2>
          <button type="button" className={styles.iconBtn} aria-label="關閉" onClick={onClose}>
            <Icon name="close" size={24} />
          </button>
        </div>
        {url ? (
          <img src={url} alt={`${preview.title}完成作品`} />
        ) : (
          <p role="status">{error || "載入作品中…"}</p>
        )}
        {art ? (
          <div className={styles.viewerMenu}>
            <button
              type="button"
              className={styles.viewerRow}
              onClick={() => downloadColoringBlob(art.compositeBlob, art.title)}
            >
              <SaveIcon />
              存圖片
            </button>
            <button
              type="button"
              className={styles.viewerRow}
              onClick={() =>
                void shareColoringBlob(art.compositeBlob, art.title).catch(() =>
                  setError("分享暫時無法開啟，可以先存圖片。"),
                )
              }
            >
              <ShareIcon />
              分享作品
            </button>
            <button
              type="button"
              className={styles.viewerRow}
              onClick={() =>
                void printColoringImage(art.compositeBlob, art.title).catch(
                  () => setError("列印暫時無法開啟。"),
                )
              }
            >
              <PrintIcon />
              列印作品
            </button>
          </div>
        ) : null}
        {confirmDelete ? (
          <div className={styles.viewerMenu}>
            <p className={styles.confirmNote}>刪除這份收藏？這台裝置上就看不到了。</p>
            <button type="button" className={styles.viewerRow} disabled={deleting} onClick={() => setConfirmDelete(false)}>
              <Icon name="heart" size={24} />
              保留作品
            </button>
            <button
              type="button"
              className={styles.viewerRow}
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                try {
                  await deleteColoringArtwork(preview.id);
                  onDelete();
                } catch {
                  setError("作品還沒刪除，請再試一次。");
                  setDeleting(false);
                }
              }}
            >
              <TrashIcon />
              確認刪除
            </button>
          </div>
        ) : (
          <button type="button" className={styles.viewerRow} onClick={() => setConfirmDelete(true)}>
            <TrashIcon />
            刪除這份收藏
          </button>
        )}
        <p role="status">{error}</p>
        <p className={styles.srOnly}>作品存在這台裝置</p>
      </div>
    </div>
  );
}
