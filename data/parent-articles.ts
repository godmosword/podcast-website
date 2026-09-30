/**
 * 家長區「育兒文章分享」。
 *
 * 新增一篇：在 `PARENT_ARTICLES` 陣列最後（或你要的閱讀順序位置）加一筆。
 * 列表、上一篇／下一篇與靜態路徑都讀這個陣列，不用改版面元件。
 *
 * - `blocks` 保留原文分段：`paragraph` 是作者的一行、`spacer` 是原文空行。
 *   也可使用 `heading`（level 2 或 3）、`list`、`image`。
 * - 圖片請放到 `public/parent-articles/`，用站內路徑（例如
 *   `/parent-articles/example.jpg`）。`coverImage` 是列表封面；內文圖放 `image` block。
 * - `excerpt` 請從開頭原文摘一句或一小段，不要改寫。
 * - 新增中文後若字型缺字，執行 `npm run font:subset`。
 */
export type ParentArticleBlock =
  | { readonly type: "paragraph"; readonly text: string }
  | { readonly type: "spacer" }
  | { readonly type: "heading"; readonly level: 2 | 3; readonly text: string }
  | { readonly type: "list"; readonly items: readonly string[] }
  | {
      readonly type: "image";
      readonly src: string;
      readonly alt: string;
      readonly width: number;
      readonly height: number;
    };

export type ParentArticle = {
  readonly slug: string;
  readonly title: string;
  /** 發布日 YYYY-MM-DD（台北日期）。 */
  readonly publishedAt: string;
  /** 方格子原文網址。 */
  readonly sourceUrl: string;
  /** 列表摘要：原文開頭，不改寫。 */
  readonly excerpt: string;
  readonly coverImage?: string;
  readonly coverAlt?: string;
  readonly blocks: readonly ParentArticleBlock[];
};

