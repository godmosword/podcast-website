import type { Metadata } from "next";
import Link from "next/link";
import BlockDropGame from "@/components/games/BlockDropGame";
import { getSiteUrl } from "@/lib/site-url";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "繽紛方塊",
  description: "原創落下方塊益智小遊戲，排滿整行就消除，挑戰最高分。",
  openGraph: {
    title: "繽紛方塊 · 車車遊樂園",
    description: "原創落下方塊益智小遊戲，排滿整行就消除，挑戰最高分。",
    url: `${getSiteUrl()}/games/block-drop`,
  },
};

export default function BlockDropPage() {
  return (
    <main className={styles.main} aria-label="繽紛方塊小遊戲">
      <Link href="/games" className={styles.back}>
        ← 回遊樂園
      </Link>
      <BlockDropGame />
    </main>
  );
}
