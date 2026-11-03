import type { Metadata } from "next";
import { DemoArticle } from "@/components/demo/DemoArticle";

export const metadata: Metadata = {
  title: "排版示範 B",
  description: "用現有文章試親子生活雜誌排版。非正式頁，不收入搜尋。",
  robots: { index: false, follow: false },
};

export default function DemoStyleBPage() {
  return (
    <main>
      <DemoArticle variant="b" />
    </main>
  );
}
