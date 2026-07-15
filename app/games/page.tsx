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

function GameCard({ game, index }: { game: GameMeta; index: number }) {
  const parentTip = gameParentTip(game);
  const ariaParts = [
    game.title,
    GAME_TYPE_LABEL[game.gameType],
    game.ageRange,
    `約 ${game.estMinutes} 分鐘`,
    ...game.controls,
    parentTip,
    "開始玩",
  ].filter(Boolean);

  return (
    <li className={`${styles.gridItem} ${game.featured ? styles.featuredItem : ""}`}>
      <Link
        href={game.href}
        className={`${styles.card} scrollEnter press-squash`}
        aria-label={ariaParts.join("，")}
        style={{
          ["--card-accent" as string]: game.accent,
          ["--card-image-position" as string]: game.art.position ?? "50% 50%",
        }}
      >
        <RoughFrame
          color={game.accent}
          rough={index % 2 === 0 ? 1 : 2}
          width={3}
          shiftFilter
        />
        <div className={styles.thumb}>
          <Image
            src={game.art.thumbnail ?? game.art.cover}
            alt={game.art.alt}
            fill
            sizes="(max-width: 640px) 92vw, 440px"
            className={styles.thumbImage}
            style={{ objectPosition: game.art.position ?? "50% 50%" }}
          />
          <span className={styles.typePill}>{GAME_TYPE_LABEL[game.gameType]}</span>
          {game.featured ? <span className={styles.featuredPill}>第一次玩推薦</span> : null}
        </div>
        <span className={styles.body}>
          <span className={styles.meta}>
            <span
              className={`${styles.ageTag} marker`}
              style={{ ["--marker-color" as string]: game.accent }}
            >
              {game.ageRange}
            </span>
            <span className={styles.duration}>⏱ 約 {game.estMinutes} 分鐘</span>
          </span>
          <span className={styles.cardTitle}>{game.title}</span>
          <span className={styles.summary}>{game.desc}</span>
          <span className={styles.controls}>
            {game.controls.map((control) => (
              <span key={control}>{control}</span>
            ))}
          </span>
          {parentTip ? <span className={styles.parentTip}>{parentTip}</span> : null}
          <span className={styles.footer}>
            <span className={styles.playLabel}>開始玩</span>
            <span className={styles.arrow} aria-hidden>
              <Icon name="play" size={13} />
            </span>
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
  startIndex,
}: {
  id: string;
  title: string;
  hint: string;
  games: GameMeta[];
  startIndex: number;
}) {
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
      <ul className={styles.grid}>
        {games.map((game, index) => (
          <GameCard key={game.slug} game={game} index={startIndex + index} />
        ))}
      </ul>
    </section>
  );
}

export default function GamesHubPage() {
  const featured = GAMES.find((game) => game.featured) ?? GAMES[0];
  const exploreGames = GAMES.filter((game) => game.ageBand === "explore");
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
              <span aria-hidden>▶</span> 先玩繽紛消消樂
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

      <div className={styles.sectionIntro}>
        <span className={styles.sectionDot} aria-hidden />
        <p>每一站都有新的小任務，挑一款就出發。</p>
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
        startIndex={1}
      />

      <p className={styles.footerNote}>玩完一站，還有下一站等你發現 🎡</p>
    </main>
  );
}
