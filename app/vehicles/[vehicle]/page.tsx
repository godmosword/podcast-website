import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allVehicles, getStoriesByVehicle } from "@/data/stories";
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
  return {
    title: `${name}故事`,
    description: `車車遊樂園所有${name}相關的親子故事。`,
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

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <h1 className={styles.title}>{vehicle}故事屋</h1>
      <p className={styles.subtitle}>{stories.length} 則故事等你來聽</p>

      <ul className={styles.list}>
        {stories.map((story) => (
          <li key={story.slug}>
            <StoryCard story={story} />
          </li>
        ))}
      </ul>

      <SiteFooter />
    </main>
  );
}
