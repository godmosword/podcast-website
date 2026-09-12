import type { Metadata } from "next";
import { redirect } from "next/navigation";
import HeroWorld from "@/components/landing/hero-world/HeroWorld";
import { INTRO_PORTAL_ENABLED } from "@/lib/intro-gate";

export const metadata: Metadata = {
  title: "走進車車遊樂園",
  description: "故事，就從這裡出發。跟小紅一起走進車車遊樂園。",
  alternates: { canonical: "/intro" },
  robots: { index: false, follow: true },
  openGraph: { title: "走進車車遊樂園", url: "/intro" },
};

export default function IntroPage() {
  if (!INTRO_PORTAL_ENABLED) {
    redirect("/");
  }
  return <main data-intro-root><HeroWorld /></main>;
}
