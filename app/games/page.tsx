import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
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
  return game.hasTimer ? "有計時" : "不趕時間";
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
    <li
      className={`${styles.gridItem} ${game.slug === "coloring-book" ? styles.lead : ""}`}
    >
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
            sizes={
              game.slug === "coloring-book"
                ? "(max-width: 640px) calc(100vw - 32px), 300px"
                : "(max-width: 640px) calc(50vw - 24px), 300px"
            }
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
        </div>
        <span className={styles.cardBody}>
          <span className={styles.cardTitle}>{game.title}</span>
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
 * 著色本從漢堡收進遊樂園後當第一站，後面才是兩款街機。
 * 年齡徽章與 meta 行仍標 3–7／6–12，不再另切分區。
 */
const HUB_STATION_ORDER: readonly GameMeta["slug"][] = [
  "coloring-book",
  "candy-match",
  "block-drop",
];

const ORDERED_GAMES: GameMeta[] = HUB_STATION_ORDER.map((slug) => {
  const game = GAMES.find((entry) => entry.slug === slug);
  if (!game) throw new Error(`missing hub station: ${slug}`);
  return game;
});

export default function GamesHubPage() {
  return (
    <main className={styles.main} aria-label="車車遊樂園小遊戲">
      <header className={styles.hero}>
        <h1 className="sr-only">車車遊樂園</h1>
        {/* picture 依 viewport 只下載一張 hero，避免 mobile 先抓 desktop 再被 CSS 換圖 */}
        <picture className={styles.heroPicture}>
          <source
            media="(max-width: 640px)"
            type="image/avif"
            srcSet="/games/v2/hub/hero-mobile.avif"
          />
          <source
            media="(max-width: 640px)"
            type="image/webp"
            srcSet="/games/v2/hub/hero-mobile.webp"
          />
          <source type="image/avif" srcSet="/games/v2/hub/hero-desktop.avif" />
          <img
            src="/games/v2/hub/hero-desktop.webp"
            alt="黏土車車在遊樂園入口與摩天輪旁準備開始遊戲"
            width={1672}
            height={941}
            fetchPriority="high"
            decoding="async"
            className={styles.heroImage}
          />
        </picture>
      </header>

      <ul className={styles.cardGrid} aria-label="小遊戲">
        {ORDERED_GAMES.map((game, index) => (
          <GameCard key={game.slug} game={game} eager={index === 0} />
        ))}
      </ul>
    </main>
  );
}
