/** 貼紙顯示名。存檔仍用 id；舊存檔退役遊戲的貼紙不收回。 */
export const STICKER_LABELS: Record<string, string> = {
  "played-block-drop": "玩過繽紛樂園",
  "played-candy-match": "玩過繽紛消消樂",
  // 已退役遊戲：舊存檔仍留著這些貼紙，孩子賺到的就不收回；
  // 少了 label 會在家長儀表板上顯示成生的英文 ID。
  "played-car-adventure": "玩過車車大冒險",
  "played-candy-kart": "玩過繽紛卡丁車",
  "played-snowboard": "玩過阿蹦雪山衝刺",
  "garage-5": "認識好多車車朋友",
  "medal-master": "三顆星達人",
};

export function stickerLabel(id: string): string {
  return STICKER_LABELS[id] ?? id;
}
