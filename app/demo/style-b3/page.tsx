import type { Metadata } from "next";
import { DemoArticleB3 } from "@/components/demo/DemoArticleB3";

export const metadata: Metadata = {
  title: "排版示範 B3",
  description: "用現有文章試把短句接成自然段的閱讀排版。非正式頁，不收入搜尋。",
  robots: { index: false, follow: false },
};

export default function DemoStyleB3Page() {
  return (
    <main>
      <DemoArticleB3 />
    </main>
  );
}
