import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allVehicles, getStoriesByVehicle } from "@/data/content";
import { faqPageJsonLd } from "@/lib/json-ld";
import { vehicleDefinitionSummary, vehicleFaqs } from "@/lib/vehicle-geo";
import JsonLd from "@/components/JsonLd";
import SiteFooter from "@/components/SiteFooter";
import StoryCard from "@/components/StoryCard";
import styles from "./page.module.css";

export function generateStaticParams() {
  return allVehicles().map((vehicle) => ({ vehicle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vehicle: string }>;
}): Promise<Metadata> {
  const { vehicle } = await params;
  const name = decodeURIComponent(vehicle);
  const stories = getStoriesByVehicle(name);
  if (stories.length === 0) {
    return { title: "找不到車種" };
  }

  const description = vehicleDefinitionSummary(name, stories);
  return {
    title: `${name}故事`,
    description,
    alternates: { canonical: `/vehicles/${encodeURIComponent(name)}` },
    openGraph: {
      title: `${name}故事 · 車車遊樂園`,
      description,
      url: `/vehicles/${encodeURIComponent(name)}`,
      type: "website",
    },
  };
}

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ vehicle: string }>;
}) {
  const { vehicle: encoded } = await params;
  const vehicle = decodeURIComponent(encoded);
  const stories = getStoriesByVehicle(vehicle);

  if (stories.length === 0) {
    notFound();
  }

  const lede = vehicleDefinitionSummary(vehicle, stories);
  const faqs = vehicleFaqs(vehicle, stories);

  return (
    <main className={styles.main}>
      <JsonLd data={faqPageJsonLd(faqs)} />
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <h1 className={styles.title}>{vehicle}故事屋</h1>
      <p className={styles.lede}>{lede}</p>
      <p className={styles.subtitle}>{stories.length} 則故事等你來聽</p>

      <ul className={styles.list}>
        {stories.map((story) => (
          <li key={story.slug}>
            <StoryCard story={story} />
          </li>
        ))}
      </ul>

      <p className={styles.more}>
        <Link href="/for-parents">家長搜尋指南</Link>
      </p>

      <SiteFooter />
    </main>
  );
}
