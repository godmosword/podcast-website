/**
 * 多多壽司屋貼紙存檔。
 * 寫在 cheche:progress 的 preferences.gameKit，跟消消樂的玩法記在同一層，
 * 不放進全站 profile.stickers（家長儀表板才不會多出 30 個 id）。
 * 收滿 30 張時，全站貼紙只加一張「多多貼紙書收集完成」。
 * 只會加上、不會收回：以前用 24 張換到的那張還留著。
 */

import { stickerLabel } from "@/lib/gamekit/progress/stickers";
import {
  getGameKitSettingsFromStore,
  loadGameProfileFromStore,
  saveGameKitSettingsToStore,
  saveGameProfileToStore,
} from "@/lib/progress-store";
import {
  DINO_SUSHI_STICKER_TOTAL,
  isDinoSushiStickerId,
  type DinoSushiStickerId,
} from "@/lib/games/dino-sushi/stickers";

/** 收滿貼紙書才寫進全站貼紙。家長儀表板用這個中文名。 */
export const DINO_SUSHI_BOOK_STICKER = "dino-sushi-sticker-book";

export type DinoSushiStickerState = {
  unlocked: DinoSushiStickerId[];
  seen: DinoSushiStickerId[];
  fresh: DinoSushiStickerId[];
  roundKey: string;
  gift: DinoSushiStickerId | "";
};

const EMPTY: DinoSushiStickerState = {
  unlocked: [],
  seen: [],
  fresh: [],
  roundKey: "",
  gift: "",
};

function keepKnown(ids: readonly string[], allowed?: ReadonlySet<string>): DinoSushiStickerId[] {
  const out: DinoSushiStickerId[] = [];
  for (const id of ids) {
    if (!isDinoSushiStickerId(id) || out.includes(id)) continue;
    if (allowed && !allowed.has(id)) continue;
    out.push(id);
  }
  return out;
}

export function loadDinoSushiStickers(): DinoSushiStickerState {
  if (typeof window === "undefined") return { ...EMPTY, unlocked: [], seen: [], fresh: [] };
  try {
    const stored = getGameKitSettingsFromStore();
    const unlocked = keepKnown(stored.dinoSushiStickers);
    const allowed = new Set(unlocked);
    const gift = isDinoSushiStickerId(stored.dinoSushiStickerGift) ? stored.dinoSushiStickerGift : "";
    return {
      unlocked,
      seen: keepKnown(stored.dinoSushiStickersSeen, allowed),
      fresh: keepKnown(stored.dinoSushiStickersFresh, allowed),
      roundKey: stored.dinoSushiStickerRoundKey,
      gift: gift && allowed.has(gift) ? gift : "",
    };
  } catch {
    return { ...EMPTY, unlocked: [], seen: [], fresh: [] };
  }
}

function awardBookIfComplete(unlocked: readonly string[]): void {
  if (unlocked.length < DINO_SUSHI_STICKER_TOTAL) return;
  const profile = loadGameProfileFromStore();
  if (profile.stickers.includes(DINO_SUSHI_BOOK_STICKER)) return;
  saveGameProfileToStore({
    ...profile,
    stickers: [...profile.stickers, DINO_SUSHI_BOOK_STICKER],
  });
}

export type DinoSushiStickerWrite = {
  ok: boolean;
  state: DinoSushiStickerState;
};

/**
 * 寫進 localStorage。失敗時 ok 為 false，state 仍是磁碟上的舊檔，
 * 呼叫端不要把這一輪算成已經存好。
 */
export function saveDinoSushiStickerState(next: DinoSushiStickerState): DinoSushiStickerWrite {
  if (typeof window === "undefined") return { ok: true, state: next };
  const unlocked = keepKnown(next.unlocked);
  const allowed = new Set(unlocked);
  const seen = keepKnown(next.seen, allowed);
  const fresh = keepKnown(next.fresh, allowed);
  const gift = next.gift && allowed.has(next.gift) ? next.gift : "";
  try {
    saveGameKitSettingsToStore({
      dinoSushiStickers: unlocked,
      dinoSushiStickersSeen: seen,
      dinoSushiStickersFresh: fresh,
      dinoSushiStickerRoundKey: next.roundKey,
      dinoSushiStickerGift: gift,
    });
    awardBookIfComplete(unlocked);
  } catch {
    return { ok: false, state: loadDinoSushiStickers() };
  }
  return { ok: true, state: loadDinoSushiStickers() };
}

/** 加上這幾張。已經有的略過，其他遊戲的進度不動。 */
export function addDinoSushiStickers(ids: readonly string[]): {
  state: DinoSushiStickerState;
  added: DinoSushiStickerId[];
  ok: boolean;
} {
  const current = loadDinoSushiStickers();
  const added = keepKnown(ids).filter((id) => !current.unlocked.includes(id));
  if (added.length === 0) return { state: current, added: [], ok: true };
  const saved = saveDinoSushiStickerState({
    ...current,
    unlocked: [...current.unlocked, ...added],
  });
  if (!saved.ok) return { state: current, added: [], ok: false };
  return { state: saved.state, added, ok: true };
}

export function markDinoSushiStickersSeen(): DinoSushiStickerState {
  const current = loadDinoSushiStickers();
  if (current.seen.length === current.unlocked.length) return current;
  const saved = saveDinoSushiStickerState({ ...current, seen: [...current.unlocked] });
  return saved.ok ? saved.state : current;
}

/** 給測試確認儀表板看得到中文名，不會露出英文 id。 */
export function dinoSushiBookStickerLabel(): string {
  return stickerLabel(DINO_SUSHI_BOOK_STICKER);
}
