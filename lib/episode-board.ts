import rawBoard from "@/data/episode-board.json";
import {
  episodeBoardEntrySchema,
  episodeBoardFileSchema,
} from "@/data/episode-board.schema";
import { isSafeInternalHref } from "@/lib/episode-board-href";
import {
  isBoardActionId,
  isBoardCharacterId,
  type BoardActionId,
  type BoardCharacterId,
  type EpisodeBoardActor,
} from "@/lib/episode-board-types";

/** 畫面上同時出現的車車上限。再多，手機上的點擊範圍會疊在一起。 */
export const EPISODE_BOARD_ACTOR_LIMIT = 4;

const CHARACTER_NAME: Record<BoardCharacterId, string> = {
  "duo-duo": "恐龍車多多",
  "xiao-hong": "小紅賽車",
  "hui-hui": "小貨車灰灰",
  "dong-dong": "東東挖土機",
  "ling-ling": "鈴鈴清潔車",
  "an-an": "安安救護車",
  watt: "小機器人沃特",
};

const ACTION_LABEL: Record<BoardActionId, string> = {
  idle: "在小鎮裡休息",
  drive: "慢慢開車",
  "brush-teeth": "正在刷牙",
  "wait-light": "在紅綠燈前面停一停",
  "paint-self": "試著換成不同顏色，再變回自己",
  "transform-robot": "變成圓滾滾的機器人",
  dig: "正在挖土",
  sweep: "正在掃地",
};

export type EpisodeBoardDropReason =
  | "invalid"
  | "unknown-character"
  | "unsafe-href"
  | "duplicate-character"
  | "over-capacity";

export type EpisodeBoardDrop = {
  index: number;
  id?: string;
  reason: EpisodeBoardDropReason;
};

export type EpisodeBoardCoercion = {
  id: string;
  from: string;
  to: "idle";
};

export type EpisodeBoardModel = {
  actors: EpisodeBoardActor[];
  dropped: EpisodeBoardDrop[];
  coerced: EpisodeBoardCoercion[];
};

const EMPTY_MODEL: EpisodeBoardModel = {
  actors: [],
  dropped: [],
  coerced: [],
};

/**
 * 讀 `data/episode-board.json`。
 * 新增一集時把物件插到 `episodes` 最前面：第一筆有效資料就是「這一集」。
 * 缺欄位、不認得的角色、不是站內故事連結的那一筆會被略過。
 * 不認得的動作改成原地休息。整份檔壞掉時回傳空小鎮，不丟例外。
 */
export function loadEpisodeBoard(): EpisodeBoardModel {
  return parseEpisodeBoard(rawBoard);
}

export function parseEpisodeBoard(raw: unknown): EpisodeBoardModel {
  const file = episodeBoardFileSchema.safeParse(raw);
  if (!file.success) return EMPTY_MODEL;

  const actors: EpisodeBoardActor[] = [];
  const dropped: EpisodeBoardDrop[] = [];
  const coerced: EpisodeBoardCoercion[] = [];
  const seen = new Set<BoardCharacterId>();

  file.data.episodes.forEach((entry, index) => {
    const parsed = episodeBoardEntrySchema.safeParse(entry);
    if (!parsed.success) {
      dropped.push({ index, reason: "invalid" });
      return;
    }
    const row = parsed.data;
    if (!isBoardCharacterId(row.character)) {
      dropped.push({ index, id: row.id, reason: "unknown-character" });
      return;
    }
    if (!isSafeInternalHref(row.href)) {
      dropped.push({ index, id: row.id, reason: "unsafe-href" });
      return;
    }
    if (seen.has(row.character)) {
      dropped.push({ index, id: row.id, reason: "duplicate-character" });
      return;
    }
    if (actors.length >= EPISODE_BOARD_ACTOR_LIMIT) {
      dropped.push({ index, id: row.id, reason: "over-capacity" });
      return;
    }
    seen.add(row.character);
    let action: BoardActionId = "idle";
    if (isBoardActionId(row.action)) {
      action = row.action;
    } else {
      coerced.push({ id: row.id, from: row.action, to: "idle" });
    }
    actors.push({
      id: row.id,
      character: row.character,
      action,
      name: CHARACTER_NAME[row.character],
      actionLabel: ACTION_LABEL[action],
      title: row.title,
      summary: row.summary,
      href: row.href,
      featured: actors.length === 0,
    });
  });

  return { actors, dropped, coerced };
}
