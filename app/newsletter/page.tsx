import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import { ParentArticleList } from "@/components/for-parents/ParentArticleList";
import { ParentArticlesMasthead } from "@/components/for-parents/ParentArticlesMasthead";
import JsonLd from "@/components/JsonLd";
import { breadcrumbListJsonLd } from "@/lib/json-ld";
import {
  listNewsletters,
  newsletterPath,
  newsletterReadingMinutes,
  newslettersLayout,
} from "@/lib/newsletters";
import { parentSection } from "@/lib/parent-sections";
import styles from "@/app/for-parents/articles/page.module.css";

const section = parentSection("newsletter");

export const metadata: Metadata = {
  title: section.label,
  description: section.description,
  alternates: { canonical: section.href },
  openGraph: {
    title: `${section.label} · 車車遊樂園`,
    description: section.description,
    url: section.href,
    type: "website",
  },
};

export default function NewsletterIndexPage() {
  const issues = listNewsletters();
  const layout = newslettersLayout(issues);
  const longestMinutes = Math.max(1, ...issues.map(newsletterReadingMinutes));

  return (
    <main className={styles.main}>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: section.label, url: section.href },
        ])}
      />
      <ParentArticlesMasthead
        title={section.label}
        count={issues.length}
        latestPublishedAt={layout.latest?.publishedAt ?? null}
        longestMinutes={longestMinutes}
        variant="newsletter"
      />
      <ParentArticleList layout={layout} hrefFor={newsletterPath} />
      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
