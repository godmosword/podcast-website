import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import { ParentArticleList } from "@/components/for-parents/ParentArticleList";
import { ParentArticlesMasthead } from "@/components/for-parents/ParentArticlesMasthead";
import JsonLd from "@/components/JsonLd";
import { breadcrumbListJsonLd } from "@/lib/json-ld";
import {
  listParentArticles,
  parentArticleReadingMinutes,
  parentArticlesLayout,
} from "@/lib/parent-articles";
import { parentSection } from "@/lib/parent-sections";
import styles from "./page.module.css";

const section = parentSection("parent-articles");

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

export default function ParentArticlesPage() {
  const articles = listParentArticles();
  const layout = parentArticlesLayout();
  const longestMinutes = Math.max(1, ...articles.map(parentArticleReadingMinutes));

  return (
    <main className={styles.main}>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: "親子指南", url: "/for-parents" },
          { name: section.label, url: section.href },
        ])}
      />
      <ParentArticlesMasthead
        title={section.label}
        count={articles.length}
        latestPublishedAt={layout.latest?.publishedAt ?? null}
        longestMinutes={longestMinutes}
      />
      <ParentArticleList layout={layout} />
      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
