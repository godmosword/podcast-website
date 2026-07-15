/** 繪本著色兩段式流程：封面 → 選圖 → 畫布。 */

export type ColoringStage = "cover" | "picker" | "canvas";

export const COLORING_COVER_CTA = "打開著色本";
export const COLORING_BACK_TO_COVER = "回封面";
export const COLORING_PICKER_LEAD = "選一頁來塗";

export function coloringShellShowsTitle(stage: ColoringStage): boolean {
  return stage !== "cover";
}
