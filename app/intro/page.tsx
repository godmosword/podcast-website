import type { Metadata } from "next";
import HeroWorld from "@/components/landing/hero-world/HeroWorld";

export const metadata: Metadata = {
  title: "走進車車遊樂園",
  description: "故事，就從這裡出發。跟小紅一起走進車車遊樂園。",
  alternates: { canonical: "/intro" },
  robots: { index: false, follow: true },
  openGraph: { title: "走進車車遊樂園", url: "/intro" },
};

export default function IntroPage() {
  return <main data-intro-root><HeroWorld /></main>;
}
