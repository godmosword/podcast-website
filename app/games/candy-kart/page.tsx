import type { Metadata } from "next";
import Link from "next/link";
import { CandyKartIframeHost } from "@/components/games/CandyKartIframeHost";
import { candyKartIframeSrc } from "@/lib/games/candy-kart/iframe-src";
import { getSiteUrl } from "@/lib/site-url";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "繽紛卡丁車",
  description:
    "馬卡龍黏土風 3D 卡丁車：6 條糖果賽道、3 圈競速、收集彩虹星星，拿下繽紛糖果盃！",
  openGraph: {
    title: "繽紛卡丁車 · 車車遊樂園",
    description: "Godot 打造的馬卡龍卡丁車：漂移過彎、收集星星、爭奪糖果盃。",
    url: `${getSiteUrl()}/games/candy-kart`,
  },
};

export default function CandyKartGamePage() {
  return (
    <main className={styles.main} aria-label="繽紛卡丁車小遊戲">
      <Link href="/games" className={styles.back}>
        ← 回遊樂園
      </Link>
      <CandyKartIframeHost
        title="繽紛卡丁車遊戲"
        src={candyKartIframeSrc()}
        className={styles.kartFrame}
      />
      <p className={styles.kartNote}>畫面沒出來嗎？重新整理一下試試 🍬</p>
    </main>
  );
}
