import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import { NewsletterView } from "@/components/newsletter/NewsletterView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbListJsonLd } from "@/lib/json-ld";
import {
  getNewsletter,
  listNewsletters,
  newsletterPath,
  newslettersIndexPath,
} from "@/lib/newsletters";
import { parentSection } from "@/lib/parent-sections";
import styles from "@/app/for-parents/articles/page.module.css";

type NewsletterPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return listNewsletters().map((issue) => ({ slug: issue.slug }));
}

export async function generateMetadata({
  params,
}: NewsletterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const issue = getNewsletter(slug);
  if (!issue) return { title: "找不到電子報" };
  const path = newsletterPath(issue.slug);
  return {
    title: issue.title,
    description: issue.description,
    alternates: { canonical: path },
    openGraph: {
      title: `${issue.title} · 車車遊樂園`,
      description: issue.description,
      url: path,
      type: "article",
      publishedTime: issue.publishedAt,
    },
  };
}

export default async function NewsletterPage({ params }: NewsletterPageProps) {
  const { slug } = await params;
  const issue = getNewsletter(slug);
  if (!issue) notFound();
  const section = parentSection("newsletter");

  return (
    <main className={styles.main}>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: section.label, url: newslettersIndexPath() },
          { name: issue.title, url: newsletterPath(issue.slug) },
        ])}
      />
      <NewsletterView issue={issue} />
      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
