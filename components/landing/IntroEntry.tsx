import Link from "next/link";
import { MODEL_PATH } from "@/components/landing/hero-world/config";
import styles from "./IntroEntry.module.css";

/**
 * ADR-0003：Intro 是 opt-in 入口。`/` 永遠直接是 Landing，這個 SSR 連結是
 * 進入 `/intro` 的唯一入口，所以它必須是真的 `<a>`（沒有 JS 也能點），
 * 而且用 v3 的 poster 當視覺誘因，讓它看起來值得點。
 */
export default function IntroEntry() {
  return (
    <Link href="/intro" className={styles.entry} prefetch={false}>
      <picture className={styles.thumbFrame}>
        <img
          className={styles.thumb}
          src={`${MODEL_PATH}/poster-mobile.webp`}
          alt=""
          aria-hidden="true"
          width={615}
          height={490}
          loading="lazy"
          decoding="async"
        />
      </picture>
      <span className={styles.label}>看小紅開進遊樂園</span>
      <span className={styles.arrow} aria-hidden="true">→</span>
    </Link>
  );
}
