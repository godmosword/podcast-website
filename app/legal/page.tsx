import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { CONTACT_EMAIL } from "@/lib/contact";
import {
  LEGAL_POLICY_UPDATED_AT,
  LEGAL_POLICY_VERSION,
} from "@/lib/legal-policy";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "版權、隱私與使用條款",
  description:
    "車車遊樂園官方網站的智慧財產權、隱私資料治理、兒少保護、第三方服務與使用條款。",
  alternates: { canonical: "/legal" },
};

export default function LegalPage() {
  return (
    <>
      <main className={styles.main}>
        <Link href="/" className={styles.back}>
          ← 回故事屋
        </Link>

        <h1 className={styles.title}>版權、隱私與使用條款</h1>
        <p className={styles.updated}>
          最後更新：{LEGAL_POLICY_UPDATED_AT} · 政策版本：{LEGAL_POLICY_VERSION}
        </p>
        <nav className={styles.toc} aria-label="本頁章節">
          <a href="#copyright">智慧財產權</a>
          <a href="#takedown">侵權通知</a>
          <a href="#privacy">隱私說明</a>
          <a href="#children">兒少與家長</a>
          <a href="#contact">聯絡</a>
        </nav>

        <p className={styles.notice}>
          本頁是網站政策摘要，不取代個別法律意見；如適用法域有強制規定，依該等規定辦理。
        </p>

        <section className={styles.section} id="nature">
          <h2 className={styles.heading}>網站性質</h2>
          <p className={styles.text}>
            本網站為 Bonbon &amp; 馬米親子 Podcast
            《車車遊樂園》的「看圖聽故事」官方輔助網站，提供節目介紹、插圖翻頁與語音播放體驗，並導流至各收聽平台與社群帳號。
          </p>
        </section>

        <section className={styles.section} id="copyright">
          <h2 className={styles.heading}>智慧財產權與節目內容</h2>
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
              網站<strong>程式碼</strong>於公開儲存庫依 MIT 授權；
              <strong>節目內容不在</strong>
              該授權範圍內，即使取得程式碼，亦<strong>不</strong>
              表示取得節目內容之使用授權。維護者於私人儲存庫內另備{" "}
              <code>LICENSE</code>、<code>DISCLAIMER.md</code> 全文。
            </li>
          </ul>
        </section>

        <section className={styles.section} id="permission">
          <h2 className={styles.heading}>可接受的分享方式</h2>
          <ul className={styles.list}>
            <li>
              家庭可在本站或官方收聽平台進行個人、非商業的收聽與共讀；分享本站連結、官方分享按鈕或短摘錄評論時，請保留「車車遊樂園」與原始頁面連結。
            </li>
            <li>
              不得下載、抓取、批量複製、重新上傳、改作、出售、訓練資料集收錄或以任何方式讓第三方誤認為獲得官方授權；不得移除著作權、商標或來源標示。
            </li>
            <li>
              自動化取用以本站 <code>robots.txt</code>、<code>llms.txt</code> 與本頁為準；檢索型摘要僅限必要的短摘錄並附來源，訓練型資料集不獲授權。
            </li>
          </ul>
        </section>

        <section className={styles.section} id="takedown">
          <h2 className={styles.heading}>侵權通知與處理</h2>
          <p className={styles.text}>
            如果您是權利人或經授權的代理人，認為本站頁面、音檔、圖片、字幕或文案侵害權利，請寄信至{" "}
            <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("侵權通知｜車車遊樂園")}`}>
              {CONTACT_EMAIL}
            </a>
            ，主旨請寫「侵權通知｜車車遊樂園」，並提供以下資料：
          </p>
          <ol className={styles.list}>
            <li>您的姓名、聯絡方式，以及權利人身分或代理資格。</li>
            <li>被主張侵權作品的名稱、權利證明或可供核對的原始連結。</li>
            <li>本站疑似侵權內容的完整 URL、檔案或頁面位置，以及具體侵權說明。</li>
            <li>您確認通知內容真實、完整，並願意配合必要查證的聲明。</li>
          </ol>
          <p className={styles.text}>
            我們會記錄案件、核對權利與來源；在查證期間，得暫停相關頁面或素材的公開提供。若您不是權利人，請勿提交他人的個人資料或偽造權利聲明。
          </p>
        </section>

        <section className={styles.section} id="submissions">
          <h2 className={styles.heading}>許願、建議與投稿內容</h2>
          <ul className={styles.list}>
            <li>
              樂園地圖的許願與故事建議僅供節目製作、需求統計與開幕通知；不會直接公開留言，也不保證採用、回覆或提供報酬。
            </li>
            <li>
              請只提交您有權提供的文字，勿貼上孩子姓名、電話、地址、學校、照片、聲音或其他可識別資料，也勿貼上第三方受著作權保護的完整作品。
            </li>
            <li>
              若未來希望公開使用某則投稿或將其改編為節目，我們會另行取得必要的授權或同意；單純送出許願不代表本站取得公開發表的完整授權。
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
              Email 或暱稱、許願留言內容，儲存於本站資料庫。這些資料<strong>僅用於</strong>
              園區開幕通知與需求統計，<strong>不</strong>與第三方分享、
              <strong>不</strong>用於行銷。表單須由<strong>家長或照顧者</strong>
              填寫並勾選同意後才會送出；未勾選同意者不予收件。
            </li>
            <li>
              <strong>新集 Email 名單</strong>：若您使用訂閱表單，本站會先將 Email 暫存為待確認狀態，並寄出一次性確認連結，<strong>只用來驗證信箱</strong>。完成點擊後才會加入名單。確認連結 24 小時後失效。目前尚未寄發新集上線通知或電子報；開通後才會使用這份名單。未確認的資料不會用來寄信。
            </li>
            <li>
              <strong>保留與刪除</strong>：許願資料保留至通知目的完成（對應園區上線後 90
              天內刪除）。家長可隨時來信{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
              要求查詢、更正或刪除所提供的資料，我們將於收到請求後 30 天內處理。
            </li>
            <li>
              <strong>IP 位址</strong>：送出表單時，本站僅將您的 IP
              位址暫時用於防濫用之速率限制，本站應用程式不將 IP 或瀏覽器 user-agent 寫入內容資料庫；託管服務的基礎設施紀錄則依其政策管理。
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
              點選收聽平台等外連將離開本站，各平台依其隱私政策處理資料。家長可透過瀏覽器清除網站資料，刪除本機{" "}
              <code>localStorage</code> 中的偏好紀錄。
            </li>
            <li>
              製作團隊後台（<code>/studio</code>）可讀取<strong>同一台裝置</strong>
              的本機互動摘要，僅供內部驗收，非全站統計報表。
            </li>
            <li>
              <strong>同意留痕</strong>：每次表單送出會以伺服器時間記錄家長同意的政策版本，僅用於證明告知版本與資料治理；不會因此建立使用者帳號或跨裝置識別。
            </li>
          </ul>
        </section>

        <section className={styles.section} id="providers">
          <h2 className={styles.heading}>第三方服務與資料處理者</h2>
          <ul className={styles.list}>
            <li>
              網站託管、網站分析與部署可能使用 Vercel；匿名頁面瀏覽與事件依 Vercel Web Analytics 服務處理。
            </li>
            <li>
              若環境設定啟用許願或訂閱功能，資料庫可能使用 Neon Postgres；新集通知確認信可能使用 Resend。它們只接收完成該功能所必要的資料，並依各自政策與合約處理。
            </li>
            <li>
              Apple Podcasts、Spotify、KKBOX、YouTube、LINE、Instagram、Threads、Facebook 等外部平台由其自身控制資料處理；本站不替其隱私政策或內容負責。
            </li>
          </ul>
        </section>

        <section className={styles.section} id="children">
          <h2 className={styles.heading}>兒少與家長使用</h2>
          <ul className={styles.list}>
            <li>
              本站提供親子共讀內容，但不建立兒童帳號、不要求孩子直接提供個人資料，也不在播放器中放置個人化廣告追蹤。
            </li>
            <li>
              許願與 Email 訂閱表單只接受家長或照顧者勾選同意；請由成人代為填寫，並避免在自由文字中留下孩子的個資。
            </li>
            <li>
              若家長發現孩子的資料被提交，或希望查詢、更正、刪除相關資料，請寄信至{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>；我們會核對必要資訊後處理請求。
            </li>
          </ul>
        </section>

        <section className={styles.section} id="security">
          <h2 className={styles.heading}>安全與政策變更</h2>
          <p className={styles.text}>
            本站採取資料最小化、速率限制、一次性確認連結、伺服器端輸入驗證與安全標頭等措施；任何網路傳輸都不能保證絕對安全。若資料用途、第三方服務或保存期間變更，我們會更新本頁版本與日期；重大變更會在相關表單入口提醒重新閱讀。
          </p>
        </section>

        <section className={styles.section} id="disclaimer">
          <h2 className={styles.heading}>網站免責</h2>
          <p className={styles.text}>
            本網站與其程式碼依現狀（as is）提供，不提供任何明示或默示之保證。因使用或無法使用本網站所生之任何直接、間接或衍生損害，在法律允許範圍內，營運者與開發貢獻者不負賠償責任。節目摘要、字幕與建議年齡僅供親子共讀參考，不構成教育、醫療、發展或其他專業意見。營運者保留隨時調整內容、連結、功能與本聲明之權利。
          </p>
        </section>

        <section className={styles.section} id="contact">
          <h2 className={styles.heading}>聯絡</h2>
          <p className={styles.text}>
            若您為權利人，認為本網站內容有侵權或需更正之處；或您為家長，欲查詢、更正或刪除您提供的資料，請來信{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            ，並在主旨註明「版權／隱私請求」。我們會在合理期間內回覆；如需驗證身分，只會要求處理該請求所必要的資訊。
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
