import type { Metadata } from "next";
import Link from "next/link";
import CarMissionGame from "@/components/games/CarMissionGame";
import { getSiteUrl } from "@/lib/site-url";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "怪獸卡車的溫柔任務",
  description:
    "慢慢開、輕輕對待螢火蟲的怪獸卡車小遊戲，適合 3–7 歲親子一起玩。",
  openGraph: {
    title: "怪獸卡車的溫柔任務 · 車車遊樂園",
    description:
      "溫柔前進、輕輕喇叭，和怪獸卡車一起完成任務。",
    url: `${getSiteUrl()}/games/car-mission`,
  },
};

export default function CarMissionPage() {
  return (
    <main className={styles.main} aria-label="怪獸卡車溫柔任務小遊戲">
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>
      <CarMissionGame />
    </main>
  );
}
