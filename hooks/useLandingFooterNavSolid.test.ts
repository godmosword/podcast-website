import { describe, expect, test } from "vitest";
import {
  LANDING_FOOT_SOLID_RATIO,
  landingFooterWarrantsSolidNav,
} from "./useLandingFooterNavSolid";

describe("landingFooterWarrantsSolidNav", () => {
  test("未相交時不實心", () => {
    expect(
      landingFooterWarrantsSolidNav({
        isIntersecting: false,
        intersectionRatio: 0.5,
      }),
    ).toBe(false);
  });

  test("相交但比例不足時不實心", () => {
    expect(
      landingFooterWarrantsSolidNav({
        isIntersecting: true,
        intersectionRatio: LANDING_FOOT_SOLID_RATIO - 0.01,
      }),
    ).toBe(false);
  });

  test("相交且比例達門檻時實心", () => {
    expect(
      landingFooterWarrantsSolidNav({
        isIntersecting: true,
        intersectionRatio: LANDING_FOOT_SOLID_RATIO,
      }),
    ).toBe(true);
  });
});
