/**
 * 家長區「電子報」。
 *
 * 一期一筆，加在陣列末端（較早的在前）。列表、上一期／下一期與靜態路徑都讀這個陣列。
 * `body` 是 Notion 原稿，不要改字。`<br />`、`<b>`、callout、來源連結由
 * `lib/newsletter-markdown.ts` 畫出來。
 */
export type Newsletter = {
  readonly slug: string;
  readonly title: string;
  /** 期別日期 YYYY-MM-DD（台北日期）。 */
  readonly publishedAt: string;
  /** 主旨：列表摘要與單篇 description，不改寫。 */
  readonly description: string;
  /** Notion markdown 原稿。 */
  readonly body: string;
};

export const NEWSLETTERS: readonly Newsletter[] = [
  {
    slug: "2026-10-28",
    title: "⏱️ 「你已經試了 20 秒囉」：陪在旁邊說出孩子努力多久，他更願意再撐一下",
    publishedAt: "2026-10-28",
    description:
      "孩子卡關就喊「我不會」？今晚 5 分鐘「計時小幫手」遊戲，陪他多撐一下",
    body: "## 本期一句話\n\n陪在旁邊說「你已經試了 20 秒」，孩子更敢再試。\n\n## 主題\n\n孩子卡關喊「我不會啦！」時，先別急著幫忙，坐到他旁邊說「你已經試了 20 秒囉」。<br />大阪大學石川萌子、鹿子木康弘等研究團隊在《Child Development》發表研究：讓 4–5 歲孩子試著打開一個很難開的木箱，旁邊的機器人每隔一段時間報「20 秒了喔」，孩子就試得比較久；換成大人，效果差不多；只從電腦喇叭播出同樣的聲音，就沒有幫助。<br />先說清楚：這是實驗室裡的短時間任務，箱子其實打不開，量的是「當下願意試多久」，不能證明在家這樣說，孩子長期就會更有毅力。如果孩子常常一卡關就情緒很大，可以和兒科醫師或老師聊聊。<br /><b>3–4 歲</b> 撐 10、20 秒就很了不起，時間短一點、事情簡單一點。<br /><b>5–7 歲</b> 可以挑稍難的任務，也讓他知道：試過了再開口求救，完全沒問題。\n\n## 今晚就能試\n\n<callout icon=\"⏱️\" color=\"blue_bg\">\n<b>活動名：</b> 計時小幫手<br /><b>需時：</b> 5 分鐘<br /><b>材料：</b> 一件孩子覺得有點難的事（拼圖、接軌道、扣釦子都可以）<br /><b>適合年齡：</b> 3–7 歲\n\n1. 坐在孩子旁邊，先不急著出手幫忙。\n2. 每過一會兒，用平常的語氣說出他努力了多久：「10 秒了」「20 秒了」。\n3. 他想停或求救時，先說「你剛剛試了 30 秒耶」，再問：「要再試一次，還是要我幫一點點？」<br /><b>家長可照唸：</b>「你已經試了好久，我都看到了。」\n</callout>\n\n## 來源\n\n- [大阪大學新聞稿：機器人的聲音能提高幼兒的堅持](https://resou.osaka-u.ac.jp/ja/research/2026/20260715_1)（論文：[Child Development](https://doi.org/10.1093/chidev/aacag125)）：4–5 歲孩子在旁有人或機器人報時間時，試得比較久；電腦播音沒效果。\n- [MIT 新聞：寶寶看大人努力後，自己也會更努力](https://news.mit.edu/2017/babies-try-harder-seeing-adults-0921)（論文：[Science 2017](https://www.science.org/doi/10.1126/science.aan2317)）：15 個月大的寶寶看過大人各努力約 30 秒才成功，之後按按鈕的次數將近多一倍。\n",
  },
];
