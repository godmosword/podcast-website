import { describe, expect, it } from "vitest";
import {
  isEasyParking,
  isHighEnergy,
  isOutdoorPlace,
  isRainyDayFriendly,
  isStrollerFriendly,
} from "@/lib/playground-context";

describe("playground contextual traits", () => {
  it("只用 normalized fields，不從 tips 推導推車友善", () => {
    expect(
      isStrollerFriendly({
        indoor: false,
        facilities: [],
        tags: [],
        tips: "推車友善，入口平坦",
      }),
    ).toBe(false);
    expect(
      isStrollerFriendly({
        indoor: false,
        facilities: ["嬰兒車借用"],
        tags: [],
      }),
    ).toBe(true);
  });

  it("各 contextual trait 以既有 tags／facilities／indoor 判斷", () => {
    expect(isOutdoorPlace({ indoor: false, facilities: [], tags: [] })).toBe(true);
    expect(isRainyDayFriendly({ indoor: true, facilities: [], tags: [] })).toBe(true);
    expect(isRainyDayFriendly({ indoor: false, facilities: [], tags: ["雨天備案"] })).toBe(
      true,
    );
    expect(isEasyParking({ indoor: false, facilities: ["停車場"], tags: [] })).toBe(true);
    expect(isHighEnergy({ indoor: false, facilities: ["大型遊具"], tags: [] })).toBe(true);
  });
});
