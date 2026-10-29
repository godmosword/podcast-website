/**
 * 方格子文章 → 家長區 `ParentArticle` 的純轉換。
 * 抓列表、下載圖片與寫檔在 `scripts/sync-vocus-articles.ts`。
 * 文末標記「同步更新至親子出國專欄」會改收進親子出國，見 `vocusArticleDestination`。
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

/** 在指定的文章陣列結尾插入新文。已有相同 `sourceUrl` 時原樣返回。 */
export function appendParentArticleSource(
  source: string,
  articles: readonly ParentArticle[],
  exportName = "PARENT_ARTICLES",
): string {
  const fresh = articles.filter((article) => !source.includes(article.sourceUrl));
  if (fresh.length === 0) return source;
  const marker = `export const ${exportName}`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`找不到 ${exportName}`);
  const close = source.lastIndexOf("\n];");
  if (close < start) throw new Error(`找不到 ${exportName} 結尾`);
  const insertion = `\n${fresh.map((article) => serializeParentArticle(article)).join("\n")}`;
  return `${source.slice(0, close)}${insertion}${source.slice(close)}`;
}

/**
 * 作者放在文末、用來把這篇收進「親子出國」的標記。
 * 引號不是標記的一部分；分類時會拿掉包住它的引號、空白與標點。
 */
export const TRAVEL_ABROAD_MARKER = "同步更新至親子出國專欄";

export type VocusArticleDestination = "parent-articles" | "travel-abroad";

const MARKER_EDGE = new Set([
  "「", "」", "『", "』", '"', "'", "“", "”", "‘", "’", "＂", "〝", "〞",
  "〈", "〉", "《", "》", "(", ")", "（", "）", "[", "]", "【", "】",
  "｢", "｣",
  "。", "．", ".", "！", "!", "？", "?", "、", "，", ",", "；", ";", "：", ":",
  "…", "—", "－", "-", "～", "~", "・", "·", "｡", "､", "･",
]);

const MARKER_QUOTE_OR_SPACE = new Set([
  "「", "」", "『", "』", '"', "'", "“", "”", "‘", "’", "＂", "〝", "〞",
  "｢", "｣",
  " ", "\n", "\r", "\t", "\u00a0", "\u3000", "\u2800", "\u200b", "\ufeff", "\u2060",
]);

type TextPiece = {
  blockIndex: number;
  itemIndex: number | null;
  text: string;
};

function compactMarkerText(value: string): string {
  return value.normalize("NFKC").replace(/[\s\u2800\u200b\ufeff\u2060]/g, "");
}

function stripMarkerEdges(value: string): string {
  const chars = [...value];
  let start = 0;
  let end = chars.length;
  while (start < end && MARKER_EDGE.has(chars[start] ?? "")) start += 1;
  while (end > start && MARKER_EDGE.has(chars[end - 1] ?? "")) end -= 1;
  return chars.slice(start, end).join("");
}

/** 比對用：全形折成半形、去掉空白，再剝掉兩端的引號與標點。 */
export function normalizeTravelMarkerProbe(value: string): string {
  return stripMarkerEdges(compactMarkerText(value));
}

function textPieces(blocks: readonly ParentArticleBlock[]): TextPiece[] {
  const pieces: TextPiece[] = [];
  blocks.forEach((block, blockIndex) => {
    if (block.type === "paragraph" || block.type === "heading") {
      pieces.push({ blockIndex, itemIndex: null, text: block.text });
      return;
    }
    if (block.type === "list") {
      block.items.forEach((text, itemIndex) => {
        pieces.push({ blockIndex, itemIndex, text });
      });
    }
  });
  return pieces;
}

function articleEndingText(blocks: readonly ParentArticleBlock[]): string {
  return textPieces(blocks)
    .map((piece) => piece.text)
    .join("\n");
}

