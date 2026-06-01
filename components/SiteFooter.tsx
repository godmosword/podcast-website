import styles from "./SiteFooter.module.css";

// 社群與收聽平台連結。把 url 填上即會自動顯示；
// 留空字串的項目會被隱藏，避免出現失效連結。
const SOCIAL_LINKS: { label: string; url: string }[] = [
  { label: "Instagram", url: "" },
  { label: "YouTube", url: "" },
  { label: "Threads", url: "" },
];

const PLATFORM_LINKS: { label: string; url: string }[] = [
  { label: "Spotify", url: "" },
  { label: "Apple Podcasts", url: "" },
  { label: "RSS", url: "" },
];

// 贊助 / 支持連結（選填）。
const SUPPORT_URL = "";

function LinkRow({
  links,
}: {
  links: { label: string; url: string }[];
}) {
  const visible = links.filter((l) => l.url.trim() !== "");
  if (visible.length === 0) return null;
  return (
    <nav className={styles.row}>
      {visible.map((l) => (
        <a
          key={l.label}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          {l.label}
        </a>
      ))}
    </nav>
  );
}

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <p className={styles.parentNote}>
        給家長：每則故事是一組圖片配一段語音，點播放鈕就能邊看邊聽，
        適合睡前親子共讀。
      </p>

      <LinkRow links={SOCIAL_LINKS} />
      <LinkRow links={PLATFORM_LINKS} />

      {SUPPORT_URL.trim() !== "" && (
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.support}
        >
          💛 支持我們繼續說故事
        </a>
      )}

      <p className={styles.copyright}>© 車車故事屋</p>
    </footer>
  );
}
