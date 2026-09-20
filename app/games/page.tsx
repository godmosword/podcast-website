import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { IconBlockFall, IconCrayon, IconSwap } from "@/components/games/ClayIcons";
import { GAMES, gameParentTip, type GameMeta } from "@/data/games";
import JsonLd from "@/components/JsonLd";
import { gameListJsonLd } from "@/lib/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import styles from "./page.module.css";

export const metadata: Metadata = {
  // 根 layout 的 template 是 `%s · 車車遊樂園`，這裡再寫「車車遊樂園」會輸出
  // 「車車遊樂園 · 車車遊樂園」。用導覽列同一個詞「遊樂園」。
  title: "遊樂園",
  description:
    "和故事裡的車車朋友一起玩小遊戲：繽紛消消樂、繪本著色與繽紛樂園，適合 3–12 歲親子。",
  alternates: { canonical: "/games" },
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

/**
 * 兒童減法審（2026-09-20）：不識字的孩子靠「玩法圖示」認站——
 * 蠟筆＝塗、兩格交換＝找一樣、方塊落下＝排一排。play 鈕與動作詞都用同一顆。
 */
function playIcon(game: GameMeta, size: number) {
  switch (game.gameType) {
    case "coloring":
      return <IconCrayon size={size} />;
    case "match":
      return <IconSwap size={size} />;
    case "blocks":
      return <IconBlockFall size={size} />;
  }
}

function GameCard({ game, eager }: { game: GameMeta; eager: boolean }) {
  const parentTip = gameParentTip(game);
  const ariaParts = [
    game.title,
    game.teaser,
    GAME_TYPE_LABEL[game.gameType],
    game.ageRange,
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
          {/* 美術審 L3：封面角標的年齡拿掉，只留下方 meta 列的「3–7 歲」（同一資訊不出現兩次）。
              兒童減法審：play 鈕 56px、依遊戲換玩法圖示（下一步按哪裡）；首張卡輕微呼吸 */}
          <span
            className={`${styles.playFab}${eager ? ` ${styles.playFabLead}` : ""}`}
            aria-hidden
          >
            {playIcon(game, 30)}
          </span>
        </div>
        <span className={styles.cardBody}>
          <span className={styles.cardTitle}>{game.title}</span>
          {/* 兒童減法審：三字動作詞＋同一顆玩法圖示（圖為主、字為輔）；
              家長 meta 只留年齡——「約 N 分鐘」可有可無，「不趕時間」三張全同＝零資訊 */}
          <span className={styles.cardVerb}>
            {playIcon(game, 18)}
            {game.teaser}
          </span>
          <span className={styles.cardMeta}>
            <span>{game.ageRange}</span>
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
      <JsonLd data={gameListJsonLd()} />
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
