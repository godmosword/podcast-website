import type { Metadata } from "next";
import Link from "next/link";
import Doodle from "@/components/decor/Doodle";
import RoughFrame from "@/components/decor/RoughFrame";
import Wheel from "@/components/decor/Wheel";
import decor from "@/components/decor/decor.module.css";
import GameThumbArt from "@/components/games/GameThumbArt";
import PlaygroundHubBadge from "@/components/games/PlaygroundHubBadge";
import { GAMES, type GameMeta } from "@/data/games";
import { getSiteUrl } from "@/lib/site-url";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "車車遊樂園",
  description:
    "和故事裡的車車朋友一起玩小遊戲：闖關、方塊、糖果卡丁車，適合 5–12 歲親子。",
  openGraph: {
    title: "車車遊樂園 · 小遊戲",
    description:
      "車車大冒險、繽紛方塊、繽紛卡丁車——親子小遊戲一站玩。",
    url: `${getSiteUrl()}/games`,
  },
};

function GameCard({ game, index }: { game: GameMeta; index: number }) {
  return (
    <li className={styles.gridItem}>
      <Link
        href={game.href}
        className={`${styles.card} popIn press-squash`}
        aria-label={`${game.title}，${game.ageRange}，約 ${game.estMinutes} 分鐘`}
        style={{
          boxShadow: `var(--shadow-md), 0 6px 0 ${game.accent}`,
          animationDelay: `${Math.min(index, 4) * 55}ms`,
        }}
      >
        <RoughFrame
          color={game.accent}
          rough={index % 2 === 0 ? 1 : 2}
          width={3}
        />
        <div
          className={styles.thumb}
          style={{
            ["--thumb-accent" as string]: game.accent,
          }}
        >
          <GameThumbArt gameId={game.slug} className={styles.thumbArt} />
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
          <span className={styles.footer}>
            <span className={styles.playLabel}>開始玩</span>
            <span
              className={styles.arrow}
              style={{
                backgroundColor: `color-mix(in srgb, ${game.accent} 14%, var(--card))`,
                color: "var(--ink)",
              }}
              aria-hidden
            >
              ▶
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function GamesHubPage() {
  return (
    <main className={styles.main} aria-label="車車遊樂園小遊戲">
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <header className={styles.hero}>
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
          className={`${decor.doodle} ${decor.tiltB}`}
          style={{ right: "6%", top: "12px" }}
        />
        <Doodle
          kind="dots"
          size={28}
          color="var(--c-mint)"
          className={`${decor.doodle}`}
          style={{ left: "12%", bottom: "18px" }}
        />
        <Doodle
          kind="zigzag"
          size={30}
          color="var(--c-sky)"
          className={`${decor.doodle} ${decor.tiltC}`}
          style={{ right: "10%", bottom: "14px" }}
        />

        <div className={styles.heroBadge} aria-hidden>
          <PlaygroundHubBadge size={52} />
        </div>

        <h1 className={styles.title}>車車遊樂園</h1>
        <p className={styles.subtitle}>
          和故事裡的車車朋友一起闖關、堆方塊、開卡丁車！
          <br />
          免下載、點開就能玩，最適合親子同樂。
        </p>

        <ul className={styles.highlights} aria-label="遊樂園特色">
          <li className={styles.chip}>
            <Wheel size={18} color="var(--c-lilac)" />
            {GAMES.length} 款小遊戲
          </li>
          <li className={styles.chip}>🧸 3–6 歲 · 🏁 6–12 歲</li>
          <li className={styles.chip}>📱 手機也能玩</li>
        </ul>
      </header>

      <section className={styles.zone} aria-labelledby="games-available">
        <h2 id="games-available" className={styles.zoneTitle}>
          現在就能玩
        </h2>
        <ul className={styles.grid}>
          {GAMES.map((game, index) => (
            <GameCard key={game.slug} game={game} index={index} />
          ))}
        </ul>
      </section>

      <p className={styles.footerNote}>挑一款喜歡的車車遊戲開始玩 🎡</p>
    </main>
  );
}
