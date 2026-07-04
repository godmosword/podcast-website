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
  it("島嶼許願（feature）接受暱稱或 email", () => {
    expect(
      zoneWishBodySchema.safeParse({ zoneId: "dino", nickname: "阿寶" }).success,
    ).toBe(true);
    expect(
      zoneWishBodySchema.safeParse({ zoneId: "dino", email: "a@b.co" }).success,
    ).toBe(true);
  });

  it("故事許願（story）需 message，聯絡方式選填", () => {
    expect(
      zoneWishBodySchema.safeParse({
        zoneId: "dino",
        category: "story",
        message: "垃圾車半夜去哪裡？",
      }).success,
    ).toBe(true);
    expect(
      zoneWishBodySchema.safeParse({
        zoneId: "dino",
        category: "story",
        message: "想聽消防車",
        nickname: "小車",
      }).success,
    ).toBe(true);
  });

  it("feature 拒絕空 payload", () => {
    expect(zoneWishBodySchema.safeParse({ zoneId: "dino" }).success).toBe(false);
  });

  it("story 拒絕空 message", () => {
    expect(
      zoneWishBodySchema.safeParse({ zoneId: "dino", category: "story" }).success,
    ).toBe(false);
  });

  it("拒絕無效 zoneId", () => {
    expect(zoneWishBodySchema.safeParse({ zoneId: "nope", nickname: "x" }).success).toBe(
      false,
    );
  });

  it("拒絕非法 category", () => {
    expect(
      zoneWishBodySchema.safeParse({
        zoneId: "dino",
        category: "other",
        nickname: "x",
      }).success,
    ).toBe(false);
  });
});
