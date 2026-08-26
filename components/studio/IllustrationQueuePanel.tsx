import Link from "next/link";
import { pendingIllustrationsForStudio } from "@/lib/illustration-queue-query";
import styles from "./IllustrationQueuePanel.module.css";

function syncedDay(syncedAt: string): string {
  return syncedAt.slice(0, 10);
}

export default function IllustrationQueuePanel() {
  const pending = pendingIllustrationsForStudio();

  return (
    <section className={styles.section} aria-labelledby="studio-illustration-heading">
      <h2 id="studio-illustration-heading" className={styles.heading}>
        待生圖佇列
      </h2>
      <p className={styles.lead}>
        MVP 單圖（pageCount=1）的集。生圖只在本機跑，CI 不放 OpenAI
        key、不自動核准。
      </p>
      {pending.length === 0 ? (
        <p className={styles.empty}>目前沒有待生圖的 MVP 集。</p>
      ) : (
        <ul className={styles.list}>
          {pending.map((item) => (
            <li key={item.slug} className={styles.item}>
              <div className={styles.itemHead}>
                <Link className={styles.storyLink} href={`/story/${item.slug}`}>
                  {item.slug} {item.title}
                </Link>
                <p className={styles.meta}>
                  同步 {syncedDay(item.syncedAt)} ·{" "}
                  {item.subtitleReady ? "字幕已校對" : "字幕尚未校對"}
                </p>
              </div>
              <p className={styles.command}>
                <code>{`npm run illustrate -- ${item.slug}`}</code>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
