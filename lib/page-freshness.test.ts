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
      // 生成器用 `git log --format=%h`，短雜湊長度會隨 repo 物件數自動變長
      // （本 repo 已從 7 碼長到 8 碼），所以只能驗下限不能釘死長度。
      expect(STATIC_PAGE_MODIFIED_DATE_SOURCE[route], route).toMatch(
        /^[0-9a-f]{7,40} /,
      );
    }
  });

  it("日期表與來源表的路由一致", () => {
    expect(Object.keys(STATIC_PAGE_MODIFIED_DATE_SOURCE).sort()).toEqual(
      Object.keys(STATIC_PAGE_MODIFIED_DATES).sort(),
    );
  });
});
