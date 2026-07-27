import type { GameSessionResult } from "../progress/session";
import {
  isSnowboardCourseId,
  SNOWBOARD_COURSES,
  snowboardCourseIndex,
  type SnowboardCourseId,
} from "@/lib/games/snowboard/course";

export const SNOWBOARD_MESSAGE_SOURCE = "cheche-snowboard" as const;

export type SnowboardReadyMessage = {
  source: typeof SNOWBOARD_MESSAGE_SOURCE;
  type: "ready";
  protocolVersion?: 2;
  supportedCourseIds?: SnowboardCourseId[];
};

export type SnowboardConfigMessage = {
  source: typeof SNOWBOARD_MESSAGE_SOURCE;
  type: "config";
  protocolVersion: 2;
  difficulty: "relaxed" | "standard" | "challenge";
  volume: number;
  locale: "zh-Hant";
  reducedMotion: boolean;
  unlockedCourseIds: SnowboardCourseId[];
};

export type SnowboardControlMessage = {
  source: typeof SNOWBOARD_MESSAGE_SOURCE;
  type: "control";
  action: "pause" | "resume";
};

export type SnowboardFinishMessage = {
  source: typeof SNOWBOARD_MESSAGE_SOURCE;
  type: "run-finish";
  protocolVersion: 2;
  runId: string;
  courseId: string;
  totalMs: number;
  falls: number;
  snowflakesCollected: number;
  snowflakesTotal: number;
  score: number;
  trickScore: number;
  bestCombo: number;
};

export function isSnowboardReadyMessage(
  data: unknown,
): data is SnowboardReadyMessage {
  if (!data || typeof data !== "object") return false;
  const message = data as Partial<SnowboardReadyMessage>;
  return message.source === SNOWBOARD_MESSAGE_SOURCE && message.type === "ready";
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isSafeScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= 10_000_000_000
  );
}

export function isSnowboardFinishMessage(
  data: unknown,
): data is SnowboardFinishMessage {
  if (!data || typeof data !== "object") return false;
  const message = data as Partial<SnowboardFinishMessage>;
  return (
    message.source === SNOWBOARD_MESSAGE_SOURCE &&
    message.type === "run-finish" &&
    message.protocolVersion === 2 &&
    typeof message.runId === "string" &&
    message.runId.length >= 8 &&
    typeof message.courseId === "string" &&
    isSnowboardCourseId(message.courseId) &&
    typeof message.totalMs === "number" &&
    Number.isFinite(message.totalMs) &&
    message.totalMs > 0 &&
    isFiniteNonNegative(message.falls) &&
    isFiniteNonNegative(message.snowflakesCollected) &&
    isFiniteNonNegative(message.snowflakesTotal) &&
    message.snowflakesCollected <= message.snowflakesTotal &&
    isSafeScore(message.score) &&
    isSafeScore(message.trickScore) &&
    isSafeScore(message.bestCombo)
  );
}

export function buildSnowboardConfigMessage(input: {
  difficulty: SnowboardConfigMessage["difficulty"];
  volume: number;
  reducedMotion: boolean;
  unlockedCourseIds: SnowboardCourseId[];
}): SnowboardConfigMessage {
  return {
    source: SNOWBOARD_MESSAGE_SOURCE,
    type: "config",
    protocolVersion: 2,
    difficulty: input.difficulty,
    volume: Math.max(0, Math.min(1, input.volume)),
    locale: "zh-Hant",
    reducedMotion: input.reducedMotion,
    unlockedCourseIds: SNOWBOARD_COURSES.map((course) => course.id).filter((id) =>
      input.unlockedCourseIds.includes(id),
    ),
  };
}

export function buildSnowboardControlMessage(
  action: SnowboardControlMessage["action"],
): SnowboardControlMessage {
  return { source: SNOWBOARD_MESSAGE_SOURCE, type: "control", action };
}

export function snowboardSessionFromFinish(
  message: SnowboardFinishMessage,
): GameSessionResult {
  const base: GameSessionResult = {
    gameId: "snowboard",
    score: message.score,
    courseId: message.courseId,
    trickScore: message.trickScore,
    bestCombo: message.bestCombo,
  };
  const course = SNOWBOARD_COURSES.find((item) => item.id === message.courseId);
  if (!course) return base;
  return {
    ...base,
    levelIndex: snowboardCourseIndex(course.id),
    cleared: true,
    flawless: message.totalMs <= course.parTimeMs,
    collectedAll:
      message.snowflakesTotal > 0 &&
      message.snowflakesCollected >= message.snowflakesTotal,
  };
}
