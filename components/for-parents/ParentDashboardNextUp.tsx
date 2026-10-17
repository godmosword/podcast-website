import Link from "next/link";
import { formatActivityDate } from "@/lib/for-parents/dashboard";
import type {
  NextUp,
  NextUpPrimary,
  NextUpReason,
  NextUpRow,
} from "@/lib/for-parents/dashboard-next-up";
import Icon from "@/components/ui/Icon";
import styles from "./parent-dashboard.module.css";

const PRIMARY_LABEL: Record<NextUpPrimary["kind"], string> = {
  resume: "上次聽到",
  latest: "最新一集",
  recommended: "推薦這一集",
};

const PRIMARY_CTA: Record<NextUpPrimary["kind"], string> = {
  resume: "繼續聽",
  latest: "聽最新一集",
  recommended: "去聽這一集",
};

/** 「還沒聽」不加標籤：新裝置上每一集都是，標了等於沒標。 */
const REASON_LABEL: Record<NextUpReason, string | null> = {
  "in-progress": "聽到一半",
  favorite: "已收藏",
  latest: "最新一集",
  "not-started": null,
};

function primaryMeta(primary: NextUpPrimary): string {
  const parts = [`EP ${primary.ep}`];
  if (primary.page != null) parts.push(`第 ${primary.page} 頁`);
  if (primary.lastDate) parts.push(formatActivityDate(primary.lastDate));
  if (primary.kind !== "resume" && primary.tagline) parts.push(primary.tagline);
  return parts.join(" · ");
}

function rowDetail(row: NextUpRow): string {
  if (row.reason === "in-progress" && row.lastDate) {
    return formatActivityDate(row.lastDate);
  }
  return row.tagline ?? "";
}

/** 接著聽：整頁唯一的實心按鈕（繼續聽／聽最新一集），下面最多 3 集建議。 */
export function ParentDashboardNextUp({ nextUp }: { nextUp: NextUp }) {
  const { primary, more, firstTime } = nextUp;

  return (
    <section className={styles.card} aria-labelledby="next-heading">
      <h2 id="next-heading" className={styles.cardTitle}>
        {firstTime ? "從這裡開始" : "接著聽"}
      </h2>

      {primary ? (
        <div className={styles.resume}>
          <p className={styles.resumeLabel}>{PRIMARY_LABEL[primary.kind]}</p>
          <p className={styles.resumeTitle}>{primary.title}</p>
          <p className={styles.resumeMeta}>{primaryMeta(primary)}</p>
          <Link
            href={primary.href}
            className={styles.ctaSolid}
            aria-label={`${PRIMARY_CTA[primary.kind]}：${primary.title}`}
          >
            {PRIMARY_CTA[primary.kind]}
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      ) : (
        <p className={styles.note}>每一集都聽完了，可以挑喜歡的再聽一次。</p>
      )}

      {more.length > 0 ? (
        <>
          <p className={styles.subTitle}>{firstTime ? "也很適合第一次聽" : "也可以聽"}</p>
          <ul className={styles.rows}>
            {more.map((row) => (
              <li key={row.slug}>
                <Link href={row.href} className={styles.row}>
                  <span className={styles.rowTitle}>{row.title}</span>
                  <span className={styles.rowMeta}>
                    {REASON_LABEL[row.reason] ? (
                      <span className={styles.pill}>{REASON_LABEL[row.reason]}</span>
                    ) : null}
                    {rowDetail(row)}
                  </span>
                  <span className={styles.rowEp}>EP {row.ep}</span>
                  <Icon name="chevron-right" size={16} className={styles.rowArrow} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
