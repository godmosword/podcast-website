import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { CONTACT_EMAIL } from "@/lib/contact";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "使用條款與免責聲明",
  description:
    "車車遊樂園官方網站的版權說明、節目內容使用限制、第三方服務與字型授權。",
  alternates: { canonical: "/legal" },
};

export default function LegalPage() {
  return (
    <>
      <main className={styles.main}>
        <Link href="/" className={styles.back}>
          ← 回故事屋
        </Link>

        <h1 className={styles.title}>使用條款與免責聲明</h1>
        <p className={styles.updated}>最後更新：2026-07-05</p>

        <section className={styles.section} id="nature">
          <h2 className={styles.heading}>網站性質</h2>
          <p className={styles.text}>
            本網站為 Bonbon &amp; 馬米親子 podcast
            《車車遊樂園》的「看圖聽故事」官方輔助網站，提供節目介紹、插圖翻頁與語音播放體驗，並導流至各收聽平台與社群帳號。
          </p>
        </section>

        <section className={styles.section} id="copyright">
          <h2 className={styles.heading}>版權與節目內容</h2>
          <ul className={styles.list}>
            <li>
              節目音檔、插圖、封面、吉祥物、原創角色（如鈴鈴清潔車、恐龍車多多、亮亮警車等）、標題與相關文案，其著作權與商標權屬
              <strong> Bonbon &amp; 馬米</strong> 或原權利人所有（除非頁面另有標示）。
            </li>
            <li>
              「<strong>車車遊樂園</strong>」與「<strong>看圖聽故事</strong>」為 Bonbon &amp;
              馬米之品牌名稱，以未註冊商標（™）主張權利；未經書面同意不得使用於相同或近似之節目、商品或服務。
            </li>
            <li>
              <strong>未經權利人書面同意，禁止</strong>以本網站或儲存庫內之節目素材進行再製、公開傳輸、散布、販售，或暗示官方代言之商業用途。
            </li>
            <li>
              原始碼儲存庫為<strong>公開</strong>（MIT 授權程式碼）；即使取得程式碼，亦<strong>不</strong>表示取得節目內容之使用授權。
            </li>
            <li>
              網站<strong>程式碼</strong>依 MIT 授權；<strong>節目內容不在</strong>
              該授權範圍內。維護者於私人儲存庫內另備 <code>LICENSE</code>、
              <code>DISCLAIMER.md</code> 全文。
            </li>
          </ul>
        </section>

        <section className={styles.section} id="subtitles">
          <h2 className={styles.heading}>字幕與故事文案</h2>
          <p className={styles.text}>
            播放器上的即時字幕（或故事摘要）可能由本機轉錄或依節目大綱整理，<strong>非</strong>
            保證與實際語音逐字一致，僅供親子共讀輔助。
          </p>
        </section>

        <section className={styles.section} id="illustrations">
          <h2 className={styles.heading}>插圖與 AI 生圖</h2>
          <p className={styles.text}>
            部分劇情插圖由營運團隊以工具輔助產生；產出先進暫存目錄，維護者以{" "}
            <code>contact.html</code> 審圖清單<strong>逐張人工審稿</strong>
            ，通過後才發佈至網站。未通過審核之暫存圖不對外提供。
          </p>
        </section>

        <section className={styles.section} id="age">
          <h2 className={styles.heading}>建議年齡</h2>
          <p className={styles.text}>
            各集若顯示「建議年齡」（ageRange），僅供家長參考，不構成教育、醫療或發展評估之專業意見；請依孩子狀況自行判斷是否適合收聽。
          </p>
        </section>

        <section className={styles.section} id="trademarks">
          <h2 className={styles.heading}>第三方商標與連結</h2>
          <ul className={styles.list}>
            <li>
              Apple Podcasts、Spotify、KKBOX、YouTube、LINE、Instagram、Threads、Facebook
              等名稱與圖示為各權利人之商標；收聽平台使用官方提供之徽章／標誌檔（見站內{" "}
              <code>public/brand/</code>），僅作<strong>指示性連結</strong>
              （導向官方頁面），不代表與上述公司之合作或代言關係。
            </li>
            <li>
              點選連結將離開本網站；第三方服務之條款、隱私政策與內容由該平台負責。
            </li>
            <li>
              RSS（<code>/feed.xml</code>）供訂閱本網站彙整之節目資訊；完整收聽體驗仍以各平台與權利人公告為準。
            </li>
          </ul>
        </section>

        <section className={styles.section} id="fonts">
          <h2 className={styles.heading}>字型授權</h2>
          <ul className={styles.list}>
            <li>
              中文圓體：<a href="https://github.com/justfont/open-huninn-font">jf-open
              粉圓（huninn）</a> 之子集檔（SIL Open Font License 1.1）。完整條款見儲存庫{" "}
              <code>app/fonts/OFL-huninn.txt</code> 與{" "}
              <code>THIRD_PARTY_NOTICES.md</code>。
            </li>
            <li>
              拉丁字母與數字：<a href="https://fonts.google.com/specimen/Baloo+2">Baloo
              2</a>、<a href="https://fonts.google.com/specimen/Gochi+Hand">Gochi Hand</a>（SIL
              Open Font License，經 Google Fonts 自託管）。
            </li>
          </ul>
        </section>

        <section className={styles.section} id="privacy">
          <h2 className={styles.heading}>資料收集與隱私</h2>
          <ul className={styles.list}>
            <li>
              網站可能在瀏覽器 <code>localStorage</code>{" "}
              儲存收藏、繼續播放進度、遊戲最佳分數、完播紀錄與平台連結點擊次數等偏好。這些資料<strong>留在您的裝置上</strong>；本站無登入功能，不建立使用者帳號。
            </li>
            <li>
              <strong>許願／開幕通知表單</strong>：若您使用樂園地圖的許願表單，本站會收集您填寫的
              Email 或暱稱、許願留言內容，以及瀏覽器
              user-agent，儲存於本站資料庫。這些資料<strong>僅用於</strong>
              園區開幕通知與需求統計，<strong>不</strong>與第三方分享、
              <strong>不</strong>用於行銷。表單須由<strong>家長或照顧者</strong>
              填寫並勾選同意後才會送出；未勾選同意者不予收件。
            </li>
            <li>
              <strong>保留與刪除</strong>：許願資料保留至通知目的完成（對應園區上線後 90
              天內刪除）。家長可隨時來信{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
              要求查詢、更正或刪除所提供的資料，我們將於收到請求後 30 天內處理。
            </li>
            <li>
              <strong>IP 位址</strong>：送出表單時，本站僅將您的 IP
              位址用於防濫用之速率限制，<strong>不儲存</strong>於資料庫。
            </li>
            <li>
              為了解官網導流成效，本站使用{" "}
              <a href="https://vercel.com/docs/analytics">
                Vercel Web Analytics
              </a>
              收集<strong>匿名</strong>的頁面瀏覽與自訂事件（例如「點了哪個收聽平台」「聽完了哪一集」「隔了幾天回來」——只記集數編號與天數區間）。我們<strong>不</strong>
              收集孩子姓名、年齡或其他可識別個人身分的欄位；亦不在播放器內嵌入第三方廣告追蹤。
            </li>
            <li>
              點選 Spotify、Apple Podcasts、KKBOX、YouTube
              等外連將離開本站，各平台依其隱私政策處理資料。家長可透過瀏覽器清除網站資料，刪除本機{" "}
              <code>localStorage</code> 中的偏好紀錄。
            </li>
            <li>
              製作團隊後台（<code>/studio</code>）可讀取<strong>同一台裝置</strong>
              的本機互動摘要，僅供內部驗收，非全站統計報表。
            </li>
          </ul>
        </section>

        <section className={styles.section} id="disclaimer">
          <h2 className={styles.heading}>網站免責</h2>
          <p className={styles.text}>
            本網站與其程式碼依現狀（as is）提供，不提供任何明示或默示之保證。因使用或無法使用本網站所生之任何直接、間接或衍生損害，在法律允許範圍內，營運者與開發貢獻者不負賠償責任。營運者保留隨時調整內容、連結、功能與本聲明之權利。
          </p>
        </section>

        <section className={styles.section} id="contact">
          <h2 className={styles.heading}>聯絡</h2>
          <p className={styles.text}>
            若您為權利人，認為本網站內容有侵權或需更正之處；或您為家長，欲查詢、更正或刪除孩子相關資料，請來信{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            ，或透過節目官方社群或 podcast 平台與 Bonbon &amp; 馬米聯繫。
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
