import { describe, expect, it } from "vitest";
import type { Reaction } from "@/lib/games/dino-sushi/reactions";
import { duoPose } from "./DinoSushiDuoDuo";

const eaten = (mood: Reaction["mood"]): Reaction => ({ mood, line: "好吃", sfx: mood, eats: true, brush: false });

describe("點餐時多多是店長（2026-11-08 設計審 MUST-1）", () => {
  it.each(["love", "yum", "puff"] as const)("朋友吃到（%s）那一拍：多多微笑、小跳，不用愛心眼或大笑搶走朋友的開心", (mood) => {
    const pose = duoPose("order", "react", eaten(mood), false);
    expect(pose).toEqual({ mouth: "closed", face: "idle", cheer: true });
  });

  it("送過去、朋友咬的時候：看著，不跳", () => {
    for (const phase of ["handoff", "ride", "eat"] as const) {
      expect(duoPose("order", phase, null, false)).toEqual({ mouth: "closed", face: "look", cheer: false });
    }
  });

  it("缺料朋友不吃：多多照樣看泡泡，不跳", () => {
    const look: Reaction = { mood: "look", line: "還少一樣", sfx: "look", eats: false, brush: false };
    expect(duoPose("order", "react", look, false)).toEqual({ mouth: "closed", face: "look", cheer: false });
  });

  it("自由做仍是多多吃：最愛照樣愛心眼", () => {
    expect(duoPose("free", "react", eaten("love"), false)).toEqual({ mouth: "closed", face: "love", cheer: false });
  });
});
