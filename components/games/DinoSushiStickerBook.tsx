"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { ToppingArt, BaseArt, baseSrc, toppingSrc } from "@/lib/games/dino-sushi/art";
import { customerById } from "@/lib/games/dino-sushi/customers";
import { DUODUO_TOOTHBRUSH_SRC, duoduoStickerSrc } from "@/lib/games/dino-sushi/duoduo-sticker";
import {
  DINO_SUSHI_STICKER_TOTAL,
  DINO_SUSHI_STICKERS,
  STICKER_GROUP_LABEL,
  STICKER_ROUND_PROMISE,
  stickerTapSpeech,
  type DinoSushiSticker,
  type StickerArt,
  type StickerGroup,
} from "@/lib/games/dino-sushi/stickers";
import { TapButton } from "./DinoSushiPiece";
import styles from "./DinoSushiStickerBook.module.css";

const GROUPS: StickerGroup[] = ["food", "base", "mood", "surprise", "customer"];

/** 開書時一次最多閃幾張新貼紙；捲過去的話等捲完再閃。 */
const FLASH_MAX = 6;
const FLASH_AFTER_SCROLL_MS = 350;

function artSrc(art: StickerArt): string {
  switch (art.kind) {
    case "topping":
      return toppingSrc(art.id);
    case "base":
      return baseSrc(art.id);
    case "medal":
      return duoduoStickerSrc(art.state);
    case "customer":
      return customerById(art.id).avatar;
    default:
      return art.state === "toothbrush" ? DUODUO_TOOTHBRUSH_SRC : duoduoStickerSrc(art.state);
  }
}

export function DinoSushiStickerFace({
  sticker,
  locked,
}: {
  sticker: DinoSushiSticker;
  locked: boolean;
}) {
  const art = sticker.art;
  /* 鎖住時用原圖當遮罩畫不透明的暖棕剪影（圖檔不動）；圖本身藏起來 */
  const silhouette = locked ? ({ ["--sil" as string]: `url("${artSrc(art)}")` } as CSSProperties) : undefined;
  const frame =
    art.kind === "medal"
      ? art.frame === "gold"
        ? styles.frameGold
        : styles.frameSun
      : art.kind === "customer"
        ? styles.face
        : "";
  let image = null;
  if (art.kind === "topping") image = <ToppingArt id={art.id} />;
  else if (art.kind === "base") image = <BaseArt id={art.id} />;
  else if (art.kind === "medal") {
    image = (
      // eslint-disable-next-line @next/next/no-img-element -- 現有多多貼紙
      <img src={duoduoStickerSrc(art.state)} alt="" draggable={false} decoding="async" />
    );
  } else if (art.kind === "customer") {
    image = (
      // eslint-disable-next-line @next/next/no-img-element -- 現有角色定裝照，圓裁現成的 jpg
      <img src={customerById(art.id).avatar} alt="" draggable={false} decoding="async" />
    );
  } else {
    const src = art.state === "toothbrush" ? DUODUO_TOOTHBRUSH_SRC : duoduoStickerSrc(art.state);
    image = (
      // eslint-disable-next-line @next/next/no-img-element -- 現有多多貼紙
      <img src={src} alt="" draggable={false} decoding="async" />
    );
  }
  return (
    <span className={`${styles.pic} ${frame}`} data-kind={art.kind} style={silhouette}>
      {/* 鎖住只畫剪影；問號只留在格子名稱，不再蓋住剪影的外形 */}
      {image}
    </span>
  );
}

type Props = {
  unlocked: readonly string[];
  seen: readonly string[];
  reducedMotion: boolean;
  onClose: () => void;
  onSpeak: (text: string) => void;
};

type Flash = { ids: readonly string[]; afterScroll: boolean };

function fullyInside(el: Element, top: number, bottom: number, shift = 0): boolean {
  const r = el.getBoundingClientRect();
  return r.top - shift >= top - 1 && r.bottom - shift <= bottom + 1;
}

/**
 * 開書時把新貼紙指給孩子看：畫面內的新貼紙依序閃一次；畫面內一張都沒有（新的在下面幾區）
 * 才把第一張新的捲到中間再閃。只在書裡捲，不動外層頁面。一次開書只做一次。
 * 減少動態：瞬間捲、不閃。
 */
