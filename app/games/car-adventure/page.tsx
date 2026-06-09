import type { Metadata } from "next";
import Link from "next/link";
import CarPlatformer from "@/components/games/CarPlatformer";
import { getSiteUrl } from "@/lib/site-url";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "車車大冒險",
  description:
    "原創橫向過關小遊戲：開車跑跳、躲尖刺、踩搗蛋車、吃金幣、衝向終點旗。",
  openGraph: {
    title: "車車大冒險 · 車車遊樂園",
    description: "原創橫向過關小遊戲：開車跑跳、躲尖刺、踩搗蛋車、衝向終點旗。",
    url: `${getSiteUrl()}/games/car-adventure`,
  },
};

export default function CarAdventurePage() {
  return (
    <main className={styles.main} aria-label="車車大冒險小遊戲">
      <Link href="/games" className={styles.back}>
        ← 回遊樂園
      </Link>
      <CarPlatformer />
    </main>
  );
}
