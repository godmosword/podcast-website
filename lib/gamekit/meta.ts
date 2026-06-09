import type { GameKitGameId } from "./types";
import { addStars, loadPlayerProfile, recordBestScore, savePlayerProfile } from "./save";

/** 跨遊戲星星經濟與解鎖（Phase 6 擴充）。 */
export class MetaProgress {
  private profile = loadPlayerProfile();

  get stars(): number {
    return this.profile.stars;
  }

  get unlockedVehicles(): string[] {
    return [...this.profile.unlockedVehicles];
  }

  bestScore(gameId: GameKitGameId): number {
    return this.profile.bests[gameId] ?? 0;
  }

  awardStars(amount: number): void {
    this.profile = addStars(this.profile, amount);
    savePlayerProfile(this.profile);
  }

  submitScore(gameId: GameKitGameId, score: number): boolean {
    const prev = this.bestScore(gameId);
    if (score <= prev) return false;
    this.profile = recordBestScore(this.profile, gameId, score);
    savePlayerProfile(this.profile);
    return true;
  }

  reload(): void {
    this.profile = loadPlayerProfile();
  }
}

/** 三星制：bit0=通關 bit1=無失誤 bit2=全收集。 */
export function medalFlags(cleared: boolean, flawless: boolean, collectedAll: boolean): number {
  return (cleared ? 1 : 0) | (flawless ? 2 : 0) | (collectedAll ? 4 : 0);
}

export function medalCount(flags: number): number {
  let n = 0;
  if (flags & 1) n += 1;
  if (flags & 2) n += 1;
  if (flags & 4) n += 1;
  return n;
}
