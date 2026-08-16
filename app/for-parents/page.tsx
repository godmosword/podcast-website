import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import ParentCoListenSection from "@/components/for-parents/ParentCoListenSection";
import {
  parentCoListenStories,
  parentLandingFacts,
  parentLandingFaqs,
  representativeParentStories,
} from "@/lib/for-parents";
import { coverageHeadline } from "@/lib/playground-coverage";
import { breadcrumbListJsonLd, faqPageJsonLd } from "@/lib/json-ld";
import { STATIC_PAGE_MODIFIED_DATES } from "@/lib/page-freshness";
import { visibleSocials } from "@/lib/social";
import { storyCoverPath } from "@/lib/story-utils";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "親子指南：給家長的中文車車 Podcast",
  description:
    "整理車車遊樂園適合家長搜尋的重點：中文車車 Podcast、適合年齡、故事主題、陪聽方法與代表性集數。",
  alternates: { canonical: "/for-parents" },
  other: { dateModified: STATIC_PAGE_MODIFIED_DATES["/for-parents"] },
  openGraph: {
    title: "親子指南：給家長的中文車車 Podcast · 車車遊樂園",
    description:
      "用 answer-first 的方式整理車車遊樂園適合親子共聽的原因、集數、角色、更新方式與代表性故事。",
    url: "/for-parents",
    type: "website",
  },
};

export default function ForParentsPage() {
  const facts = parentLandingFacts();
  const faqs = parentLandingFaqs(facts);
  const representativeStories = representativeParentStories();
  const coListenStories = parentCoListenStories();
  const threads = visibleSocials().find((s) => s.icon === "threads");
  const playMapCoverage = coverageHeadline();

  return (
    <main className={styles.main}>
      <JsonLd data={faqPageJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: "親子指南", url: "/for-parents" },
        ])}
      />

      <header className={styles.header}>
        <p className={styles.eyebrow}>親子指南</p>
        <h1 className={styles.title}>中文車車故事，陪孩子安心聽</h1>
        <p className={styles.lede}>
          適合年齡、故事內容、更新方式與代表性集數，一頁看完。
        </p>
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
          <div>
            <dt>同步檢查</dt>
            <dd>{facts.syncCadence}</dd>
          </div>
        </dl>
      </header>

      <section className={styles.toolSection} aria-labelledby="parent-tools-heading">
        <h2 id="parent-tools-heading" className={styles.toolSectionTitle}>
          家長工具
        </h2>
        <div className={styles.toolGrid}>
          <article className={styles.toolCard} aria-labelledby="play-map-heading">
            <p className={styles.toolEmoji} aria-hidden>
              📍
            </p>
            <h3 id="play-map-heading">附近哪裡適合放電？</h3>
            <p>
              用地圖找適合 3–8 歲的公園與室內樂園，可依室內／免費篩選，並一鍵開啟 Google
              地圖導航。{playMapCoverage}。
            </p>
            <Link href="/for-parents/play-map" className={styles.toolCta}>
              開啟親子遊樂地圖 →
            </Link>
          </article>

          <article className={styles.toolCard} aria-labelledby="dashboard-heading">
            <p className={styles.toolEmoji} aria-hidden>
              📊
            </p>
            <h3 id="dashboard-heading">這台裝置上的親子進度</h3>
            <p>
              查看小遊戲探索、最近收聽與推薦共讀故事。所有資料只留在您的瀏覽器，不會上傳到伺服器。
            </p>
            <Link href="/for-parents/dashboard" className={styles.toolCta}>
              開啟家庭儀表板 →
            </Link>
          </article>
        </div>
      </section>

      {threads?.url ? (
        <section
          className={styles.threadsCallout}
          aria-labelledby="threads-heading"
        >
          <div>
            <h2 id="threads-heading">育兒小筆記</h2>
            <p>
              站外的日常短筆記：共讀心得、車車冷知識與錄音幕後，更新比官網零碎但更即時。
            </p>
          </div>
          <a
            className={styles.threadsLink}
            href={threads.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="到 Threads 看育兒小筆記（另開視窗）"
          >
            另開 Threads →
          </a>
        </section>
      ) : null}

      <section className={styles.answerSection} aria-labelledby="podcast-heading">
        <h2 id="podcast-heading">有哪些適合 3–6 歲的中文車車 Podcast？</h2>
        <p>{faqs[0].answer}</p>
      </section>

      <section className={styles.answerSection} aria-labelledby="what-heading">
        <h2 id="what-heading">車車遊樂園是什麼？</h2>
        <p>{faqs[1].answer}</p>
        <p>
          官網把每集整理成可分享的故事頁：封面、播放入口與故事大綱；共讀提問與家長延伸集中在本頁下方。
        </p>
      </section>

      <section className={styles.answerSection} aria-labelledby="listen-heading">
        <h2 id="listen-heading">如何陪孩子一起聽？</h2>
        <p>{faqs[2].answer}</p>
        <ul className={styles.steps}>
          <li>先讓孩子從封面或車種挑一集，降低選擇壓力。</li>
          <li>播放時可以短暫停下來，請孩子說說角色現在的感覺。</li>
          <li>聽完再回到生活經驗，例如洗手、合作、認識新朋友或勇敢求助。</li>
        </ul>
      </section>

      <section className={styles.answerSection} aria-labelledby="update-heading">
        <h2 id="update-heading">車車遊樂園多久更新？</h2>
        <p>{faqs[3].answer}</p>
      </section>

      <section className={styles.storySection} aria-labelledby="episodes-heading">
        <h2 id="episodes-heading">可以先從哪幾集開始？</h2>
        <p>
          可以先從最新集數、好習慣、手足合作或勇敢求助主題開始，再依孩子喜歡的車種延伸到更多故事。
        </p>
        <div className={styles.storyGrid}>
          {representativeStories.map((story) => (
            <Link
              key={story.slug}
              href={`/story/${story.slug}`}
              className={styles.storyCard}
            >
              <span className={styles.cover}>
                <Image
                  src={storyCoverPath(story.slug)}
                  alt={`${story.title} 封面`}
                  fill
                  sizes="(max-width: 720px) 45vw, 220px"
                />
              </span>
              <span className={styles.storyMeta}>EP {story.ep}</span>
              <span className={styles.storyTitle}>{story.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <ParentCoListenSection stories={coListenStories} />

      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
