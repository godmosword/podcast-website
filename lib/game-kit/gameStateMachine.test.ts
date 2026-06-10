import { describe, expect, it } from "vitest";
import {
  createGameStateMachine,
  mapLegacyStatus,
  transition,
} from "./gameStateMachine";

describe("gameStateMachine", () => {
  it("idle → playing on start", () => {
    expect(transition("idle", "start")).toBe("playing");
  });

  it("playing → paused → playing on resume", () => {
    expect(transition("playing", "pause")).toBe("paused");
    expect(transition("paused", "resume")).toBe("playing");
  });

  it("playing → gameOver on end", () => {
    expect(transition("playing", "end")).toBe("gameOver");
  });

  it("invalid transition returns null", () => {
    expect(transition("idle", "pause")).toBeNull();
  });

  it("createGameStateMachine mutates phase", () => {
    const sm = createGameStateMachine("idle");
    expect(sm.phase).toBe("idle");
    sm.send("start");
    expect(sm.phase).toBe("playing");
  });

  it("mapLegacyStatus maps won/ready to idle", () => {
    expect(mapLegacyStatus("won")).toBe("idle");
    expect(mapLegacyStatus("ready")).toBe("idle");
    expect(mapLegacyStatus("over")).toBe("gameOver");
  });
});
