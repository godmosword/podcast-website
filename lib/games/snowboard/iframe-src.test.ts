import { afterEach, describe, expect, it, vi } from "vitest";
import { snowboardIframeSrc } from "./iframe-src";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("snowboardIframeSrc", () => {
  it("keeps the normal export URL clean", () => {
    expect(snowboardIframeSrc()).toBe("/snowboard/v2/index.html");
  });

  it("forwards validated debug and visual QA options", () => {
    expect(snowboardIframeSrc("bonbon-peak", "forest", "carve")).toBe(
      "/snowboard/v2/index.html?debugFinish=bonbon-peak&visualStage=forest&visualPose=carve",
    );
  });

  it("drops unknown values", () => {
    expect(snowboardIframeSrc("other", "space", "fall")).toBe(
      "/snowboard/v2/index.html",
    );
  });

  it("production host drops debug and visual query parameters", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("window", { location: { hostname: "podcast.example.com" } });
    expect(snowboardIframeSrc("bonbon-peak", "forest", "carve")).toBe(
      "/snowboard/v2/index.html",
    );
  });

  it("allows debug query parameters only on local production hosts", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("window", { location: { hostname: "127.0.0.1" } });
    expect(snowboardIframeSrc("bonbon-peak", "forest", "carve")).toContain(
      "debugFinish=bonbon-peak",
    );
  });
});
