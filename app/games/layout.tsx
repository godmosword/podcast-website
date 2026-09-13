import type { ReactNode } from "react";

/**
 * 遊樂園區塊 layout。
 *
 * 這裡刻意**不包 landmark**：原本是 `<section aria-label="車車遊樂園">`，
 * 但有可及名稱的 `<section>` 就是一個 `region` landmark，會把各頁自己的
 * `<main>` 包進另一個 landmark（axe `landmark-main-is-top-level`）。
 * 區塊名稱各頁 `<main aria-label>` 已經有了，這層不需要再宣告一次。
 */
export default function GamesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
