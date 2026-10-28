/**
 * 把電子報原稿（Notion markdown）拆成區塊。
 * 只認得這份稿用到的標記：`##` 標題、`<br />`、`<b>`、`<callout>`、
 * 編號／項目清單、`[文字](網址)`。其餘字元原樣留下。
 */

export type NewsletterInline =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "bold"; readonly text: string }
  | { readonly type: "break" }
  | { readonly type: "link"; readonly text: string; readonly href: string };

export type NewsletterBlock =
  | { readonly type: "heading"; readonly level: 2 | 3; readonly text: string }
  | { readonly type: "paragraph"; readonly inlines: readonly NewsletterInline[] }
  | { readonly type: "callout"; readonly blocks: readonly NewsletterBlock[] }
  | {
      readonly type: "list";
      readonly ordered: boolean;
      readonly items: readonly (readonly NewsletterInline[])[];
    };

function parseInlines(input: string): NewsletterInline[] {
  const inlineRe = /<br\s*\/?>|<\/?b>|\[([^\]]+)\]\(([^)\s]+)\)/g;
  const result: NewsletterInline[] = [];
  let last = 0;
  let bold = false;
  const pushText = (text: string) => {
    if (text === "") return;
    result.push(bold ? { type: "bold", text } : { type: "text", text });
  };

  for (const match of input.matchAll(inlineRe)) {
    const token = match[0];
    const index = match.index ?? 0;
    pushText(input.slice(last, index));
    if (token.startsWith("<br")) {
      result.push({ type: "break" });
    } else if (token === "<b>") {
      bold = true;
    } else if (token === "</b>") {
      bold = false;
    } else if (match[1] != null && match[2] != null && /^https?:\/\//.test(match[2])) {
      result.push({ type: "link", text: match[1], href: match[2] });
    } else {
      pushText(token);
    }
    last = index + token.length;
  }
  pushText(input.slice(last));
  return result;
}

/** 去掉首尾空行，保留段落裡的原文。 */
export function parseNewsletterMarkdown(source: string): NewsletterBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: NewsletterBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim() === "") {
      index += 1;
      continue;
    }

    if (line.startsWith("<callout")) {
      const inner: string[] = [];
      const afterOpen = line.replace(/^<callout[^>]*>/, "");
      if (afterOpen.includes("</callout>")) {
        const beforeClose = afterOpen.split("</callout>")[0] ?? "";
        if (beforeClose.trim() !== "") inner.push(beforeClose);
        index += 1;
      } else {
        if (afterOpen.trim() !== "") inner.push(afterOpen);
        index += 1;
        while (index < lines.length && !(lines[index] ?? "").includes("</callout>")) {
          inner.push(lines[index] ?? "");
          index += 1;
        }
        if (index < lines.length) {
          const beforeClose = (lines[index] ?? "").split("</callout>")[0] ?? "";
          if (beforeClose.trim() !== "") inner.push(beforeClose);
          index += 1;
        }
      }
      blocks.push({
        type: "callout",
        blocks: parseNewsletterMarkdown(inner.join("\n")),
      });
      continue;
    }

    const heading3 = /^### (.+)$/.exec(line);
    if (heading3?.[1]) {
      blocks.push({ type: "heading", level: 3, text: heading3[1] });
      index += 1;
      continue;
    }
    const heading2 = /^## (.+)$/.exec(line);
    if (heading2?.[1]) {
      blocks.push({ type: "heading", level: 2, text: heading2[1] });
      index += 1;
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\. /.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\d+\. /, ""));
        index += 1;
      }
      blocks.push({
        type: "list",
        ordered: true,
        items: items.map(parseInlines),
      });
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && (lines[index] ?? "").startsWith("- ")) {
        items.push((lines[index] ?? "").slice(2));
        index += 1;
      }
      blocks.push({
        type: "list",
        ordered: false,
        items: items.map(parseInlines),
      });
      continue;
    }

    blocks.push({ type: "paragraph", inlines: parseInlines(line) });
    index += 1;
  }

  return blocks;
}

function inlinePlain(inlines: readonly NewsletterInline[]): string {
  return inlines
    .map((node) => (node.type === "break" ? "" : node.text))
    .join("");
}

function blockPlain(blocks: readonly NewsletterBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return block.text;
        case "paragraph":
          return inlinePlain(block.inlines);
        case "callout":
          return blockPlain(block.blocks);
        case "list":
          return block.items.map(inlinePlain).join("");
        default: {
          const unreachable: never = block;
          return unreachable;
        }
      }
    })
    .join("");
}

/** 畫面上看得到的字，不含標記。用來核對沒有漏字。 */
export function newsletterVisibleText(source: string): string {
  return blockPlain(parseNewsletterMarkdown(source));
}