/**
 * 文末（圖片說明不算）在拿掉空白、引號與兩端標點之後，
 * 以「同步更新至親子出國專欄」結尾才算親子出國。正文中間提到不算。
 */
export function vocusArticleDestination(
  blocks: readonly ParentArticleBlock[],
): VocusArticleDestination {
  const probe = normalizeTravelMarkerProbe(articleEndingText(blocks));
  return probe.endsWith(TRAVEL_ABROAD_MARKER) ? "travel-abroad" : "parent-articles";
}

function findMarkerCut(text: string): number | null {
  let cut: number | null = null;
  for (let index = 0; index <= text.length; ) {
    if (normalizeTravelMarkerProbe(text.slice(index)) === TRAVEL_ABROAD_MARKER) {
      cut = index;
    }
    if (index === text.length) break;
    const code = text.charCodeAt(index);
    index += code >= 0xd800 && code <= 0xdbff ? 2 : 1;
  }
  return cut;
}

function trimMarkerPrefix(value: string): string {
  const chars = [...value];
  let end = chars.length;
  while (end > 0 && MARKER_QUOTE_OR_SPACE.has(chars[end - 1] ?? "")) end -= 1;
  return chars.slice(0, end).join("");
}

/**
 * 刪掉文末標記。標記自己一行（可含引號、空白、標點）就整段拿掉；
 * 跟在句子後面時只刪標記，前面的句子留下。沒有標記時原樣返回。
 */
export function stripTravelAbroadMarker(
  blocks: readonly ParentArticleBlock[],
): readonly ParentArticleBlock[] {
  if (vocusArticleDestination(blocks) !== "travel-abroad") return blocks;
  const pieces = textPieces(blocks);
  const joined = pieces.map((piece) => piece.text).join("\n");
  const cut = findMarkerCut(joined);
  if (cut === null) {
    throw new Error("文末有親子出國標記，但無法定位要刪除的字");
  }

  const dropPiece = new Set<number>();
  const replaceText = new Map<number, string>();
  let offset = 0;
  for (let index = 0; index < pieces.length; index += 1) {
    const piece = pieces[index];
    if (!piece) continue;
    const start = offset;
    const end = start + piece.text.length;
    const boundary = end + (index < pieces.length - 1 ? 1 : 0);
    if (cut >= boundary) {
      offset = boundary;
      continue;
    }
    if (cut > start && cut < end) {
      const kept = trimMarkerPrefix(piece.text.slice(0, cut - start));
      if (kept.length === 0 || normalizeTravelMarkerProbe(kept) === "") {
        dropPiece.add(index);
      } else {
        replaceText.set(index, kept);
      }
    } else if (cut <= start) {
      dropPiece.add(index);
    }
    offset = boundary;
  }

  const pieceIndexByBlock = new Map<number, number[]>();
  pieces.forEach((piece, index) => {
    const list = pieceIndexByBlock.get(piece.blockIndex) ?? [];
    list.push(index);
    pieceIndexByBlock.set(piece.blockIndex, list);
  });

  const next: ParentArticleBlock[] = [];
  blocks.forEach((block, blockIndex) => {
    const owned = pieceIndexByBlock.get(blockIndex);
    if (!owned) {
      next.push(block);
      return;
    }
    if (block.type === "paragraph" || block.type === "heading") {
      const pieceIndex = owned[0];
      if (pieceIndex === undefined || dropPiece.has(pieceIndex)) return;
      const text = replaceText.get(pieceIndex) ?? block.text;
      next.push({ ...block, text });
      return;
    }
    if (block.type === "list") {
      const items = block.items.flatMap((item, itemIndex) => {
        const pieceIndex = owned[itemIndex];
        if (pieceIndex === undefined || dropPiece.has(pieceIndex)) return [];
        return [replaceText.get(pieceIndex) ?? item];
      });
      if (items.length === 0) return;
      next.push({ ...block, items });
    }
  });
  return trimEdgeSpacers(next);
}

