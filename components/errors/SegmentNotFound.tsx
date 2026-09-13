import Link from "next/link";
import NotFoundHero from "@/components/not-found/NotFoundHero";
import styles from "@/app/not-found.module.css";

type SegmentNotFoundProps = {
  title: string;
  message: string;
  backHref: string;
  backLabel: string;
};

/**
 * 區塊級 404 的共用殼。
 *
 * 根層的「這裡還沒有故事／這集故事還在準備中」對故事路由是對的，但全站 9 個
 * `notFound()` 呼叫點都落到那一頁——打錯島名或景點 id 的人會被告知「這集故事
 * 還在準備中」，而且唯一出口是回首頁，不是退回他原本在逛的那一區。
 */
export default function SegmentNotFound({
  title,
  message,
  backHref,
  backLabel,
}: SegmentNotFoundProps) {
  return (
    <main className={styles.main}>
      <NotFoundHero />
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{message}</p>
      <Link href={backHref} className={styles.cta}>
        ← {backLabel}
      </Link>
    </main>
  );
}
