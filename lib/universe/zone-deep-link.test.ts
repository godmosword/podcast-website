import { describe, expect, it } from "vitest";
import { parseZoneDeepLink, parseZoneDeepLinkFromSearch } from "./zone-deep-link";

describe("parseZoneDeepLink", () => {
  it("有效 zone id 回傳 ZoneDef", () => {
    const zone = parseZoneDeepLink("dino");
    expect(zone?.id).toBe("dino");
    expect(zone?.name).toBe("恐龍島");
  });

  it("無效 id 靜默回 null", () => {
    expect(parseZoneDeepLink("nope")).toBeNull();
    expect(parseZoneDeepLink("")).toBeNull();
    expect(parseZoneDeepLink(null)).toBeNull();
  });
});

describe("parseZoneDeepLinkFromSearch", () => {
  it("從 query 解析 zone", () => {
    const zone = parseZoneDeepLinkFromSearch("?zone=rescue&foo=1");
    expect(zone?.id).toBe("rescue");
  });
});