export function articleFromVocusPost(
  post: VocusListItem,
  existingSlugs: ReadonlySet<string>,
  slug?: string,
): ParentArticle {
  const blocks = stripTravelAbroadMarker(htmlToParentBlocks(post.html));
  const excerpt = excerptFromBlocks(blocks);
  return {
    slug: slug ?? slugForVocusPost(post.contentId, existingSlugs),
    title: post.title,
    publishedAt: publishedAtTaipei(post.publishAt),
    sourceUrl: post.sourceUrl,
    excerpt,
    blocks,
  };
}

export type VocusStoredArticle = {
  sourceUrl: string;
  slug: string;
  destination: VocusArticleDestination;
};

export type VocusSyncAction =
  | { kind: "add"; destination: VocusArticleDestination; post: VocusListItem }
  | {
      kind: "move";
      destination: VocusArticleDestination;
      from: VocusArticleDestination;
      slug: string;
      post: VocusListItem;
    };

/**
 * 新文加到標記指定的區。已收錄但標記改了（或拿掉）則整篇搬走，沿用原來的 slug，
 * 不另建一篇。同一輪由舊到新，跟附加順序一致。
 */
export function planVocusArticleSync(
  items: readonly VocusListItem[],
  stored: readonly VocusStoredArticle[],
): {
  actions: VocusSyncAction[];
  skippedExisting: number;
  skippedUnpublished: number;
} {
  const byUrl = new Map(stored.map((entry) => [entry.sourceUrl, entry]));
  const seen = new Set<string>();
  const actions: VocusSyncAction[] = [];
  let skippedExisting = 0;
  let skippedUnpublished = 0;

  for (const item of items) {
    if (seen.has(item.sourceUrl)) {
      skippedExisting += 1;
      continue;
    }
    seen.add(item.sourceUrl);
    const current = byUrl.get(item.sourceUrl);
    if (!isPublishableVocusPost(item)) {
      if (current) skippedExisting += 1;
      else skippedUnpublished += 1;
      continue;
    }
    const destination = vocusArticleDestination(htmlToParentBlocks(item.html));
    if (!current) {
      actions.push({ kind: "add", destination, post: item });
      continue;
    }
    if (current.destination === destination) {
      skippedExisting += 1;
      continue;
    }
    actions.push({
      kind: "move",
      destination,
      from: current.destination,
      slug: current.slug,
      post: item,
    });
  }

  actions.sort((left, right) => {
    const byTime = left.post.publishAt.localeCompare(right.post.publishAt);
    if (byTime !== 0) return byTime;
    return left.post.contentId.localeCompare(right.post.contentId);
  });
  return { actions, skippedExisting, skippedUnpublished };
}

function skipSourceToken(source: string, index: number): number {
  const quote = source[index];
  if (quote === '"' || quote === "'" || quote === "`") {
    let cursor = index + 1;
    while (cursor < source.length) {
      if (source[cursor] === "\\") {
        cursor += 2;
        continue;
      }
      if (source[cursor] === quote) return cursor + 1;
      cursor += 1;
    }
    throw new Error("文章資料裡有未結束的字串");
  }
  if (quote === "/" && source[index + 1] === "/") {
    const newline = source.indexOf("\n", index);
    return newline === -1 ? source.length : newline + 1;
  }
  if (quote === "/" && source[index + 1] === "*") {
    const end = source.indexOf("*/", index + 2);
    return end === -1 ? source.length : end + 2;
  }
  return -1;
}

function findExportedArray(
  source: string,
  exportName: string,
): { open: number; close: number } {
  const marker = `export const ${exportName}`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`找不到 ${exportName}`);
  // `ParentArticle[]` 的方括號在宣告上，陣列本體是後面的 `= [`。
  const equals = source.indexOf("= [", start);
  if (equals < 0) throw new Error(`找不到 ${exportName} 的 [`);
  const open = equals + 2;
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const skipped = skipSourceToken(source, index);
    if (skipped >= 0) {
      index = skipped - 1;
      continue;
    }
    const char = source[index];
    if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) return { open, close: index };
    }
  }
  throw new Error(`找不到 ${exportName} 結尾`);
}

