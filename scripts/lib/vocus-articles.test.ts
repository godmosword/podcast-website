import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { load as parseYaml } from "js-yaml";
import { describe, expect, it } from "vitest";
import { PARENT_ARTICLES } from "../../data/parent-articles";
import {
  appendParentArticleSource,
  articleFromVocusPost,
  excerptFromBlocks,
  htmlToParentBlocks,
  parseContentsPage,
  publishedAtTaipei,
  selectPostsToAppend,
  shouldEnableAutoMerge,
  slugForVocusPost,
  vocusContentsUrl,
} from "./vocus-articles";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/vocus");

function fixture(name: string): string {
  return readFileSync(join(fixtures, name), "utf8");
}

describe("方格子 HTML → blocks", () => {
  it("視力系列三篇的 HTML 與手寫 blocks 一致", () => {
    const cases = [
      ["vision-care-1", "vision-care-1.html"],
      ["vision-care-2", "vision-care-2.html"],
      ["vision-care-3", "vision-care-3.html"],
    ] as const;
    for (const [slug, file] of cases) {
      const article = PARENT_ARTICLES.find((entry) => entry.slug === slug);
      expect(article, slug).toBeDefined();
      expect(htmlToParentBlocks(fixture(file))).toEqual(article?.blocks);
    }
  });

  it("保留換行、空行、標題、清單、圖片，並去掉物件替代字元與文首文末空行", () => {
    expect(htmlToParentBlocks(fixture("rich-blocks.html"))).toEqual([
      { type: "heading", level: 2, text: "小標" },
      { type: "paragraph", text: "第一行" },
      { type: "paragraph", text: "第二行 " },
      { type: "spacer" },
      { type: "heading", level: 2, text: "當成二級標題" },
      { type: "heading", level: 3, text: "更小的標" },
      { type: "list", items: ["項目一", "項目二\n續行"] },
      {
        type: "image",
        src: "https://images.example/light.jpg",
        alt: "紅綠燈",
        width: 800,
        height: 600,
      },
      { type: "paragraph", text: "圖說保持原文" },
      { type: "paragraph", text: "結尾" },
    ]);
  });

  it("摘要用第一個 spacer 之前的原文行", () => {
    const blocks = htmlToParentBlocks(fixture("emotion-volcano.html"));
    expect(excerptFromBlocks(blocks)).toBe(
      [
        "我想很多爸爸媽媽有感，",
        "當孩子情緒一上來，就像小火山突然爆發一樣🌋",
        "這時候，不管大人說什麼，孩子好像都聽不進去。",
        "我一直在想，有沒有什麼簡單又好懂的方法，",
        "可以讓孩子學習怎麼面對生氣的情緒？",
      ].join("\n"),
    );
    expect(blocks.some((block) => block.type === "spacer")).toBe(true);
    expect(JSON.stringify(blocks)).not.toContain("\\uFFFC");
    const saved = PARENT_ARTICLES.find(
      (article) => article.slug === "vocus-6ad06360fd89780001c70f77",
    );
    expect(saved?.blocks).toEqual(blocks);
    expect(saved?.publishedAt).toBe("2026-10-15");
    expect(saved?.excerpt).toBe(excerptFromBlocks(blocks));
  });
});

describe("方格子去重與附加順序", () => {
  it("略過已收錄與未公開文，並由舊到新排列", () => {
    const page = parseContentsPage(JSON.parse(fixture("listing.json")));
    const existing = new Set(["https://vocus.cc/post/6aa4aebffd897800019c944a"]);
    const selected = selectPostsToAppend(page.items, existing);
    expect(selected.skippedExisting).toBe(2);
    expect(selected.skippedUnpublished).toBe(1);
    expect(selected.posts.map((post) => post.contentId)).toEqual([
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      "bbbbbbbbbbbbbbbbbbbbbbbb",
    ]);
    expect(publishedAtTaipei("2026-10-14T16:30:00.000Z")).toBe("2026-10-15");
    expect(publishedAtTaipei("2026-10-15T05:23:44.009Z")).toBe("2026-10-15");
    expect(publishedAtTaipei("2026-09-12T01:45:35.442Z")).toBe("2026-09-12");
  });

  it("slug 用貼文 id，且 sourceUrl 已在檔內時不重複插入", () => {
    const slugs = new Set(["vocus-aaaaaaaaaaaaaaaaaaaaaaaa"]);
    expect(slugForVocusPost("bbbbbbbbbbbbbbbbbbbbbbbb", slugs)).toBe(
      "vocus-bbbbbbbbbbbbbbbbbbbbbbbb",
    );
    expect(slugForVocusPost("aaaaaaaaaaaaaaaaaaaaaaaa", slugs)).toBe(
      "vocus-aaaaaaaaaaaaaaaaaaaaaaaa-2",
    );

    const page = parseContentsPage(JSON.parse(fixture("listing.json")));
    const post = page.items.find((item) => item.contentId === "aaaaaaaaaaaaaaaaaaaaaaaa");
    expect(post).toBeDefined();
    if (!post) return;
    const article = articleFromVocusPost(post, new Set());
    const source = 'export const PARENT_ARTICLES: readonly ParentArticle[] = [\n];\n';
    const once = appendParentArticleSource(source, [article]);
    const twice = appendParentArticleSource(once, [article]);
    expect(once).toContain(article.sourceUrl);
    expect(once).toContain('slug: "vocus-aaaaaaaaaaaaaaaaaaaaaaaa"');
    expect(twice).toBe(once);
    expect(vocusContentsUrl(1)).toBe(
      "https://api.vocus.cc/api/contents?creatorId=6aa4a7adaa92714642f625a3&num=10&page=1&order=desc&sort=publishAt&status=2",
    );
  });
});

describe("自動合併 workflow", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const workflow = readFileSync(
    join(root, ".github/workflows/sync-vocus-articles.yml"),
    "utf8",
  );
  const finish = readFileSync(join(root, "scripts/finish-vocus-sync.sh"), "utf8");

  it("排程對齊台北每 6 小時，且檢查失敗時不呼叫 squash auto-merge", () => {
    const doc = parseYaml(workflow) as Record<string, unknown> & {
      on?: { schedule?: Array<{ cron: string }> };
      true?: { schedule?: Array<{ cron: string }> };
    };
    const triggers = doc.on ?? doc.true;
    const cron = triggers?.schedule?.[0]?.cron;
    expect(cron).toBe("20 0,6,12,18 * * *");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("npm run lint");
    expect(workflow).toContain("npm run typecheck");
    expect(workflow).toContain("npm test");
    expect(workflow).toContain("continue-on-error: true");
    expect(workflow).toContain("bash scripts/finish-vocus-sync.sh");

    const mergeAt = finish.indexOf('gh pr merge "$pr" --squash --auto');
    const refuseAt = finish.indexOf('檢查未全過，PR 保持開啟、不合併');
    expect(refuseAt).toBeGreaterThan(-1);
    expect(mergeAt).toBeGreaterThan(refuseAt);
    expect(finish).toContain("--disable-auto");
  });
});

describe("自動合併閘門", () => {
  it("四項都成功才合併", () => {
    expect(
      shouldEnableAutoMerge({
        fonts: "success",
        lint: "success",
        typecheck: "success",
        test: "success",
      }),
    ).toBe(true);
    expect(
      shouldEnableAutoMerge({
        fonts: "success",
        lint: "failure",
        typecheck: "success",
        test: "success",
      }),
    ).toBe(false);
    expect(
      shouldEnableAutoMerge({
        fonts: "failure",
        lint: "success",
        typecheck: "success",
        test: "success",
      }),
    ).toBe(false);
  });
});
