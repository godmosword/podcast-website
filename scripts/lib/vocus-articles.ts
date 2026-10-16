/**
 * 方格子文章 → 家長區 `ParentArticle` 的純轉換。
 * 抓列表、下載圖片與寫檔在 `scripts/sync-vocus-articles.ts`。
 */
import { JSDOM } from "jsdom";
import { z } from "zod";
import type { ParentArticle, ParentArticleBlock } from "../../data/parent-articles";

export const VOCUS_CREATOR_ID = "6aa4a7adaa92714642f625a3";

export const VOCUS_CONTENTS_ENDPOINT = "https://api.vocus.cc/api/contents";

/** 與作者頁 __NEXT_DATA__ 的 SWR fallback 相同的查詢。 */
export function vocusContentsUrl(page: number, pageSize = 10): string {
  const url = new URL(VOCUS_CONTENTS_ENDPOINT);
  url.searchParams.set("creatorId", VOCUS_CREATOR_ID);
  url.searchParams.set("num", String(pageSize));
  url.searchParams.set("page", String(page));
  url.searchParams.set("order", "desc");
  url.searchParams.set("sort", "publishAt");
  url.searchParams.set("status", "2");
  return url.toString();
}

export function vocusSourceUrl(contentId: string): string {
  return `https://vocus.cc/post/${contentId}`;
}

const contentSchema = z.object({
  title: z.string(),
  type: z.string(),
  isPay: z.boolean().optional(),
  adult: z.boolean().optional(),
  spam: z.number().optional(),
  contentId: z.string(),
  publishAt: z.string(),
  post: z
    .object({
      content: z.string().optional(),
      ogImageURL: z.string().optional(),
      title: z.string().optional(),
    })
    .optional(),
});

const contentsPageSchema = z.object({
  contents: z.array(contentSchema),
  count: z.number(),
});

export type VocusListItem = {
  contentId: string;
  title: string;
  publishAt: string;
  sourceUrl: string;
  html: string;
  ogImageURL: string | null;
  isPay: boolean;
  adult: boolean;
  spam: number;
  type: string;
};

export type VocusContentsPage = {
  count: number;
  items: VocusListItem[];
};

/** 物件替代字元（嵌入圖／元件的佔位）不是作者文字。 */
const OBJECT_REPLACEMENT = /\uFFFC/g;

const BLANK_CHARS = /[\s\u00a0\u2800\u200b\uFEFF]/g;

const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "UL",
  "OL",
  "LI",
  "FIGURE",
  "IMG",
  "BLOCKQUOTE",
  "SECTION",
  "ARTICLE",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TD",
  "TH",
]);

const ELEMENT = 1;
const TEXT = 3;

type NodeLike = {
  nodeType: number;
  nodeName: string;
  textContent: string | null;
  childNodes: ArrayLike<NodeLike>;
  getAttribute?: (name: string) => string | null;
};

type ImageBlock = Extract<ParentArticleBlock, { type: "image" }>;

type Piece =
  | { type: "text"; text: string }
  | { type: "image"; image: ImageBlock };

function normalizeText(value: string): string {
  return value.replace(OBJECT_REPLACEMENT, "");
}

function isBlankText(value: string): boolean {
  return value.replace(BLANK_CHARS, "") === "";
}

function tagName(node: NodeLike): string {
  return node.nodeName.toUpperCase();
}

function childList(node: NodeLike): NodeLike[] {
  return Array.from(node.childNodes);
}

function elementChildren(node: NodeLike): NodeLike[] {
  return childList(node).filter((child) => child.nodeType === ELEMENT);
}

function attr(node: NodeLike, name: string): string {
  return node.getAttribute?.(name) ?? "";
}

function positiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function imageBlock(node: NodeLike): ImageBlock | null {
  const src = attr(node, "src").trim();
  if (!src) return null;
  return {
    type: "image",
    src,
    alt: attr(node, "alt"),
    width: positiveInt(attr(node, "width")),
    height: positiveInt(attr(node, "height")),
  };
}

function findFirst(node: NodeLike, tag: string): NodeLike | null {
  if (node.nodeType === ELEMENT && tagName(node) === tag) return node;
  for (const child of elementChildren(node)) {
    const found = findFirst(child, tag);
    if (found) return found;
  }
  return null;
}

