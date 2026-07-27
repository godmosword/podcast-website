import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isSnowboardFinishMessage,
  isSnowboardReadyMessage,
  buildSnowboardConfigMessage,
  buildSnowboardControlMessage,
  snowboardSessionFromFinish,
  type SnowboardFinishMessage,
} from "./snowboard-bridge";

const COMPLETE: SnowboardFinishMessage = {
  source: "cheche-snowboard",
  type: "run-finish",
  protocolVersion: 2,
  runId: "test-run-001",
  courseId: "bonbon-peak",
  totalMs: 90_000,
  falls: 0,
  snowflakesCollected: 12,
  snowflakesTotal: 12,
  score: 1_111_222,
  trickScore: 1_222,
  bestCombo: 3,
};

describe("snowboard iframe bridge", () => {
  it("辨識 ready 與合法完賽訊息", () => {
    expect(
      isSnowboardReadyMessage({ source: "cheche-snowboard", type: "ready" }),
    ).toBe(true);
    expect(isSnowboardFinishMessage(COMPLETE)).toBe(true);
  });

  it("config 只傳送合法解鎖賽道並限制音量", () => {
    expect(
      buildSnowboardConfigMessage({
        difficulty: "challenge",
        volume: 2,
        reducedMotion: true,
        unlockedCourseIds: ["bonbon-peak", "glacier-night"],
      }),
    ).toMatchObject({
      type: "config",
      protocolVersion: 2,
      difficulty: "challenge",
      volume: 1,
      unlockedCourseIds: ["bonbon-peak", "glacier-night"],
    });
    expect(buildSnowboardControlMessage("pause")).toEqual({
      source: "cheche-snowboard",
      type: "control",
      action: "pause",
    });
  });

  it.each([
    { ...COMPLETE, source: "wrong" },
    { ...COMPLETE, totalMs: 0 },
    { ...COMPLETE, totalMs: Number.NaN },
    { ...COMPLETE, falls: -1 },
    { ...COMPLETE, snowflakesCollected: -1 },
    { ...COMPLETE, score: Number.MAX_SAFE_INTEGER + 1 },
    { ...COMPLETE, runId: "short" },
  ])("拒絕不合法 payload %#", (payload) => {
    expect(isSnowboardFinishMessage(payload)).toBe(false);
  });

  it("90 秒與 12/12 映射完整三星", () => {
    expect(snowboardSessionFromFinish(COMPLETE)).toEqual({
      gameId: "snowboard",
      score: 1_111_222,
      courseId: "bonbon-peak",
      trickScore: 1_222,
      bestCombo: 3,
      levelIndex: 0,
      cleared: true,
      flawless: true,
      collectedAll: true,
    });
  });

  it("超時與漏收分別失去對應星", () => {
    expect(
      snowboardSessionFromFinish({
        ...COMPLETE,
        totalMs: 100_000,
        snowflakesCollected: 11,
      }),
    ).toMatchObject({ flawless: false, collectedAll: false });
  });

  it("未知雪道只記錄分數", () => {
    expect(
      snowboardSessionFromFinish({ ...COMPLETE, courseId: "unknown" }),
    ).toEqual({
      gameId: "snowboard",
      score: 1_111_222,
      courseId: "unknown",
      trickScore: 1_222,
      bestCombo: 3,
    });
  });

  it("Godot 與 TypeScript bridge source 對齊", () => {
    const source = readFileSync(
      join(process.cwd(), "snowboard-game/scripts/bridge.gd"),
      "utf8",
    );
    expect(source).toContain('const SOURCE := "cheche-snowboard"');
    expect(source).toContain('"type": "run-finish"');
    expect(source).toContain('"courseId": Course.ID');
  });
});
