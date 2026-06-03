import Link from "next/link";
import { SITE_RSS_PATH } from "@/lib/feed";
import { PLATFORMS } from "@/lib/platforms";
import { SOCIALS } from "@/lib/social";
import styles from "./SiteFooter.module.css";

// 社群連結：共用 lib/social.ts 單一資料來源。
const SOCIAL_LINKS: { label: string; url: string }[] = SOCIALS.map((s) => ({
  label: s.label,
  url: s.url,
}));

// 收聽平台：共用 lib/platforms.ts 單一資料來源，再補上 SoundOn / RSS 訂閱。
const PLATFORM_LINKS: { label: string; url: string }[] = [
  ...PLATFORMS.map((p) => ({ label: p.label, url: p.url })),
  {
    label: "SoundOn",
    url: "https://player.soundon.fm/p/c478dbec-701a-4f1c-8c4a-736c52e7c4f5",
  },
  {
    label: "RSS",
    url: "https://feeds.soundon.fm/podcasts/c478dbec-701a-4f1c-8c4a-736c52e7c4f5.xml",
  },
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

      <nav className={styles.row}>
        <Link href="/about" className={styles.link}>
          關於我們
        </Link>
      </nav>

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

      <p className={styles.copyright}>© 車車遊樂園 · Bonbon &amp; 馬米</p>
    </footer>
  );
}
