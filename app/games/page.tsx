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
    "和故事裡的車車朋友一起玩小遊戲：消消樂、著色、跑跳、方塊與糖果卡丁車，適合 3–12 歲親子。",
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

/** 家長在選卡當下就需要的判斷資訊（時長／有無時間壓力）。 */
function paceLabel(game: GameMeta): string {
  return game.hasTimer ? "⏱ 有計時" : "🌿 沒有時間壓力";
}

function GameCard({ game, feature }: { game: GameMeta; feature?: boolean }) {
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
    <li className={`${styles.gridItem} ${feature ? styles.gridItemWide : ""}`}>
      <Link
        href={game.href}
        className={`${styles.gameCard} ${feature ? styles.gameCardFeature : ""} scrollEnter press-squash`}
        aria-label={ariaParts.join("，")}
        style={{
          ["--card-accent" as string]: game.accent,
        }}
      >
        <div className={styles.thumb}>
          <Image
            src={feature ? game.art.cover : (game.art.thumbnail ?? game.art.cover)}
            alt={game.art.alt}
            fill
            sizes={
              feature
                ? "(max-width: 640px) 94vw, 600px"
                : "(max-width: 640px) 88vw, 280px"
            }
            className={styles.thumbImage}
            style={{ objectPosition: game.art.position ?? "50% 50%" }}
            priority={feature}
          />
          <span className={styles.ageBadge}>{ageShort(game.ageRange)}</span>
          <span className={styles.playFab} aria-hidden>
            <Icon name="play" size={feature ? 18 : 14} />
          </span>
          {parentTip ? (
            <span className={styles.parentCorner}>{parentTip}</span>
          ) : null}
        </div>
        <span className={styles.cardBody}>
          <span className={styles.cardTitle}>
            <span aria-hidden>{game.emoji}</span> {game.title}
          </span>
          {feature ? (
            <span className={styles.cardTeaser}>{game.teaser}</span>
          ) : null}
          <span className={styles.cardMeta}>
            <span>約 {game.estMinutes} 分鐘</span>
            <span>{paceLabel(game)}</span>
          </span>
        </span>
      </Link>
    </li>
  );
}

function GameSection({
  id,
  title,
  hint,
  games,
  featuredSlug,
}: {
  id: string;
  title: string;
  hint: string;
  games: GameMeta[];
  featuredSlug?: string;
}) {
  if (games.length === 0) return null;
  return (
    <section className={styles.zone} aria-labelledby={id}>
      <div className={styles.zoneHeading}>
        <div>
          <p className={styles.zoneKicker}>{hint}</p>
          <h2 id={id} className={styles.zoneTitle}>
            {title}
          </h2>
        </div>
        <span className={styles.zoneCount}>{games.length} 款</span>
      </div>
      <ul className={styles.cardGrid}>
        {games.map((game) => (
          <GameCard
            key={game.slug}
            game={game}
            feature={game.slug === featuredSlug}
          />
        ))}
      </ul>
    </section>
  );
}

/** 主打遊戲排到所屬分類的第一張，並以大卡呈現（不另開 featured 區塊）。 */
function withFeaturedFirst(games: GameMeta[], featuredSlug: string): GameMeta[] {
  const featured = games.filter((game) => game.slug === featuredSlug);
  const rest = games.filter((game) => game.slug !== featuredSlug);
  return [...featured, ...rest];
}

export default function GamesHubPage() {
  const featured = GAMES.find((game) => game.featured) ?? GAMES[0];
  const exploreGames = withFeaturedFirst(
    GAMES.filter((game) => game.ageBand === "explore"),
    featured.slug,
  );
  const challengeGames = withFeaturedFirst(
    GAMES.filter((game) => game.ageBand === "challenge"),
    featured.slug,
  );

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

      <GameSection
        id="games-explore"
        title="小小探索"
        hint="3–7 歲 · 沒有壓力，慢慢玩"
        games={exploreGames}
        featuredSlug={featured.slug}
      />
      <GameSection
        id="games-challenge"
        title="挑戰賽道"
        hint="6–12 歲 · 準備好再來挑戰"
        games={challengeGames}
        featuredSlug={featured.slug}
      />

      <p className={styles.footerNote}>玩完一站，還有下一站等你發現 🎡</p>
    </main>
  );
}
