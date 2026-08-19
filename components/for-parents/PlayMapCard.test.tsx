import { describe, expect, it } from "vitest";
import { listPlayMapCardBinaryFacts } from "./PlayMapCard";

describe("listPlayMapCardBinaryFacts", () => {
  it("free=true 顯示免費，free=false 顯示需購票", () => {
    expect(listPlayMapCardBinaryFacts({ free: true, indoor: true })[0]).toEqual({
      label: "免費",
      kind: "fee",
    });
    expect(listPlayMapCardBinaryFacts({ free: false, indoor: true })[0]).toEqual({
      label: "需購票",
      kind: "fee",
    });
  });

  it("indoor=true 顯示室內，indoor=false 顯示戶外", () => {
    expect(listPlayMapCardBinaryFacts({ free: true, indoor: true })[1]).toEqual({
      label: "室內",
      kind: "environment",
    });
    expect(listPlayMapCardBinaryFacts({ free: true, indoor: false })[1]).toEqual({
      label: "戶外",
      kind: "environment",
    });
  });

  it("需購票不帶票價數字，也不推導天氣適性", () => {
    const facts = listPlayMapCardBinaryFacts({ free: false, indoor: false });
    expect(facts.map((fact) => fact.label)).toEqual(["需購票", "戶外"]);
    expect(facts.map((fact) => fact.label).join()).not.toMatch(/\d|遮蔭|雨天|預約/);
  });
});
