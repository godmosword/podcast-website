import { describe, expect, it } from "vitest";
import {
  FEEDBACK_PII_KEYWORDS,
  detectFeedbackPii,
  hasEmailInText,
  hasPhoneLikeDigits,
  hasPiiKeyword,
} from "./feedback-pii";

describe("hasPhoneLikeDigits", () => {
  it("連續 8 碼以上數字命中", () => {
    expect(hasPhoneLikeDigits("我的號碼 0912345678")).toBe(true);
    expect(hasPhoneLikeDigits("12345678")).toBe(true);
  });

  it("含分隔符號的電話也命中", () => {
    expect(hasPhoneLikeDigits("0912-345-678")).toBe(true);
    expect(hasPhoneLikeDigits("(02) 2345 6789")).toBe(true);
    expect(hasPhoneLikeDigits("+886 912 345 678")).toBe(true);
  });

  it("全形數字也命中", () => {
    expect(hasPhoneLikeDigits("０９１２３４５６７８")).toBe(true);
  });

  it("7 碼以下不命中", () => {
    expect(hasPhoneLikeDigits("我今年 5 歲")).toBe(false);
    expect(hasPhoneLikeDigits("第 1234567 名")).toBe(false);
  });
});

describe("hasEmailInText", () => {
  it("正文出現 email 命中", () => {
    expect(hasEmailInText("回信給 parent@example.com 謝謝")).toBe(true);
  });

  it("沒有 email 不命中", () => {
    expect(hasEmailInText("垃圾車半夜去哪裡？")).toBe(false);
    expect(hasEmailInText("小明@車車遊樂園")).toBe(false);
  });
});

describe("hasPiiKeyword", () => {
  it("清單關鍵字全部命中", () => {
    for (const keyword of FEEDBACK_PII_KEYWORDS) {
      expect(hasPiiKeyword(`我想說${keyword}的事`)).toBe(true);
    }
  });

  it("一般留言不命中", () => {
    expect(hasPiiKeyword("我最喜歡挖土機")).toBe(false);
  });
});

describe("detectFeedbackPii", () => {
  it("乾淨留言不需複審", () => {
    expect(detectFeedbackPii("我最喜歡挖土機那一集！")).toEqual({
      needsReview: false,
      reasons: [],
    });
  });

  it("命中電話規則標記需複審", () => {
    expect(detectFeedbackPii("打 0912345678 給我")).toEqual({
      needsReview: true,
      reasons: ["phone"],
    });
  });

  it("命中關鍵字標記需複審", () => {
    expect(detectFeedbackPii("我在快樂幼兒園上課")).toEqual({
      needsReview: true,
      reasons: ["keyword"],
    });
  });

  it("多條規則同時命中會列出全部原因", () => {
    const result = detectFeedbackPii("我的學校電話 0223456789，或寄 parent@example.com");
    expect(result.needsReview).toBe(true);
    expect(result.reasons).toEqual(["phone", "email", "keyword"]);
  });
});
