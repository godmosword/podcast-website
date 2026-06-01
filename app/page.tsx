import Link from "next/link";
import { stories } from "@/data/stories";
import styles from "./page.module.css";

// 「去其他平台收聽」連結。把 url 填上即會自動顯示在 footer；
// 留空字串的項目會被隱藏，避免出現失效連結。
const PLATFORM_LINKS: { label: string; url: string }[] = [
  { label: "Spotify", url: "" },
  { label: "Apple Podcasts", url: "" },
  { label: "YouTube", url: "" },
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export default function HomePage() {
  const platforms = PLATFORM_LINKS.filter((p) => p.url.trim() !== "");

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot.png"
          alt="揮手的紅色小卡車"
          className={styles.mascot}
          width={200}
          height={150}
        />
        <h1 className={styles.title}>車車故事屋</h1>
        <p className={styles.subtitle}>陪孩子看圖、聽故事、左右翻頁 🚗</p>
      </header>

      <ul className={styles.list}>
        {stories.map((story) => (
          <li key={story.slug}>
            <Link
              href={`/story/${story.slug}`}
              className={styles.card}
              style={{
                borderColor: story.color,
                boxShadow: `0 6px 0 ${story.color}`,
              }}
            >
              {/* 故事縮圖：用第一張圖 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/stories/${story.slug}/${pad2(1)}.jpg`}
                alt=""
                className={styles.thumb}
                style={{ backgroundColor: `${story.color}22` }}
                loading="lazy"
              />

              <span className={styles.cardText}>
                <span className={styles.cardTitle}>
                  <span aria-hidden>{story.emoji}</span> {story.title}
                </span>

                {story.summary && (
                  <span className={styles.cardSummary}>{story.summary}</span>
                )}

                <span className={styles.cardFooter}>
                  {story.tags && story.tags.length > 0 ? (
                    <span className={styles.tags}>
                      {story.tags.map((tag) => (
                        <span
                          key={tag}
                          className={styles.tag}
                          style={{
                            color: story.color,
                            backgroundColor: `${story.color}1f`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className={styles.cardMeta}>
                      {story.pageCount} 張圖 · 含語音
                    </span>
                  )}
                  <span
                    className={styles.cardArrow}
                    style={{ color: story.color }}
                    aria-hidden
                  >
                    ▶
                  </span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <footer className={styles.footer}>
        <p className={styles.parentNote}>
          給家長：每則故事是 10 張圖配一段語音，點播放鈕就能邊看邊聽，
          適合睡前親子共讀。
        </p>

        {platforms.length > 0 && (
          <nav className={styles.platforms} aria-label="其他收聽平台">
            {platforms.map((p) => (
              <a
                key={p.label}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.platformLink}
              >
                {p.label}
              </a>
            ))}
          </nav>
        )}

        <p className={styles.copyright}>© 車車故事屋</p>
      </footer>
    </main>
  );
}
