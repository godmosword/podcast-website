"use client";

import { useEffect, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { ToppingArt, BaseArt } from "@/lib/games/dino-sushi/art";
import { customerById } from "@/lib/games/dino-sushi/customers";
import { DUODUO_TOOTHBRUSH_SRC, duoduoStickerSrc } from "@/lib/games/dino-sushi/duoduo-sticker";
import {
  DINO_SUSHI_STICKER_TOTAL,
  DINO_SUSHI_STICKERS,
  STICKER_GROUP_LABEL,
  STICKER_ROUND_PROMISE,
  stickerTapSpeech,
  type DinoSushiSticker,
  type StickerGroup,
} from "@/lib/games/dino-sushi/stickers";
import { TapButton } from "./DinoSushiPiece";
import styles from "./DinoSushiStickerBook.module.css";

const GROUPS: StickerGroup[] = ["food", "base", "mood", "surprise", "customer"];

export function DinoSushiStickerFace({
  sticker,
  locked,
}: {
  sticker: DinoSushiSticker;
  locked: boolean;
}) {
  const art = sticker.art;
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
    <span className={`${styles.pic} ${frame}`} data-kind={art.kind}>
      {image}
      {locked ? (
        <span className={styles.mystery} aria-hidden>
          ？
        </span>
      ) : null}
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

export function DinoSushiStickerBook({ unlocked, seen, reducedMotion, onClose, onSpeak }: Props) {
  const bookRef = useRef<HTMLDivElement>(null);
  const owned = new Set(unlocked);
  const known = new Set(seen);
  useFocusTrap(true, bookRef);

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
      <div className={styles.bar}>
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
      {GROUPS.map((group) => (
        <section key={group} className={styles.section} aria-label={STICKER_GROUP_LABEL[group]}>
          <h3 className={styles.sectionTitle}>{STICKER_GROUP_LABEL[group]}</h3>
          <ul className={styles.grid}>
            {DINO_SUSHI_STICKERS.filter((sticker) => sticker.group === group).map((sticker) => {
              const got = owned.has(sticker.id);
              const isNew = got && !known.has(sticker.id);
              return (
                <li key={sticker.id}>
                  <TapButton
                    className={styles.cell}
                    data-locked={got ? undefined : "true"}
                    data-new={isNew ? "true" : undefined}
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
      ))}
      <p className={styles.footer}>{STICKER_ROUND_PROMISE}</p>
    </div>
  );
}
