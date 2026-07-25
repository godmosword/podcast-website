import { describe, expect, it } from "vitest";
import { adventuresZoneQueryRedirects } from "./adventures-redirects";

describe("adventuresZoneQueryRedirects", () => {
  it("把 ?zone= 永久導向 /adventures/:id", () => {
    const rules = adventuresZoneQueryRedirects();
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({
      source: "/adventures",
      destination: "/adventures/:zid",
      permanent: true,
    });
    expect(rules[0]!.has[0]).toMatchObject({
      type: "query",
      key: "zone",
    });
  });
});
