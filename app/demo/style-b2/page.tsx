import type { Metadata } from "next";
import { DemoArticle } from "@/components/demo/DemoArticle";

export const metadata: Metadata = {
  title: "排版示範 B2",
  description: "用現有文章試較安靜的親子閱讀排版。非正式頁，不收入搜尋。",
  robots: { index: false, follow: false },
};

export default function DemoStyleB2Page() {
  return (
    <main>
      <DemoArticle variant="b2" />
    </main>
  );
}
