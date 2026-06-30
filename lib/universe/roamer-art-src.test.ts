import { describe, expect, it } from "vitest";
import { roamerPngToWebp } from "./roamer-art-src";

describe("roamerPngToWebp", () => {
  it("front / rear 路徑", () => {
    expect(roamerPngToWebp("/adventures/roamers/a-ku.png")).toBe(
      "/adventures/roamers/a-ku.webp",
    );
    expect(roamerPngToWebp("/adventures/roamers/a-ku.rear.png")).toBe(
      "/adventures/roamers/a-ku.rear.webp",
    );
  });
});
