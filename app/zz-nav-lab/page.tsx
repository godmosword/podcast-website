import type { Metadata } from "next";
import styles from "./page.module.css";

// 臨時診斷頁（不合併）：iPhone／iPad 上頂端列字變糊，用幾種寫法並排找出原因。
export const metadata: Metadata = {
  title: "頂端列模糊診斷",
  robots: { index: false, follow: false },
};

const VARIANTS = [
  { id: "A", label: "A｜舊版：sticky＋頂端列本身毛玻璃", cls: "a" },
  { id: "B", label: "B｜目前正式站：sticky＋毛玻璃放在 ::before", cls: "b" },
  { id: "C", label: "C｜候選：sticky＋不用毛玻璃（94% 底色）", cls: "c" },
  { id: "D", label: "D｜不 sticky＋頂端列本身毛玻璃", cls: "d" },
  { id: "E", label: "E｜不 sticky＋不用毛玻璃", cls: "e" },
  { id: "F", label: "F｜sticky＋不用毛玻璃＋完全不透明", cls: "f" },
] as const;

function Bar() {
  return (
    <>
      <span className={styles.brand}>車車遊樂園</span>
      <span className={styles.links}>
        <span>首頁</span>
        <span>頻道</span>
        <span>社群</span>
        <span>留言</span>
      </span>
    </>
  );
}

export default function NavLabPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>頂端列模糊診斷</h1>
      <p className={styles.note}>
        每一格上方都是一條假的頂端列，字一樣、顏色一樣，只差寫法。請用 iPhone／iPad 看哪幾條的字是清楚的，回報字母就好。
      </p>
      <p className={styles.reference}>
        對照：這行是一般文字（不在頂端列裡）<span className={styles.brandInline}>車車遊樂園</span>
      </p>
      {VARIANTS.map((v) => (
        <section key={v.id} className={styles.section}>
          <h2 className={styles.label}>{v.label}</h2>
          <div className={styles.stage}>
            <div className={`${styles.bar} ${styles[v.cls]}`}>
              <Bar />
            </div>
            <div className={styles.filler} />
          </div>
        </section>
      ))}
    </main>
  );
}
