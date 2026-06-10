export type GamePhase = "idle" | "playing" | "paused" | "gameOver";

export type GameEvent = "start" | "pause" | "resume" | "end" | "reset";

const TRANSITIONS: Record<GamePhase, Partial<Record<GameEvent, GamePhase>>> = {
  idle: { start: "playing" },
  playing: { pause: "paused", end: "gameOver" },
  paused: { resume: "playing", end: "gameOver", reset: "idle" },
  gameOver: { start: "playing", reset: "idle" },
};

export function transition(
  phase: GamePhase,
  event: GameEvent,
): GamePhase | null {
  return TRANSITIONS[phase][event] ?? null;
}

export function createGameStateMachine(initial: GamePhase = "idle") {
  let phase = initial;

  return {
    get phase() {
      return phase;
    },
    send(event: GameEvent): GamePhase | null {
      const next = transition(phase, event);
      if (next) phase = next;
      return next;
    },
    reset(next: GamePhase = "idle") {
      phase = next;
    },
  };
}

/** 將遊戲元件自訂狀態映射到共用 phase（如 CarPlatformer 的 won/over/ready）。 */
export function mapLegacyStatus(
  status: "ready" | "playing" | "paused" | "won" | "over",
): GamePhase {
  switch (status) {
    case "playing":
      return "playing";
    case "paused":
      return "paused";
    case "over":
      return "gameOver";
    default:
      return "idle";
  }
}
