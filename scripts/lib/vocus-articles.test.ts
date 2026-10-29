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
  planVocusArticleSync,
  publishedAtTaipei,
  removeParentArticlesFromSource,
  removeParentSeriesSlugs,
  selectPostsToAppend,
  shouldEnableAutoMerge,
  slugForVocusPost,
  stripTravelAbroadMarker,
  TRAVEL_ABROAD_MARKER,
  isPublishableVocusPost,
  mergeArticleDetail,
  vocusArticleDestination,
  vocusArticleUrl,
  vocusContentsUrl,
  type VocusListItem,
} from "./vocus-articles";
import { coverForVocusArticle } from "./vocus-article-covers";

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
    expect(finish).toContain("git add data/parent-travel-abroad-articles.ts");
    expect(finish).toContain("git add data/parent-article-series.ts");
    expect(finish).toContain('if [ "$checks_ok" = true ]');
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

function routed(html: string) {
  const raw = htmlToParentBlocks(html);
  return {
    raw,
    destination: vocusArticleDestination(raw),
    blocks: stripTravelAbroadMarker(raw),
  };
}

function post(html: string, contentId = "aaaaaaaaaaaaaaaaaaaaaaaa"): VocusListItem {
  return {
    contentId,
    title: "標題",
    publishAt: "2026-10-15T00:00:00.000Z",
    sourceUrl: `https://vocus.cc/post/${contentId}`,
    html,
    ogImageURL: null,
    isPay: false,
    adult: false,
    spam: 0,
    type: "post",
  };
}

describe("親子出國標記", () => {
  it("沒有標記的文留在育兒文章分享，內文不改", () => {
    const result = routed("<p>第一段</p><p>結尾</p>");
    expect(result.destination).toBe("parent-articles");
    expect(result.blocks).toBe(result.raw);
    expect(result.blocks).toEqual([
      { type: "paragraph", text: "第一段" },
      { type: "paragraph", text: "結尾" },
    ]);
  });

  it("文末才算；中間提到標記、後面還有正文的仍留在育兒文章", () => {
    const result = routed(
      "<p>同步更新至親子出國專欄</p><p>下面還有正文</p>",
    );
    expect(result.destination).toBe("parent-articles");
    expect(result.blocks).toBe(result.raw);
  });

  it.each([
    ["標記自己一行", "<p>第一段</p><p>同步更新至親子出國專欄</p>"],
    ["全形空白與字間空白", "<p>第一段</p><p>\u3000同 步更新至親子出國 專欄\u3000</p>"],
    ["角引號與全形句號", "<p>第一段</p><p>「同步更新至親子出國專欄」。</p>"],
    ["半形引號與句號", '<p>第一段</p><p>"同步更新至親子出國專欄".</p>'],
    ["單引號", "<p>第一段</p><p>'同步更新至親子出國專欄'</p>"],
    ["『』與全形驚嘆號", "<p>第一段</p><p>『同步更新至親子出國專欄』！</p>"],
    ["彎引號", "<p>第一段</p><p>“同步更新至親子出國專欄”</p>"],
    ["全形括號", "<p>第一段</p><p>（同步更新至親子出國專欄）</p>"],
    ["半形括號", "<p>第一段</p><p>(同步更新至親子出國專欄)</p>"],
    ["半形角括號", "<p>第一段</p><p>｢同步更新至親子出國專欄｣</p>"],
    ["全形引號", "<p>第一段</p><p>＂同步更新至親子出國專欄＂</p>"],
  ])("%s 收進親子出國，標記不留在頁面上", (_label, html) => {
    const result = routed(html);
    expect(result.destination).toBe("travel-abroad");
    expect(result.blocks).toEqual([{ type: "paragraph", text: "第一段" }]);
    expect(JSON.stringify(result.blocks)).not.toContain(TRAVEL_ABROAD_MARKER);
    expect(stripTravelAbroadMarker(result.blocks)).toBe(result.blocks);
  });

  it("標記接在最後一句後面時，只刪標記、留下前面的句子", () => {
    const result = routed("<p>祝旅途愉快。同步更新至親子出國專欄。</p>");
    expect(result.destination).toBe("travel-abroad");
    expect(result.blocks).toEqual([{ type: "paragraph", text: "祝旅途愉快。" }]);
  });

  it("換行拆開的標記、圖與清單項目也認得，圖會留下", () => {
    const split = routed("<p>正文<br>同步更新至<br>親子出國專欄</p>");
    expect(split.destination).toBe("travel-abroad");
    expect(split.blocks).toEqual([{ type: "paragraph", text: "正文" }]);

    const withImage = routed(
      '<p>海邊</p><img src="https://images.example/sea.jpg" alt="海邊" width="800" height="600"><p>同步更新至親子出國專欄</p>',
    );
    expect(withImage.destination).toBe("travel-abroad");
    expect(withImage.blocks).toEqual([
      { type: "paragraph", text: "海邊" },
      {
        type: "image",
        src: "https://images.example/sea.jpg",
        alt: "海邊",
        width: 800,
        height: 600,
      },
    ]);

    const list = routed("<ul><li>護照</li><li>同步更新至親子出國專欄</li></ul>");
    expect(list.destination).toBe("travel-abroad");
    expect(list.blocks).toEqual([{ type: "list", items: ["護照"] }]);
  });
});

