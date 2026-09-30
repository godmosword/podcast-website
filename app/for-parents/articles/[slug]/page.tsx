import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import { ParentArticleView } from "@/components/for-parents/ParentArticleView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbListJsonLd } from "@/lib/json-ld";
import {
  getParentArticle,
  listParentArticles,
  parentArticleNeighbors,
  parentArticlePath,
  parentArticlesIndexPath,
} from "@/lib/parent-articles";
import { parentSection } from "@/lib/parent-sections";
import styles from "../page.module.css";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return listParentArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getParentArticle(slug);
  if (!article) return { title: "找不到文章" };
  const description = article.excerpt.replaceAll("\n", "");
  const path = parentArticlePath(article.slug);
  return {
    title: article.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${article.title} · 車車遊樂園`,
      description,
      url: path,
      type: "article",
      publishedTime: article.publishedAt,
    },
  };
}

export default async function ParentArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getParentArticle(slug);
  if (!article) notFound();
  const { previous, next } = parentArticleNeighbors(article.slug);
  const section = parentSection("parent-articles");

  return (
    <main className={styles.main}>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: "親子指南", url: "/for-parents" },
          { name: section.label, url: parentArticlesIndexPath() },
          { name: article.title, url: parentArticlePath(article.slug) },
        ])}
      />
      <ParentArticleView article={article} previous={previous} next={next} />
      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
