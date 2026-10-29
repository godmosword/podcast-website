/**
 * 家長區「親子出國」。
 *
 * 方格子文末有「同步更新至親子出國專欄」（可含空白、引號、標點）時，
 * `npm run sync:vocus` 把那篇收進這個陣列，不進 `data/parent-articles.ts`。
 * 閱讀順序＝陣列順序；多篇時較早發布的在前。列表頁另外依發布日新到舊顯示。
 * 不要在 `PARENT_TRAVEL_ABROAD_ARTICLES` 之後再加陣列（同步用最後一個 `];` 定位）。
 *
 * 圖片與育兒文章共用 `public/parent-articles/`，搬走時不用改路徑。
 * 型別與育兒文章相同，見 `data/parent-articles.ts`。
 */
import type { ParentArticle } from "./parent-articles";

export const PARENT_TRAVEL_ABROAD_ARTICLES: readonly ParentArticle[] = [
  {
    slug: "vocus-6ae34027fd897800012f3e51",
    title: "名古屋北陸親子景點推薦：小松之杜，近距離看超大挖土機與卡車！",
    publishedAt: "2026-10-29",
    sourceUrl: "https://vocus.cc/article/6ae34027fd897800012f3e51",
    excerpt: "這次名古屋北陸之旅帶孩子到了小松，參觀了當地非常有名的小松之杜。\n小松之杜在 JR 小松站旁，原本是 Komatsu 的創業工廠，2011 年改建成開放給大家的綠地園區。園區裡停著超大型自卸卡車 930E 和巨型油壓挖土機 PC4000，旁邊還有「わくわくコマツ館」可以近看建築機械車輛。\n我們運氣不錯，不但到室內實際操作了小型挖土機，本來擔心下雨不開放的超大機具，隨著下午雨停了，真的開始運作了！\n開放進去操作室參觀的時候，孩子跟我都難掩興奮，留下了非常深刻的美好回憶。\n車車遊樂園又解鎖了一種特殊車子囉！",
    coverImage: "/parent-articles/vocus-6ae34027fd897800012f3e51-cover.webp",
    coverAlt: "小松 PC4000 大型怪手前，大人與小孩的背影",
    blocks: [
      { type: "paragraph", text: "這次名古屋北陸之旅帶孩子到了小松，參觀了當地非常有名的小松之杜。" },
      { type: "paragraph", text: "小松之杜在 JR 小松站旁，原本是 Komatsu 的創業工廠，2011 年改建成開放給大家的綠地園區。園區裡停著超大型自卸卡車 930E 和巨型油壓挖土機 PC4000，旁邊還有「わくわくコマツ館」可以近看建築機械車輛。" },
      { type: "paragraph", text: "我們運氣不錯，不但到室內實際操作了小型挖土機，本來擔心下雨不開放的超大機具，隨著下午雨停了，真的開始運作了！" },
      { type: "paragraph", text: "開放進去操作室參觀的時候，孩子跟我都難掩興奮，留下了非常深刻的美好回憶。" },
      { type: "paragraph", text: "車車遊樂園又解鎖了一種特殊車子囉！" },
    ],
  },
];
