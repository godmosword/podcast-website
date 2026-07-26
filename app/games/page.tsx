import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import Doodle from "@/components/decor/Doodle";
import RoughFrame from "@/components/decor/RoughFrame";
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
  adventure: "跑跳闖關",
  blocks: "堆疊挑戰",
  racing: "賽道競速",
  coloring: "塗顏色",
};

/** 精簡年齡標：3–7 歲 → 3–7 */
function ageShort(ageRange: string): string {
  return ageRange.replace(/\s*歲\s*$/u, "");
}

function FeaturedCard({ game }: { game: GameMeta }) {
  const parentTip = gameParentTip(game);
  const ariaParts = [
    game.title,
    game.teaser,
    GAME_TYPE_LABEL[game.gameType],
    game.ageRange,
    `約 ${game.estMinutes} 分鐘`,
    ...game.controls,
    parentTip,
    "一起玩",
  ].filter(Boolean);

  return (
    <section className={styles.featuredSection} aria-labelledby="games-featured">
      <div className={styles.featuredHeading}>
        <p className={styles.zoneKicker}>今天主打</p>
        <h2 id="games-featured" className={styles.zoneTitle}>
          先玩這一站
        </h2>
      </div>
      <Link
        href={game.href}
        className={`${styles.featuredCard} scrollEnter press-squash`}
        aria-label={ariaParts.join("，")}
        style={{
          ["--card-accent" as string]: game.accent,
        }}
      >
        <RoughFrame color={game.accent} rough={1} width={3} shiftFilter />
        <div className={styles.featuredThumb}>
          <Image
            src={game.art.cover}
            alt={game.art.alt}
            fill
            sizes="(max-width: 640px) 94vw, 920px"
            className={styles.featuredImage}
            style={{ objectPosition: game.art.position ?? "50% 50%" }}
            priority
          />
        </div>
        <span className={styles.featuredBody}>
          <span className={styles.featuredEmoji} aria-hidden>
            {game.emoji}
          </span>
          <span className={styles.featuredTitle}>{game.title}</span>
          <span className={styles.featuredTeaser}>{game.teaser}</span>
          <span className={styles.featuredCta}>
            一起玩 ▶
          </span>
          {parentTip ? (
            <span className={styles.parentTipSoft}>{parentTip}</span>
          ) : null}
        </span>
      </Link>
    </section>
  );
}

function CompactGameCard({ game, index }: { game: GameMeta; index: number }) {
  const parentTip = gameParentTip(game);
  const ariaParts = [
    game.title,
    game.teaser,
    GAME_TYPE_LABEL[game.gameType],
    game.ageRange,
    `約 ${game.estMinutes} 分鐘`,
    game.desc,
    ...game.controls,
    parentTip,
    "開始玩",
  ].filter(Boolean);

  return (
    <li className={styles.gridItem}>
      <Link
        href={game.href}
        className={`${styles.compactCard} scrollEnter press-squash`}
        aria-label={ariaParts.join("，")}
        style={{
          ["--card-accent" as string]: game.accent,
        }}
      >
        <RoughFrame
          color={game.accent}
          rough={index % 2 === 0 ? 1 : 2}
          width={2.5}
          shiftFilter
        />
        <div className={styles.compactThumb}>
          <Image
            src={game.art.thumbnail ?? game.art.cover}
            alt={game.art.alt}
            fill
            sizes="(max-width: 640px) 88vw, 280px"
            className={styles.compactImage}
            style={{ objectPosition: game.art.position ?? "50% 50%" }}
          />
          <span className={styles.ageBadge}>{ageShort(game.ageRange)}</span>
          <span className={styles.playFab} aria-hidden>
            <Icon name="play" size={14} />
          </span>
          {parentTip ? (
            <span className={styles.parentCorner}>{parentTip}</span>
          ) : null}
        </div>
        <span className={styles.compactTitle}>
          <span aria-hidden>{game.emoji}</span> {game.title}
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
  startIndex,
}: {
  id: string;
  title: string;
  hint: string;
  games: GameMeta[];
  startIndex: number;
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
      <ul className={styles.compactGrid}>
        {games.map((game, index) => (
          <CompactGameCard
            key={game.slug}
            game={game}
            index={startIndex + index}
          />
        ))}
      </ul>
    </section>
  );
}

export default function GamesHubPage() {
  const featured = GAMES.find((game) => game.featured) ?? GAMES[0];
  const exploreGames = GAMES.filter(
    (game) => game.ageBand === "explore" && !game.featured,
  );
  const challengeGames = GAMES.filter((game) => game.ageBand === "challenge");

  return (
    <main className={styles.main} aria-label="車車遊樂園小遊戲">
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

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
        <Doodle
          kind="loop"
          size={32}
          color="var(--c-pink)"
          draw
          className={`${decor.doodle} ${decor.tiltB}`}
          style={{ right: "6%", top: "12px" }}
        />
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>今天想玩哪一站？</span>
          <h1 className={styles.title}>車車遊樂園</h1>
          <p className={styles.subtitle}>
            和故事裡的車車朋友一起玩，找糖果、塗顏色、跑跳、堆方塊、衝上賽道！
          </p>
          <div className={styles.heroActions}>
            <Link href={featured.href} className={styles.primaryCta}>
              <span aria-hidden>▶</span> 先去玩一站
            </Link>
            <span className={styles.heroNote}>免下載 · 手機也能玩</span>
          </div>
          <ul className={styles.highlights} aria-label="遊樂園特色">
            <li className={styles.chip}>
              <Wheel size={18} color="var(--c-lilac)" />
              {GAMES.length} 款遊戲
            </li>
            <li className={styles.chip}>🧸 3–7 歲探索</li>
            <li className={styles.chip}>🏁 6–12 歲挑戰</li>
          </ul>
        </div>
        <Doodle
          kind="dots"
          size={28}
          color="var(--c-mint)"
          className={decor.doodle}
          style={{ left: "12%", bottom: "18px" }}
        />
        <Doodle
          kind="zigzag"
          size={30}
          color="var(--c-sky)"
          className={`${decor.doodle} ${decor.tiltC}`}
          style={{ right: "10%", bottom: "14px" }}
        />
      </header>

      <FeaturedCard game={featured} />

      <div className={styles.sectionIntro}>
        <span className={styles.sectionDot} aria-hidden />
        <p>還想逛逛？下面還有其他車站。</p>
        <span className={styles.sectionDot} aria-hidden />
      </div>

      <GameSection
        id="games-explore"
        title="小小探索"
        hint="3–7 歲 · 沒有壓力，慢慢玩"
        games={exploreGames}
        startIndex={0}
      />
      <GameSection
        id="games-challenge"
        title="挑戰賽道"
        hint="6–12 歲 · 準備好再來挑戰"
        games={challengeGames}
        startIndex={exploreGames.length}
      />

      <p className={styles.footerNote}>玩完一站，還有下一站等你發現 🎡</p>
    </main>
  );
}
