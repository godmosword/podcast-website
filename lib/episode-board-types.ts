/** 角色看板認得的車車。不在這份名單裡的 JSON 角色會被略過。 */
export const BOARD_CHARACTER_IDS = [
  "duo-duo",
  "xiao-hong",
  "hui-hui",
  "dong-dong",
  "diao-che",
  "ling-ling",
  "an-an",
  "lan-ba-shi",
  "monster-truck",
  "a-ku",
  "xiang-xiang",
  "watt",
] as const;

export type BoardCharacterId = (typeof BOARD_CHARACTER_IDS)[number];

/** 角色看板上做得出來的動作。不認得的動作會降成 idle，不丟掉那一集。 */
export const BOARD_ACTION_IDS = [
  "idle",
  "drive",
  "brush-teeth",
  "wait-light",
  "paint-self",
  "transform-robot",
  "dig",
  "lift",
  "sweep",
] as const;

export type BoardActionId = (typeof BOARD_ACTION_IDS)[number];

export type EpisodeBoardActor = {
  id: string;
  character: BoardCharacterId;
  action: BoardActionId;
  /** 給孩子看的角色名。 */
  name: string;
  /** 給讀屏與按鈕用的動作說明。 */
  actionLabel: string;
  title: string;
  summary: string;
  /** 站內集數頁或播放器，例如 /story/ep-35 或 /story/ep-35/play。 */
  href: string;
  /** 檔案裡第一筆有效集數。 */
  featured: boolean;
};

export function isBoardCharacterId(value: string): value is BoardCharacterId {
  return (BOARD_CHARACTER_IDS as readonly string[]).includes(value);
}

export function isBoardActionId(value: string): value is BoardActionId {
  return (BOARD_ACTION_IDS as readonly string[]).includes(value);
}
