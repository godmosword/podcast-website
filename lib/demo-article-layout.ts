import { PARENT_ARTICLES } from "@/data/parent-articles";

/**
 * 排版示範只用這一篇的原文。句子不改寫、不增刪。
 * 金句是原文段落的再顯示，正文仍依原本順序全部出現。
 */
export const DEMO_ARTICLE_SLUG = "vocus-6ad06360fd89780001c70f77";

const article = PARENT_ARTICLES.find((entry) => entry.slug === DEMO_ARTICLE_SLUG);
if (!article) {
  throw new Error(`找不到示範文章 ${DEMO_ARTICLE_SLUG}`);
}

export const DEMO_SOURCE_ARTICLE = article;

export const DEMO_PARAGRAPHS: readonly string[] = article.blocks.flatMap((block) =>
  block.type === "paragraph" ? [block.text] : [],
);

/** 標題金句：原文第二句，只在外面加引號。 */
export const DEMO_TITLE_QUOTE = DEMO_PARAGRAPHS[1] ?? "";

export type DemoFigure = {
  readonly src: string;
  readonly alt: string;
  readonly credit: string;
  readonly width: number;
  readonly height: number;
};

export const DEMO_FIGURES = [
  {
    src: "/stories/ep-34/01.jpg",
    alt: "第34集故事封面，小紅賽車在遊樂園",
    credit: "圖 1　第 34 集〈小紅賽車好想生氣怎麼辦？〉故事封面（public/stories/ep-34/01.jpg）",
    width: 1400,
    height: 1400,
  },
  {
    src: "/characters/小紅賽車.jpg",
    alt: "小紅賽車的角色定裝照",
    credit: "圖 2　小紅賽車定裝照（public/characters/小紅賽車.jpg）",
    width: 1400,
    height: 1400,
  },
  {
    src: "/stories/ep-3/01.webp",
    alt: "第3集故事封面，小紅賽車準備比賽",
    credit: "圖 3　第 3 集〈小紅賽車不是第一名也沒關係〉故事封面（public/stories/ep-3/01.webp）",
    width: 1400,
    height: 1400,
  },
] as const satisfies readonly DemoFigure[];

export type DemoSlot =
  | { readonly kind: "paragraphs"; readonly texts: readonly string[] }
  | { readonly kind: "pull"; readonly text: string }
  | { readonly kind: "figure"; readonly figure: DemoFigure };

function paragraphs(start: number, end: number): DemoSlot {
  return { kind: "paragraphs", texts: DEMO_PARAGRAPHS.slice(start, end) };
}

function pull(index: number): DemoSlot {
  const text = DEMO_PARAGRAPHS[index];
  if (!text) throw new Error(`示範金句超出原文：${index}`);
  return { kind: "pull", text };
}

/**
 * 每 3 段接一個金句（原文句子再顯示一次，外面加引號）。
 * 三段落之間穿插站內既有的圖。切片接起來必須等於原文全段。
 */
export const DEMO_SLOTS: readonly DemoSlot[] = [
  paragraphs(0, 3),
  pull(2),
  { kind: "figure", figure: DEMO_FIGURES[0] },
  paragraphs(3, 6),
  pull(5),
  paragraphs(6, 9),
  pull(9),
  paragraphs(9, 12),
  pull(10),
  { kind: "figure", figure: DEMO_FIGURES[1] },
  paragraphs(12, 15),
  pull(15),
  { kind: "figure", figure: DEMO_FIGURES[2] },
  paragraphs(15, 18),
  pull(18),
  paragraphs(18, 21),
  pull(20),
];

export function demoBodyParagraphs(): string[] {
  return DEMO_SLOTS.flatMap((slot) => (slot.kind === "paragraphs" ? [...slot.texts] : []));
}
