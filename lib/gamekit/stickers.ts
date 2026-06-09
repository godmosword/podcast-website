/** 貼紙簿：玩遊戲與聽故事解鎖（Phase 6）。 */
export type StickerDef = {
  id: string;
  label: string;
  emoji: string;
  hint: string;
};

export const GAME_STICKERS: StickerDef[] = [
  { id: "played-car-adventure", label: "大冒險", emoji: "🏁", hint: "玩過車車大冒險" },
  { id: "played-block-drop", label: "繽紛方塊", emoji: "🧩", hint: "玩過繽紛方塊" },
  { id: "medal-master", label: "三星達人", emoji: "🏆", hint: "任一款遊戲拿滿 3 顆星" },
  { id: "garage-5", label: "車庫新手", emoji: "🅿️", hint: "車庫解鎖 3 台車" },
];

export function stickerDef(id: string): StickerDef | undefined {
  return GAME_STICKERS.find((s) => s.id === id);
}
