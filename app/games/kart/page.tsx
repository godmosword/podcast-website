import type { Metadata } from "next";
import Link from "next/link";
import { KartIframeHost } from "@/components/games/KartIframeHost";
import { getSiteUrl } from "@/lib/site-url";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "車車卡丁車",
  description:
    "原創 arcade 卡丁車：漂移甩尾、迷你加速，適合 5–12 歲在賽道上競速。",
  openGraph: {
    title: "車車卡丁車 · 車車遊樂園",
    description: "原創 3D 卡丁車小遊戲：WASD 開車、空格漂移。",
    url: `${getSiteUrl()}/games/kart`,
  },
};

export default function KartGamePage() {
  return (
    <main className={styles.main} aria-label="車車卡丁車小遊戲">
      <Link href="/games" className={styles.back}>
        ← 回遊樂園
      </Link>
      <KartIframeHost
        title="車車卡丁車遊戲"
        src="/kart/index.html"
        className={styles.kartFrame}
      />
      {/* Dev: ensure `npm run build:kart` has run before deploy. */}
      <p className={styles.kartNote}>
        畫面沒出來嗎？重新整理一下試試 🛞
      </p>
    </main>
  );
}
