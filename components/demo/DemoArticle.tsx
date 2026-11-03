import Image from "next/image";
import Link from "next/link";
import {
  DEMO_FIGURES,
  DEMO_SLOTS,
  DEMO_SOURCE_ARTICLE,
  DEMO_TITLE_QUOTE,
  type DemoSlot,
} from "@/lib/demo-article-layout";
import { formatParentArticleDate } from "@/lib/parent-articles";
import stylesA from "./DemoArticleA.module.css";
import stylesB from "./DemoArticleB.module.css";
import stylesB2 from "./DemoArticleB2.module.css";

type Variant = "a" | "b" | "b2";

/** 最後一個字跟閉引號黏在一起，避免「」單獨掉到下一行。原文沒有改。 */
function QuotedLine({
  text,
  keepClass,
}: {
  text: string;
  keepClass: string | undefined;
}) {
  const parts = [...new Intl.Segmenter("zh-Hant", { granularity: "grapheme" }).segment(text)].map(
    (part) => part.segment,
  );
  const tailCount = Math.min(3, parts.length);
  const tail = parts.splice(parts.length - tailCount, tailCount).join("");
  return (
    <>
      「{parts.join("")}
      <span className={keepClass}>{tail}」</span>
    </>
  );
}

const COPY = {
  a: {
    kicker: "A Day 觀點文",
    links: [
      { href: "/demo/style-b", label: "看 B 版親子雜誌" },
      { href: "/demo/style-b2", label: "看 B2 閱讀版" },
    ],
  },
  b: {
    kicker: "親子生活雜誌",
    links: [
      { href: "/demo/style-a", label: "看 A 版觀點文" },
      { href: "/demo/style-b2", label: "看 B2 閱讀版" },
    ],
  },
  b2: {
    kicker: "閱讀版",
    links: [
      { href: "/demo/style-b", label: "跟 B 版並排看" },
      { href: "/demo/style-a", label: "看 A 版" },
    ],
  },
} as const;

const STYLES = { a: stylesA, b: stylesB, b2: stylesB2 } as const;

function Slots({
  slots,
  styles,
  imageSizes,
  captioned,
  quietClosing,
}: {
  slots: readonly DemoSlot[];
  styles: Record<string, string | undefined>;
  imageSizes: string;
  captioned: boolean;
  quietClosing: boolean;
}) {
  const firstFigure = slots.findIndex((slot) => slot.kind === "figure");
  return slots.map((slot, index) => {
    if (slot.kind === "paragraphs") {
      const closingFollows =
        quietClosing && slots[index + 1]?.kind === "pull" && index + 1 === slots.length - 1;
      return (
        <div key={index} className={styles.stanza}>
          {slot.texts.map((text, textIndex) => (
            <p
              key={`${index}-${textIndex}`}
              className={
                closingFollows && textIndex === slot.texts.length - 1 ? styles.closingLine : undefined
              }
            >
              {text}
            </p>
          ))}
        </div>
      );
    }
    if (slot.kind === "pull") {
      if (quietClosing && index === slots.length - 1) return null;
      return (
        <blockquote key={index} className={styles.pull}>
          <p>
            <QuotedLine text={slot.text} keepClass={styles.keep} />
          </p>
        </blockquote>
      );
    }
    return (
      <figure key={slot.figure.src} className={styles.figure}>
        <Image
          src={slot.figure.src}
          alt={slot.figure.alt}
          width={slot.figure.width}
          height={slot.figure.height}
          sizes={imageSizes}
          priority={index === firstFigure}
        />
        {captioned ? <figcaption className={styles.caption}>{slot.figure.caption}</figcaption> : null}
      </figure>
    );
  });
}

export function DemoArticle({ variant }: { variant: Variant }) {
  const styles = STYLES[variant];
  const copy = COPY[variant];
  const imageSizes =
    variant === "a" ? "100vw" : variant === "b" ? "(min-width: 1000px) 960px, 100vw" : "(min-width: 760px) 684px, 100vw";

  return (
    <article className={styles.page}>
      <p className={styles.banner}>
        排版示範，不是正式文章。文字是原文，沒有改寫。
        {copy.links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </p>
      <header className={styles.header}>
        <p className={styles.kicker}>{copy.kicker}</p>
        <h1 className={styles.title}>
          <QuotedLine text={DEMO_TITLE_QUOTE} keepClass={styles.keep} />
        </h1>
        <p className={styles.meta}>
          <time dateTime={DEMO_SOURCE_ARTICLE.publishedAt}>
            {formatParentArticleDate(DEMO_SOURCE_ARTICLE.publishedAt)}
          </time>
          <span>{DEMO_SOURCE_ARTICLE.title}</span>
        </p>
      </header>
      <div className={styles.body}>
        <Slots
          slots={DEMO_SLOTS}
          styles={styles}
          imageSizes={imageSizes}
          captioned={variant === "b2"}
          quietClosing={variant === "b2"}
        />
      </div>
      <footer className={styles.footer}>
        <h2>圖片出處</h2>
        <ol>
          {DEMO_FIGURES.map((figure) => (
            <li key={figure.src}>{figure.credit}</li>
          ))}
        </ol>
        <p>
          原文刊於
          <a href={DEMO_SOURCE_ARTICLE.sourceUrl} target="_blank" rel="noopener noreferrer">
            方格子〈{DEMO_SOURCE_ARTICLE.title}〉
          </a>
        </p>
        <p>
          <Link href={`/for-parents/articles/${DEMO_SOURCE_ARTICLE.slug}`}>正式文章頁</Link>
        </p>
      </footer>
    </article>
  );
}
