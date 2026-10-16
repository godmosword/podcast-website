"use client";

import { useRef, type CSSProperties } from "react";
import { GameEndStation } from "@/components/games/GameEndStation";
import { IconChevronLeft } from "@/components/games/ClayIcons";
import { ResultStars, type ResultStarHint } from "@/components/games/ResultStars";
import { PlateArt } from "@/lib/games/dino-sushi/art";
import { DuoDuoSticker } from "@/lib/games/dino-sushi/duoduo-sticker";
import { freshLayout } from "@/lib/games/dino-sushi/fresh-layout";
import { ORDERS_PER_ROUND } from "@/lib/games/dino-sushi/orders";
import type { RoundMedals } from "@/lib/games/dino-sushi/medals";
import { stickerById, type DinoSushiSticker } from "@/lib/games/dino-sushi/stickers";
import { roundVariety } from "@/lib/games/dino-sushi/variety";
import { DinoSushiStickerFace } from "./DinoSushiStickerBook";
import { TapButton } from "./DinoSushiPiece";
import { ShopBelt, ShopWall } from "./DinoSushiShop";
import type { DinoSushiOutcome } from "./DinoSushiView";
import { useFreshGrid } from "./useFreshGrid";
import styles from "./DinoSushiView.module.css";

/** 新貼紙等盤子和星星出來才彈；第 10 張以後不再往後延，整段不超過約 1.1 秒。 */
const FRESH_STAGGER_CAP = 9;
const FLAWLESS_TARGET = 3;

type Props = {
  outcome: DinoSushiOutcome;
  /** 點餐模式拿到幾顆星；自由做為 null。 */
  stars: number | null;
  /** 這一輪新拿到的貼紙。 */
  fresh: readonly string[];
  /** 這一輪若是保底送的，就是那張的 id。 */
  gift: string;
  reducedMotion: boolean;
  onReplay: () => void;
  onTitle: () => void;
  onBook: () => void;
};

function GoldPlate() {
  return (
    <span className={styles.hintPlate}>
      <PlateArt gold />
    </span>
  );
}

/** 沒拿到的星各自差什麼（拿滿就空）。帶上這輪做到幾盤，家長不會讀成已經達成。 */
function missedRules(medals: RoundMedals): ResultStarHint[] {
  const missed: ResultStarHint[] = [];
  const got = medals.firstTryCount;
  if (!medals.flawless) {
    missed.push({
      key: "flawless",
      text: `${FLAWLESS_TARGET} 盤一次做對（${Math.min(got, FLAWLESS_TARGET)}/${FLAWLESS_TARGET}）`,
      mark: <GoldPlate />,
    });
  }
  if (!medals.collectedAll) {
    missed.push({
      key: "all",
      text: `${ORDERS_PER_ROUND} 盤都一次做對（${got}/${ORDERS_PER_ROUND}）`,
      mark: <GoldPlate />,
    });
  }
  return missed;
}

/** 疊好的盤子：做了幾個一眼看得出來；一個接一個彈出來（減少動態時直接出現）。 */
function PlateRow({ outcome, reducedMotion }: { outcome: DinoSushiOutcome; reducedMotion: boolean }) {
  return (
    <p
      className={styles.resultPlates}
      role="img"
      aria-label={`吃了 ${outcome.plates.length} 盤`}
      data-reduced={reducedMotion ? "true" : undefined}
    >
      {outcome.plates.slice(-10).map((p, i) => (
        <span
          key={i}
          className={styles.resultPlate}
          data-gold={p.gold ? "true" : undefined}
          style={{ ["--i" as string]: i }}
          aria-hidden
        >
          <PlateArt gold={p.gold} />
        </span>
      ))}
    </p>
  );
}

function staggerStyle(i: number): CSSProperties {
  return { ["--i" as string]: i };
}

