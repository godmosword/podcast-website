import { describe, expect, it } from "vitest";
import { snowboardIframeSrc } from "./iframe-src";

describe("snowboardIframeSrc", () => {
  it("keeps the normal export URL clean", () => {
    expect(snowboardIframeSrc()).toBe("/snowboard/index.html");
  });

  it("forwards validated debug and visual QA options", () => {
    expect(snowboardIframeSrc("bonbon-peak", "forest", "carve")).toBe(
      "/snowboard/index.html?debugFinish=bonbon-peak&visualStage=forest&visualPose=carve",
    );
  });

  it("drops unknown values", () => {
    expect(snowboardIframeSrc("other", "space", "fall")).toBe(
      "/snowboard/index.html",
    );
  });
});