export const PARENT_ARTICLES: readonly ParentArticle[] = [
  {
    slug: "vision-care-1",
    title: "注意孩子的視力保健（ㄧ）",
    publishedAt: "2026-09-12",
    sourceUrl: "https://vocus.cc/post/6aa4aebffd897800019c944a",
    excerpt: "我的孩子因為先天性單眼散光\n容易產生視差",
    blocks: [
      { type: "paragraph", text: "我的孩子因為先天性單眼散光" },
      { type: "paragraph", text: "容易產生視差" },
      { type: "spacer" },
      { type: "paragraph", text: "從2歲開始" },
      { type: "paragraph", text: "我就發現他有時候會歪著頭看東西" },
      { type: "paragraph", text: "再加上我和先生都是高度近視" },
      { type: "paragraph", text: "所以一直都有帶他到眼科追蹤" },
      { type: "spacer" },
      { type: "paragraph", text: "一直追蹤到4歲" },
      { type: "paragraph", text: "醫生確認是先天性單眼散光" },
      { type: "spacer" },
      { type: "paragraph", text: "🔸第一次視力檢查 " },
      { type: "paragraph", text: "左眼1.0、右眼0.7" },
      { type: "paragraph", text: "醫生表示可以先觀察" },
      { type: "paragraph", text: "也可以配眼鏡" },
      { type: "spacer" },
      { type: "paragraph", text: "🔸半年後- 第二次檢查 " },
      { type: "paragraph", text: "左眼1.0、右眼0.6 " },
      { type: "paragraph", text: "右眼又退步了" },
      { type: "paragraph", text: "醫生建議開始配戴眼鏡+遮眼" },
      { type: "paragraph", text: "每天遮眼罩2小時" },
      { type: "paragraph", text: "讓右眼多練習出力" },
      { type: "spacer" },
      { type: "paragraph", text: "🔸再三個月後- 第三次檢查 " },
      { type: "paragraph", text: "左眼1.2、右眼1.2 🎉" },
      { type: "spacer" },
      { type: "paragraph", text: "醫生說眼鏡對他有幫助" },
      { type: "paragraph", text: "建議繼續配戴" },
      { type: "paragraph", text: "遮眼時間改成每天1小時" },
      { type: "paragraph", text: "雖然視力已經恢復1.2" },
      { type: "paragraph", text: "但還需要一點時間持續強化右眼" },
      { type: "paragraph", text: "等下次返診能維持好視力就能停止遮眼" },
      { type: "paragraph", text: "也有機會不帶眼鏡" },
      { type: "spacer" },
      { type: "paragraph", text: "我們家孩子因為眼睛的先天條件比較不好" },
      { type: "paragraph", text: "所以更需要靠後天持續追蹤與治療" },
      { type: "spacer" },
      { type: "paragraph", text: "分享這段經驗是想提醒爸爸媽媽" },
      { type: "paragraph", text: "如果發現孩子常歪頭、瞇眼、靠很近看" },
      { type: "paragraph", text: "或是家裡有高度近視、散光等家族史" },
      { type: "paragraph", text: "可以提早帶孩子做檢查" },
      { type: "spacer" },
      { type: "paragraph", text: "現在的醫療很進步" },
      { type: "paragraph", text: "只要把握黃金治療期，很多問題都有機會改善" },
      { type: "spacer" },
      { type: "paragraph", text: "希望每個孩子" },
      { type: "paragraph", text: "都能擁有清楚又健康的視力❤️" },
    ],
  },
  {
    slug: "vision-care-2",
    title: "注意孩子的視力（二）",
    publishedAt: "2026-09-12",
    sourceUrl: "https://vocus.cc/post/6aa4afa9fd897800019cbfbc",
    excerpt: "我孩子的視力\n如何從0.6恢復到1.2",
    blocks: [
      { type: "paragraph", text: "我孩子的視力" },
      { type: "paragraph", text: "如何從0.6恢復到1.2" },
      { type: "spacer" },
      { type: "paragraph", text: "這過程中我沒禁用3c" },
      { type: "paragraph", text: "甚至有時候我還請3c幫忙" },
      { type: "paragraph", text: "但帶孩子去公園跟打球幫助很多" },
      { type: "spacer" },
      { type: "paragraph", text: "因為我的孩子有先天性單眼散光" },
      { type: "paragraph", text: "容易造成兩眼視差" },
      { type: "spacer" },
      { type: "paragraph", text: "在孩子單眼視力0.6時" },
      { type: "paragraph", text: "醫生建議帶眼鏡+遮眼" },
      { type: "paragraph", text: "然後在他做精細動作或近距離時遮眼效果最好" },
      { type: "paragraph", text: "例如：寫字、畫畫、玩玩具、黏土" },
      { type: "spacer" },
      { type: "paragraph", text: "以下是孩子遮眼三個月的實測方法：" },
      { type: "paragraph", text: "🔸遮眼一天共2小時，維持三個月" },
      { type: "spacer" },
      { type: "paragraph", text: "（平日）" },
      { type: "paragraph", text: "▪️白天遮眼1小時：上課、畫畫、寫字" },
      { type: "paragraph", text: "▪️放學去公園玩1小時" },
      { type: "paragraph", text: "▪️晚上遮眼1小時：使用iPad、玩玩具、黏土、樂高、看故事書，這過程半小時需讓眼睛休息10分鐘" },
      { type: "spacer" },
      { type: "paragraph", text: "（假日）" },
      { type: "paragraph", text: "▪️除了以上遮眼方法不變" },
      { type: "paragraph", text: "▪️好天氣至少在戶外待半天或騎腳踏車" },
      { type: "paragraph", text: "▪️雨天帶去室內打網球或橋下公園玩" },
    ],
  },
  {
    slug: "vision-care-3",
    title: "注意孩子的視力（三）",
    publishedAt: "2026-09-12",
    sourceUrl: "https://vocus.cc/post/6aa4b010fd897800019cd432",
    excerpt: "為了拯救孩子的視力\n我做了哪些改變？",
    blocks: [
      { type: "paragraph", text: "為了拯救孩子的視力" },
      { type: "paragraph", text: "我做了哪些改變？" },
      { type: "spacer" },
      { type: "paragraph", text: "一年前" },
      { type: "paragraph", text: "我走入診間" },
      { type: "paragraph", text: "醫生跟我說了一個" },
      { type: "paragraph", text: "我腦海中從沒出現過的詞" },
      { type: "spacer" },
      { type: "paragraph", text: "孩子的「遠視儲備」已經很低了" },
      { type: "paragraph", text: "當時我在想" },
      { type: "paragraph", text: "該如何保護孩子僅有少少的遠視儲備" },
      { type: "paragraph", text: "我們做了這些事" },
      { type: "spacer" },
      { type: "paragraph", text: "▪️換掉用了十年的電視，找了解析度高畫質好的螢幕" },
      { type: "paragraph", text: "▪️在客廳量出適合大小的電視與距離" },
      { type: "paragraph", text: "▪️室內注意光線，孩子在近距離用眼時 ，例如看故事書、玩黏土…，加用檯燈" },
      { type: "paragraph", text: "▪️使用蕃茄鬧鐘用眼30分鐘，休息10分鐘" },
      { type: "paragraph", text: "▪️平日放學讓孩子去公園1小時" },
      { type: "paragraph", text: "▪️假日至少半天在戶外活動" },
      { type: "paragraph", text: "▪️每週至少安排一次打球" },
      { type: "spacer" },
      { type: "paragraph", text: "一年後的遠視儲備量跟一年前完全一樣" },
      { type: "paragraph", text: "表示以上方法對我家孩子來說是可行的" },
      { type: "paragraph", text: "我還是會繼續堅持下去🧡" },
    ],
  },
];