describe("已收錄文章加上標記會搬走、不複製", () => {
  const marked = "<p>你好</p><p>「同步更新至親子出國專欄」。</p>";
  const plain = "<p>你好</p>";

  it("育兒文章後來有標記：同一 slug 移到親子出國，再跑一次不再新增", () => {
    const item = post(marked);
    const stored = {
      sourceUrl: item.sourceUrl,
      slug: "vocus-aaaaaaaaaaaaaaaaaaaaaaaa",
      destination: "parent-articles" as const,
    };
    const first = planVocusArticleSync([item], [stored]);
    expect(first.actions).toEqual([
      {
        kind: "move",
        destination: "travel-abroad",
        from: "parent-articles",
        slug: stored.slug,
        post: item,
      },
    ]);
    expect(first.skippedExisting).toBe(0);

    const article = articleFromVocusPost(item, new Set([stored.slug]), stored.slug);
    expect(article.slug).toBe(stored.slug);
    expect(article.blocks).toEqual([{ type: "paragraph", text: "你好" }]);
    expect(article.excerpt).toBe("你好");

    const second = planVocusArticleSync(
      [item],
      [{ ...stored, destination: "travel-abroad" }],
    );
    expect(second.actions).toEqual([]);
    expect(second.skippedExisting).toBe(1);
  });

  it("沒有標記的新文仍只進育兒文章；拿掉標記會搬回去", () => {
    const fresh = post(plain, "bbbbbbbbbbbbbbbbbbbbbbbb");
    expect(planVocusArticleSync([fresh], []).actions).toEqual([
      { kind: "add", destination: "parent-articles", post: fresh },
    ]);

    const travel = post(plain);
    const back = planVocusArticleSync(
      [travel],
      [
        {
          sourceUrl: travel.sourceUrl,
          slug: "kept-slug",
          destination: "travel-abroad",
        },
      ],
    );
    expect(back.actions).toEqual([
      {
        kind: "move",
        destination: "parent-articles",
        from: "travel-abroad",
        slug: "kept-slug",
        post: travel,
      },
    ]);
  });

  it("從育兒文章檔移走後只出現在親子出國檔一次", () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
    const parent = readFileSync(join(root, "data/parent-articles.ts"), "utf8");
    const series = readFileSync(join(root, "data/parent-article-series.ts"), "utf8");
    const url = "https://vocus.cc/post/6ad06360fd89780001c70f77";
    const removed = removeParentArticlesFromSource(parent, [url]);
    expect(removed).not.toContain(url);
    expect(removed).toContain('slug: "vision-care-1"');
    expect(removed).toContain("https://vocus.cc/post/6aa4aebffd897800019c944a");
    expect(removed).toContain("https://vocus.cc/post/6aa4afa9fd897800019cbfbc");
    expect(removed).toContain("https://vocus.cc/post/6aa4b010fd897800019cd432");

    const article = articleFromVocusPost(
      post(`<p>你好</p><p>${TRAVEL_ABROAD_MARKER}</p>`),
      new Set(),
    );
    const travel = appendParentArticleSource(
      'export const PARENT_TRAVEL_ABROAD_ARTICLES: readonly ParentArticle[] = [\n];\n',
      [article],
      "PARENT_TRAVEL_ABROAD_ARTICLES",
    );
    const again = appendParentArticleSource(travel, [article], "PARENT_TRAVEL_ABROAD_ARTICLES");
    expect(again).toBe(travel);
    expect(travel.match(new RegExp(article.sourceUrl, "g"))).toHaveLength(1);
    expect(removed).not.toContain(article.sourceUrl);

    const withBraces = `export const PARENT_ARTICLES: readonly ParentArticle[] = [
  {
    slug: "keep",
    title: "留",
    publishedAt: "2026-01-01",
    sourceUrl: "https://vocus.cc/post/aaaaaaaaaaaaaaaaaaaaaaaa",
    excerpt: "括號",
    blocks: [
      { type: "paragraph", text: "括號 { 與 } 還有 [陣列]" },
    ],
  },
  {
    slug: "move",
    title: "搬",
    publishedAt: "2026-01-02",
    sourceUrl: "https://vocus.cc/post/bbbbbbbbbbbbbbbbbbbbbbbb",
    excerpt: "b",
    blocks: [
      { type: "paragraph", text: "b" },
    ],
  },
];
`;
    const kept = removeParentArticlesFromSource(withBraces, [
      "https://vocus.cc/post/bbbbbbbbbbbbbbbbbbbbbbbb",
    ]);
    expect(kept).toContain("括號 { 與 } 還有 [陣列]");
    expect(kept).toContain("aaaaaaaaaaaaaaaaaaaaaaaa");
    expect(kept).not.toContain("bbbbbbbbbbbbbbbbbbbbbbbb");

    const seriesNext = removeParentSeriesSlugs(series, ["vision-care-2"]);
    expect(seriesNext).toContain("vision-care-1");
    expect(seriesNext).toContain("vision-care-3");
    expect(seriesNext).not.toContain("vision-care-2");
    const emptied = removeParentSeriesSlugs(series, [
      "vision-care-1",
      "vision-care-2",
      "vision-care-3",
    ]);
    expect(emptied).not.toContain("vision-care");
    expect(emptied).toContain("export const PARENT_ARTICLE_SERIES");
  });
});

