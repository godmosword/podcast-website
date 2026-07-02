import { describe, expect, it } from "vitest";
import { parseWishContact, zoneWishBodySchema } from "./zone-wish-schema";

describe("parseWishContact", () => {
  it("含 @ 視為 email", () => {
    expect(parseWishContact(" kid@example.com ")).toEqual({
      email: "kid@example.com",
    });
  });

  it("否則視為暱稱", () => {
    expect(parseWishContact(" 小車迷 ")).toEqual({ nickname: "小車迷" });
  });
});

describe("zoneWishBodySchema", () => {
  it("接受暱稱或 email", () => {
    expect(zoneWishBodySchema.safeParse({ zoneId: "dino", nickname: "阿寶" }).success).toBe(
      true,
    );
    expect(
      zoneWishBodySchema.safeParse({ zoneId: "dino", email: "a@b.co" }).success,
    ).toBe(true);
  });

  it("拒絕空 payload", () => {
    expect(zoneWishBodySchema.safeParse({ zoneId: "dino" }).success).toBe(false);
  });

  it("拒絕無效 zoneId", () => {
    expect(zoneWishBodySchema.safeParse({ zoneId: "nope", nickname: "x" }).success).toBe(
      false,
    );
  });
});
