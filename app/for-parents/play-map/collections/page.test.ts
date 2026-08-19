import { describe, expect, it } from "vitest";
import {
  generateMetadata,
  generateStaticParams,
} from "@/app/for-parents/play-map/collections/[collectionSlug]/page";
import { metadata } from "@/app/for-parents/play-map/collections/page";

describe("collection launch routes", () => {
  it("index metadata cites 15 city collections", () => {
    expect(metadata.description).toContain("15 個城市親子景點");
    expect(metadata.description).toContain("6 組免費景點");
    expect(metadata.description).toContain("1 組室內親子景點");
  });

  it("static params include launched free collection and exclude unlaunched variants", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(22);
    expect(params).toContainEqual({ collectionSlug: "chiayi-city" });
    expect(params).toContainEqual({ collectionSlug: "chiayi-county" });
    expect(params).toContainEqual({ collectionSlug: "taoyuan-indoor" });
    expect(params).toContainEqual({ collectionSlug: "kaohsiung-free" });
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
    expect(params).not.toContainEqual({
      collectionSlug: "taoyuan-rainy-day",
    });
  });

  it("kaohsiung-free metadata keeps the launch title, description, and canonical", async () => {
    const result = await generateMetadata({
      params: Promise.resolve({ collectionSlug: "kaohsiung-free" }),
    });

    expect(result.title).toEqual({
      absolute: "高雄免費親子景點｜車車遊樂園",
    });
    expect(result.description).toBe(
      "目前收錄 5 個高雄免費親子景點，從兒童藝術、閱讀，到公園散步、生態觀察與大型遊戲，涵蓋 3 個行政區、3 種景點類型。",
    );
    expect(result.alternates).toEqual({
      canonical: "/for-parents/play-map/collections/kaohsiung-free",
    });
  });
});
