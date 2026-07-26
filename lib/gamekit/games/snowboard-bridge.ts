import type { GameSessionResult } from "../progress/session";
import {
  isSnowboardCourseId,
  SNOWBOARD_PAR_TIME_MS,
} from "@/lib/games/snowboard/course";

const SNOWBOARD_MESSAGE_SOURCE = "cheche-snowboard" as const;

export type SnowboardReadyMessage = {
  source: typeof SNOWBOARD_MESSAGE_SOURCE;
  type: "ready";
};

export type SnowboardFinishMessage = {
  source: typeof SNOWBOARD_MESSAGE_SOURCE;
  type: "run-finish";
  courseId: string;
  totalMs: number;
  falls: number;
  snowflakesCollected: number;
  snowflakesTotal: number;
};

export function isSnowboardReadyMessage(
  data: unknown,
): data is SnowboardReadyMessage {
  if (!data || typeof data !== "object") return false;
  const message = data as Partial<SnowboardReadyMessage>;
  return (
    message.source === SNOWBOARD_MESSAGE_SOURCE && message.type === "ready"
  );
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isSnowboardFinishMessage(
  data: unknown,
): data is SnowboardFinishMessage {
  if (!data || typeof data !== "object") return false;
  const message = data as Partial<SnowboardFinishMessage>;
  return (
    message.source === SNOWBOARD_MESSAGE_SOURCE &&
    message.type === "run-finish" &&
    typeof message.courseId === "string" &&
    typeof message.totalMs === "number" &&
    Number.isFinite(message.totalMs) &&
    message.totalMs > 0 &&
    isFiniteNonNegative(message.falls) &&
    isFiniteNonNegative(message.snowflakesCollected) &&
    isFiniteNonNegative(message.snowflakesTotal)
  );
}

function snowboardScoreFromTime(totalMs: number): number {
  if (!Number.isFinite(totalMs) || totalMs <= 0) return 0;
  return Math.max(1, Math.floor(100_000_000 / totalMs));
}

export function snowboardSessionFromFinish(
  message: SnowboardFinishMessage,
): GameSessionResult {
  const base: GameSessionResult = {
    gameId: "snowboard",
    score: snowboardScoreFromTime(message.totalMs),
  };
  if (!isSnowboardCourseId(message.courseId)) return base;
  return {
    ...base,
    levelIndex: 0,
    cleared: true,
    flawless: message.totalMs <= SNOWBOARD_PAR_TIME_MS,
    collectedAll:
      message.snowflakesTotal > 0 &&
      message.snowflakesCollected >= message.snowflakesTotal,
  };
}
