import { GAMES } from "@/data/games";
import { getLifetimeStars } from "@/lib/gamekit/progress/economy";
import { nextGarageUnlock } from "@/lib/gamekit/progress/garage";
import type { PlayerProfile } from "@/lib/gamekit/types";

export type HubProgressSnapshot = {
  stars: number;
  playedCount: number;
  totalGames: number;
  playedSlugs: readonly string[];
  nextUnlock: { name: string; remaining: number } | null;
};

/**
 * Hub 低壓進度：星星／已玩幾款／下一輛車庫車。
 * coloringPlayed 來自本機著色草稿，不寫入 GameKit schema。
 */
export function hubProgressFromProfile(
  profile: PlayerProfile,
  coloringPlayed: boolean,
): HubProgressSnapshot {
  const stars = getLifetimeStars(profile);
  const playedSlugs: string[] = [];
  for (const game of GAMES) {
    if (game.slug === "coloring-book") {
      if (coloringPlayed) playedSlugs.push(game.slug);
      continue;
    }
    if (game.slug === "candy-match" && profile.gamesPlayed["candy-match"]) {
      playedSlugs.push(game.slug);
    }
    if (game.slug === "block-drop" && profile.gamesPlayed["block-drop"]) {
      playedSlugs.push(game.slug);
    }
  }
  return {
    stars,
    playedCount: playedSlugs.length,
    totalGames: GAMES.length,
    playedSlugs,
    nextUnlock: nextGarageUnlock(stars),
  };
}

export function hubProgressLabel(snap: HubProgressSnapshot): string {
  const parts = [`收集了 ${snap.stars} 顆星星`];
  if (snap.playedCount > 0) {
    parts.push(`玩過 ${snap.playedCount}/${snap.totalGames} 站`);
  }
  if (snap.nextUnlock) {
    parts.push(`再 ${snap.nextUnlock.remaining} 顆就能認識${snap.nextUnlock.name}`);
  }
  return parts.join(" · ");
}
