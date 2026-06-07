import type { Metadata } from "next";
import Link from "next/link";
import CarStarGame from "@/components/games/CarStarGame";
import { getSiteUrl } from "@/lib/site-url";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "車車吃星星",
  description:
    "和故事裡的電動車、安安救護車、小紅賽車一起玩迷宮，適合 3–7 歲。",
  openGraph: {
    title: "車車吃星星 · 車車遊樂園",
    description:
      "和故事裡的車車朋友一起吃星星，適合 3–7 歲的迷宮小遊戲。",
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
