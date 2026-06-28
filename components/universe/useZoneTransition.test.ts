import { describe, expect, it } from "vitest";
import { getTransitionKey } from "./useZoneTransition";

describe("useZoneTransition helpers", () => {
  it("getTransitionKey 回傳 from-to 字串", () => {
    expect(getTransitionKey("building", "open")).toBe("building-to-open");
    expect(getTransitionKey("planned", "building")).toBe("planned-to-building");
  });

  it("相同 status 回傳 null", () => {
    expect(getTransitionKey("open", "open")).toBeNull();
  });
});
