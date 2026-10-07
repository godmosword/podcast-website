/** 繪本著色兩段式流程：封面 → 選圖 → 畫布。 */

export type ColoringStage = "cover" | "picker" | "canvas";

export const COLORING_COVER_CTA = "打開著色本";
export const COLORING_PICKER_LEAD = "選一頁來塗";
export const COLORING_PICKER_CHARACTERS = "車車朋友";
export const COLORING_PICKER_SCENES = "故事畫面";
export const COLORING_DONE_CTA = "我塗好了";
export const COLORING_GALLERY_HEADING = "我的作品";
/** 還沒動筆：先讓孩子塗到一塊顏色。 */
export const COLORING_HINT_DRAW = "點一個顏色，用蠟筆在圖上塗塗看";
/** 已經有顏色、還沒用過填滿。 */
export const COLORING_HINT_FILL = "再點「填滿」，點一下塗滿一整塊";
/** 參考彩圖卡。 */
export const COLORING_REFERENCE_TITLE = "照著塗";
export const COLORING_REFERENCE_CAPTION = "點彩圖上的顏色，蠟筆就換成一樣的顏色。也可以塗成你喜歡的樣子！";
export const COLORING_REFERENCE_PEEK = "放大看彩圖";
export const COLORING_REFERENCE_PEEK_HINT = "點一個顏色，就用它來塗";
