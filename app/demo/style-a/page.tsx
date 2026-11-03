import type { Metadata } from "next";
import { DemoArticle } from "@/components/demo/DemoArticle";

export const metadata: Metadata = {
  title: "排版示範 A",
  description: "用現有文章試 A Day 觀點文排版。非正式頁，不收入搜尋。",
  robots: { index: false, follow: false },
};

export default function DemoStyleAPage() {
  return (
    <main>
      <DemoArticle variant="a" />
    </main>
  );
}
