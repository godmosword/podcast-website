/* eslint-disable @next/next/no-img-element -- 取色需要與原尺寸對齊的 <img>，不走 next/image 的 srcset。 */
"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import type { ColoringPage } from "@/data/coloring-pages";
import {
  COLORING_REFERENCE_CAPTION,
  COLORING_REFERENCE_PEEK,
  COLORING_REFERENCE_PEEK_HINT,
  COLORING_REFERENCE_TITLE,
} from "@/lib/coloring/flow";
import styles from "./ColoringReference.module.css";

/** 縮圖比這窄時點一下改成放大看，免得小手點不準。 */
const PICK_MIN_WIDTH = 160;

type Sample = (nx: number, ny: number) => string | null;

function pointIn(event: MouseEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    width: rect.width,
    nx: (event.clientX - rect.left) / rect.width,
    ny: (event.clientY - rect.top) / rect.height,
  };
}

type ColoringReferenceProps = {
  page: ColoringPage;
  sample: Sample;
  onPick: (hex: string) => void;
  onPeek: () => void;
  /** 「換成○○了」；放在卡片裡，從放大圖取色也會唸出來。 */
  status: string;
};

/** 參考彩圖卡：手機是橫條縮圖，桌機在右欄放大；點彩圖直接換成那塊的顏色。 */
export const ColoringReference = forwardRef<HTMLButtonElement, ColoringReferenceProps>(
  function ColoringReference({ page, sample, onPick, onPeek, status }, peekRef) {
    const [marker, setMarker] = useState<{ x: number; y: number; hex: string } | null>(null);
    const [broken, setBroken] = useState(false);

    const handleImage = (event: MouseEvent<HTMLButtonElement>) => {
      const { width, nx, ny } = pointIn(event);
      // 鍵盤觸發（detail 0）或縮圖太小：放大到畫布上再挑。
      if (event.detail === 0 || width < PICK_MIN_WIDTH) {
        onPeek();
        return;
      }
      const hex = sample(nx, ny);
      if (!hex) return;
      onPick(hex);
      setMarker({ x: nx, y: ny, hex });
    };

    return (
      <section className={styles.card} aria-label={COLORING_REFERENCE_TITLE}>
        <button
          ref={peekRef}
          type="button"
          className={styles.figure}
          onClick={handleImage}
          aria-label={`${page.title}參考彩圖，點一下拿顏色`}
        >
          {broken ? (
            <span className={styles.broken}>彩圖暫時打不開</span>
          ) : (
            <img
              src={page.referenceSrc}
              alt=""
              draggable={false}
              onError={() => setBroken(true)}
            />
          )}
          {marker ? (
            <span
              key={`${marker.x}-${marker.y}`}
              className={styles.marker}
              style={{
                left: `${marker.x * 100}%`,
                top: `${marker.y * 100}%`,
                background: marker.hex,
              }}
              aria-hidden="true"
            />
          ) : null}
        </button>
        <div className={styles.body}>
          <p className={styles.title}>
            {COLORING_REFERENCE_TITLE}
            <span className={styles.tapHint}>・點小圖放大</span>
          </p>
          <p className={styles.caption}>{page.activity ?? COLORING_REFERENCE_CAPTION}</p>
          <button type="button" className={styles.peekBtn} onClick={onPeek}>
            {COLORING_REFERENCE_PEEK}
          </button>
          <p className={styles.status} role="status" aria-live="polite">
            {status}
          </p>
        </div>
      </section>
    );
  },
);

type ColoringReferencePeekProps = {
  page: ColoringPage;
  sample: Sample;
  onPick: (hex: string) => void;
  onClose: () => void;
};

/** 疊在畫布上的大彩圖：點一個顏色就換色並回到畫布。 */
export function ColoringReferencePeek({
  page,
  sample,
  onPick,
  onClose,
}: ColoringReferencePeekProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleImage = (event: MouseEvent<HTMLButtonElement>) => {
    // 鍵盤按下去沒有座標可取色，就當成「回去塗」。
    if (event.detail === 0) {
      onClose();
      return;
    }
    const { nx, ny } = pointIn(event);
    const hex = sample(nx, ny);
    if (hex) onPick(hex);
    onClose();
  };

  return (
    <div className={styles.peek} role="group" aria-label={`${page.title}參考彩圖`}>
      <button
        type="button"
        className={styles.peekImage}
        onClick={handleImage}
        aria-label="點彩圖上的顏色，回去塗"
      >
        <img src={page.referenceSrc} alt="" draggable={false} />
      </button>
      <p className={styles.peekHint}>{COLORING_REFERENCE_PEEK_HINT}</p>
      <button ref={closeRef} type="button" className={styles.peekClose} onClick={onClose}>
        回去塗
      </button>
    </div>
  );
}
