import type { Metadata } from "next";
import { ParentSectionPage } from "@/components/for-parents/ParentSectionPage";
import { parentSection } from "@/lib/parent-sections";

const section = parentSection("parent-story-making");

export const metadata: Metadata = {
  title: section.label,
  description: section.description,
  alternates: { canonical: section.href },
  robots: { index: false, follow: false },
};

export default function ParentStoryMakingPage() {
  return <ParentSectionPage title={section.label} />;
}
