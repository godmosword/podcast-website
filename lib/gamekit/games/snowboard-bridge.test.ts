import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isSnowboardFinishMessage,
  isSnowboardReadyMessage,
  snowboardSessionFromFinish,
  type SnowboardFinishMessage,
} from "./snowboard-bridge";

const COMPLETE: SnowboardFinishMessage = {
  source: "cheche-snowboard",
  type: "run-finish",
  courseId: "bonbon-peak",
  totalMs: 90_000,
  falls: 0,
  snowflakesCollected: 12,
  snowflakesTotal: 12,
};

describe("snowboard iframe bridge", () => {
  it("辨識 ready 與合法完賽訊息", () => {
    expect(
      isSnowboardReadyMessage({ source: "cheche-snowboard", type: "ready" }),
    ).toBe(true);
    expect(isSnowboardFinishMessage(COMPLETE)).toBe(true);
  });

  it.each([
    { ...COMPLETE, source: "wrong" },
    { ...COMPLETE, totalMs: 0 },
    { ...COMPLETE, totalMs: Number.NaN },
    { ...COMPLETE, falls: -1 },
    { ...COMPLETE, snowflakesCollected: -1 },
  ])("拒絕不合法 payload %#", (payload) => {
    expect(isSnowboardFinishMessage(payload)).toBe(false);
  });

  it("90 秒與 12/12 映射完整三星", () => {
    expect(snowboardSessionFromFinish(COMPLETE)).toEqual({
      gameId: "snowboard",
      score: 1111,
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
    ).toEqual({ gameId: "snowboard", score: 1111 });
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