function endsWithBr(node: NodeLike): boolean {
  const nodes = childList(node);
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const current = nodes[index];
    if (!current) continue;
    if (current.nodeType === TEXT && isBlankText(current.textContent ?? "")) {
      continue;
    }
    return current.nodeType === ELEMENT && tagName(current) === "BR";
  }
  return false;
}

function lineIsEmpty(line: Piece[]): boolean {
  return line.every((piece) => piece.type === "text" && isBlankText(normalizeText(piece.text)));
}

/**
 * `<br>` 是作者換行。`<p><br></p>` 在 HTML 裡會切成前後兩段空行，
 * 尾端那段是標記本身造成的，拿掉才會回到「一個空段＝一個 spacer」。
 */
function readInline(root: NodeLike): Piece[][] {
  const lines: Piece[][] = [[]];
  const visit = (node: NodeLike): void => {
    if (node.nodeType === TEXT) {
      lines[lines.length - 1]?.push({ type: "text", text: node.textContent ?? "" });
      return;
    }
    if (node.nodeType !== ELEMENT) return;
    const tag = tagName(node);
    if (tag === "BR") {
      lines.push([]);
      return;
    }
    if (tag === "IMG") {
      const image = imageBlock(node);
      if (image) lines[lines.length - 1]?.push({ type: "image", image });
      return;
    }
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "UL" || tag === "OL") return;
    for (const child of childList(node)) visit(child);
  };
  for (const child of childList(root)) visit(child);
  const last = lines[lines.length - 1];
  if (endsWithBr(root) && lines.length > 1 && last && lineIsEmpty(last)) {
    lines.pop();
  }
  return lines;
}

function lineToBlocks(line: Piece[]): ParentArticleBlock[] {
  const blocks: ParentArticleBlock[] = [];
  let buffer = "";
  const flush = (): void => {
    const text = normalizeText(buffer);
    buffer = "";
    if (!isBlankText(text)) blocks.push({ type: "paragraph", text });
  };
  for (const piece of line) {
    if (piece.type === "text") buffer += piece.text;
    else {
      flush();
      blocks.push(piece.image);
    }
  }
  flush();
  if (blocks.length === 0) return [{ type: "spacer" }];
  return blocks;
}

function blocksFromInlineContainer(node: NodeLike): ParentArticleBlock[] {
  const blocks: ParentArticleBlock[] = [];
  for (const line of readInline(node)) blocks.push(...lineToBlocks(line));
  return blocks;
}

function headingBlocks(node: NodeLike, level: 2 | 3): ParentArticleBlock[] {
  const produced = blocksFromInlineContainer(node);
  const text = produced
    .flatMap((block) => (block.type === "paragraph" ? [block.text] : []))
    .join("\n");
  const blocks: ParentArticleBlock[] = [];
  if (text) blocks.push({ type: "heading", level, text });
  for (const block of produced) {
    if (block.type === "image") blocks.push(block);
  }
  return blocks;
}

function listBlocks(node: NodeLike): ParentArticleBlock[] {
  const items: string[] = [];
  const nested: ParentArticleBlock[] = [];
  for (const li of elementChildren(node)) {
    if (tagName(li) !== "LI") continue;
    const produced = blocksFromInlineContainer(li);
    const text = produced
      .flatMap((block) => (block.type === "paragraph" ? [block.text] : []))
      .join("\n");
    if (text) items.push(text);
    for (const block of produced) {
      if (block.type === "image") nested.push(block);
    }
    for (const child of elementChildren(li)) {
      if (tagName(child) === "UL" || tagName(child) === "OL") {
        nested.push(...listBlocks(child));
      }
    }
  }
  const blocks: ParentArticleBlock[] = [];
  if (items.length > 0) blocks.push({ type: "list", items });
  blocks.push(...nested);
  return blocks;
}

function figureBlocks(node: NodeLike): ParentArticleBlock[] {
  const blocks: ParentArticleBlock[] = [];
  const img = findFirst(node, "IMG");
  if (img) {
    const image = imageBlock(img);
    if (image) blocks.push(image);
  }
  const caption = findFirst(node, "FIGCAPTION");
  if (caption) blocks.push(...blocksFromInlineContainer(caption));
  return blocks;
}

