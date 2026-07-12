import {
  CELEBRATION_BURST_BUDGET_MAX,
  CELEBRATION_BURST_BUDGET_WINDOW_MS,
  CELEBRATION_COOLDOWN_MS,
  CELEBRATION_INTENSITY_BY_EVENT,
  CELEBRATION_MERGE_WINDOW_MS,
  CELEBRATION_PARTICLE_COUNT,
  type CelebrationEventId,
  type CelebrationIntensity,
} from "@/data/celebration";
import type { SfxKind } from "@/lib/sfx";

export type CelebrationDecision = {
  allowed: boolean;
  event: CelebrationEventId;
  intensity: CelebrationIntensity;
  /** DOM 粒子數；0 表示不畫。 */
  particleCount: number;
  playSfx: SfxKind | null;
};

const CELEBRATION_SFX_BY_EVENT: Partial<Record<CelebrationEventId, SfxKind>> = {
  favorite_added: "collect",
  game_race_finish: "collect",
};

export type CelebrationScheduler = {
  request: (event: CelebrationEventId, now?: number) => CelebrationDecision;
  reset: () => void;
};

/** 可測試的慶祝排程器（冷卻／合併／burst 預算）。 */
export function createCelebrationScheduler(): CelebrationScheduler {
  const lastByEvent = new Map<CelebrationEventId, number>();
  const lastByIntensity = new Map<CelebrationIntensity, number>();
  const burstTimestamps: number[] = [];

  function pruneBurstBudget(now: number): void {
    while (
      burstTimestamps.length > 0 &&
      now - burstTimestamps[0]! > CELEBRATION_BURST_BUDGET_WINDOW_MS
    ) {
      burstTimestamps.shift();
    }
  }

  function request(event: CelebrationEventId, now = Date.now()): CelebrationDecision {
    const intensity = CELEBRATION_INTENSITY_BY_EVENT[event];
    const denied: CelebrationDecision = {
      allowed: false,
      event,
      intensity,
      particleCount: 0,
      playSfx: null,
    };

    const lastEventAt = lastByEvent.get(event);
    if (
      lastEventAt !== undefined &&
      now - lastEventAt < CELEBRATION_MERGE_WINDOW_MS
    ) {
      return denied;
    }

    const lastIntensityAt = lastByIntensity.get(intensity);
    if (
      lastIntensityAt !== undefined &&
      now - lastIntensityAt < CELEBRATION_COOLDOWN_MS[intensity]
    ) {
      return denied;
    }

    if (intensity === "burst") {
      pruneBurstBudget(now);
      if (burstTimestamps.length >= CELEBRATION_BURST_BUDGET_MAX) {
        return denied;
      }
      burstTimestamps.push(now);
    }

    lastByEvent.set(event, now);
    lastByIntensity.set(intensity, now);

    return {
      allowed: true,
      event,
      intensity,
      particleCount: CELEBRATION_PARTICLE_COUNT[intensity],
      playSfx: CELEBRATION_SFX_BY_EVENT[event] ?? null,
    };
  }

  function reset(): void {
    lastByEvent.clear();
    lastByIntensity.clear();
    burstTimestamps.length = 0;
  }

  return { request, reset };
}

let clientScheduler: CelebrationScheduler | null = null;

/** Client 慶祝閘門；SSR 一律不觸發。 */
export function requestCelebration(event: CelebrationEventId): CelebrationDecision {
  const intensity = CELEBRATION_INTENSITY_BY_EVENT[event];
  if (typeof window === "undefined") {
    return {
      allowed: false,
      event,
      intensity,
      particleCount: 0,
      playSfx: null,
    };
  }
  if (!clientScheduler) {
    clientScheduler = createCelebrationScheduler();
  }
  return clientScheduler.request(event);
}
