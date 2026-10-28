/**
 * 家長區「電子報」。
 *
 * 一期一筆，加在陣列末端（較早的在前）。列表、上一期／下一期與靜態路徑都讀這個陣列。
 * `body` 是 Notion 審定的口語原稿，不要改字。`<br />`、`<b>`、callout、來源連結由
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
    slug: "2026-10-09",
    title: "🌙 睡前螢幕下班：睡前一小時讓螢幕先去睡",
    publishedAt: "2026-10-09",
    description:
      "孩子睡前總喊「再看一集」？今晚試試讓螢幕先「下班」一小時",
    body: "## 本期一句話\n\n睡前一小時，讓螢幕比孩子先去睡。\n\n## 主題\n\n四歲的小安睡前抱著平板喊：「再一集就好！」平板關了，他到十點還睜著眼。\n\n日本大阪大學問了 4,273 位小學生家長。家裡有「睡前一小時不碰 3C」、「固定時間上床」這兩條規則的孩子，平常日睡得比較久，週末也比較少補眠。\n\n先說清楚：這是家長填問卷看到的「有關」，不能證明「關螢幕就一定睡更好」。也可能是本來作息就很規律的家庭，本來就比較早關螢幕。所以別緊張，重點是把「睡前那一段」固定下來就好。\n\n<b>3–4 歲</b> 一天約需 10–13 小時睡眠（含午睡），睡前的小儀式越短、越固定越好。\n\n<b>5–7 歲</b> 6 歲起約需 9–12 小時，可以讓孩子一起訂規則。\n\n## 今晚就能試\n\n<callout icon=\"🧺\" color=\"blue_bg\">\n<b>活動名：</b> 螢幕下班儀式\n\n<b>需時：</b> 約 5 分鐘（睡前一小時開始）\n\n<b>材料：</b> 平板或遙控器、一個小籃子當「螢幕的床」\n\n<b>適合年齡：</b> 3–7 歲\n\n1. 睡前一小時先預告：「再 10 分鐘，平板要下班囉。」\n2. 時間到，請孩子親手把平板放進「螢幕的床」，跟它說晚安。\n3. 接著進入固定儀式：洗澡、刷牙、一個故事，或一段不看畫面的故事音檔。\n\n<b>家長可照唸：</b>「平板今天也工作很久了，我們送它去睡覺，換我們一起聽故事。」\n</callout>\n\n## 來源\n\n- [大阪大學研究新聞稿](https://resou.osaka-u.ac.jp/ja/research/2026/20260619_2)（論文刊於 [Sleep Medicine](https://doi.org/10.1016/j.sleep.2026.109054)）：日本小學生家長大調查，睡前限 3C、固定就寢與睡得較長有關。\n- [BMC Public Health 澳洲調查](https://link.springer.com/article/10.1186/s12889-026-27580-1)：傍晚使用和平板手機使用，與幼兒夜眠較短有關。\n- [Frontiers in Sleep 研究](https://www.frontiersin.org/journals/sleep/articles/10.3389/frsle.2026.1783027/full)：3–5 歲孩子越早關電視，睡得越長。\n- [JAMA Pediatrics 統合分析摘要](https://read.qxmd.com/read/41770550/within-person-association-between-daily-screen-use-and-sleep-in-youth-a-systematic-review-and-meta-analysis)：偶爾多看影響小，上床後使用較傷睡眠感受。\n- [英國政府 5 歲以下螢幕指引](https://beststartinlife.gov.uk/screen-time-under-5s/)：睡前一小時避免螢幕，改讀故事。\n- [美國兒科醫學會：孩子需要睡多久](https://www.healthychildren.org/English/healthy-living/sleep/Pages/healthy-sleep-habits-how-many-hours-does-your-child-need.aspx)：各年齡的睡眠時數，以及睡前關螢幕的建議。\n- [國健署健康九九](https://health99.hpa.gov.tw/article/18640)：睡前不碰 3C、建立睡眠儀式。\n- [衛福部新聞稿](https://dep.mohw.gov.tw/pro/cp-2731-44097-120.html)：幼兒園孩子九點前就寢、2 歲以上每天螢幕不超過 1 小時。\n",
  },
  {
    slug: "2026-10-13",
    title: "🛝 出門玩一下：學齡前每週多出門玩一天，和孩子到 8 歲前情緒比較穩有關",
    publishedAt: "2026-10-13",
    description:
      "孩子下課只想窩著看平板？每週多出門玩一天，今晚 10 分鐘就能開始",
    body: "## 本期一句話\n\n每週多出門玩一天，孩子的心情多一份底氣。\n\n## 主題\n\n五歲的小禾放學只想看卡通。硬被拉出門，結果繞著溜滑梯跑了二十分鐘，回家心情反而超好。\n\n2026 年 6 月，英國艾希特大學在《兒童心理學與精神醫學期刊》發表研究，跟著蘇格蘭 4,151 位孩子看了好幾年。學齡前，每週多出門玩一天，孩子一路「情緒穩、比較少焦慮或衝動」的機會，就多了約 6% 到 14%。\n\n先說清楚：這是家長自己回報、跟著孩子看好幾年的研究，只能說「有關」，不能證明出門玩就一定讓孩子情緒更好。也可能是孩子本來就活潑、家長也比較有空，才比較常出門。不過出門玩幾乎沒有壞處，試試看吧。\n\n<b>3–4 歲</b> 散步、撿葉子、追泡泡就很夠，重點是「出去」。\n\n<b>5–7 歲</b> 可以加入跑跳、爬攀爬架、騎滑步車，讓孩子自己決定怎麼玩。\n\n## 今晚就能試\n\n<callout icon=\"🧭\" color=\"blue_bg\">\n<b>活動名：</b> 晚餐前 10 分鐘「巷口探險」\n\n<b>需時：</b> 10 分鐘\n\n<b>材料：</b> 一雙好走的鞋、一個小袋子\n\n<b>適合年齡：</b> 3–7 歲\n\n1. 出門前說好：「今天要找三樣東西：一片葉子、一台車、一個圓圓的東西。」\n2. 讓孩子帶路，大人跟在後面，只要注意車子就好。\n3. 回家後把袋子裡的寶貝擺出來，請孩子說說是在哪裡找到的。\n\n<b>家長可照唸：</b>「今天你是探險隊長，我跟著你走，你看到什麼都告訴我。」\n</callout>\n\n## 來源\n\n- [艾希特大學新聞稿](https://news.exeter.ac.uk/faculty-of-health-and-life-sciences/more-outdoor-play-during-preschool-years-linked-to-better-mental-health-later-in-childhood/)（論文：[Journal of Child Psychology and Psychiatry](https://doi.org/10.1111/jcpp.70175)）：蘇格蘭 4,151 位孩子，學齡前常出門玩，和 8 歲前情緒較穩有關。\n- [JAMA Pediatrics 日本濱松世代研究](https://jamanetwork.com/journals/jamapediatrics/fullarticle/2800738)：常到戶外玩，和螢幕帶來的生活自理落差較小有關。\n- [國健署：您的孩子今天運動了嗎？](https://www.hpa.gov.tw/Pages/Detail.aspx?nodeid=571&pid=14174)：3–5 歲每天三小時以上身體活動、螢幕不超過 1 小時。\n- [日本文部科學省 幼兒期運動指針](https://www.mext.go.jp/a_menu/sports/undousisin/1319771.htm)：3–6 歲每天合計 60 分鐘以上開心地動。\n",
  },
  {
    slug: "2026-10-16",
    title: "📱 陪玩時大人手機先進車庫：漏接孩子的訊號，和語言發展有關",
    publishedAt: "2026-10-16",
    description:
      "陪玩時總滑手機？今晚 15 分鐘，把大人手機先「進車庫」",
    body: "## 本期一句話\n\n陪玩時手機先放下，孩子的話才聽得見。\n\n## 主題\n\n四歲的小安喊：「媽媽看這個！」媽媽正在回訊息，過了兩秒才抬頭說「好棒。」\n\n2026 年 10 月，《JAMA Pediatrics》線上發表加拿大卡爾加里大學團隊的觀察研究。家長滑手機、看智慧手錶的那幾秒，容易漏接孩子的眼神、聲音或手勢，漏接的風險大約是平常的六倍。\n\n先說清楚：這份研究只能說兩件事「有關」，不能說是「因果」。也可能是本來就比較忙、壓力比較大的家長，手機才用得比較久；孩子說話的發展，也還受很多其他事影響。偶爾看一下手機，不會決定孩子的未來。研究要提醒的是：陪玩、吃飯、一起看書時，一直被螢幕打斷。\n\n<b>3–4 歲</b> 孩子還常靠眼神和短句找你，在地板上陪玩時，把手機放到視線外最有感。\n\n<b>5–7 歲</b> 可以一起訂「車庫時間」：這 15 分鐘大人也不滑，孩子比較願意配合。\n\n## 今晚就能試\n\n<callout icon=\"🚗\" color=\"blue_bg\">\n<b>活動名：</b> 手機進車庫・地板 15 分鐘\n\n<b>需時：</b> 15 分鐘\n\n<b>材料：</b> 大人的手機一支、兩個孩子喜歡的玩具或一本圖畫書\n\n<b>適合年齡：</b> 3–7 歲\n\n1. 開始前把手機靜音，放到另一個房間（或廚房抽屜），跟孩子說：「接下來 15 分鐘，手機去車庫休息。」\n2. 坐到孩子旁邊跟著他玩，他指什麼、說什麼，你就接一句、問一句。\n3. 時間到，一起把手機「開出來」，誇誇他：「剛才你都有告訴我你在做什麼。」\n\n<b>家長可照唸：</b>「這 15 分鐘手機去車庫，我的眼睛只看你。」\n</callout>\n\n## 來源\n\n- [JAMA Pediatrics：家長用科技與漏接孩子溝通訊號](https://jamanetwork.com/journals/jamapediatrics/fullarticle/2854872)（作者解說：[The Conversation](https://theconversation.com/how-technoference-can-disrupt-parent-child-connections-292863)）：13–18 個月親子遊戲時，家長滑裝置和漏接訊號、語言回報較弱有關。\n- [日本 JECS：母親陪孩子時用數位媒體與兩歲發展](https://www.nature.com/articles/s41598-025-87430-9)：3,786 對親子，陪在身邊時每天用一小時以上，和語言社會發展較低有關。\n- [哈佛兒童發展中心：發球與回擊](https://developingchild.harvard.edu/key-concept/serve-and-return/)：孩子發出訊號、大人回應的一來一往，幫語言與社會能力打底。\n- [衛福部保護服務司：3C 時代父母要注意的事](https://dep.mohw.gov.tw/DOPS/fp-1246-76598-105.html)：別讓 3C 取代用心陪伴。\n",
  },
  {
    slug: "2026-10-20",
    title: "📖 故事一直講下去：共讀貴在持續，邊講邊聊更加分",
    publishedAt: "2026-10-20",
    description:
      "孩子快上小學才開始講故事，來得及嗎？今晚 10 分鐘，三個問題讓故事變聊天",
    body: "## 本期一句話\n\n故事不怕晚開始，只怕太早停下來。\n\n## 主題\n\n五歲的阿哲抱著車車繪本喊：「再講一次！」爸爸心裡卻有點擔心：我們去年才開始講故事，是不是太晚了？\n\n2026 年 8 月，東京科學大學在《Pediatric Research》發表研究，看了 2,609 位小一生（6–7 歲）。結果是：「講了幾年」比「幾歲開始講」更重要。講的年數一樣的話，早一點或晚一點開始，看不出什麼差別。\n\n先說清楚：東京這份研究是請家長回頭想以前的事，而且只看了一個時間點，只能說「有關」，不能證明是講故事帶來這些差別。也可能是孩子本來就比較穩、愛聽故事，家長才容易一直講下去。而且參加的家庭，收入和教育程度都偏高。邊讀邊聊的那些實驗，大多是老師或研究人員帶的；拿來用在家裡聽 podcast，是我們自己延伸的想法。\n\n<b>3–4 歲</b> 問題短一點，指著圖問：「這是誰？他在做什麼？」答不出來沒關係，大人先示範一次。\n\n<b>5–7 歲</b> 多問「為什麼」「後來會怎樣」，再請孩子當主講，把故事講一遍給你聽。\n\n## 今晚就能試\n\n<callout icon=\"🚗\" color=\"blue_bg\">\n<b>活動名：</b> 睡前三問故事時間\n\n<b>需時：</b> 10 分鐘\n\n<b>材料：</b> 一本孩子喜歡的繪本，或一集車車故事\n\n<b>適合年齡：</b> 3–7 歲\n\n1. 讀完或聽完一段就停一下，問：「剛剛發生什麼事？」\n2. 再問：「他為什麼要這樣做？」孩子答多答少，你都接一句、補一點。\n3. 最後問：「如果是你，你會怎麼辦？」然後就去睡，不用每題都答對。\n\n<b>家長可照唸：</b>「今天你來當故事的司機，告訴我故事接下來要開去哪裡？」\n</callout>\n\n## 來源\n\n- [東京科學大學新聞稿](https://www.isct.ac.jp/ja/news/s45mhijnswdi)（論文：[Pediatric Research](https://doi.org/10.1038/s41390-026-05397-3)）：2,609 位小一生，學齡前講故事持續越久，和調適力、行為與閱讀習慣較好有關。\n- [Frontiers in Education 對話式共讀統合分析](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2026.1817388/full)：16 項實驗，邊讀邊問能提升 3–5 歲孩子說故事、講因果的能力。\n- [國健署：親子共讀分齡秘笈（1–5 歲）](https://www.hpa.gov.tw/Pages/Detail.aspx?nodeid=870&pid=13574)：3–5 歲建議用對話式共讀討論情節。\n- [國健署：親子共讀 這樣做就對了](https://www.hpa.gov.tw/Pages/Detail.aspx?nodeid=4306&pid=14270)：共讀不必很長，3–5 分鐘也可以，每週 2–3 次也行。\n",
  },
  {
    slug: "2026-10-23",
    title: "🚦 「車車要轉彎囉」：孩子邊玩邊自言自語，是在練習管好自己",
    publishedAt: "2026-10-23",
    description:
      "孩子玩車一直自言自語，要叫他安靜嗎？今晚 5 分鐘紅綠燈遊戲，陪他把話放進腦袋",
    body: "## 本期一句話\n\n孩子的自言自語，是腦袋裡的方向盤。\n\n## 主題\n\n四歲的小安趴在地上排車車，嘴巴一直沒停：「紅燈，停！好，綠燈了，衝！」<br />2026 年 9 月，京都大學、筑波大學等團隊在《Acta Psychologica》發表研究，請 58 位 3–6 歲孩子從 1 數到 5。結果發現，要不出聲、只在腦袋裡數完，大概要到 5 歲左右；3、4 歲的孩子還需要說出來。<br />先說清楚：這份研究的孩子人數不多，只能說「有關」，不能證明多講話就會更能管好自己。每個孩子差很多，不愛出聲也不代表落後。<br /><b>3–4 歲</b> 出聲自言自語很正常，不用糾正。可以給他一句說給自己聽的話，像洗手時唸「先沖水、抹肥皂、搓搓搓」。<br /><b>5–7 歲</b> 慢慢會變成小聲嘀咕，或在心裡想；需要專心時，可以提醒他「在心裡跟自己說」。\n\n## 今晚就能試\n\n<callout icon=\"🚦\" color=\"blue_bg\">\n<b>活動名：</b> 腦袋裡的紅綠燈<br /><b>需時：</b> 5 分鐘<br /><b>材料：</b> 一台玩具車（沒有也行，用手當車）<br /><b>適合年齡：</b> 3–7 歲\n\n1. 大人喊「紅燈」，孩子停車，大聲數「1、2、3、4、5」再出發。\n2. 改喊「黃燈」：嘴巴閉起來，在心裡數到 5 再出發（3–4 歲小聲數也可以）。\n3. 換孩子當交通警察喊燈號，你來開車。<br /><b>家長可照唸：</b>「把要做的事說給自己聽，你的腦袋就是方向盤。」\n</callout>\n\n## 來源\n\n- [筑波大學新聞稿：從 1 數到 5 測量幼兒「腦中的話」](https://www.tsukuba.ac.jp/journal/medicine-health/20260909140000.html)（論文：[Acta Psychologica](https://doi.org/10.1016/j.actpsy.2026.107716)）：58 位 3–6 歲孩子，在心裡數數約 5 歲變穩定。\n- [Cognitive Development 2021：學齡前孩子的自言自語內容](https://www.sciencedirect.com/science/article/abs/pii/S0885201421001118)：71 位 3–5 歲孩子，邊拼積木邊說計畫的孩子拼得較準。\n- [Journal of Child and Family Studies 2023：自言自語與自我調節](https://link.springer.com/article/10.1007/s10826-023-02685-y)：122 位學齡前孩子，自言自語和等待、卡關時的自我控制有關。\n- [芝麻街工作坊：We Have Self Control](https://sesameworkshop.org/resources/we-have-self-control/)：建議在日常例行中給孩子一句說給自己聽的話。\n- [國健署：兒童發展篩檢量表](https://www.hpa.gov.tw/Pages/List.aspx?nodeid=4821)：3–4、4–5、5–7 歲分齡量表可下載。\n",
  },
  {
    slug: "2026-10-28",
    title: "⏱️ 「你已經試了 20 秒囉」：陪在旁邊說出孩子努力多久，他更願意再撐一下",
    publishedAt: "2026-10-28",
    description:
      "孩子卡關就喊「我不會」？今晚 5 分鐘「計時小幫手」遊戲，陪他多撐一下",
    body: "## 本期一句話\n\n陪在旁邊說「你已經試了 20 秒」，孩子更敢再試。\n\n## 主題\n\n孩子卡關喊「我不會啦！」的時候，先別急著出手。坐到他旁邊，說一句「你已經試了 20 秒囉」。<br />大阪大學石川萌子、鹿子木康弘等研究團隊在《Child Development》發表研究。他們讓 4–5 歲孩子試著打開一個很難開的木箱。旁邊的機器人每隔一陣子報一次「20 秒了喔」，孩子就會試比較久。換成大人來報，效果也差不多。但如果只是電腦喇叭放同樣的聲音，就沒用。<br />先說清楚：這是在實驗室裡做的短短小任務，箱子其實根本打不開。研究看的是孩子「當下願意試多久」，不能證明在家這樣說，孩子以後就會更有毅力。如果孩子常常一卡關就大爆炸，可以找兒科醫師或老師聊聊。<br /><b>3–4 歲</b> 撐 10、20 秒就很了不起，時間短一點、事情簡單一點。<br /><b>5–7 歲</b> 可以挑稍難的任務，也讓他知道：試過了再開口求救，完全沒問題。\n\n## 今晚就能試\n\n<callout icon=\"⏱️\" color=\"blue_bg\">\n<b>活動名：</b> 計時小幫手<br /><b>需時：</b> 5 分鐘<br /><b>材料：</b> 一件孩子覺得有點難的事（拼圖、接軌道、扣釦子都可以）<br /><b>適合年齡：</b> 3–7 歲\n\n1. 坐在孩子旁邊，先不急著出手幫忙。\n2. 每過一會兒，用平常的語氣說出他努力了多久：「10 秒了」「20 秒了」。\n3. 他想停或求救時，先說「你剛剛試了 30 秒耶」，再問：「要再試一次，還是要我幫一點點？」<br /><b>家長可照唸：</b>「你已經試了好久，我都看到了。」\n</callout>\n\n## 來源\n\n- [大阪大學新聞稿：機器人的聲音能提高幼兒的堅持](https://resou.osaka-u.ac.jp/ja/research/2026/20260715_1)（論文：[Child Development](https://doi.org/10.1093/chidev/aacag125)）：4–5 歲孩子在旁有人或機器人報時間時，試得比較久；電腦播音沒效果。\n- [MIT 新聞：寶寶看大人努力後，自己也會更努力](https://news.mit.edu/2017/babies-try-harder-seeing-adults-0921)（論文：[Science 2017](https://www.science.org/doi/10.1126/science.aan2317)）：15 個月大的寶寶看過大人各努力約 30 秒才成功，之後按按鈕的次數將近多一倍。\n",
  },
];