function appendNode(node: NodeLike, blocks: ParentArticleBlock[]): void {
  if (node.nodeType === TEXT) {
    const text = normalizeText(node.textContent ?? "");
    if (!isBlankText(text)) blocks.push({ type: "paragraph", text });
    return;
  }
  if (node.nodeType !== ELEMENT) return;
  const tag = tagName(node);
  if (tag === "SCRIPT" || tag === "STYLE") return;
  if (tag === "P" || tag === "FIGCAPTION" || tag === "BLOCKQUOTE" || tag === "TD" || tag === "TH") {
    blocks.push(...blocksFromInlineContainer(node));
    return;
  }
  if (tag === "H1" || tag === "H2") {
    blocks.push(...headingBlocks(node, 2));
    return;
  }
  if (tag === "H3" || tag === "H4" || tag === "H5" || tag === "H6") {
    blocks.push(...headingBlocks(node, 3));
    return;
  }
  if (tag === "UL" || tag === "OL") {
    blocks.push(...listBlocks(node));
    return;
  }
  if (tag === "IMG") {
    const image = imageBlock(node);
    if (image) blocks.push(image);
    return;
  }
  if (tag === "FIGURE") {
    blocks.push(...figureBlocks(node));
    return;
  }
  if (tag === "BR") {
    blocks.push({ type: "spacer" });
    return;
  }
  const kids = elementChildren(node);
  if (kids.some((child) => BLOCK_TAGS.has(tagName(child)))) {
    for (const child of childList(node)) appendNode(child, blocks);
    return;
  }
  if (kids.length > 0 || !isBlankText(node.textContent ?? "")) {
    blocks.push(...blocksFromInlineContainer(node));
  }
}

/** 去掉文首文末空行；中間空行保留。 */
export function trimEdgeSpacers(
  blocks: readonly ParentArticleBlock[],
): ParentArticleBlock[] {
  let start = 0;
  let end = blocks.length;
  while (start < end && blocks[start]?.type === "spacer") start += 1;
  while (end > start && blocks[end - 1]?.type === "spacer") end -= 1;
  return blocks.slice(start, end);
}

/** 方格子 Lexical HTML → `ParentArticleBlock[]`。不改寫作者文字。 */
export function htmlToParentBlocks(html: string): ParentArticleBlock[] {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: "https://vocus.cc/",
  });
  try {
    const blocks: ParentArticleBlock[] = [];
    const body = dom.window.document.body as unknown as NodeLike;
    for (const child of childList(body)) appendNode(child, blocks);
    return trimEdgeSpacers(blocks);
  } finally {
    dom.window.close();
  }
}

/**
 * 與 `lib/parent-articles.test.ts` 的摘要斷言同一條規則：
 * 只取 paragraph，再用第一個 spacer 在 blocks 裡的索引切片。
 */
export function excerptFromBlocks(blocks: readonly ParentArticleBlock[]): string {
  const opening = blocks.flatMap((block) =>
    block.type === "paragraph" ? [block.text] : [],
  );
  const firstSpacer = blocks.findIndex((block) => block.type === "spacer");
  const stanza = opening.slice(0, firstSpacer === -1 ? opening.length : firstSpacer);
  return stanza.join("\n");
}

