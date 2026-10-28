import Link from "next/link";
import type { Newsletter } from "@/data/newsletters";
import { NewsletterBody } from "@/components/newsletter/NewsletterBody";
import Icon from "@/components/ui/Icon";
import {
  formatParentArticleDate,
} from "@/lib/parent-articles";
import {
  newsletterNeighbors,
  newsletterPath,
  newslettersIndexPath,
} from "@/lib/newsletters";
import articleStyles from "@/components/for-parents/ParentArticleView.module.css";

export function NewsletterView({ issue }: { issue: Newsletter }) {
  const { previous, next } = newsletterNeighbors(issue.slug);

  return (
    <article className={articleStyles.article}>
      <Link className={articleStyles.back} href={newslettersIndexPath()}>
        <Icon name="arrow-left" size={16} className="icon-lead" />回到電子報
      </Link>
      <header className={articleStyles.header}>
        <h1 className={articleStyles.title}>{issue.title}</h1>
        <time className={articleStyles.date} dateTime={issue.publishedAt}>
          {formatParentArticleDate(issue.publishedAt)}
        </time>
      </header>
      <div className={articleStyles.body}>
        <NewsletterBody body={issue.body} />
      </div>
      {previous || next ? (
        <nav className={articleStyles.seriesNav} aria-label="其他電子報">
          {previous ? (
            <Link className={articleStyles.seriesLink} href={newsletterPath(previous.slug)}>
              <span className={articleStyles.seriesLabel}>上一期</span>
              <span className={articleStyles.seriesTitle}>{previous.title}</span>
            </Link>
          ) : null}
          {next ? (
            <Link
              className={`${articleStyles.seriesLink} ${articleStyles.seriesNext}`}
              href={newsletterPath(next.slug)}
            >
              <span className={articleStyles.seriesLabel}>下一期</span>
              <span className={articleStyles.seriesTitle}>{next.title}</span>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </article>
  );
}