function useNewStickerFlash(bookRef: RefObject<HTMLDivElement | null>, reducedMotion: boolean): Flash | null {
  const [flash, setFlash] = useState<Flash | null>(null);
  const done = useRef(false);
  useEffect(() => {
    const book = bookRef.current;
    if (done.current || !book) return;
    done.current = true;
    const cells = [...book.querySelectorAll<HTMLElement>('[data-new="true"]')];
    if (cells.length === 0) return;
    const box = book.getBoundingClientRect();
    const barHeight = book.querySelector("[data-book-bar]")?.getBoundingClientRect().height ?? 0;
    const top = box.top + barHeight;
    const bottom = box.bottom;
    let visible = cells.filter((cell) => fullyInside(cell, top, bottom));
    let afterScroll = false;
    if (visible.length === 0) {
      const first = cells[0]!.getBoundingClientRect();
      const wanted = book.scrollTop + (first.top - top) - (bottom - top - first.height) / 2;
      const target = Math.max(0, Math.min(wanted, book.scrollHeight - book.clientHeight));
      const shift = target - book.scrollTop;
      visible = cells.filter((cell) => fullyInside(cell, top, bottom, shift));
      book.scrollTo({ top: target, behavior: reducedMotion ? "auto" : "smooth" });
      afterScroll = true;
    }
    if (reducedMotion) return;
    setFlash({ ids: visible.slice(0, FLASH_MAX).map((cell) => cell.dataset.stickerId ?? ""), afterScroll });
  }, [bookRef, reducedMotion]);
  return flash;
}

function flashStyle(index: number, afterScroll: boolean): CSSProperties {
  return {
    ["--flash-i" as string]: index,
    ["--flash-wait" as string]: afterScroll ? `${FLASH_AFTER_SCROLL_MS}ms` : "0ms",
  };
}

export function DinoSushiStickerBook({ unlocked, seen, reducedMotion, onClose, onSpeak }: Props) {
  const bookRef = useRef<HTMLDivElement>(null);
  const owned = new Set(unlocked);
  const known = new Set(seen);
  useFocusTrap(true, bookRef);
  const flash = useNewStickerFlash(bookRef, reducedMotion);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={bookRef}
      className={styles.book}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dino-sushi-sticker-book-title"
      data-testid="dino-sushi-sticker-book"
      data-reduced={reducedMotion ? "true" : undefined}
    >
      <div className={styles.bar} data-book-bar>
        <button type="button" className={styles.close} onClick={onClose}>
          回去
        </button>
        <div>
          <h2 id="dino-sushi-sticker-book-title" className={styles.heading}>
            貼紙書
          </h2>
          <p className={styles.count}>
            {owned.size}/{DINO_SUSHI_STICKER_TOTAL}
          </p>
        </div>
      </div>
      {GROUPS.map((group) => {
        const stickers = DINO_SUSHI_STICKERS.filter((sticker) => sticker.group === group);
        const newCount = stickers.filter((sticker) => owned.has(sticker.id) && !known.has(sticker.id)).length;
        return (
          <section key={group} className={styles.section} aria-label={STICKER_GROUP_LABEL[group]}>
            <h3 className={styles.sectionTitle}>
              {STICKER_GROUP_LABEL[group]}
              {/* 家長一眼知道下面幾區也有新的 */}
              {newCount > 0 ? (
                <span className={styles.sectionNew} aria-hidden>
                  新 {newCount}
                </span>
              ) : null}
            </h3>
            <ul className={styles.grid}>
              {stickers.map((sticker) => {
                const got = owned.has(sticker.id);
                const isNew = got && !known.has(sticker.id);
                const flashAt = flash ? flash.ids.indexOf(sticker.id) : -1;
                return (
                  <li key={sticker.id}>
                    <TapButton
                      className={styles.cell}
                      data-sticker-id={sticker.id}
                      data-locked={got ? undefined : "true"}
                      data-new={isNew ? "true" : undefined}
                      data-flash={flashAt >= 0 ? "true" : undefined}
                      style={flashAt >= 0 && flash ? flashStyle(flashAt, flash.afterScroll) : undefined}
                      aria-label={stickerTapSpeech(sticker.id, got)}
                      onTap={() => onSpeak(stickerTapSpeech(sticker.id, got))}
                    >
                      <DinoSushiStickerFace sticker={sticker} locked={!got} />
                      <span className={styles.name} aria-hidden>
                        {got ? sticker.name : "？"}
                      </span>
                      {isNew ? (
                        <span className={styles.badge} aria-hidden>
                          新
                        </span>
                      ) : null}
                    </TapButton>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <p className={styles.footer}>{STICKER_ROUND_PROMISE}</p>
    </div>
  );
}