/** 新貼紙格：放得下就全放，放不下時最後一格是「+N」，點了打開貼紙書。 */
function FreshGrid({ stickers, onBook }: { stickers: readonly DinoSushiSticker[]; onBook: () => void }) {
  const ref = useRef<HTMLUListElement>(null);
  const { columns, rows } = useFreshGrid(ref);
  const { shown, more } = freshLayout(stickers.length, columns, rows);
  return (
    <ul ref={ref} className={styles.freshRow}>
      {stickers.slice(0, shown).map((sticker, i) => (
        <li key={sticker.id} className={styles.freshThumb} style={staggerStyle(Math.min(i, FRESH_STAGGER_CAP))}>
          <DinoSushiStickerFace sticker={sticker} locked={false} />
        </li>
      ))}
      {more > 0 ? (
        <li className={styles.freshThumb} style={staggerStyle(Math.min(shown, FRESH_STAGGER_CAP) + 1)}>
          <TapButton
            className={styles.freshMore}
            data-fresh-more
            aria-label={`還有 ${more} 張，打開貼紙書`}
            onTap={onBook}
          >
            +{more}
          </TapButton>
        </li>
      ) : null}
    </ul>
  );
}

function FreshStickers({
  fresh,
  gift,
  reducedMotion,
  onBook,
}: {
  fresh: readonly string[];
  gift: string;
  reducedMotion: boolean;
  onBook: () => void;
}) {
  if (fresh.length === 0) return null;
  const gifted = fresh.length === 1 && fresh[0] === gift;
  const stickers = fresh.map((id) => stickerById(id)).filter((sticker) => sticker != null);
  return (
    <div className={styles.freshStickers} data-reduced={reducedMotion ? "true" : undefined}>
      <p className={styles.freshTitle}>{gifted ? "多多送你貼紙！" : "新貼紙！"}</p>
      <FreshGrid stickers={stickers} onBook={onBook} />
    </div>
  );
}

export function DinoSushiResult({
  outcome,
  stars,
  fresh,
  gift,
  reducedMotion,
  onReplay,
  onTitle,
  onBook,
}: Props) {
  const titleAction = { label: "回標題", icon: <IconChevronLeft size={22} />, onClick: onTitle };
  const details =
    outcome.medals && stars !== null ? (
      <>
        <PlateRow outcome={outcome} reducedMotion={reducedMotion} />
        <ResultStars stars={stars} hints={missedRules(outcome.medals)} animate={!reducedMotion} />
        <FreshStickers fresh={fresh} gift={gift} reducedMotion={reducedMotion} onBook={onBook} />
      </>
    ) : (
      <>
        <PlateRow outcome={outcome} reducedMotion={reducedMotion} />
        <FreshStickers fresh={fresh} gift={gift} reducedMotion={reducedMotion} onBook={onBook} />
      </>
    );
  const bookLabel = fresh.length > 0 ? "放進貼紙書" : "貼紙書";
  const mood = roundVariety(outcome.seed);
  return (
    <div
      className={styles.resultOverlay}
      data-testid="dino-sushi-result"
      /* 有新貼紙時店面收矮、彩紙收起，「放進貼紙書」才留在同一屏 */
      data-fresh={fresh.length > 0 ? "true" : undefined}
    >
      {/* 店裡吃飽飽的多多（裝飾）：同一間迴轉壽司店，結算不像跳到另一個畫面 */}
      <div className={styles.resultHero} data-reduced={reducedMotion ? "true" : undefined} aria-hidden>
        <ShopWall sky={mood.sky} lantern={mood.lantern} />
        <span className={styles.resultDuo}>
          <DuoDuoSticker mouth="closed" face="love" />
        </span>
        <ShopBelt />
      </div>
      <GameEndStation
        className={styles.resultStation}
        mood="win"
        title={outcome.mode === "order" ? "多多吃飽飽！" : "多多吃飽了！"}
        gameSlug="dino-sushi"
        onReplay={onReplay}
        replayLabel={outcome.mode === "order" ? "再做一輪" : "再自由做"}
        details={details}
        leadingAction={titleAction}
        sideSize={64}
        mainSize={88}
        extraActions={
          <TapButton className={styles.resultBook} onTap={onBook}>
            {bookLabel}
          </TapButton>
        }
      />
    </div>
  );
}