/** ISO 時間 → 台北日曆日 `YYYY-MM-DD`。 */
export function publishedAtTaipei(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`無法解析發布時間：${iso}`);
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function slugForVocusPost(
  contentId: string,
  existingSlugs: ReadonlySet<string>,
): string {
  const base = `vocus-${contentId}`;
  if (!existingSlugs.has(base)) return base;
  let suffix = 2;
  while (existingSlugs.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function isPublishableVocusPost(item: VocusListItem): boolean {
  return (
    item.type === "post" &&
    !item.isPay &&
    !item.adult &&
    item.spam === 0 &&
    /^[a-f0-9]{24}$/.test(item.contentId) &&
    item.html.trim().length > 0
  );
}

export function parseContentsPage(payload: unknown): VocusContentsPage {
  const page = contentsPageSchema.parse(payload);
  const items = page.contents.map((entry): VocusListItem => {
    const og = entry.post?.ogImageURL?.trim() ?? "";
    return {
      contentId: entry.contentId,
      title: (entry.post?.title || entry.title).trim(),
      publishAt: entry.publishAt,
      sourceUrl: vocusSourceUrl(entry.contentId),
      html: entry.post?.content ?? "",
      ogImageURL: og.startsWith("https://") ? og : null,
      isPay: entry.isPay === true,
      adult: entry.adult === true,
      spam: entry.spam ?? 0,
      type: entry.type,
    };
  });
  return { count: page.count, items };
}

/**
 * 還沒出現在 `sourceUrl` 的公開文，依發布時間由舊到新（附加到陣列末端的閱讀順序）。
 * 同一 `sourceUrl` 只留一筆。
 */
export function selectPostsToAppend(
  items: readonly VocusListItem[],
  existingSourceUrls: ReadonlySet<string>,
): { posts: VocusListItem[]; skippedExisting: number; skippedUnpublished: number } {
  const seen = new Set(existingSourceUrls);
  const posts: VocusListItem[] = [];
  let skippedExisting = 0;
  let skippedUnpublished = 0;
  for (const item of items) {
    if (seen.has(item.sourceUrl)) {
      skippedExisting += 1;
      continue;
    }
    seen.add(item.sourceUrl);
    if (!isPublishableVocusPost(item)) {
      skippedUnpublished += 1;
      continue;
    }
    posts.push(item);
  }
  posts.sort((left, right) => {
    const byTime = left.publishAt.localeCompare(right.publishAt);
    if (byTime !== 0) return byTime;
    return left.contentId.localeCompare(right.contentId);
  });
  return { posts, skippedExisting, skippedUnpublished };
}

export function shouldEnableAutoMerge(outcomes: {
  fonts: string;
  lint: string;
  typecheck: string;
  test: string;
}): boolean {
  return (
    outcomes.fonts === "success" &&
    outcomes.lint === "success" &&
    outcomes.typecheck === "success" &&
    outcomes.test === "success"
  );
}

function serializeBlock(block: ParentArticleBlock): string {
  if (block.type === "spacer") return '      { type: "spacer" },';
  if (block.type === "paragraph") {
    return `      { type: "paragraph", text: ${JSON.stringify(block.text)} },`;
  }
  if (block.type === "heading") {
    return `      { type: "heading", level: ${block.level}, text: ${JSON.stringify(block.text)} },`;
  }
  if (block.type === "list") {
    const items = block.items.map((item) => `        ${JSON.stringify(item)},`).join("\n");
    return `      {\n        type: "list",\n        items: [\n${items}\n        ],\n      },`;
  }
  return `      { type: "image", src: ${JSON.stringify(block.src)}, alt: ${JSON.stringify(block.alt)}, width: ${block.width}, height: ${block.height} },`;
}

export function serializeParentArticle(article: ParentArticle): string {
  const lines = [
    "  {",
    `    slug: ${JSON.stringify(article.slug)},`,
    `    title: ${JSON.stringify(article.title)},`,
    `    publishedAt: ${JSON.stringify(article.publishedAt)},`,
    `    sourceUrl: ${JSON.stringify(article.sourceUrl)},`,
    `    excerpt: ${JSON.stringify(article.excerpt)},`,
  ];
  if (article.coverImage) {
    lines.push(`    coverImage: ${JSON.stringify(article.coverImage)},`);
    if (article.coverAlt) {
      lines.push(`    coverAlt: ${JSON.stringify(article.coverAlt)},`);
    }
  }
  lines.push("    blocks: [");
  for (const block of article.blocks) lines.push(serializeBlock(block));
  lines.push("    ],");
  lines.push("  },");
  return lines.join("\n");
}

/** 在 `PARENT_ARTICLES` 結尾插入新文。已有相同 `sourceUrl` 時原樣返回。 */
export function appendParentArticleSource(
  source: string,
  articles: readonly ParentArticle[],
): string {
  const fresh = articles.filter((article) => !source.includes(article.sourceUrl));
  if (fresh.length === 0) return source;
  const marker = "export const PARENT_ARTICLES";
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("找不到 PARENT_ARTICLES");
  const close = source.lastIndexOf("\n];");
  if (close < start) throw new Error("找不到 PARENT_ARTICLES 結尾");
  const insertion = `\n${fresh.map((article) => serializeParentArticle(article)).join("\n")}`;
  return `${source.slice(0, close)}${insertion}${source.slice(close)}`;
}

export function articleFromVocusPost(
  post: VocusListItem,
  existingSlugs: ReadonlySet<string>,
): ParentArticle {
  const blocks = htmlToParentBlocks(post.html);
  const excerpt = excerptFromBlocks(blocks);
  return {
    slug: slugForVocusPost(post.contentId, existingSlugs),
    title: post.title,
    publishedAt: publishedAtTaipei(post.publishAt),
    sourceUrl: post.sourceUrl,
    excerpt,
    blocks,
  };
}
