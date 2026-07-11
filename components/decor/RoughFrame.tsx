import type { CSSProperties } from "react";
import decor from "./decor.module.css";

type RoughFrameProps = {
  /** 外框顏色，預設吃 currentColor（可傳 per-story color 或 accent 變數） */
  color?: string;
  /** 套用哪一個全域粗糙濾鏡（SvgDefs 定義 1~3） */
  rough?: 1 | 2 | 3;
  /** D7：輪替 #rough-1/2/3 濾鏡變體（非 path redraw） */
  shiftFilter?: boolean;
  /** 邊框粗細（px） */
  width?: number;
  /** 圓角，預設 var(--radius-xl) */
  radius?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * 手繪不規則外框。絕對定位覆蓋父層（父層需 position: relative），
 * 以 SVG feTurbulence 濾鏡讓直線邊框產生手繪抖動感。
 * 純裝飾、不攔截點擊。
 */
export default function RoughFrame({
  color = "currentColor",
  rough = 1,
  shiftFilter = false,
  width = 3,
  radius,
  className,
  style,
}: RoughFrameProps) {
  const shiftClass = shiftFilter ? decor.roughShift : "";
  const mergedClass = [decor.roughFrame, shiftClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      aria-hidden
      className={mergedClass}
      style={{
        color,
        borderWidth: `${width}px`,
        borderRadius: radius ?? "var(--radius-xl)",
        filter: shiftFilter ? undefined : `url(#rough-${rough})`,
        ...style,
      }}
    />
  );
}
