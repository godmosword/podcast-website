import { describe, expect, it } from "vitest";
import { generateStaticParams } from "@/app/for-parents/play-map/collections/[collectionSlug]/page";
import { metadata } from "@/app/for-parents/play-map/collections/page";

describe("chiayi-city collection launch routes", () => {
  it("index metadata cites 15 city collections", () => {
    expect(metadata.description).toContain("15 個城市親子景點");
    expect(metadata.description).toContain("5 組免費景點");
  });

  it("static params include chiayi-city and exclude unlaunched variants", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(20);
    expect(params).toContainEqual({ collectionSlug: "chiayi-city" });
    expect(params).toContainEqual({ collectionSlug: "chiayi-county" });
    expect(params).not.toContainEqual({
      collectionSlug: "chiayi-city-indoor",
    });
    expect(params).not.toContainEqual({
      collectionSlug: "chiayi-city-rainy-day",
    });
    expect(params).not.toContainEqual({
      collectionSlug: "chiayi-city-free",
    });
    expect(params).not.toContainEqual({
      collectionSlug: "changhua-free",
    });
  });
});
