import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "關於我們",
  description:
    "車車遊樂園是 Bonbon & 馬米的親子 Podcast 看圖聽故事網站，適合睡前親子共讀。",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <h1 className={styles.title}>關於車車遊樂園</h1>

      <section className={styles.lede} aria-label="關於我們">
        <p className={styles.text}>嗨嗨，我是馬米</p>
        <p className={styles.text}>
          是 Bonbon 的媽咪，也是《車車遊樂園》的主講者。
        </p>
        <p className={styles.text}>
          Bonbon 現在就讀幼兒園，是一個非常喜歡車子的小男孩。
          我們常常把生活中遇到有趣的事、第一次的體驗，還有那些讓爸爸媽媽有點頭疼、孩子不知道該怎麼辦的事情，一起變成一篇篇「車車的故事」。
        </p>
        <p className={styles.text}>第一次上學好想媽媽，怎麼辦？</p>
        <p className={styles.text}>不愛刷牙怎麼辦？</p>
        <p className={styles.text}>遇到困難時，我可以找誰一起幫忙？</p>
        <p className={styles.text}>
          我們希望透過故事，陪孩子慢慢找到自己的方法。
          學著運用身邊擁有的工具，做出自己想做的事情；
          練習說出心裡的感受，也勇敢說出自己想說的話。
        </p>
        <p className={styles.text}>
          不用每件事情都做到最好，
          但希望孩子在一次又一次的小小冒險裡，
          學會思考、嘗試，也更認識自己。
        </p>
        <p className={styles.text}>
          以善良、溫暖、勇敢為出發點，
          陪著孩子一起探索、一起長大。
        </p>
        <p className={styles.tagline}>
          🚗 小小車車，大大冒險。
          <br />
          我們一起出發去《車車遊樂園》
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
