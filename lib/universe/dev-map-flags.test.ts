import { describe, expect, it } from "vitest";
import { parseDevStatusOverrides } from "./dev-map-flags";

describe("dev-map-flags", () => {
  it("parseDevStatusOverrides 解析 car-park:building", () => {
    expect(parseDevStatusOverrides("?devStatus=car-park:building")).toEqual({
      "car-park": "building",
    });
  });

  it("無效 id 或 status 回傳空", () => {
    expect(parseDevStatusOverrides("?devStatus=invalid:open")).toEqual({});
    expect(parseDevStatusOverrides("?devStatus=car-park:invalid")).toEqual({});
  });
});
