import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import { ParentArticleList } from "@/components/for-parents/ParentArticleList";
import JsonLd from "@/components/JsonLd";
import { breadcrumbListJsonLd } from "@/lib/json-ld";
import { listParentArticles } from "@/lib/parent-articles";
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
  return (
    <main className={styles.main}>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: "親子指南", url: "/for-parents" },
          { name: section.label, url: section.href },
        ])}
      />
      <header className={styles.header}>
        <p className={styles.eyebrow}>給爸媽</p>
        <h1 className={styles.title}>{section.label}</h1>
        <p className={styles.lede}>{section.description}</p>
      </header>
      <ParentArticleList articles={listParentArticles()} />
      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
