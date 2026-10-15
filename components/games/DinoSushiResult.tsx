"use client";

import { GameEndStation } from "@/components/games/GameEndStation";
import { IconChevronLeft } from "@/components/games/ClayIcons";
import { ResultStars, type ResultStarHint } from "@/components/games/ResultStars";
import { PlateArt } from "@/lib/games/dino-sushi/art";
import { DuoDuoSticker } from "@/lib/games/dino-sushi/duoduo-sticker";
import type { RoundMedals } from "@/lib/games/dino-sushi/medals";
import { stickerById } from "@/lib/games/dino-sushi/stickers";
import { DinoSushiStickerFace } from "./DinoSushiStickerBook";
import { TapButton } from "./DinoSushiPiece";
import { ShopBelt, ShopWall } from "./DinoSushiShop";
import type { DinoSushiOutcome } from "./DinoSushiView";
import styles from "./DinoSushiView.module.css";

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

/** 沒拿到的星各自差什麼（拿滿就空）。 */
function missedRules(medals: RoundMedals): ResultStarHint[] {
  const missed: ResultStarHint[] = [];
  if (!medals.flawless) missed.push({ key: "flawless", text: "3 盤一次做對", mark: <GoldPlate /> });
  if (!medals.collectedAll) missed.push({ key: "all", text: "5 盤都一次做對", mark: <GoldPlate /> });
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

function FreshStickers({
  fresh,
  gift,
  reducedMotion,
}: {
  fresh: readonly string[];
  gift: string;
  reducedMotion: boolean;
}) {
  if (fresh.length === 0) return null;
  const gifted = fresh.length === 1 && fresh[0] === gift;
  const stickers = fresh.map((id) => stickerById(id)).filter((sticker) => sticker != null);
  return (
    <div className={styles.freshStickers} data-reduced={reducedMotion ? "true" : undefined}>
      <p className={styles.freshTitle}>{gifted ? "多多送你貼紙！" : "新貼紙！"}</p>
      <ul className={styles.freshRow}>
        {stickers.map((sticker) => (
          <li key={sticker.id} className={styles.freshThumb}>
            <DinoSushiStickerFace sticker={sticker} locked={false} />
          </li>
        ))}
      </ul>
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
        <FreshStickers fresh={fresh} gift={gift} reducedMotion={reducedMotion} />
      </>
    ) : (
      <>
        <PlateRow outcome={outcome} reducedMotion={reducedMotion} />
        <FreshStickers fresh={fresh} gift={gift} reducedMotion={reducedMotion} />
      </>
    );
  const bookLabel = fresh.length > 0 ? "放進貼紙書" : "貼紙書";
  return (
    <div className={styles.resultOverlay} data-testid="dino-sushi-result">
      {/* 店裡吃飽飽的多多（裝飾）：同一間迴轉壽司店，結算不像跳到另一個畫面 */}
      <div className={styles.resultHero} data-reduced={reducedMotion ? "true" : undefined} aria-hidden>
        <ShopWall />
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
