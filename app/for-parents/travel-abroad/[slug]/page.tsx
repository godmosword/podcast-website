import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import { ParentArticleView } from "@/components/for-parents/ParentArticleView";
import styles from "@/components/for-parents/ParentSectionPage.module.css";
import JsonLd from "@/components/JsonLd";
import { breadcrumbListJsonLd } from "@/lib/json-ld";
import { parentSection } from "@/lib/parent-sections";
import {
  getTravelAbroadArticle,
  listTravelAbroadArticles,
  travelAbroadArticlePath,
  travelAbroadIndexPath,
  travelAbroadNeighbors,
} from "@/lib/parent-travel-abroad";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return listTravelAbroadArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getTravelAbroadArticle(slug);
  if (!article) return { title: "找不到文章" };
  const description = article.excerpt.replaceAll("\n", "");
  const path = travelAbroadArticlePath(article.slug);
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

export default async function ParentTravelAbroadArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getTravelAbroadArticle(slug);
  if (!article) notFound();
  const { previous, next } = travelAbroadNeighbors(article.slug);
  const section = parentSection("parent-travel-abroad");

  return (
    <main className={styles.main}>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: section.label, url: travelAbroadIndexPath() },
          { name: article.title, url: travelAbroadArticlePath(article.slug) },
        ])}
      />
      <ParentArticleView
        article={article}
        previous={previous}
        next={next}
        indexHref={travelAbroadIndexPath()}
        indexLabel="回到親子出國"
        hrefFor={travelAbroadArticlePath}
      />
      <SiteFooter />
    </main>
  );
}
