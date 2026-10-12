import { useId } from "react";
import {
  BRAND_MARKS,
  BRAND_MARK_SIZE,
  brandMarkBox,
  type BrandMarkArt,
  type BrandMarkId,
} from "@/lib/brand-marks";
import styles from "./BrandMark.module.css";

type Props = {
  id: BrandMarkId;
  /**
   * `chip`：放在頁尾的純白章裡（日間用品牌標準色）。
   * `row`：和文字同一個可點容器，底不一定是純白（日間用黑色版）。
   * 夜間兩者都用深色底的白色版。
   */
  surface: "chip" | "row";
  className?: string;
};

function Art({
  art,
  width,
  height,
  uid,
  className,
}: {
  art: BrandMarkArt;
  width: number;
  height: number;
  uid: string;
  className?: string;
}) {
  if (art.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 各家官方品牌檔需原樣顯示，固定 30px 不走 next/image 轉檔
      <img
        src={art.src}
        alt=""
        width={width}
        height={height}
        className={className}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <svg
      viewBox={art.viewBox}
      width={width}
      height={height}
      className={className}
      focusable="false"
    >
      {art.render(uid)}
    </svg>
  );
}

/** 平台／社群標誌：官方檔原樣、依底色挑官方色版。可及名稱由外層連結提供。 */
export default function BrandMark({ id, surface, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const spec = BRAND_MARKS[id];
  const { width, height } = brandMarkBox(id, BRAND_MARK_SIZE);
  const day = spec.art[surface === "chip" ? "white" : "light"];
  const night = spec.art.dark;
  const wrapClass = [styles.mark, className].filter(Boolean).join(" ");

  return (
    <span className={wrapClass} aria-hidden="true" data-brand-mark={id}>
      {day === night ? (
        <Art art={day} width={width} height={height} uid={uid} />
      ) : (
        <>
          <Art art={day} width={width} height={height} uid={`${uid}d`} className={styles.day} />
          <Art art={night} width={width} height={height} uid={`${uid}n`} className={styles.night} />
        </>
      )}
    </span>
  );
}
