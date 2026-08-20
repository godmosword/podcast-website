import { describe, expect, it } from "vitest";
import { listCities, listPlaygrounds } from "@/data/playgrounds";
import { listCityPlayStats } from "./playground-city-stats";

describe("listCityPlayStats", () => {
  const stats = listCityPlayStats(listPlaygrounds());

  it("回傳 15 筆", () => {
    expect(stats).toHaveLength(15);
  });

  it("順序與 listCities() 一致", () => {
    expect(stats.map((row) => row.city)).toEqual(listCities());
  });

  it("苗栗與彰化的 indoor 為 0", () => {
    expect(stats.find((row) => row.city === "苗栗縣")?.indoor).toBe(0);
    expect(stats.find((row) => row.city === "彰化縣")?.indoor).toBe(0);
  });

  it("各縣市 free + notFree === total", () => {
    for (const row of stats) {
      expect(row.free + row.notFree).toBe(row.total);
      expect(row.indoor + row.outdoor).toBe(row.total);
    }
  });
});
