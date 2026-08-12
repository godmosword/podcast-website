import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import Doodle from "@/components/decor/Doodle";
import Wheel from "@/components/decor/Wheel";
import decor from "@/components/decor/decor.module.css";
import Icon from "@/components/ui/Icon";
import { GAMES, gameParentTip, type GameMeta } from "@/data/games";
import { getSiteUrl } from "@/lib/site-url";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "車車遊樂園",
  description:
    "和故事裡的車車朋友一起玩小遊戲：繽紛消消樂、繪本著色與繽紛樂園，適合 3–12 歲親子。",
  openGraph: {
    title: "車車遊樂園 · 小遊戲",
    description: "黏土風親子小遊戲與繪本著色，一起探索車車遊樂園。",
    url: `${getSiteUrl()}/games`,
  },
};

const GAME_TYPE_LABEL: Record<GameMeta["gameType"], string> = {
  match: "找一找",
  blocks: "堆疊挑戰",
  coloring: "塗顏色",
};

/** 精簡年齡標：3–7 歲 → 3–7 */
function ageShort(ageRange: string): string {
  return ageRange.replace(/\s*歲\s*$/u, "");
}

/**
 * 家長在選卡當下就需要的判斷資訊（時長／有無時間壓力）。
 * 文案刻意短：meta 行要在 3 欄網格最窄的 234px 卡上仍保持單行，
 * 否則各卡文字基線會參差（見 /design-review 2026-08-12）。
 */
function paceLabel(game: GameMeta): string {
  return game.hasTimer ? "⏱ 有計時" : "🌿 不趕時間";
}

function GameCard({ game, eager }: { game: GameMeta; eager: boolean }) {
  const parentTip = gameParentTip(game);
  const ariaParts = [
    game.title,
    game.teaser,
    GAME_TYPE_LABEL[game.gameType],
    game.ageRange,
    `約 ${game.estMinutes} 分鐘`,
    paceLabel(game),
    game.desc,
    ...game.controls,
    parentTip,
    "開始玩",
  ].filter(Boolean);

  return (
    <li className={styles.gridItem}>
      <Link
        href={game.href}
        className={`${styles.gameCard} scrollEnter press-squash`}
        aria-label={ariaParts.join("，")}
        style={{
          ["--card-accent" as string]: game.accent,
        }}
      >
        <div className={styles.thumb}>
          <Image
            src={game.art.thumbnail ?? game.art.cover}
            alt={game.art.alt}
            fill
            /* 每張卡同寬，sizes 必須貼齊實際渲染寬度，否則會下載到過小的檔再放大。 */
            sizes="(max-width: 640px) calc(100vw - 32px), 300px"
            className={styles.thumbImage}
            style={{ objectPosition: game.art.position ?? "50% 50%" }}
            /* 只有 3 張卡：首張 preload（LCP），其餘 eager 但不佔 preload 預算。
               卡片本身由 .scrollEnter 淡入，圖若還在 lazy 佇列會再疊一層延遲。 */
            priority={eager}
            {...(eager ? {} : { loading: "eager" as const })}
          />
          <span className={styles.ageBadge}>{ageShort(game.ageRange)}</span>
          <span className={styles.playFab} aria-hidden>
            <Icon name="play" size={16} />
          </span>
          {parentTip ? (
            <span className={styles.parentCorner}>{parentTip}</span>
          ) : null}
        </div>
        <span className={styles.cardBody}>
          <span className={styles.cardTitle}>
            <span aria-hidden>{game.emoji}</span> {game.title}
          </span>
          <span className={styles.cardTeaser}>{game.teaser}</span>
          <span className={styles.cardMeta}>
            <span>{game.ageRange}</span>
            <span>約 {game.estMinutes} 分鐘</span>
            <span>{paceLabel(game)}</span>
          </span>
        </span>
      </Link>
    </li>
  );
}

/**
 * 單一均等網格：3 個活動不足以撐起兩個年齡分區，
 * 分區只會把版面切碎（其中一區永遠只有一張卡）。年齡改由卡上徽章與 meta 行承擔。
 * 3–7 歲的活動排前面；同齡層維持 `data/games.ts` 的順序（sort 穩定）。
 */
const AGE_BAND_ORDER: Record<GameMeta["ageBand"], number> = {
  explore: 0,
  challenge: 1,
};

const ORDERED_GAMES: GameMeta[] = [...GAMES].sort(
  (a, b) => AGE_BAND_ORDER[a.ageBand] - AGE_BAND_ORDER[b.ageBand],
);

export default function GamesHubPage() {
  return (
    <main className={styles.main} aria-label="車車遊樂園小遊戲">
      <header className={styles.hero}>
        <Image
          src="/games/v2/hub/hero-desktop.webp"
          alt="黏土車車在遊樂園入口與摩天輪旁準備開始遊戲"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 960px"
          className={styles.heroImage}
        />
        <div className={styles.heroShade} aria-hidden />
        <Doodle
          kind="burst"
          size={36}
          color="var(--c-yellow)"
          className={`${decor.doodle} ${decor.tiltA}`}
          style={{ left: "4%", top: "8px" }}
        />
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>今天想玩哪一站？</span>
          <h1 className={styles.title}>車車遊樂園</h1>
          <p className={styles.subtitle}>
            和故事裡的車車朋友一起玩，找糖果、塗顏色、堆方塊！
          </p>
          <ul className={styles.highlights} aria-label="遊樂園特色">
            <li className={styles.chip}>
              <Wheel size={18} color="var(--c-lilac)" />
              {GAMES.length} 款遊戲
            </li>
            <li className={styles.chip}>免下載 · 手機也能玩</li>
          </ul>
        </div>
        <Doodle
          kind="dots"
          size={28}
          color="var(--c-mint)"
          className={decor.doodle}
          style={{ left: "12%", bottom: "18px" }}
        />
      </header>

      <section className={styles.zone} aria-labelledby="games-all">
        <h2 id="games-all" className={styles.zoneTitle}>
          全部遊戲
        </h2>
        <ul className={styles.cardGrid}>
          {ORDERED_GAMES.map((game, index) => (
            <GameCard key={game.slug} game={game} eager={index === 0} />
          ))}
        </ul>
      </section>

      <p className={styles.footerNote}>玩完一站，還有下一站等你發現 🎡</p>
    </main>
  );
}
