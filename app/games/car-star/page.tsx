import type { Metadata } from "next";
import Link from "next/link";
import CarStarGame from "@/components/games/CarStarGame";
import { getSiteUrl } from "@/lib/site-url";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "車車吃星星",
  description: "適合 3–7 歲的開車吃金幣迷宮小遊戲，邊聽故事邊玩。",
  openGraph: {
    title: "車車吃星星 · 車車遊樂園",
    description: "適合 3–7 歲的開車吃金幣迷宮小遊戲。",
    url: `${getSiteUrl()}/games/car-star`,
  },
};

export default function CarStarPage() {
  return (
    <main className={styles.main} aria-label="車車吃星星小遊戲">
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>
      <CarStarGame />
    </main>
  );
}