describe("方格子 article 型別", () => {
  const contentId = "6ae34027fd897800012f3e51";
  const listPayload = {
    count: 1,
    contents: [
      {
        title: "名古屋北陸",
        type: "article",
        isPay: false,
        adult: false,
        spam: 0,
        contentId,
        publishAt: "2026-10-29T13:06:04.184Z",
        article: {
          title: "名古屋北陸",
          thumbnailUrl: "https://images.vocus.cc/thumb.png",
        },
      },
    ],
  };
  const detailHtml = [
    "<html><body><div>",
    '<p class="graf--p"><span style="white-space: pre-wrap;">帶孩子去小松看挖土機。</span></p>',
    '<p class="graf--p"><span style="white-space: pre-wrap;"><同步更新至親子出國專欄></span></p>',
    "</div></body></html>",
  ].join("");

  it("列表沒有內文時先不當公開文，補上單篇 HTML 後收進親子出國", () => {
    const parsed = parseContentsPage(listPayload);
    const listed = parsed.items[0];
    expect(listed).toBeDefined();
    if (!listed) return;
    expect(listed.type).toBe("article");
    expect(listed.html).toBe("");
    expect(listed.sourceUrl).toBe(`https://vocus.cc/article/${contentId}`);
    expect(listed.ogImageURL).toBe("https://images.vocus.cc/thumb.png");
    expect(isPublishableVocusPost(listed)).toBe(false);
    expect(vocusArticleUrl(contentId)).toBe(
      `https://api.vocus.cc/api/article/${contentId}`,
    );

    const merged = mergeArticleDetail(listed, { article: { content: detailHtml } });
    expect(isPublishableVocusPost(merged)).toBe(true);
    expect(vocusArticleDestination(htmlToParentBlocks(merged.html))).toBe("travel-abroad");

    const article = articleFromVocusPost(merged, new Set());
    expect(article.slug).toBe(`vocus-${contentId}`);
    expect(article.blocks).toEqual([
      { type: "paragraph", text: "帶孩子去小松看挖土機。" },
    ]);
    expect(JSON.stringify(article)).not.toContain(TRAVEL_ABROAD_MARKER);

    const plan = planVocusArticleSync([merged], []);
    expect(plan.actions).toEqual([
      { kind: "add", destination: "travel-abroad", post: merged },
    ]);
    expect(plan.skippedUnpublished).toBe(0);
  });

  it("已經在親子出國的 article 再跑一次不會重寫，指定封面也不改去下載縮圖", () => {
    const parsed = parseContentsPage(listPayload);
    const listed = parsed.items[0];
    expect(listed).toBeDefined();
    if (!listed) return;
    const merged = mergeArticleDetail(listed, { article: { content: detailHtml } });
    const again = planVocusArticleSync(
      [merged],
      [
        {
          sourceUrl: merged.sourceUrl,
          slug: `vocus-${contentId}`,
          destination: "travel-abroad",
        },
      ],
    );
    expect(again.actions).toEqual([]);
    expect(again.skippedExisting).toBe(1);

    expect(coverForVocusArticle(`vocus-${contentId}`, merged.ogImageURL)).toEqual({
      coverImage: `/parent-articles/vocus-${contentId}-cover.webp`,
      coverAlt: "小松 PC4000 大型怪手前，大人與小孩的背影",
      downloadOg: false,
    });
    expect(coverForVocusArticle("vocus-aaaaaaaaaaaaaaaaaaaaaaaa", "https://images.example/a.jpg")).toEqual({
      coverImage: "/parent-articles/vocus-aaaaaaaaaaaaaaaaaaaaaaaa-cover.webp",
      downloadOg: true,
    });
  });
});
