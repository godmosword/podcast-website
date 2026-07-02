import { describe, expect, it } from "vitest";
import {
  STATIC_PAGE_MODIFIED_DATES,
  STATIC_PAGE_MODIFIED_DATE_SOURCE,
} from "./page-freshness";

describe("STATIC_PAGE_MODIFIED_DATES", () => {
  it("每個靜態頁都有可解析的日期與可追溯的 git 來源", () => {
    const routes = Object.keys(STATIC_PAGE_MODIFIED_DATES);
    expect(routes.length).toBeGreaterThan(0);

    for (const route of routes) {
      expect(
        Number.isNaN(Date.parse(STATIC_PAGE_MODIFIED_DATES[route])),
        route,
      ).toBe(false);
      expect(STATIC_PAGE_MODIFIED_DATE_SOURCE[route], route).toMatch(
        /^[0-9a-f]{7} /,
      );
    }
  });

  it("日期表與來源表的路由一致", () => {
    expect(Object.keys(STATIC_PAGE_MODIFIED_DATE_SOURCE).sort()).toEqual(
      Object.keys(STATIC_PAGE_MODIFIED_DATES).sort(),
    );
  });
});
