import { describe, expect, it } from "vitest";
import { xiaojuMood } from "@/lib/games/orange-express/mood";
import { createRun, withHook } from "@/lib/games/orange-express/reducer";

describe("小橘的表情", () => {
  const base = createRun("drive", "big");

  it("停在綠區或黃區都是開心臉（黃區也算停好）", () => {
    expect(xiaojuMood(withHook(base, { progress: 0.65, speed: 0 }))).toBe("happy");
    expect(xiaojuMood(withHook(base, { progress: 0.53, speed: 0 }))).toBe("happy");
  });

  it("開門等朋友上車也是開心臉", () => {
    const stopped = withHook(base, { progress: 0.65, speed: 0 });
    expect(xiaojuMood({ ...stopped, phase: "doors-open" })).toBe("happy");
  });

  it("開車中、開過頭倒車都是平常的臉，沒有難過的表情", () => {
    expect(xiaojuMood(withHook(base, { progress: 0.3, speed: 0.4 }))).toBe("calm");
    expect(xiaojuMood({ ...withHook(base, { progress: 0.7, speed: 0.2 }), phase: "reversing" })).toBe("calm");
  });
});