function articleObjectSpans(
  source: string,
  open: number,
  close: number,
): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = [];
  let depth = 0;
  let objectStart = -1;
  for (let index = open + 1; index < close; index += 1) {
    const skipped = skipSourceToken(source, index);
    if (skipped >= 0) {
      index = skipped - 1;
      continue;
    }
    const char = source[index];
    if (char === "{" || char === "[") {
      if (char === "{" && depth === 0) objectStart = index;
      depth += 1;
    } else if (char === "}" || char === "]") {
      depth -= 1;
      if (char === "}" && depth === 0 && objectStart >= 0) {
        spans.push({ start: objectStart, end: index + 1 });
        objectStart = -1;
      }
    }
  }
  return spans;
}

function sourceUrlProperty(sourceUrl: string): string {
  return `sourceUrl: ${JSON.stringify(sourceUrl)}`;
}

/**
 * 從文章陣列拿掉指定 `sourceUrl` 的物件。用來把已收錄的文章改放到另一區，
 * 避免同一篇同時留在兩個檔案。
 */
export function removeParentArticlesFromSource(
  source: string,
  sourceUrls: readonly string[],
  exportName = "PARENT_ARTICLES",
): string {
  if (sourceUrls.length === 0) return source;
  const wanted = new Set(sourceUrls.map(sourceUrlProperty));
  for (const sourceUrl of sourceUrls) {
    if (!source.includes(sourceUrlProperty(sourceUrl))) {
      throw new Error(`找不到要移走的文章：${sourceUrl}`);
    }
  }
  const array = findExportedArray(source, exportName);
  const spans = articleObjectSpans(source, array.open, array.close).filter((span) => {
    const body = source.slice(span.start, span.end);
    for (const property of wanted) {
      if (body.includes(property)) return true;
    }
    return false;
  });
  if (spans.length !== sourceUrls.length) {
    throw new Error("要移走的文章數量跟資料檔裡對得上的物件數不一樣");
  }

  let next = source;
  for (const span of [...spans].sort((left, right) => right.start - left.start)) {
    let start = span.start;
    while (start > 0 && next[start - 1] !== "\n") start -= 1;
    let end = span.end;
    while (end < next.length && (next[end] === " " || next[end] === "\t")) end += 1;
    if (next[end] === ",") end += 1;
    if (next[end] === "\r") end += 1;
    if (next[end] === "\n") end += 1;
    next = `${next.slice(0, start)}${next.slice(end)}`;
  }
  for (const sourceUrl of sourceUrls) {
    if (next.includes(sourceUrlProperty(sourceUrl))) {
      throw new Error(`文章沒有移走：${sourceUrl}`);
    }
  }
  return next;
}

/** 文章離開育兒文章分享時，從系列名單拿掉 slug。空的系列一併刪除。 */
export function removeParentSeriesSlugs(
  source: string,
  slugs: readonly string[],
): string {
  if (slugs.length === 0) return source;
  const drop = new Set(slugs);
  const replaced = source.replace(/slugs:\s*\[[\s\S]*?\]/g, (full) => {
    const found = [...full.matchAll(/"([^"]+)"/g)].map((match) => match[1] ?? "");
    const next = found.filter((slug) => !drop.has(slug));
    if (next.length === found.length) return full;
    return `slugs: [${next.map((slug) => JSON.stringify(slug)).join(", ")}]`;
  });
  return replaced.replace(
    /\{\s*id:\s*"(?:[^"\\]|\\.)*",\s*title:\s*"(?:[^"\\]|\\.)*",\s*slugs:\s*\[\s*\],?\s*\},?/g,
    "",
  );
}
