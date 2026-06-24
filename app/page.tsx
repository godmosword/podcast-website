import type { Metadata } from "next";
import LandingHub from "@/components/landing/LandingHub";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "車車遊樂園 · 親子故事與手作",
  description:
    "Storyline 式親子內容入口：車車故事、睡前數綿羊、捏黏土手作、衛教宣導，適合 3–7 歲親子共讀。",
  openGraph: {
    title: "車車遊樂園",
    description:
      "車車故事、睡前收聽、捏黏土與衛教宣導 — 給 3–7 歲的看圖聽故事小天地。",
  },
};

export default function HomePage() {
  return (
    <main className={styles.main}>
      <LandingHub />
    </main>
  );
}
