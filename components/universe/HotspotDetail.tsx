import type { Hotspot, Zone } from "@/data/universe";
import { hotspotActionHref } from "@/lib/universe/hotspot";
import styles from "./HotspotDetail.module.css";

type HotspotDetailProps = {
  zone: Zone;
  hotspot: Hotspot;
  /** 標題元素 id（a11y） */
  titleId: string;
};

/** 熱點詳情本體（Server 可渲染；modal／全頁共用）。 */
export default function HotspotDetail({
  zone,
  hotspot,
  titleId,
}: HotspotDetailProps) {
  const actionHref = hotspotActionHref(zone.id, hotspot);
  const action = hotspot.action;

  return (
    <div className={styles.body}>
      <p className={styles.eyebrow}>{zone.name}</p>
      <h2 id={titleId} className={styles.title} tabIndex={-1}>
        {hotspot.name}
      </h2>

      {action.type === "locked" ? (
        <>
          <p className={styles.hint}>{action.hint}</p>
          <p className={styles.coming}>敬請期待</p>
        </>
      ) : null}

      {action.type === "link" ? (
        <a
          className={styles.cta}
          href={actionHref}
          {...(/^https?:\/\//i.test(actionHref)
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          前往：{hotspot.name}
        </a>
      ) : null}

      {action.type === "story" ? (
        <a className={styles.cta} href={actionHref}>
          去聽這個故事
        </a>
      ) : null}
    </div>
  );
}
