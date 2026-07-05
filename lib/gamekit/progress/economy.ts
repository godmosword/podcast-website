import type { Economy, PlayerProfile, StarLedgerEntry } from "../types";
import { vehiclesUnlockedAt } from "./garage";

const LEDGER_MAX = 200;
const MIGRATED_V2_LEDGER_ID = "system:migrated-v2";

export type StarLedgerInput = {
  id: string;
  amount: number;
  source: string;
  at?: string;
};

export function createEmptyEconomy(): Economy {
  return { lifetimeStars: 0, balance: 0, ledger: [] };
}

export function getLifetimeStars(profile: PlayerProfile): number {
  return profile.economy?.lifetimeStars ?? profile.stars ?? 0;
}

function getEconomyFromProfile(profile: PlayerProfile): Economy {
  if (profile.economy) return profile.economy;
  const stars = profile.stars ?? 0;
  return { lifetimeStars: stars, balance: stars, ledger: [] };
}

function trimLedger(ledger: StarLedgerEntry[]): StarLedgerEntry[] {
  if (ledger.length <= LEDGER_MAX) return ledger;
  return ledger.slice(ledger.length - LEDGER_MAX);
}

function unlockVehicle(profile: PlayerProfile, vehicleId: string): PlayerProfile {
  if (profile.unlockedVehicles.includes(vehicleId)) return profile;
  return {
    ...profile,
    unlockedVehicles: [...profile.unlockedVehicles, vehicleId],
  };
}

function syncGarageUnlocks(profile: PlayerProfile): PlayerProfile {
  let next = profile;
  for (const id of vehiclesUnlockedAt(getLifetimeStars(next))) {
    next = unlockVehicle(next, id);
  }
  return next;
}

function withEconomy(profile: PlayerProfile, economy: Economy): PlayerProfile {
  return {
    ...profile,
    version: 3,
    economy,
    stars: economy.lifetimeStars,
  };
}

export function migrateV2ToV3(profile: Partial<PlayerProfile>): PlayerProfile {
  const base: PlayerProfile = {
    stars: 0,
    unlockedVehicles: ["小黃"],
    bests: {},
    medals: {},
    stickers: [],
    gamesPlayed: {},
    ...profile,
    version: 3,
    economy: profile.economy ?? createEmptyEconomy(),
  };

  if (profile.version === 3 && profile.economy) {
    return syncGarageUnlocks(withEconomy(base, profile.economy));
  }

  const stars = Math.max(0, profile.stars ?? 0);
  const existing = profile.economy;
  if (existing?.ledger.some((e) => e.id === MIGRATED_V2_LEDGER_ID)) {
    return syncGarageUnlocks(
      withEconomy(base, {
        lifetimeStars: existing.lifetimeStars,
        balance: existing.balance,
        ledger: existing.ledger,
      }),
    );
  }

  const ledger: StarLedgerEntry[] = existing?.ledger ? [...existing.ledger] : [];
  if (stars > 0) {
    ledger.push({
      id: MIGRATED_V2_LEDGER_ID,
      amount: stars,
      source: "system:migrated-v2",
      at: new Date().toISOString(),
    });
  }

  const economy: Economy = {
    lifetimeStars: existing?.lifetimeStars ?? stars,
    balance: existing?.balance ?? stars,
    ledger: trimLedger(ledger),
  };

  return syncGarageUnlocks(withEconomy(base, economy));
}

export function applyGrantStars(
  profile: PlayerProfile,
  entry: StarLedgerInput,
): PlayerProfile {
  const amount = entry.amount;
  if (amount <= 0) return profile;

  const economy = getEconomyFromProfile(profile);
  if (economy.ledger.some((e) => e.id === entry.id)) {
    return profile;
  }

  const at = entry.at ?? new Date().toISOString();
  const nextEconomy: Economy = {
    lifetimeStars: economy.lifetimeStars + amount,
    balance: economy.balance + amount,
    ledger: trimLedger([
      ...economy.ledger,
      { id: entry.id, amount, source: entry.source, at },
    ]),
  };

  return syncGarageUnlocks(withEconomy(profile, nextEconomy));
}
