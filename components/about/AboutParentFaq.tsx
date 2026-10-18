import Image from "next/image";
import Link from "next/link";
import {
  parentLandingFacts,
  parentLandingFaqs,
  representativeParentStories,
} from "@/lib/for-parents";
import { storyDisplayTitle } from "@/lib/story-title";
import { storyCoverPath } from "@/lib/story-utils";
import styles from "./AboutParentFaq.module.css";

/** 「如何陪孩子一起聽？」：最貼近家長的一題，排第一並接步驟；舊 /for-parents#co-listen 也落在這裡。 */
const LISTEN_TOGETHER_INDEX = 2;
/** 畫面順序（JSON-LD 維持資料順序）：先講怎麼陪聽，再講是什麼、多久更新。 */
const DISPLAY_ORDER = [LISTEN_TOGETHER_INDEX, 0, 1, 3] as const;

/**
 * 關於頁的「給家長的常見問題」。原本是 /for-parents（親子指南）的內容，
 * 2026-10-18 併進關於頁；FAQPage JSON-LD 由頁面用同一份 parentLandingFaqs 產生。
 */
export default function AboutParentFaq() {
  const facts = parentLandingFacts();
  const faqs = parentLandingFaqs(facts);
  const ordered = DISPLAY_ORDER.flatMap((index) => (faqs[index] ? [{ faq: faqs[index], index }] : []));
  const stories = representativeParentStories();

  return (
    <section className={styles.section} aria-labelledby="parent-faq-heading">
      <h2 id="parent-faq-heading" className={styles.heading}>
        給家長的常見問題
      </h2>

      <dl className={styles.facts}>
        <div>
          <dt>目前集數</dt>
          <dd>{facts.episodeCount} 集</dd>
        </div>
        <div>
          <dt>語言</dt>
          <dd>{facts.language}</dd>
        </div>
        <div>
          <dt>適合年齡</dt>
          <dd>{facts.ageRange}</dd>
        </div>
      </dl>

      {ordered.map(({ faq, index }) => (
        <div
          key={faq.question}
          id={index === LISTEN_TOGETHER_INDEX ? "co-listen" : undefined}
          className={styles.answer}
        >
          <h3>{faq.question}</h3>
          <p>{faq.answer}</p>
          {index === LISTEN_TOGETHER_INDEX ? (
            <>
              <ul className={styles.steps}>
                <li>先讓孩子從封面或車種挑一集，降低選擇壓力。</li>
                <li>播放時可以短暫停下來，請孩子說說角色現在的感覺。</li>
                <li>聽完再回到生活經驗，例如洗手、合作、認識新朋友或勇敢求助。</li>
              </ul>
              <p>
                每集故事頁下方的「給爸媽：一起聊聊」有那一集的聽完提問，部分集數還附親子小活動。
              </p>
            </>
          ) : null}
        </div>
      ))}

      <div className={styles.answer}>
        <h3>可以先從哪幾集開始？</h3>
        <p>
          最前面是剛上架的故事，接著是可以先聽的幾集，再依孩子喜歡的車種延伸到更多故事。
        </p>
        <div className={styles.storyGrid}>
          {stories.map((story) => (
            <Link key={story.slug} href={`/story/${story.slug}`} className={styles.storyCard}>
              <span className={styles.cover}>
                <Image
                  src={storyCoverPath(story.slug)}
                  alt={`${storyDisplayTitle(story)} 封面`}
                  fill
                  sizes="(max-width: 640px) 45vw, 150px"
                />
              </span>
              <span className={styles.storyMeta}>EP {story.ep}</span>
              <span className={styles.storyTitle}>{storyDisplayTitle(story)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
